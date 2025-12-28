// supabase/functions/mercadopago-webhook/index.ts
// Edge Function: POST /api/webhooks/mercadopago
// Webhook do Mercado Pago - ÚNICA FONTE DE CONFIRMAÇÃO DE PAGAMENTO

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!

console.log('🔑 Token length:', MERCADOPAGO_ACCESS_TOKEN ? MERCADOPAGO_ACCESS_TOKEN.length : 0)

Deno.serve(async (req) => {
  // ============================================
  // 1. CORS Headers
  // ============================================
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Webhook recebido do Mercado Pago')

    // ============================================
    // 2. Validar Webhook (Segurança)
    // ============================================
    const body = await req.json()
    
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2))

    // Mercado Pago envia notificações de diferentes tipos
    // Só processamos notificações de pagamento
    if (body.type !== 'payment') {
      console.log('⏭️ Tipo de notificação ignorado:', body.type)
      return new Response(
        JSON.stringify({ received: true, message: 'Tipo de notificação ignorado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentId = body.data?.id

    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no webhook')
      return new Response(
        JSON.stringify({ error: 'Payment ID não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // 3. Consultar Pagamento no Mercado Pago
    // ============================================
    console.log('🔍 Consultando pagamento:', paymentId)

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      }
    })

    if (!mpResponse.ok) {
      console.error('❌ Erro ao consultar Mercado Pago:', mpResponse.status)
      const errorData = await mpResponse.text()
      console.error('Erro details:', errorData)
      
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentData = await mpResponse.json()
    console.log('💳 Dados do pagamento:', JSON.stringify(paymentData, null, 2))

    // ============================================
    // 4. Extrair Metadata e Buscar Transaction
    // ============================================
    const appointmentId = paymentData.metadata?.appointment_id

    if (!appointmentId) {
      console.error('❌ appointment_id não encontrado no metadata')
      return new Response(
        JSON.stringify({ error: 'Metadata incompleto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ============================================
    // 5. Buscar Transaction no Banco
    // ============================================
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*, appointment:appointments(*)')
      .eq('gateway_payment_id', paymentId.toString())
      .single()

    if (txError || !transaction) {
      console.error('❌ Transaction não encontrada:', txError)
      
      // Se não encontrar, tentar buscar por appointment_id
      const { data: txByApt } = await supabase
        .from('payment_transactions')
        .select('*, appointment:appointments(*)')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!txByApt) {
        return new Response(
          JSON.stringify({ error: 'Transaction não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const finalTransaction = transaction || txByApt

    // ============================================
    // 6. Processar Status do Pagamento
    // ============================================
    const paymentStatus = paymentData.status
    console.log('📊 Status do pagamento:', paymentStatus)

    let newStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending'
    let appointmentStatus: 'pending_payment' | 'confirmed' | 'cancelled' = 'pending_payment'

    switch (paymentStatus) {
      case 'approved':
        newStatus = 'paid'
        appointmentStatus = 'confirmed'
        console.log('✅ Pagamento APROVADO')
        break
      
      case 'rejected':
      case 'cancelled':
        newStatus = 'failed'
        appointmentStatus = 'cancelled'
        console.log('❌ Pagamento REJEITADO/CANCELADO')
        break
      
      case 'refunded':
        newStatus = 'refunded'
        appointmentStatus = 'cancelled'
        console.log('💸 Pagamento REEMBOLSADO')
        break
      
      case 'pending':
      case 'in_process':
        newStatus = 'pending'
        appointmentStatus = 'pending_payment'
        console.log('⏳ Pagamento PENDENTE')
        break
      
      default:
        console.log('⚠️ Status desconhecido:', paymentStatus)
    }

    // ============================================
    // 7. Atualizar Transaction
    // ============================================
    const { error: updateTxError } = await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        raw_response: paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', finalTransaction.id)

    if (updateTxError) {
      console.error('❌ Erro ao atualizar transaction:', updateTxError)
    } else {
      console.log('✅ Transaction atualizada:', finalTransaction.id)
    }

    // ============================================
    // 8. Atualizar Appointment
    // ============================================
    const { error: updateAptError } = await supabase
      .from('appointments')
      .update({
        status: appointmentStatus,
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    if (updateAptError) {
      console.error('❌ Erro ao atualizar appointment:', updateAptError)
    } else {
      console.log('✅ Appointment atualizado:', appointmentId)
    }

    // ============================================
    // 9. Enviar E-mail de Confirmação (se pago)
    // ============================================
    if (newStatus === 'paid') {
      console.log('📧 Enviando e-mail de confirmação...')
      
      try {
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-appointment-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            appointmentId: appointmentId
          })
        })

        if (emailResponse.ok) {
          console.log('✅ E-mail enviado com sucesso')
        } else {
          console.error('❌ Erro ao enviar e-mail:', await emailResponse.text())
        }
      } catch (emailError) {
        console.error('❌ Erro ao chamar função de e-mail:', emailError)
      }

      // ============================================
      // 9.1. Criar Evento no Google Calendar + Meet
      // ============================================
      console.log('📅 Criando evento no Google Calendar...')
      
      try {
        const calendarResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-calendar-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            appointment_id: appointmentId
          })
        })

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          console.log('✅ Evento criado no Google Calendar:', calendarData.event_id)
          console.log('🎥 Link do Meet:', calendarData.meet_link)
        } else {
          const errorText = await calendarResponse.text()
          console.error('❌ Erro ao criar evento no Calendar:', errorText)
          // Não falha o webhook se Calendar der erro
        }
      } catch (calendarError) {
        console.error('❌ Erro ao chamar função de Calendar:', calendarError)
        // Não falha o webhook se Calendar der erro
      }
    }

    // ============================================
    // 10. Log de Auditoria (Opcional)
    // ============================================
    await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        type: 'webhook_mercadopago',
        status: 'sent',
        recipient_info: { payment_id: paymentId, status: paymentStatus },
        sent_at: new Date().toISOString()
      })
      .then(() => console.log('✅ Log de auditoria criado'))
      .catch(err => console.error('❌ Erro ao criar log:', err))

    // ============================================
    // 11. Retornar Sucesso
    // ============================================
    console.log('🎉 Webhook processado com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        payment_id: paymentId,
        payment_status: paymentStatus,
        new_status: newStatus,
        appointment_status: appointmentStatus
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erro fatal no webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})