// app/agendamento/[psicologoId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabaseClient'
import Image from 'next/image'
import Link from 'next/link'

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  is_active: boolean
}

interface Psychologist {
  id: string
  user_id: string
  price_per_session: number
  session_duration: number
  modality: string[]
  avatar_url: string | null
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

export default function AgendamentoPage({ params }: { params: { psicologoId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [psychologist, setPsychologist] = useState<Psychologist | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [modality, setModality] = useState<'online' | 'presencial'>('online')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string>('')
  const [psicologoId, setPsicologoId] = useState<string>('')

  // Unwrap params (Next.js 15+)
  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await Promise.resolve(params)
      setPsicologoId(resolvedParams.psicologoId)
    }
    unwrapParams()
  }, [params])

  // Buscar dados do psicólogo
  useEffect(() => {
    if (!psicologoId) return

    async function fetchPsychologist() {
      try {
        setLoading(true)
        
        // Buscar dados do psicólogo
        const { data: psychData, error: psychError } = await supabase
          .from('psychologists')
          .select('*')
          .eq('id', psicologoId)
          .single()

        if (psychError) {
          setError('Psicólogo não encontrado')
          return
        }

        // Buscar dados do profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', psychData.user_id)
          .single()

        setPsychologist({
          ...psychData,
          profile: {
            full_name: profileData?.full_name || 'Psicólogo',
            avatar_url: profileData?.avatar_url || psychData.avatar_url || null
          }
        })

        // Set default modality
        if (psychData.modality && psychData.modality.length > 0) {
          setModality(psychData.modality[0])
        }
      } catch (err) {
        console.error('Erro ao carregar psicólogo:', err)
        setError('Erro ao carregar psicólogo')
      } finally {
        setLoading(false)
      }
    }

    fetchPsychologist()
  }, [psicologoId])

  // Buscar horários disponíveis quando selecionar data
  useEffect(() => {
    if (!selectedDate) return

    async function fetchAvailableSlots() {
      setLoadingSlots(true)
      setError('')

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-availability`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              psychologist_id: psicologoId,
              date: selectedDate,
              modality: modality
            })
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Erro ao buscar horários')
          setAvailableSlots([])
          return
        }

        setAvailableSlots(data.available_slots || [])
      } catch (err) {
        setError('Erro ao conectar com servidor')
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, modality, psicologoId])

  // Criar agendamento
  async function handleCreateAppointment() {
    if (!selectedSlot || !selectedDate) {
      setError('Selecione data e horário')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-appointment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            psychologist_id: psicologoId,
            slot_id: selectedSlot,
            date: selectedDate,
            modality: modality
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar agendamento')
        return
      }

      // Redirecionar para página de pagamento
      router.push(`/pagamento/${data.appointment.id}`)
    } catch (err) {
      setError('Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  // Gerar próximos 30 dias
  const generateDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  const dates = generateDates()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading && !psychologist) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Carregando agendamento...</p>
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

  if (error && !psychologist) {
    return (
      <div className="error-page">
        <div className="error-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Erro ao carregar</h2>
          <p>{error}</p>
          <Link href="/buscar" className="btn-back">
            Voltar para Busca
          </Link>
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
          .error-content svg {
            color: #ef4444;
            margin-bottom: 24px;
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
          .btn-back {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            transition: all 0.3s ease;
          }
          .btn-back:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
          }
        `}</style>
      </div>
    )
  }

  if (!psychologist) return null

  return (
    <>
      <div className="appointment-page">
        {/* Header com Breadcrumb */}
        <section className="appointment-header">
          <div className="header-container">
            <div className="breadcrumb">
              <Link href="/">Início</Link>
              <span>›</span>
              <Link href="/buscar">Buscar</Link>
              <span>›</span>
              <Link href={`/perfil/${psychologist.id}`}>{psychologist.profile.full_name}</Link>
              <span>›</span>
              <span>Agendamento</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="appointment-main">
          <div className="main-container">
            <div className="appointment-grid">
              
              {/* Sidebar - Resumo do Psicólogo */}
              <aside className="appointment-sidebar">
                <div className="psychologist-card">
                  <div className="psychologist-header">
                    <div className="avatar-mini">
                      {psychologist.profile.avatar_url ? (
                        <Image 
                          src={psychologist.profile.avatar_url}
                          alt={psychologist.profile.full_name}
                          width={80}
                          height={80}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(psychologist.profile.full_name)}
                        </div>
                      )}
                    </div>
                    <div className="psychologist-info">
                      <h3>{psychologist.profile.full_name}</h3>
                      <p>Psicólogo(a)</p>
                    </div>
                  </div>

                  <div className="session-details">
                    <div className="detail-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{psychologist.session_duration} minutos</span>
                    </div>
                    <div className="detail-item price">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span className="price-value">R$ {psychologist.price_per_session?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Resumo do Agendamento */}
                  <div className="booking-summary">
                    <h4>Resumo</h4>
                    <div className="summary-items">
                      <div className="summary-item">
                        <span className="label">Modalidade:</span>
                        <span className="value">
                          {modality === 'online' ? '💻 Online' : '🏢 Presencial'}
                        </span>
                      </div>
                      {selectedDate && (
                        <div className="summary-item">
                          <span className="label">Data:</span>
                          <span className="value">
                            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {selectedSlot && (
                        <div className="summary-item">
                          <span className="label">Horário:</span>
                          <span className="value">
                            {availableSlots.find(s => s.id === selectedSlot)?.start_time.slice(0, 5)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content - Seleção */}
              <div className="appointment-content">
                
                {/* Step 1: Modalidade */}
                <div className="step-card">
                  <div className="step-header">
                    <div className="step-number">1</div>
                    <div className="step-title">
                      <h2>Escolha a Modalidade</h2>
                      <p>Selecione como deseja realizar a consulta</p>
                    </div>
                  </div>
                  
                  <div className="modality-grid">
                    {psychologist.modality.includes('online') && (
                      <button
                        onClick={() => {
                          setModality('online')
                          setSelectedDate('')
                          setSelectedSlot('')
                        }}
                        className={`modality-card ${modality === 'online' ? 'selected' : ''}`}
                      >
                        <div className="modality-icon online">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                        </div>
                        <h3>Online</h3>
                        <p>Consulta por videochamada</p>
                        {modality === 'online' && (
                          <div className="selected-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </button>
                    )}
                    
                    {psychologist.modality.includes('presencial') && (
                      <button
                        onClick={() => {
                          setModality('presencial')
                          setSelectedDate('')
                          setSelectedSlot('')
                        }}
                        className={`modality-card ${modality === 'presencial' ? 'selected' : ''}`}
                      >
                        <div className="modality-icon presencial">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                        </div>
                        <h3>Presencial</h3>
                        <p>Consulta no consultório</p>
                        {modality === 'presencial' && (
                          <div className="selected-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Data */}
                <div className="step-card">
                  <div className="step-header">
                    <div className="step-number">2</div>
                    <div className="step-title">
                      <h2>Escolha a Data</h2>
                      <p>Selecione o dia da sua consulta</p>
                    </div>
                  </div>
                  
                  <div className="calendar-grid">
                    {dates.map((date) => {
                      const dateObj = new Date(date + 'T12:00:00')
                      const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })
                      const dayNumber = dateObj.getDate()
                      const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' })
                      const isToday = date === new Date().toISOString().split('T')[0]
                      
                      return (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlot('')
                          }}
                          className={`calendar-day ${selectedDate === date ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        >
                          {isToday && <span className="today-label">Hoje</span>}
                          <div className="day-name">{dayName}</div>
                          <div className="day-number">{dayNumber}</div>
                          <div className="month-name">{monthName}</div>
                          {selectedDate === date && (
                            <div className="selected-indicator"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Step 3: Horário */}
                {selectedDate && (
                  <div className="step-card">
                    <div className="step-header">
                      <div className="step-number">3</div>
                      <div className="step-title">
                        <h2>Escolha o Horário</h2>
                        <p>Selecione o melhor horário para você</p>
                      </div>
                    </div>
                    
                    {loadingSlots ? (
                      <div className="loading-slots">
                        <div className="spinner-small"></div>
                        <p>Carregando horários disponíveis...</p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="no-slots">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <h3>Nenhum horário disponível</h3>
                        <p>Não há horários disponíveis nesta data. Tente outra data.</p>
                      </div>
                    ) : (
                      <div className="slots-grid">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`slot-card ${selectedSlot === slot.id ? 'selected' : ''}`}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>{slot.start_time.slice(0, 5)}</span>
                            {selectedSlot === slot.id && (
                              <div className="check-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Erro */}
                {error && (
                  <div className="error-alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botão Confirmar */}
                <div className="action-buttons">
                  <button
                    onClick={handleCreateAppointment}
                    disabled={!selectedSlot || loading}
                    className="btn-confirm"
                  >
                    {loading ? (
                      <>
                        <div className="spinner-button"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar para Pagamento</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .appointment-page {
          min-height: 100vh;
          background: #fafafa;
        }

        .appointment-header {
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

        .appointment-main {
          padding: 40px 24px 80px;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .appointment-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 32px;
          align-items: start;
        }

        /* Sidebar */
        .appointment-sidebar {
          position: sticky;
          top: 100px;
        }

        .psychologist-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.1);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .psychologist-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid rgba(124, 101, 181, 0.08);
        }

        .avatar-mini {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #7c65b5;
          flex-shrink: 0;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e8e4f7 0%, #ddd8f0 100%);
          font-size: 28px;
          font-weight: 900;
          color: #7c65b5;
        }

        .psychologist-info h3 {
          font-size: 18px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .psychologist-info p {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 600;
        }

        .session-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid rgba(124, 101, 181, 0.08);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(124, 101, 181, 0.05);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #2d1f3e;
        }

        .detail-item svg {
          color: #7c65b5;
          flex-shrink: 0;
        }

        .detail-item.price {
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.08) 0%, rgba(169, 150, 221, 0.08) 100%);
        }

        .price-value {
          font-size: 20px;
          font-weight: 900;
          color: #7c65b5;
        }

        .booking-summary h4 {
          font-size: 16px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 16px;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .summary-item .label {
          color: #9b8fab;
          font-weight: 600;
        }

        .summary-item .value {
          color: #2d1f3e;
          font-weight: 700;
          text-align: right;
        }

        /* Main Content */
        .appointment-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .step-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
        }

        .step-title h2 {
          font-size: 22px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .step-title p {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 500;
        }

        /* Modalidade */
        .modality-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .modality-card {
          position: relative;
          padding: 28px 24px;
          background: rgba(124, 101, 181, 0.03);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .modality-card:hover {
          background: rgba(124, 101, 181, 0.05);
          border-color: #7c65b5;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 101, 181, 0.15);
        }

        .modality-card.selected {
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.1) 0%, rgba(169, 150, 221, 0.1) 100%);
          border-color: #7c65b5;
          border-width: 3px;
        }

        .modality-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modality-icon.online {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
        }

        .modality-icon.presencial {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(110, 231, 183, 0.1) 100%);
        }

        .modality-icon svg {
          color: #7c65b5;
        }

        .modality-card.selected .modality-icon {
          transform: scale(1.1);
        }

        .modality-card h3 {
          font-size: 18px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .modality-card p {
          font-size: 13px;
          color: #9b8fab;
          font-weight: 500;
        }

        .selected-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #7c65b5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selected-badge svg {
          color: white;
          stroke-width: 3;
        }

        /* Calendar */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        .calendar-day {
          position: relative;
          padding: 16px 12px;
          background: rgba(124, 101, 181, 0.03);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .calendar-day:hover {
          background: rgba(124, 101, 181, 0.05);
          border-color: #7c65b5;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.15);
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          border-color: #7c65b5;
          color: white;
        }

        .calendar-day.today {
          border-color: #f59e0b;
          border-width: 3px;
        }

        .today-label {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: #f59e0b;
          background: rgba(251, 191, 36, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .day-name {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .day-number {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 2px;
        }

        .month-name {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .selected-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Slots */
        .loading-slots {
          text-align: center;
          padding: 48px 24px;
        }

        .spinner-small {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(124, 101, 181, 0.1);
          border-top-color: #7c65b5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-slots p {
          color: #9b8fab;
          font-size: 14px;
          font-weight: 500;
        }

        .no-slots {
          text-align: center;
          padding: 48px 24px;
        }

        .no-slots svg {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .no-slots h3 {
          font-size: 18px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 8px;
        }

        .no-slots p {
          font-size: 14px;
          color: #9b8fab;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }

        .slot-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: rgba(124, 101, 181, 0.03);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          font-weight: 700;
          color: #2d1f3e;
        }

        .slot-card:hover {
          background: rgba(124, 101, 181, 0.05);
          border-color: #7c65b5;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.15);
        }

        .slot-card.selected {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          border-color: #7c65b5;
          color: white;
        }

        .slot-card svg {
          flex-shrink: 0;
        }

        .check-icon {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .check-icon svg {
          color: #7c65b5;
          stroke-width: 3;
        }

        /* Error Alert */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 12px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 600;
        }

        .error-alert svg {
          flex-shrink: 0;
          color: #ef4444;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 16px;
        }

        .btn-confirm {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px 32px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.3);
        }

        .btn-confirm:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(124, 101, 181, 0.4);
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .spinner-button {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .appointment-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .appointment-sidebar {
            position: static;
          }

          .calendar-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .appointment-header {
            padding: 80px 16px 16px;
          }

          .appointment-main {
            padding: 24px 16px 60px;
          }

          .psychologist-card {
            padding: 20px;
          }

          .step-card {
            padding: 24px;
          }

          .step-header {
            gap: 16px;
          }

          .step-number {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .step-title h2 {
            font-size: 18px;
          }

          .modality-grid {
            grid-template-columns: 1fr;
          }

          .calendar-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  )
}