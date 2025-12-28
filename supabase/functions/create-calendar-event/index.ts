// supabase/functions/create-calendar-event/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEventRequest {
  appointment_id: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { appointment_id }: CalendarEventRequest = await req.json()

    if (!appointment_id) {
      throw new Error('appointment_id é obrigatório')
    }

    // 1. Buscar dados do appointment
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        psychologist:psychologist_id (
          user_id,
          profile:profiles!psychologist_user_id_fkey (
            full_name
          )
        ),
        patient:patient_id (
          user_id,
          profile:profiles!patient_user_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('id', appointment_id)
      .single()

    if (appointmentError || !appointment) {
      throw new Error('Agendamento não encontrado')
    }

    console.log('Appointment encontrado:', appointment)

    // 2. Pegar tokens do Google do psicólogo
    const { data: psychData, error: psychError } = await supabaseClient.auth.admin.getUserById(
      appointment.psychologist.user_id
    )

    if (psychError || !psychData) {
      throw new Error('Psicólogo não encontrado')
    }

    const providerRefreshToken = psychData.user.user_metadata?.provider_refresh_token
    
    if (!providerRefreshToken) {
      throw new Error('Psicólogo não conectou Google Calendar')
    }

    console.log('Refresh token encontrado')

    // 3. Renovar access token do Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: providerRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      throw new Error(`Erro ao renovar token: ${errorData}`)
    }

    const { access_token } = await tokenResponse.json()
    console.log('Access token renovado')

    // 4. Calcular horário de término
    const startDateTime = `${appointment.appointment_date}T${appointment.appointment_time}`
    const startDate = new Date(startDateTime)
    const endDate = new Date(startDate.getTime() + appointment.duration_minutes * 60000)

    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    // 5. Criar evento no Google Calendar
    const eventData = {
      summary: `Sessão de Terapia - ${appointment.patient.profile.full_name}`,
      description: `Sessão de terapia online.\n\nPaciente: ${appointment.patient.profile.full_name}\nDuração: ${appointment.duration_minutes} minutos`,
      start: {
        dateTime: startISO,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endISO,
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        {
          email: appointment.patient.profile.email,
          displayName: appointment.patient.profile.full_name,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${appointment_id}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'email', minutes: 60 }, // 1 hora antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
    }

    console.log('Criando evento no Calendar...')

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.text()
      throw new Error(`Erro ao criar evento: ${errorData}`)
    }

    const calendarEvent = await calendarResponse.json()
    console.log('Evento criado:', calendarEvent.id)

    // 6. Extrair link do Google Meet
    const meetLink = calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.[0]?.uri

    if (!meetLink) {
      console.warn('Link do Meet não encontrado no evento')
    }

    // 7. Atualizar appointment com IDs do Google
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({
        google_calendar_event_id: calendarEvent.id,
        google_meet_link: meetLink,
      })
      .eq('id', appointment_id)

    if (updateError) {
      throw new Error(`Erro ao atualizar appointment: ${updateError.message}`)
    }

    console.log('Appointment atualizado com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        event_id: calendarEvent.id,
        meet_link: meetLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro na function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})