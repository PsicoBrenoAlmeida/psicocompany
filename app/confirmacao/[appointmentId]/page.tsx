// app/confirmacao/[appointmentId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Appointment {
  id: string
  date: string
  modality: string
  status: string
  payment_status: string
  psychologist: {
    user_id: string
    price_per_session: number
    session_duration: number
    profile: {
      full_name: string
      email: string
      phone: string
    }
  }
  slot: {
    start_time: string
    end_time: string
  }
}

export default function ConfirmacaoPage({ params }: { params: { appointmentId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [appointmentId, setAppointmentId] = useState<string>('')

  // Unwrap params (Next.js 15+)
  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await Promise.resolve(params)
      setAppointmentId(resolvedParams.appointmentId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (!appointmentId) return

    async function fetchAppointment() {
      try {
        const { data: aptData, error: aptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single()

        if (aptError) {
          setError('Agendamento não encontrado')
          setLoading(false)
          return
        }

        // Verificar se está confirmado
        if (aptData.status !== 'confirmed' || aptData.payment_status !== 'paid') {
          setError('Pagamento ainda não confirmado')
          setLoading(false)
          return
        }

        // Buscar psicólogo
        const { data: psychData } = await supabase
          .from('psychologists')
          .select('*')
          .eq('id', aptData.psychologist_id)
          .single()

        // Buscar profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('user_id', psychData?.user_id)
          .single()

        // Buscar slot
        const { data: slotData } = await supabase
          .from('availability_slots')
          .select('start_time, end_time')
          .eq('id', aptData.slot_id)
          .single()

        const fullAppointment = {
          ...aptData,
          psychologist: {
            ...psychData,
            profile: {
              full_name: profileData?.full_name || 'Psicólogo',
              email: profileData?.email || '',
              phone: profileData?.phone || ''
            }
          },
          slot: slotData
        }

        setAppointment(fullAppointment)
        setLoading(false)
      } catch (err) {
        console.error('Erro:', err)
        setError('Erro ao carregar agendamento')
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [appointmentId])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Carregando confirmação...</p>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          }
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(124, 101, 181, 0.1);
            border-top-color: #7c65b5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-page p {
            color: #6b5d7a;
            font-size: 16px;
            font-weight: 500;
          }
        `}</style>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="error-page">
        <div className="error-content">
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2>Erro na Confirmação</h2>
          <p>{error || 'Agendamento não encontrado'}</p>
          <div className="error-actions">
            <button onClick={() => router.push('/')} className="btn-back">
              Voltar ao Início
            </button>
            <Link href="/buscar" className="btn-search">
              Nova Busca
            </Link>
          </div>
        </div>
        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
            padding: 20px;
          }
          .error-content {
            text-align: center;
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(124, 101, 181, 0.12);
            max-width: 500px;
          }
          .error-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-icon svg {
            color: #ef4444;
          }
          .error-content h2 {
            font-size: 24px;
            font-weight: 800;
            color: #2d1f3e;
            margin-bottom: 12px;
          }
          .error-content p {
            font-size: 16px;
            color: #6b5d7a;
            margin-bottom: 28px;
          }
          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-back, .btn-search {
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }
          .btn-back {
            background: white;
            color: #7c65b5;
            border: 2px solid #7c65b5;
          }
          .btn-search {
            background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
            color: white;
            border: none;
          }
          .btn-back:hover, .btn-search:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 101, 181, 0.3);
          }
        `}</style>
      </div>
    )
  }

  const appointmentDate = new Date(appointment.date + 'T12:00:00')
  const dayName = appointmentDate.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dateFormatted = appointmentDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <>
      <div className="confirmation-page">
        {/* Header com Breadcrumb */}
        <section className="confirmation-header">
          <div className="header-container">
            <div className="breadcrumb">
              <Link href="/">Início</Link>
              <span>›</span>
              <Link href="/buscar">Buscar</Link>
              <span>›</span>
              <span>Confirmação</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="confirmation-main">
          <div className="main-container">
            
            {/* Success Banner */}
            <div className="success-banner">
              <div className="success-animation">
                <div className="success-circle">
                  <div className="checkmark-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="success-content">
                <h1>Pagamento Confirmado!</h1>
                <p>Sua consulta foi agendada com sucesso. Você receberá um e-mail de confirmação em instantes.</p>
              </div>
            </div>

            <div className="confirmation-grid">
              
              {/* Coluna Principal - Detalhes */}
              <div className="confirmation-details">
                
                {/* Appointment Details Card */}
                <div className="details-card">
                  <div className="card-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h2>Detalhes da Consulta</h2>
                  </div>

                  <div className="details-list">
                    {/* Psicólogo */}
                    <div className="detail-item">
                      <div className="detail-icon psychologist">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Psicólogo(a)</span>
                        <span className="detail-value">{appointment.psychologist.profile.full_name}</span>
                        <span className="detail-extra">Profissional de Psicologia</span>
                      </div>
                    </div>

                    {/* Data */}
                    <div className="detail-item">
                      <div className="detail-icon calendar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Data da Consulta</span>
                        <span className="detail-value capitalize">{dayName}, {dateFormatted}</span>
                        <span className="detail-extra">
                          {appointment.slot.start_time.slice(0, 5)} às {appointment.slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    {/* Modalidade */}
                    <div className="detail-item">
                      <div className="detail-icon modality">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {appointment.modality === 'online' ? (
                            <>
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </>
                          ) : (
                            <>
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </>
                          )}
                        </svg>
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Modalidade</span>
                        <span className="detail-value capitalize">{appointment.modality}</span>
                        <span className="detail-extra">
                          {appointment.modality === 'online' 
                            ? 'Link será enviado por e-mail 1 hora antes' 
                            : 'Endereço disponível no e-mail de confirmação'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Duração */}
                    <div className="detail-item">
                      <div className="detail-icon time">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Duração</span>
                        <span className="detail-value">{appointment.psychologist.session_duration} minutos</span>
                        <span className="detail-extra">Sessão individual</span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="detail-item highlighted">
                      <div className="detail-icon payment">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Valor Pago</span>
                        <span className="detail-value large">R$ {appointment.psychologist.price_per_session.toFixed(2)}</span>
                        <span className="detail-extra payment-confirmed">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Pagamento confirmado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Próximos Passos */}
                <div className="next-steps-card">
                  <div className="card-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h2>Próximos Passos</h2>
                  </div>

                  <div className="steps-list">
                    <div className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>E-mail de Confirmação</h4>
                        <p>Você receberá um e-mail com todos os detalhes da consulta e instruções adicionais.</p>
                      </div>
                    </div>

                    <div className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>
                          {appointment.modality === 'online' ? 'Link da Sessão' : 'Endereço do Consultório'}
                        </h4>
                        <p>
                          {appointment.modality === 'online' 
                            ? 'O link para acessar a videochamada será enviado 1 hora antes da sessão.' 
                            : 'O endereço completo do consultório está disponível no e-mail de confirmação.'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Prepare-se para a Sessão</h4>
                        <p>
                          {appointment.modality === 'online' 
                            ? 'Certifique-se de ter uma boa conexão de internet e um local tranquilo.' 
                            : 'Chegue com 5-10 minutos de antecedência ao consultório.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                {(appointment.psychologist.profile.email || appointment.psychologist.profile.phone) && (
                  <div className="contact-card">
                    <div className="card-header">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <h2>Contato do Profissional</h2>
                    </div>

                    <div className="contact-info">
                      <p className="contact-intro">
                        Em caso de dúvidas ou necessidade de reagendamento, entre em contato:
                      </p>
                      <div className="contact-list">
                        {appointment.psychologist.profile.email && (
                          <a href={`mailto:${appointment.psychologist.profile.email}`} className="contact-item">
                            <div className="contact-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                              </svg>
                            </div>
                            <div className="contact-details">
                              <span className="contact-label">E-mail</span>
                              <span className="contact-value">{appointment.psychologist.profile.email}</span>
                            </div>
                          </a>
                        )}
                        
                        {appointment.psychologist.profile.phone && (
                          <a href={`tel:${appointment.psychologist.profile.phone}`} className="contact-item">
                            <div className="contact-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                            </div>
                            <div className="contact-details">
                              <span className="contact-label">Telefone</span>
                              <span className="contact-value">{appointment.psychologist.profile.phone}</span>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Actions */}
              <aside className="confirmation-sidebar">
                
                {/* Calendar Card */}
                <div className="calendar-widget">
                  <div className="calendar-header">
                    <h3>Lembrete</h3>
                  </div>
                  <div className="calendar-body">
                    <div className="calendar-date">
                      <div className="date-month">
                        {appointmentDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                      </div>
                      <div className="date-day">
                        {appointmentDate.getDate()}
                      </div>
                    </div>
                    <div className="calendar-details">
                      <div className="calendar-time">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {appointment.slot.start_time.slice(0, 5)}
                      </div>
                      <div className="calendar-duration">
                        {appointment.psychologist.session_duration} minutos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="actions-card">
                  <h3>O que fazer agora?</h3>
                  
                  <div className="action-buttons">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="btn-primary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <span>Meus Agendamentos</span>
                    </button>

                    <button
                      onClick={() => router.push('/buscar')}
                      className="btn-secondary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                      <span>Buscar Profissionais</span>
                    </button>

                    <button
                      onClick={() => router.push('/')}
                      className="btn-tertiary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      <span>Voltar ao Início</span>
                    </button>
                  </div>
                </div>

                {/* Help Card */}
                <div className="help-card">
                  <div className="help-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="help-content">
                    <h4>Precisa de Ajuda?</h4>
                    <p>Entre em contato com nosso suporte ou com o profissional.</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .confirmation-page {
          min-height: 100vh;
          background: #fafafa;
        }

        .confirmation-header {
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          padding: 100px 24px 24px;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 500;
        }

        .breadcrumb a {
          color: #7c65b5;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .confirmation-main {
          padding: 40px 24px 80px;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Success Banner */
        .success-banner {
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          margin-bottom: 40px;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
          border: 3px solid #10b981;
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .success-animation {
          flex-shrink: 0;
        }

        .success-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .checkmark-icon {
          animation: checkmark 0.5s ease-out 0.2s both;
        }

        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .checkmark-icon svg {
          color: white;
        }

        .success-content h1 {
          font-size: 36px;
          font-weight: 900;
          color: #2d1f3e;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .success-content p {
          font-size: 18px;
          color: #6b5d7a;
          font-weight: 500;
          line-height: 1.6;
        }

        /* Grid Layout */
        .confirmation-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }

        /* Main Content */
        .confirmation-details {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .details-card,
        .next-steps-card,
        .contact-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(124, 101, 181, 0.08);
        }

        .card-header svg {
          color: #7c65b5;
        }

        .card-header h2 {
          font-size: 22px;
          font-weight: 800;
          color: #2d1f3e;
        }

        /* Details List */
        .details-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-item {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(124, 101, 181, 0.03);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .detail-item:hover {
          background: rgba(124, 101, 181, 0.05);
          transform: translateX(4px);
        }

        .detail-item.highlighted {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(110, 231, 183, 0.1) 100%);
          border: 2px solid rgba(16, 185, 129, 0.2);
        }

        .detail-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-icon.psychologist {
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.15) 0%, rgba(169, 150, 221, 0.15) 100%);
        }

        .detail-icon.calendar {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.15) 100%);
        }

        .detail-icon.modality {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%);
        }

        .detail-icon.time {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(196, 181, 253, 0.15) 100%);
        }

        .detail-icon.payment {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(110, 231, 183, 0.15) 100%);
        }

        .detail-icon svg {
          color: #7c65b5;
        }

        .detail-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .detail-label {
          font-size: 13px;
          color: #9b8fab;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .detail-value {
          font-size: 18px;
          color: #2d1f3e;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .detail-value.large {
          font-size: 28px;
          color: #10b981;
        }

        .detail-extra {
          font-size: 13px;
          color: #6b5d7a;
          font-weight: 500;
        }

        .detail-extra.payment-confirmed {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #059669;
          font-weight: 700;
        }

        .detail-extra.payment-confirmed svg {
          color: #10b981;
        }

        /* Steps List */
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .step-item {
          display: flex;
          gap: 20px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 16px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 6px;
        }

        .step-content p {
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 500;
          line-height: 1.6;
        }

        /* Contact Card */
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .contact-intro {
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 500;
          line-height: 1.6;
        }

        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-item {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(124, 101, 181, 0.05);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .contact-item:hover {
          background: rgba(124, 101, 181, 0.1);
          border-color: #7c65b5;
          transform: translateX(4px);
        }

        .contact-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-icon svg {
          color: #7c65b5;
        }

        .contact-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .contact-label {
          font-size: 12px;
          color: #9b8fab;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .contact-value {
          font-size: 15px;
          color: #2d1f3e;
          font-weight: 700;
        }

        /* Sidebar */
        .confirmation-sidebar {
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .calendar-widget,
        .actions-card,
        .help-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.1);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        /* Calendar Widget */
        .calendar-widget {
          overflow: hidden;
        }

        .calendar-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
        }

        .calendar-header h3 {
          font-size: 16px;
          font-weight: 800;
          color: white;
        }

        .calendar-body {
          padding: 24px;
        }

        .calendar-date {
          width: 100%;
          padding: 24px;
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.1) 0%, rgba(169, 150, 221, 0.1) 100%);
          border-radius: 16px;
          text-align: center;
          margin-bottom: 20px;
        }

        .date-month {
          font-size: 14px;
          font-weight: 800;
          color: #7c65b5;
          margin-bottom: 8px;
        }

        .date-day {
          font-size: 48px;
          font-weight: 900;
          color: #2d1f3e;
          line-height: 1;
        }

        .calendar-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .calendar-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 800;
          color: #2d1f3e;
        }

        .calendar-time svg {
          color: #7c65b5;
        }

        .calendar-duration {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 600;
        }

        /* Actions Card */
        .actions-card {
          padding: 24px;
        }

        .actions-card h3 {
          font-size: 16px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-tertiary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
        }

        .btn-secondary {
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          border: 2px solid rgba(124, 101, 181, 0.2);
        }

        .btn-tertiary {
          background: white;
          color: #6b5d7a;
          border: 2px solid rgba(124, 101, 181, 0.15);
        }

        .btn-primary:hover,
        .btn-secondary:hover,
        .btn-tertiary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 101, 181, 0.2);
        }

        /* Help Card */
        .help-card {
          padding: 20px;
          display: flex;
          gap: 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .help-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .help-icon svg {
          color: #3b82f6;
        }

        .help-content h4 {
          font-size: 14px;
          font-weight: 800;
          color: #1e40af;
          margin-bottom: 4px;
        }

        .help-content p {
          font-size: 12px;
          color: #2563eb;
          font-weight: 500;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .confirmation-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .confirmation-sidebar {
            position: static;
          }

          .success-banner {
            flex-direction: column;
            text-align: center;
            padding: 40px 32px;
          }

          .success-content h1 {
            font-size: 28px;
          }

          .success-content p {
            font-size: 16px;
          }
        }

        @media (max-width: 640px) {
          .confirmation-header {
            padding: 80px 16px 16px;
          }

          .confirmation-main {
            padding: 24px 16px 60px;
          }

          .success-banner {
            padding: 32px 24px;
          }

          .success-circle {
            width: 80px;
            height: 80px;
          }

          .success-content h1 {
            font-size: 24px;
          }

          .success-content p {
            font-size: 15px;
          }

          .details-card,
          .next-steps-card,
          .contact-card {
            padding: 24px;
          }

          .detail-item {
            flex-direction: column;
            gap: 16px;
          }

          .step-item {
            gap: 16px;
          }

          .step-number {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
        }
      `}</style>
    </>
  )
}