// app/dashboard/page.tsx - Com CSS Modules
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

interface Profile {
  user_type: 'patient' | 'psychologist'
  full_name: string
  avatar_url?: string
  phone?: string
  bio?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  payment_status: string
  duration_minutes: number
  google_meet_link?: string
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

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, full_name, avatar_url, phone, bio')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError)
        if (profileError.code === 'PGRST116') {
          router.push('/onboarding')
          return
        }
        throw profileError
      }

      setProfile(profileData)

      if (profileData.user_type === 'patient') {
        await loadPatientAppointments(user.id)
      } else {
        await loadPsychologistAppointments(user.id)
      }

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const loadPatientAppointments = async (userId: string) => {
    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!patientData) return

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, payment_status, duration_minutes, psychologist_id, google_meet_link')
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: true })
        .limit(20)

      if (!appointmentsData) return

      const enriched = await Promise.all(
        appointmentsData.map(async (apt) => {
          try {
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
          } catch (e) {
            console.error('Erro ao enriquecer appointment:', e)
          }
          return apt
        })
      )

      setAppointments(enriched)
    } catch (err) {
      console.error('Erro ao carregar appointments do paciente:', err)
    }
  }

  const loadPsychologistAppointments = async (userId: string) => {
    try {
      const { data: psychData } = await supabase
        .from('psychologists')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!psychData) return

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, payment_status, duration_minutes, patient_id, google_meet_link')
        .eq('psychologist_id', psychData.id)
        .order('appointment_date', { ascending: true })
        .limit(20)

      if (!appointmentsData) return

      const enriched = await Promise.all(
        appointmentsData.map(async (apt) => {
          try {
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
          } catch (e) {
            console.error('Erro ao enriquecer appointment:', e)
          }
          return apt
        })
      )

      setAppointments(enriched)
    } catch (err) {
      console.error('Erro ao carregar appointments do psicólogo:', err)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    try {
      setCancellingId(appointmentId)

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error

      await loadDashboard()
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
      return { text: 'Aguardando Pagamento', className: styles.statusPendingPayment }
    }
    const badges: Record<string, { text: string; className: string }> = {
      scheduled: { text: 'Agendada', className: styles.statusScheduled },
      confirmed: { text: 'Confirmada', className: styles.statusConfirmed },
      completed: { text: 'Concluída', className: styles.statusCompleted },
      cancelled: { text: 'Cancelada', className: styles.statusCancelled }
    }
    return badges[status] || { text: status, className: '' }
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    })
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(
      apt => apt.appointment_date >= today && 
             apt.status !== 'cancelled' && 
             apt.payment_status === 'paid'
    )
  }

  const getPendingPaymentAppointments = () => {
    return appointments.filter(apt => apt.payment_status === 'pending' && apt.status !== 'cancelled')
  }

  // Loading State
  if (loading) {
    return (
      <main className={styles.dashboardPage}>
        <div className={styles.dashboardContainer}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </main>
    )
  }

  // Error State
  if (error) {
    return (
      <main className={styles.dashboardPage}>
        <div className={styles.dashboardContainer}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Erro ao Carregar Dashboard</h2>
            <p>{error}</p>
            <div className={styles.errorActions}>
              <button className={styles.btnRetry} onClick={loadDashboard}>
                Tentar Novamente
              </button>
              <button className={styles.btnBack} onClick={() => router.push('/')}>
                Voltar à Página Inicial
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const upcomingAppointments = getUpcomingAppointments()
  const pendingPaymentAppointments = getPendingPaymentAppointments()

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.dashboardContainer}>
        
        {/* Header */}
        <div className={styles.dashboardHeader}>
          <div>
            <h1>Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋</h1>
            <p>
              {profile?.user_type === 'patient' 
                ? 'Gerencie suas sessões e encontre psicólogos'
                : 'Acompanhe seus atendimentos e pacientes'
              }
            </p>
          </div>
          <Link href="/perfil" className={styles.btnProfile}>
            Editar Perfil
          </Link>
        </div>

        {/* Quick Actions (paciente) */}
        {profile?.user_type === 'patient' && (
          <div className={styles.quickActions}>
            <Link href="/buscar" className={styles.actionCard}>
              <div className={styles.actionIcon}>🔍</div>
              <div>
                <h3>Buscar Psicólogos</h3>
                <p>Encontre o profissional ideal</p>
              </div>
            </Link>
          </div>
        )}

        {/* Pending Payment */}
        {profile?.user_type === 'patient' && pendingPaymentAppointments.length > 0 && (
          <div className={`${styles.section} ${styles.sectionWarning}`}>
            <h2>⏳ Aguardando Pagamento ({pendingPaymentAppointments.length})</h2>
            <div className={styles.appointmentsList}>
              {pendingPaymentAppointments.map(apt => (
                <div key={apt.id} className={`${styles.appointmentCard} ${styles.appointmentCardPending}`}>
                  <div className={styles.appointmentAvatar}>
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(apt.psychologist?.full_name || 'P')}
                    </div>
                  </div>
                  <div className={styles.appointmentInfo}>
                    <h3>{apt.psychologist?.full_name}</h3>
                    <div className={styles.appointmentDatetime}>
                      <span>📅 {formatDate(apt.appointment_date)}</span>
                      <span>🕐 {formatTime(apt.appointment_time)}</span>
                    </div>
                  </div>
                  <div className={styles.appointmentActions}>
                    <span className={`${styles.statusBadge} ${styles.statusPendingPayment}`}>
                      Aguardando Pagamento
                    </span>
                    <div className={styles.actionButtons}>
                      <Link href={`/pagamento/${apt.id}`} className={`${styles.btnAction} ${styles.btnActionPrimary}`}>
                        💳 Pagar
                      </Link>
                      <button 
                        className={`${styles.btnAction} ${styles.btnActionDanger}`}
                        onClick={() => handleCancelAppointment(apt.id)}
                        disabled={cancellingId === apt.id}
                      >
                        {cancellingId === apt.id ? '...' : '❌'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        <div className={styles.section}>
          <h2>📅 Próximas Sessões ({upcomingAppointments.length})</h2>
          
          {upcomingAppointments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma sessão agendada</p>
              {profile?.user_type === 'patient' && (
                <Link href="/buscar" className={styles.btnEmpty}>
                  Buscar Psicólogos
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {upcomingAppointments.map(apt => {
                const badge = getStatusBadge(apt.status, apt.payment_status)
                return (
                  <div key={apt.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentAvatar}>
                      <div className={styles.avatarPlaceholder}>
                        {getInitials(
                          profile?.user_type === 'patient' 
                            ? apt.psychologist?.full_name || 'P'
                            : apt.patient?.full_name || 'P'
                        )}
                      </div>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <h3>
                        {profile?.user_type === 'patient' 
                          ? apt.psychologist?.full_name 
                          : apt.patient?.full_name
                        }
                      </h3>
                      <div className={styles.appointmentDatetime}>
                        <span>📅 {formatDate(apt.appointment_date)}</span>
                        <span>🕐 {formatTime(apt.appointment_time)}</span>
                      </div>
                    </div>
                    <div className={styles.appointmentActions}>
                      <span className={`${styles.statusBadge} ${badge.className}`}>
                        {badge.text}
                      </span>
                      <div className={styles.actionButtons}>
                        {apt.google_meet_link && (
                          <a href={apt.google_meet_link} target="_blank" rel="noopener noreferrer" className={styles.btnMeet}>
                            📹 Entrar
                          </a>
                        )}
                        {profile?.user_type === 'patient' && (
                          <button 
                            className={`${styles.btnAction} ${styles.btnActionDanger}`}
                            onClick={() => handleCancelAppointment(apt.id)}
                            disabled={cancellingId === apt.id}
                          >
                            {cancellingId === apt.id ? '...' : '❌ Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}