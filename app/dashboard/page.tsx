// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'
import { User } from '@supabase/supabase-js'

interface Profile {
  user_type: 'patient' | 'psychologist'
  full_name: string
  avatar_url?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<PsychologistStats | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type, full_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        if (profileData.user_type === 'patient') {
          await loadPatientData(user.id)
        } else {
          await loadPsychologistData(user.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientData = async (userId: string) => {
    try {
      // Buscar ID do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!patientData) return

      // Buscar agendamentos do paciente
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          psychologist_id
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (appointmentsData) {
        // Buscar dados dos psicólogos
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
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
  }

  const loadPsychologistData = async (userId: string) => {
    try {
      // Buscar ID e stats do psicólogo
      const { data: psychData } = await supabase
        .from('psychologists')
        .select('id, rating, total_reviews')
        .eq('user_id', userId)
        .single()

      if (!psychData) return

      // Buscar agendamentos do psicólogo
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          patient_id
        `)
        .eq('psychologist_id', psychData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (appointmentsData) {
        // Buscar dados dos pacientes
        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
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

        // Calcular stats
        const today = new Date().toISOString().split('T')[0]
        const upcoming = enrichedAppointments.filter(
          apt => apt.appointment_date >= today && apt.status !== 'cancelled'
        ).length

        setStats({
          total_sessions: enrichedAppointments.filter(apt => apt.status === 'completed').length,
          upcoming_sessions: upcoming,
          rating: psychData.rating || 0,
          total_reviews: psychData.total_reviews || 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do psicólogo:', error)
    }
  }

  const getStatusBadge = (status: string) => {
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

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(
      apt => apt.appointment_date >= today && apt.status !== 'cancelled'
    )
  }

  const getPastAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(
      apt => apt.appointment_date < today || apt.status === 'completed'
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
            </div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

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
              <Link href="/psicologos" className="action-card primary">
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
                  <Link href="/psicologos" className="btn-empty">
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
                          <img src={apt.psychologist.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.psychologist?.full_name || 'P')}
                          </div>
                        )
                      ) : (
                        apt.patient?.avatar_url ? (
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
                      <span className={`status-badge ${getStatusBadge(apt.status).class}`}>
                        {getStatusBadge(apt.status).text}
                      </span>
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
                          <img src={apt.psychologist.avatar_url} alt="Avatar" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(apt.psychologist?.full_name || 'P')}
                          </div>
                        )
                      ) : (
                        apt.patient?.avatar_url ? (
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
                      <span className={`status-badge ${getStatusBadge(apt.status).class}`}>
                        {getStatusBadge(apt.status).text}
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
    margin-bottom: 40px;
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
  }

  .appointment-card:hover {
    border-color: #7c65b5;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.1);
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
    }

    .status-badge {
      display: block;
      text-align: center;
    }
  }
`