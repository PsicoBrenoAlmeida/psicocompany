// app/dashboard/page.tsx - VERSÃO FINAL CORRIGIDA
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'
import { User } from '@supabase/supabase-js'

interface Profile {
  user_type: 'patient' | 'psychologist'
  full_name: string
  avatar_url?: string
  phone?: string
  bio?: string
  birth_date?: string
  city?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  payment_status: string
  duration_minutes: number
  google_meet_link?: string
  google_calendar_event_id?: string
  psychologist_id?: string
  patient_id?: string
  psychologist?: {
    full_name: string
    avatar_url?: string
    specialties: string[]
  }
  patient?: {
    full_name: string
    avatar_url?: string
  }
}

interface PsychologistStats {
  total_sessions: number
  upcoming_sessions: number
  rating: number
  total_reviews: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<PsychologistStats | null>(null)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const createTimeoutPromise = useCallback((ms: number) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: a operação demorou muito')), ms)
    })
  }, [])

  const checkProfileCompleteness = useCallback((profileData: Profile) => {
    const requiredFields = [
      profileData.full_name,
      profileData.phone,
      profileData.bio
    ]
    
    const isComplete = requiredFields.every(field => field && field.trim().length > 0)
    setProfileIncomplete(!isComplete)
  }, [])

  const loadPatientData = useCallback(async (userId: string) => {
    const timeoutMs = 10000

    try {
      const patientPromise = supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single()

      const { data: patientData } = await Promise.race([
        patientPromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: { id: string } | null; error: unknown }

      if (!patientData) return

      const appointmentsPromise = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          payment_status,
          duration_minutes,
          psychologist_id,
          google_meet_link,
          google_calendar_event_id
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      const { data: appointmentsData } = await Promise.race([
        appointmentsPromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: Appointment[] | null; error: unknown }

      if (appointmentsData) {
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt: Appointment) => {
            const { data: psychData } = await supabase
              .from('psychologists')
              .select('user_id, specialties')
              .eq('id', apt.psychologist_id)
              .single()

            if (psychData) {
              const { data: psychProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', psychData.user_id)
                .single()

              return {
                ...apt,
                psychologist: {
                  full_name: psychProfile?.full_name || 'Psicólogo',
                  avatar_url: psychProfile?.avatar_url,
                  specialties: psychData.specialties || []
                }
              }
            }
            return apt
          })
        )

        setAppointments(enrichedAppointments)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error)
    }
  }, [supabase, createTimeoutPromise])

  const loadPsychologistData = useCallback(async (userId: string) => {
    const timeoutMs = 10000

    try {
      const psychPromise = supabase
        .from('psychologists')
        .select('id, rating, total_reviews')
        .eq('user_id', userId)
        .single()

      const { data: psychData } = await Promise.race([
        psychPromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: { id: string; rating: number; total_reviews: number } | null; error: unknown }

      if (!psychData) return

      const appointmentsPromise = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          payment_status,
          duration_minutes,
          patient_id,
          google_meet_link,
          google_calendar_event_id
        `)
        .eq('psychologist_id', psychData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      const { data: appointmentsData } = await Promise.race([
        appointmentsPromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: Appointment[] | null; error: unknown }

      if (appointmentsData) {
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt: Appointment) => {
            const { data: patientData } = await supabase
              .from('patients')
              .select('user_id')
              .eq('id', apt.patient_id)
              .single()

            if (patientData) {
              const { data: patientProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', patientData.user_id)
                .single()

              return {
                ...apt,
                patient: {
                  full_name: patientProfile?.full_name || 'Paciente',
                  avatar_url: patientProfile?.avatar_url
                }
              }
            }
            return apt
          })
        )

        setAppointments(enrichedAppointments)

        const today = new Date().toISOString().split('T')[0]
        const upcoming = enrichedAppointments.filter(
          (apt: Appointment) => apt.appointment_date >= today && apt.status !== 'cancelled' && apt.payment_status === 'paid'
        ).length

        setStats({
          total_sessions: enrichedAppointments.filter((apt: Appointment) => apt.status === 'completed').length,
          upcoming_sessions: upcoming,
          rating: psychData.rating || 0,
          total_reviews: psychData.total_reviews || 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do psicólogo:', error)
    }
  }, [supabase, createTimeoutPromise])

  const checkUser = useCallback(async () => {
    const timeoutMs = 10000

    try {
      setLoading(true)
      setError(null)

      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet')
      }

      const userPromise = supabase.auth.getUser()
      const { data: { user: authenticatedUser } } = await Promise.race([
        userPromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: { user: User | null } }
      
      if (!authenticatedUser) {
        router.push('/login')
        return
      }

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authenticatedUser.id)
        .single()

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        createTimeoutPromise(timeoutMs)
      ]) as { data: Profile | null; error: unknown }

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError)
        setError('Erro ao carregar perfil.')
        return
      }

      if (profileData) {
        setProfile(profileData)
        
        if (profileData.user_type === 'patient') {
          checkProfileCompleteness(profileData)
          await loadPatientData(authenticatedUser.id)
        } else {
          await loadPsychologistData(authenticatedUser.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      if (errorMessage.includes('Timeout')) {
        setError('A conexão está muito lenta. Tente novamente.')
      } else if (errorMessage.includes('internet')) {
        setError('Sem conexão com a internet. Verifique sua rede.')
      } else {
        setError('Erro ao carregar dados. Tente atualizar a página.')
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, router, createTimeoutPromise, checkProfileCompleteness, loadPatientData, loadPsychologistData])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    try {
      setCancellingId(appointmentId)

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error

      // Recarregar appointments
      await checkUser()
      alert('Agendamento cancelado com sucesso!')
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      alert('Erro ao cancelar agendamento. Tente novamente.')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'pending') {
      return { text: 'Aguardando Pagamento', class: 'status-pending-payment' }
    }

    const badges = {
      scheduled: { text: 'Agendada', class: 'status-scheduled' },
      confirmed: { text: 'Confirmada', class: 'status-confirmed' },
      completed: { text: 'Concluída', class: 'status-completed' },
      cancelled: { text: 'Cancelada', class: 'status-cancelled' }
    }
    return badges[status as keyof typeof badges] || { text: status, class: '' }
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    })
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getPendingPaymentAppointments = () => {
    return appointments.filter(apt => apt.payment_status === 'pending' && apt.status !== 'cancelled')
  }

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(
      apt => apt.appointment_date >= today && 
             apt.status !== 'cancelled' && 
             apt.payment_status === 'paid'
    )
  }

  const getPastAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(
      apt => (apt.appointment_date < today || apt.status === 'completed') &&
             apt.payment_status === 'paid'
    )
  }

  if (loading) {
    return (
      <>
        <main className="dashboard-page">
          <div className="dashboard-container">
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando dashboard...</p>
              <button 
                className="btn-cancel-loading"
                onClick={() => {
                  setLoading(false)
                  router.push('/')
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

  if (error) {
    return (
      <>
        <main className="dashboard-page">
          <div className="dashboard-container">
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h2>Erro ao Carregar Dashboard</h2>
              <p>{error}</p>
              <div className="error-actions">
                <button className="btn-retry" onClick={checkUser}>
                  Tentar Novamente
                </button>
                <button className="btn-back-error" onClick={() => router.push('/')}>
                  Voltar à Página Inicial
                </button>
              </div>
            </div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

  const pendingPaymentAppointments = getPendingPaymentAppointments()
  const upcomingAppointments = getUpcomingAppointments()
  const pastAppointments = getPastAppointments()

  return (
    <>
      <main className="dashboard-page">
        <div className="dashboard-container">
          
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1>Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋</h1>
              <p>
                {profile?.user_type === 'patient' 
                  ? 'Gerencie suas sessões e encontre psicólogos'
                  : 'Acompanhe seus atendimentos e pacientes'
                }
              </p>
            </div>
            <Link href="/perfil" className="btn-profile">
              Editar Perfil
            </Link>
          </div>

          {/* Profile Incomplete Warning (apenas para pacientes) */}
          {profile?.user_type === 'patient' && profileIncomplete && (
            <div className="warning-banner">
              <div className="warning-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="warning-content">
                <h3>Complete seu perfil para uma melhor experiência</h3>
                <p>
                  Adicione informações como telefone e uma breve descrição sobre você. 
                  Isso ajuda os psicólogos a conhecerem melhor seu contexto antes da primeira sessão.
                </p>
              </div>
              <Link href="/perfil" className="btn-complete-profile">
                Completar Perfil
              </Link>
            </div>
          )}

          {/* Stats Cards (apenas para psicólogo) */}
          {profile?.user_type === 'psychologist' && stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon sessions">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{stats.total_sessions}</h3>
                  <p>Sessões realizadas</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon upcoming">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{stats.upcoming_sessions}</h3>
                  <p>Sessões agendadas</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon rating">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{stats.rating.toFixed(1)}</h3>
                  <p>{stats.total_reviews} avaliações</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions (apenas para paciente) */}
          {profile?.user_type === 'patient' && (
            <div className="quick-actions">
              <Link href="/buscar" className="action-card primary">
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <div>
                  <h3>Buscar Psicólogos</h3>
                  <p>Encontre o profissional ideal</p>
                </div>
              </Link>
            </div>
          )}

          {/* Aguardando Pagamento (apenas para paciente) */}
          {profile?.user_type === 'patient' && pendingPaymentAppointments.length > 0 && (
            <div className="section payment-pending-section">
              <div className="section-header">
                <h2>⏳ Aguardando Pagamento</h2>
                <span className="count-badge urgent">{pendingPaymentAppointments.length}</span>
              </div>

              <div className="appointments-list">
                {pendingPaymentAppointments.map(apt => (
                  <div key={apt.id} className="appointment-card pending-payment">
                    <div className="appointment-avatar">
                      {apt.psychologist?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={apt.psychologist.avatar_url} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(apt.psychologist?.full_name || 'P')}
                        </div>
                      )}
                    </div>

                    <div className="appointment-info">
                      <h3>{apt.psychologist?.full_name}</h3>
                      {apt.psychologist?.specialties && (
                        <div className="specialties">
                          {apt.psychologist.specialties.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="specialty-tag">{spec}</span>
                          ))}
                        </div>
                      )}
                      <div className="appointment-datetime">
                        <span>📅 {formatDate(apt.appointment_date)}</span>
                        <span>🕐 {formatTime(apt.appointment_time)}</span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      <span className={`status-badge ${getStatusBadge(apt.status, apt.payment_status).class}`}>
                        {getStatusBadge(apt.status, apt.payment_status).text}
                      </span>
                      <div className="action-buttons">
                        <Link 
                          href={`/pagamento/${apt.id}`}
                          className="btn-action primary"
                        >
                          💳 Finalizar Pagamento
                        </Link>
                        <button 
                          className="btn-action danger"
                          onClick={() => handleCancelAppointment(apt.id)}
                          disabled={cancellingId === apt.id}
                        >
                          {cancellingId === apt.id ? 'Cancelando...' : '❌ Cancelar Tentativa'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          <div className="section">
            <div className="section-header">
              <h2>Próximas Sessões</h2>
              {upcomingAppointments.length > 0 && (
                <span className="count-badge">{upcomingAppointments.length}</span>
              )}
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>Nenhuma sessão agendada</h3>
                <p>
                  {profile?.user_type === 'patient'
                    ? 'Busque um psicólogo e agende sua primeira sessão'
                    : 'Aguardando novos agendamentos de pacientes'
                  }
                </p>
                {profile?.user_type === 'patient' && (
                  <Link href="/buscar" className="btn-empty">
                    Buscar Psicólogos
                  </Link>
                )}
              </div>
            ) : (
              <div className="appointments-list">
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="appointment-card">
                    <div className="appointment-avatar">
                      {profile?.user_type === 'patient' ? (
                        apt.psychologist?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apt.psychologist.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.psychologist?.full_name || 'P')}
                          </div>
                        )
                      ) : (
                        apt.patient?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apt.patient.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.patient?.full_name || 'P')}
                          </div>
                        )
                      )}
                    </div>

                    <div className="appointment-info">
                      <h3>
                        {profile?.user_type === 'patient' 
                          ? apt.psychologist?.full_name 
                          : apt.patient?.full_name
                        }
                      </h3>
                      {profile?.user_type === 'patient' && apt.psychologist?.specialties && (
                        <div className="specialties">
                          {apt.psychologist.specialties.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="specialty-tag">{spec}</span>
                          ))}
                        </div>
                      )}
                      <div className="appointment-datetime">
                        <span>📅 {formatDate(apt.appointment_date)}</span>
                        <span>🕐 {formatTime(apt.appointment_time)}</span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      <span className={`status-badge ${getStatusBadge(apt.status, apt.payment_status).class}`}>
                        {getStatusBadge(apt.status, apt.payment_status).text}
                      </span>
                      
                      <div className="action-buttons">
                        {/* NOVO: Botão Google Meet */}
                        {apt.google_meet_link && (
                          <a
                            href={apt.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-meet"
                          >
                            <svg className="meet-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor"/>
                            </svg>
                            Entrar no Meet
                          </a>
                        )}
                        
                        {profile?.user_type === 'patient' && (
                          <>
                            <button 
                              className="btn-action secondary"
                              onClick={() => alert('Função de remarcar em desenvolvimento')}
                            >
                              📅 Remarcar
                            </button>
                            <button 
                              className="btn-action danger"
                              onClick={() => handleCancelAppointment(apt.id)}
                              disabled={cancellingId === apt.id}
                            >
                              {cancellingId === apt.id ? 'Cancelando...' : '❌ Cancelar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2>Histórico</h2>
                <span className="count-badge">{pastAppointments.length}</span>
              </div>

              <div className="appointments-list past">
                {pastAppointments.slice(0, 5).map(apt => (
                  <div key={apt.id} className="appointment-card past">
                    <div className="appointment-avatar">
                      {profile?.user_type === 'patient' ? (
                        apt.psychologist?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apt.psychologist.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.psychologist?.full_name || 'P')}
                          </div>
                        )
                      ) : (
                        apt.patient?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apt.patient.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.patient?.full_name || 'P')}
                          </div>
                        )
                      )}
                    </div>

                    <div className="appointment-info">
                      <h3>
                        {profile?.user_type === 'patient' 
                          ? apt.psychologist?.full_name 
                          : apt.patient?.full_name
                        }
                      </h3>
                      <div className="appointment-datetime">
                        <span>📅 {formatDate(apt.appointment_date)}</span>
                        <span>🕐 {formatTime(apt.appointment_time)}</span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      <span className={`status-badge ${getStatusBadge(apt.status, apt.payment_status).class}`}>
                        {getStatusBadge(apt.status, apt.payment_status).text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {pastAppointments.length > 5 && (
                <button className="btn-see-more">
                  Ver todas as {pastAppointments.length} sessões
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx>{styles}</style>
    </>
  )
}

const styles = `
  .dashboard-page {
    min-height: 100vh;
    background: #faf9fc;
    padding: 120px 24px 60px;
  }

  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Header */
  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .dashboard-header h1 {
    font-size: 32px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .dashboard-header p {
    color: #6b5d7a;
    font-size: 16px;
  }

  .btn-profile {
    padding: 12px 24px;
    border-radius: 10px;
    border: 2px solid #7c65b5;
    background: white;
    color: #7c65b5;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-profile:hover {
    background: #7c65b5;
    color: white;
  }

  /* Warning Banner */
  .warning-banner {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
    border: 2px solid rgba(251, 146, 60, 0.3);
    border-radius: 16px;
    margin-bottom: 32px;
    animation: slideDown 0.5s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .warning-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: rgba(251, 146, 60, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ea580c;
  }

  .warning-content {
    flex: 1;
  }

  .warning-content h3 {
    font-size: 16px;
    font-weight: 700;
    color: #9a3412;
    margin-bottom: 6px;
  }

  .warning-content p {
    font-size: 14px;
    color: #c2410c;
    line-height: 1.5;
  }

  .btn-complete-profile {
    flex-shrink: 0;
    padding: 12px 24px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    color: white;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .btn-complete-profile:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
  }

  /* Loading States */
  .btn-cancel-loading {
    margin-top: 20px;
    padding: 10px 24px;
    border-radius: 8px;
    border: 2px solid #7c65b5;
    background: white;
    color: #7c65b5;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-cancel-loading:hover {
    background: #7c65b5;
    color: white;
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: 60px 20px;
  }

  .error-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .error-state h2 {
    font-size: 24px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 12px;
  }

  .error-state p {
    font-size: 16px;
    color: #6b5d7a;
    margin-bottom: 32px;
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-retry,
  .btn-back-error {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .btn-retry {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .btn-retry:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
  }

  .btn-back-error {
    background: white;
    color: #7c65b5;
    border: 2px solid #7c65b5;
  }

  .btn-back-error:hover {
    background: rgba(124, 101, 181, 0.05);
  }

  /* Stats Grid (Psicólogo) */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-icon.sessions {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
  }

  .stat-icon.upcoming {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  }

  .stat-icon.rating {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  }

  .stat-content h3 {
    font-size: 28px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .stat-content p {
    font-size: 14px;
    color: #6b5d7a;
  }

  /* Quick Actions (Paciente) */
  .quick-actions {
    margin-bottom: 40px;
  }

  .action-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
    text-decoration: none;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .action-card.primary {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(124, 101, 181, 0.15);
  }

  .action-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .action-card h3 {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }

  .action-card p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }

  /* Section */
  .section {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .payment-pending-section {
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%);
    border: 2px solid rgba(251, 146, 60, 0.2);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .section-header h2 {
    font-size: 22px;
    font-weight: 700;
    color: #2d1f3e;
  }

  .count-badge {
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
    font-size: 14px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .count-badge.urgent {
    background: rgba(251, 146, 60, 0.2);
    color: #ea580c;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-state svg {
    color: #9b8fab;
    margin-bottom: 20px;
  }

  .empty-state h3 {
    font-size: 20px;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .empty-state p {
    color: #6b5d7a;
    font-size: 15px;
    margin-bottom: 24px;
  }

  .btn-empty {
    display: inline-block;
    padding: 12px 28px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-empty:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
  }

  /* Appointments List */
  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .appointment-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid rgba(124, 101, 181, 0.1);
    transition: all 0.3s ease;
    background: white;
  }

  .appointment-card:hover {
    border-color: #7c65b5;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.1);
  }

  .appointment-card.pending-payment {
    border-color: rgba(251, 146, 60, 0.3);
    background: rgba(251, 146, 60, 0.02);
  }

  .appointment-card.pending-payment:hover {
    border-color: #f97316;
  }

  .appointment-card.past {
    opacity: 0.7;
  }

  .appointment-avatar {
    flex-shrink: 0;
  }

  .appointment-avatar img,
  .appointment-avatar .avatar-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
  }

  .appointment-info {
    flex: 1;
  }

  .appointment-info h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .specialties {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .specialty-tag {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
    font-size: 12px;
    font-weight: 600;
  }

  .appointment-datetime {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #6b5d7a;
  }

  .appointment-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
  }

  .status-badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .status-badge.status-scheduled {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .status-badge.status-confirmed {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .status-badge.status-completed {
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
  }

  .status-badge.status-cancelled {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .status-badge.status-pending-payment {
    background: rgba(251, 146, 60, 0.2);
    color: #ea580c;
    animation: pulse 2s ease-in-out infinite;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-action {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    white-space: nowrap;
    text-decoration: none;
    display: inline-block;
  }

  .btn-action.primary {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .btn-action.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 101, 181, 0.3);
  }

  .btn-action.secondary {
    background: white;
    color: #3b82f6;
    border: 2px solid #3b82f6;
  }

  .btn-action.secondary:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .btn-action.danger {
    background: white;
    color: #ef4444;
    border: 2px solid #ef4444;
  }

  .btn-action.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* NOVO: Botão Google Meet */
  .btn-meet {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #00897b 0%, #00695c 100%);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-meet:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 137, 123, 0.4);
  }

  .btn-meet:active {
    transform: translateY(0);
  }

  .meet-icon {
    flex-shrink: 0;
  }

  .btn-see-more {
    width: 100%;
    padding: 12px;
    margin-top: 16px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #7c65b5;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-see-more:hover {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  /* Loading */
  .loading {
    text-align: center;
    padding: 80px 20px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(124, 101, 181, 0.1);
    border-top-color: #7c65b5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading p {
    color: #6b5d7a;
    font-size: 16px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-page {
      padding: 100px 16px 40px;
    }

    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .dashboard-header h1 {
      font-size: 26px;
    }

    .warning-banner {
      flex-direction: column;
      text-align: center;
      padding: 24px 20px;
    }

    .btn-complete-profile {
      width: 100%;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .section {
      padding: 24px 20px;
    }

    .appointment-card {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .appointment-actions {
      width: 100%;
      align-items: stretch;
    }

    .action-buttons {
      flex-direction: column;
      width: 100%;
    }

    .btn-action,
    .btn-meet {
      width: 100%;
      text-align: center;
      justify-content: center;
    }

    .status-badge {
      display: block;
      text-align: center;
    }

    .error-actions {
      flex-direction: column;
    }

    .btn-retry,
    .btn-back-error {
      width: 100%;
    }
  }
`