// app/agendar/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface Psychologist {
  id: string
  user_id: string
  price_per_session: number
  session_duration: number
  modality: string[]
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

interface TimeSlot {
  time: string
  available: boolean
}

type Step = 'date' | 'payment' | 'confirmation'

export default function AgendarPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const psychologistId = params?.id as string

  const [psychologist, setPsychologist] = useState<Psychologist | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('date')
  
  // Date Selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedModality, setSelectedModality] = useState<'online' | 'presencial'>('online')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Additional Info
  const [patientNotes, setPatientNotes] = useState('')
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card')
  const [processing, setProcessing] = useState(false)
  
  // Card Info
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (psychologistId) {
      loadPsychologist()
    }
  }, [psychologistId])

  useEffect(() => {
    if (selectedDate && psychologist) {
      loadAvailableSlots()
    }
  }, [selectedDate, psychologist])

  const loadPsychologist = async () => {
    try {
      setLoading(true)

      const { data: psychData, error: psychError } = await supabase
        .from('psychologists')
        .select('*')
        .eq('id', psychologistId)
        .single()

      if (psychError) throw psychError

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', psychData.user_id)
        .single()

      setPsychologist({
        ...psychData,
        profile: {
          full_name: profileData?.full_name || 'Psicólogo',
          avatar_url: profileData?.avatar_url || null
        }
      })

      // Set default modality
      if (psychData.modality && psychData.modality.length > 0) {
        setSelectedModality(psychData.modality[0])
      }
    } catch (error) {
      console.error('Erro ao carregar psicólogo:', error)
      router.push('/buscar')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedDate || !psychologist) return

    setLoadingSlots(true)
    try {
      const dayOfWeek = selectedDate.getDay()
      const dateStr = selectedDate.toISOString().split('T')[0]

      // Buscar slots disponíveis para o dia da semana
      const { data: slotsData } = await supabase
        .from('availability_slots')
        .select('start_time, end_time')
        .eq('psychologist_id', psychologist.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)

      // Buscar agendamentos já existentes para esta data
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('psychologist_id', psychologist.id)
        .eq('appointment_date', dateStr)
        .in('status', ['scheduled', 'confirmed'])

      // Gerar slots de horário
      const slots: TimeSlot[] = []
      
      if (slotsData && slotsData.length > 0) {
        slotsData.forEach(slot => {
          const start = parseTime(slot.start_time)
          const end = parseTime(slot.end_time)
          const duration = psychologist.session_duration || 50

          let current = start
          while (current < end) {
            const timeStr = formatTime(current)
            const isBooked = appointmentsData?.some(
              apt => apt.appointment_time === timeStr
            )
            
            slots.push({
              time: timeStr,
              available: !isBooked
            })

            current += duration
          }
        })
      } else {
        // Horários padrão se não houver slots configurados
        const defaultTimes = [
          '08:00', '09:00', '10:00', '11:00', 
          '14:00', '15:00', '16:00', '17:00', '18:00'
        ]
        
        defaultTimes.forEach(time => {
          const isBooked = appointmentsData?.some(
            apt => apt.appointment_time === time
          )
          slots.push({ time, available: !isBooked })
        })
      }

      setAvailableSlots(slots.sort((a, b) => a.time.localeCompare(b.time)))
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g)
    return chunks ? chunks.join(' ') : cleaned
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (!isDateDisabled(date)) {
      setSelectedDate(date)
      setSelectedTime(null)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedDate || !selectedTime || !psychologist) return

    setProcessing(true)

    try {
      // 1. Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Você precisa estar logado para agendar uma sessão')
        router.push('/login')
        return
      }

      // 2. Buscar ID do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) {
        alert('Erro: Perfil de paciente não encontrado')
        return
      }

      // 3. Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 4. Criar agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.id,
          psychologist_id: psychologist.id,
          appointment_date: selectedDate.toISOString().split('T')[0],
          appointment_time: selectedTime,
          status: 'scheduled',
          payment_status: 'paid',
          payment_method: paymentMethod,
          amount_paid: psychologist.price_per_session,
          patient_notes: patientNotes,
          modality: selectedModality
        })
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // 5. Registrar transação
      await supabase
        .from('payment_transactions')
        .insert({
          appointment_id: appointmentData.id,
          patient_id: patientData.id,
          psychologist_id: psychologist.id,
          amount: psychologist.price_per_session,
          currency: 'BRL',
          payment_method: paymentMethod,
          payment_provider: 'simulated',
          status: 'completed'
        })

      // 6. Enviar e-mails
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            appointmentId: appointmentData.id
          })
        })

        if (!emailResponse.ok) {
          console.error('Erro ao enviar e-mails:', await emailResponse.text())
        }
      } catch (emailError) {
        console.error('Erro ao enviar e-mails:', emailError)
      }
      
      setStep('confirmation')
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="loading-page">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
        <style jsx>{styles}</style>
      </>
    )
  }

  if (!psychologist) {
    return null
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <>
      <div className="schedule-page">
        <div className="schedule-container">
          
          {/* Header */}
          <div className="schedule-header">
            <Link href={`/psicologo/${psychologistId}`} className="btn-back">
              ← Voltar ao Perfil
            </Link>
            <div className="progress-steps">
              <div className={`progress-step ${step === 'date' ? 'active' : ''} ${step !== 'date' ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <span>Data e Horário</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${step === 'payment' ? 'active' : ''} ${step === 'confirmation' ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <span>Pagamento</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${step === 'confirmation' ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <span>Confirmação</span>
              </div>
            </div>
          </div>

          {/* Professional Card */}
          <div className="professional-card">
            <div className="professional-avatar">
              {psychologist.profile.avatar_url ? (
                <img src={psychologist.profile.avatar_url} alt={psychologist.profile.full_name} />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(psychologist.profile.full_name)}
                </div>
              )}
            </div>
            <div className="professional-info">
              <h2>{psychologist.profile.full_name}</h2>
              <p>Sessão de {psychologist.session_duration} minutos</p>
            </div>
            <div className="professional-price">
              <span className="price-label">Valor da Sessão</span>
              <span className="price-value">R$ {psychologist.price_per_session.toFixed(2)}</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 'date' && (
            <div className="step-content">
              <div className="content-grid">
                
                {/* Calendar */}
                <div className="calendar-section">
                  <h3>Selecione a Data</h3>
                  
                  <div className="calendar">
                    <div className="calendar-header">
                      <button onClick={prevMonth} className="calendar-nav">
                        ‹
                      </button>
                      <h4>{monthNames[month]} {year}</h4>
                      <button onClick={nextMonth} className="calendar-nav">
                        ›
                      </button>
                    </div>

                    <div className="calendar-weekdays">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>

                    <div className="calendar-days">
                      {[...Array(startingDayOfWeek)].map((_, idx) => (
                        <div key={`empty-${idx}`} className="calendar-day empty"></div>
                      ))}
                      {[...Array(daysInMonth)].map((_, idx) => {
                        const day = idx + 1
                        const date = new Date(year, month, day)
                        const isDisabled = isDateDisabled(date)
                        const isSelected = selectedDate?.getDate() === day && 
                                         selectedDate?.getMonth() === month &&
                                         selectedDate?.getFullYear() === year

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            disabled={isDisabled}
                            className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Time Slots & Modality */}
                <div className="slots-section">
                  <h3>Horários Disponíveis</h3>
                  
                  {!selectedDate ? (
                    <div className="empty-state-small">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <p>Selecione uma data no calendário</p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="loading-slots">
                      <div className="spinner-small"></div>
                      <p>Carregando horários...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="empty-state-small">
                      <p>Nenhum horário disponível para esta data</p>
                    </div>
                  ) : (
                    <>
                      {/* Modality Selection */}
                      {psychologist.modality.length > 1 && (
                        <div className="modality-section">
                          <label>Modalidade</label>
                          <div className="modality-options">
                            {psychologist.modality.includes('online') && (
                              <button
                                className={`modality-btn ${selectedModality === 'online' ? 'active' : ''}`}
                                onClick={() => setSelectedModality('online')}
                              >
                                💻 Online
                              </button>
                            )}
                            {psychologist.modality.includes('presencial') && (
                              <button
                                className={`modality-btn ${selectedModality === 'presencial' ? 'active' : ''}`}
                                onClick={() => setSelectedModality('presencial')}
                              >
                                🏢 Presencial
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Time Slots */}
                      <div className="time-slots">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`time-slot ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>

                      {/* Additional Notes */}
                      <div className="notes-section">
                        <label>Informações Adicionais (opcional)</label>
                        <textarea
                          value={patientNotes}
                          onChange={(e) => setPatientNotes(e.target.value)}
                          placeholder="Compartilhe informações que possam ajudar o psicólogo..."
                          maxLength={500}
                          rows={3}
                        />
                        <span className="char-count">{patientNotes.length}/500</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="step-actions">
                  <button 
                    className="btn-next"
                    onClick={() => setStep('payment')}
                  >
                    Continuar para Pagamento →
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'payment' && (
            <div className="step-content">
              <div className="payment-content">
                
                {/* Summary */}
                <div className="booking-summary">
                  <h3>Resumo do Agendamento</h3>
                  <div className="summary-item">
                    <span>Data:</span>
                    <strong>{selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Horário:</span>
                    <strong>{selectedTime}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Modalidade:</span>
                    <strong>{selectedModality === 'online' ? '💻 Online' : '🏢 Presencial'}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Duração:</span>
                    <strong>{psychologist.session_duration} minutos</strong>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-item total">
                    <span>Total:</span>
                    <strong>R$ {psychologist.price_per_session.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="payment-form">
                  <h3>Forma de Pagamento</h3>

                  <div className="payment-methods">
                    <button
                      className={`payment-method ${paymentMethod === 'credit_card' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('credit_card')}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Cartão de Crédito
                    </button>
                    <button
                      className={`payment-method ${paymentMethod === 'pix' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('pix')}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      PIX
                    </button>
                    <button
                      className={`payment-method ${paymentMethod === 'boleto' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('boleto')}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                      </svg>
                      Boleto
                    </button>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="card-form">
                      <div className="form-group">
                        <label>Número do Cartão</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                        />
                      </div>
                      <div className="form-group">
                        <label>Nome no Cartão</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Como está no cartão"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Validade</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/AA"
                            maxLength={5}
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV</label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="000"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="pix-info">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      <p>Após confirmar, você receberá um QR Code PIX para pagamento instantâneo.</p>
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="boleto-info">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <p>O boleto será gerado após a confirmação. Vencimento em 3 dias úteis.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="btn-back-step"
                  onClick={() => setStep('date')}
                  disabled={processing}
                >
                  ← Voltar
                </button>
                <button 
                  className="btn-pay"
                  onClick={handleProcessPayment}
                  disabled={processing || (paymentMethod === 'credit_card' && (!cardNumber || !cardName || !cardExpiry || !cardCvv))}
                >
                  {processing ? (
                    <>
                      <div className="btn-spinner"></div>
                      Processando...
                    </>
                  ) : (
                    `Confirmar Pagamento - R$ ${psychologist.price_per_session.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="step-content">
              <div className="confirmation-content">
                <div className="success-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2>Sessão Agendada com Sucesso!</h2>
                <p className="confirmation-message">
                  Sua consulta foi confirmada. Enviamos os detalhes para o seu e-mail.
                </p>

                <div className="appointment-details">
                  <div className="detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div>
                      <strong>Data e Horário</strong>
                      <p>{selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {selectedTime}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <div>
                      <strong>Profissional</strong>
                      <p>{psychologist.profile.full_name}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div>
                      <strong>Duração</strong>
                      <p>{psychologist.session_duration} minutos</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div>
                      <strong>Modalidade</strong>
                      <p>{selectedModality === 'online' ? '💻 Consulta Online' : '🏢 Consulta Presencial'}</p>
                    </div>
                  </div>
                </div>

                {selectedModality === 'online' && (
                  <div className="online-instructions">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div>
                      <strong>Instruções para a Consulta Online</strong>
                      <p>O link da videochamada será enviado por e-mail 24 horas antes da consulta.</p>
                    </div>
                  </div>
                )}

                <div className="confirmation-actions">
                  <Link href="/dashboard" className="btn-dashboard">
                    Ir para o Dashboard
                  </Link>
                  <Link href="/buscar" className="btn-search-more">
                    Buscar Mais Psicólogos
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{styles}</style>
    </>
  )
}

const styles = `
  .schedule-page {
    min-height: 100vh;
    background: #faf9fc;
    padding: 100px 24px 60px;
  }

  .schedule-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .loading-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

  .spinner-small {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(124, 101, 181, 0.1);
    border-top-color: #7c65b5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 24px;
  }

  .btn-back {
    padding: 10px 20px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #7c65b5;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-back:hover {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  .progress-steps {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .progress-step {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .step-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(124, 101, 181, 0.1);
    color: #9b8fab;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .progress-step.active .step-number {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
  }

  .progress-step.completed .step-number {
    background: #22c55e;
    color: white;
  }

  .progress-step span {
    font-size: 14px;
    font-weight: 600;
    color: #9b8fab;
  }

  .progress-step.active span {
    color: #7c65b5;
  }

  .progress-step.completed span {
    color: #22c55e;
  }

  .progress-line {
    width: 40px;
    height: 2px;
    background: rgba(124, 101, 181, 0.2);
  }

  .professional-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .professional-avatar img,
  .professional-avatar .avatar-placeholder {
    width: 72px;
    height: 72px;
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
    font-size: 24px;
  }

  .professional-info {
    flex: 1;
  }

  .professional-info h2 {
    font-size: 20px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .professional-info p {
    font-size: 14px;
    color: #6b5d7a;
  }

  .professional-price {
    text-align: right;
  }

  .price-label {
    display: block;
    font-size: 12px;
    color: #9b8fab;
    margin-bottom: 4px;
  }

  .price-value {
    font-size: 24px;
    font-weight: 800;
    color: #7c65b5;
  }

  .step-content {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-bottom: 32px;
  }

  .calendar-section h3,
  .slots-section h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 20px;
  }

  .calendar {
    background: rgba(124, 101, 181, 0.03);
    border-radius: 12px;
    padding: 20px;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .calendar-header h4 {
    font-size: 16px;
    font-weight: 700;
    color: #2d1f3e;
  }

  .calendar-nav {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: white;
    color: #7c65b5;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .calendar-nav:hover {
    background: #7c65b5;
    color: white;
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }

  .weekday {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #9b8fab;
    padding: 8px 0;
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  .calendar-day {
    aspect-ratio: 1;
    border-radius: 8px;
    border: none;
    background: white;
    color: #2d1f3e;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .calendar-day:hover:not(:disabled) {
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
  }

  .calendar-day.selected {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .calendar-day.disabled {
    background: transparent;
    color: #ddd;
    cursor: not-allowed;
  }

  .calendar-day.empty {
    background: transparent;
    cursor: default;
  }

  .empty-state-small {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-state-small svg {
    color: #9b8fab;
    margin-bottom: 12px;
  }

  .empty-state-small p {
    color: #6b5d7a;
    font-size: 14px;
  }

  .loading-slots {
    text-align: center;
    padding: 40px 20px;
  }

  .loading-slots p {
    color: #6b5d7a;
    font-size: 14px;
    margin-top: 12px;
  }

  .modality-section {
    margin-bottom: 24px;
  }

  .modality-section label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #2d1f3e;
    margin-bottom: 12px;
  }

  .modality-options {
    display: flex;
    gap: 12px;
  }

  .modality-btn {
    flex: 1;
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #6b5d7a;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .modality-btn:hover {
    border-color: #7c65b5;
  }

  .modality-btn.active {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
  }

  .time-slots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .time-slot {
    padding: 14px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #2d1f3e;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .time-slot:hover:not(:disabled) {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  .time-slot.selected {
    border-color: #7c65b5;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .time-slot:disabled {
    background: #f5f5f5;
    color: #ccc;
    cursor: not-allowed;
    border-color: #eee;
  }

  .notes-section {
    margin-top: 24px;
  }

  .notes-section label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .notes-section textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    transition: all 0.3s ease;
  }

  .notes-section textarea:focus {
    outline: none;
    border-color: #7c65b5;
  }

  .char-count {
    display: block;
    text-align: right;
    font-size: 12px;
    color: #9b8fab;
    margin-top: 6px;
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 24px;
    border-top: 2px solid rgba(124, 101, 181, 0.1);
  }

  .btn-next,
  .btn-pay {
    padding: 14px 32px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-next:hover,
  .btn-pay:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
  }

  .btn-pay:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-back-step {
    padding: 14px 32px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #7c65b5;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-back-step:hover:not(:disabled) {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  .btn-back-step:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .payment-content {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 32px;
  }

  .booking-summary {
    background: rgba(124, 101, 181, 0.03);
    border-radius: 12px;
    padding: 24px;
    height: fit-content;
  }

  .booking-summary h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 20px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(124, 101, 181, 0.1);
  }

  .summary-item:last-child {
    border-bottom: none;
  }

  .summary-item span {
    font-size: 14px;
    color: #6b5d7a;
  }

  .summary-item strong {
    font-size: 15px;
    color: #2d1f3e;
  }

  .summary-divider {
    height: 2px;
    background: rgba(124, 101, 181, 0.1);
    margin: 16px 0;
  }

  .summary-item.total {
    padding-top: 16px;
  }

  .summary-item.total span {
    font-size: 16px;
    font-weight: 700;
  }

  .summary-item.total strong {
    font-size: 24px;
    font-weight: 800;
    color: #7c65b5;
  }

  .payment-form h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 20px;
  }

  .payment-methods {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .payment-method {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-radius: 12px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #6b5d7a;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .payment-method:hover {
    border-color: #7c65b5;
  }

  .payment-method.active {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
  }

  .card-form,
  .pix-info,
  .boleto-info {
    background: rgba(124, 101, 181, 0.03);
    border-radius: 12px;
    padding: 24px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .form-group input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    font-size: 15px;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #7c65b5;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .pix-info,
  .boleto-info {
    text-align: center;
  }

  .pix-info svg,
  .boleto-info svg {
    color: #7c65b5;
    margin-bottom: 16px;
  }

  .pix-info p,
  .boleto-info p {
    font-size: 14px;
    color: #6b5d7a;
    line-height: 1.6;
  }

  .confirmation-content {
    text-align: center;
    padding: 40px 20px;
  }

  .success-icon {
    width: 120px;
    height: 120px;
    margin: 0 auto 24px;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-icon svg {
    color: #22c55e;
  }

  .confirmation-content h2 {
    font-size: 28px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 12px;
  }

  .confirmation-message {
    font-size: 16px;
    color: #6b5d7a;
    margin-bottom: 40px;
  }

  .appointment-details {
    background: rgba(124, 101, 181, 0.03);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    text-align: left;
  }

  .detail-item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(124, 101, 181, 0.1);
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-item svg {
    color: #7c65b5;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .detail-item strong {
    display: block;
    font-size: 14px;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .detail-item p {
    font-size: 15px;
    color: #6b5d7a;
  }

  .online-instructions {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: rgba(59, 130, 246, 0.05);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    margin-bottom: 32px;
    text-align: left;
  }

  .online-instructions svg {
    color: #3b82f6;
    flex-shrink: 0;
  }

  .online-instructions strong {
    display: block;
    font-size: 14px;
    color: #2d1f3e;
    margin-bottom: 6px;
  }

  .online-instructions p {
    font-size: 14px;
    color: #6b5d7a;
  }

  .confirmation-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .btn-dashboard,
  .btn-search-more {
    padding: 14px 32px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .btn-dashboard {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .btn-dashboard:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
  }

  .btn-search-more {
    border: 2px solid #7c65b5;
    background: white;
    color: #7c65b5;
  }

  .btn-search-more:hover {
    background: rgba(124, 101, 181, 0.05);
  }

  @media (max-width: 1024px) {
    .content-grid,
    .payment-content {
      grid-template-columns: 1fr;
    }

    .booking-summary {
      order: 2;
    }

    .payment-form {
      order: 1;
    }
  }

  @media (max-width: 768px) {
    .schedule-page {
      padding: 80px 16px 40px;
    }

    .schedule-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .progress-steps {
      width: 100%;
      overflow-x: auto;
    }

    .progress-step span {
      display: none;
    }

    .professional-card {
      flex-direction: column;
      text-align: center;
    }

    .professional-price {
      text-align: center;
    }

    .step-content {
      padding: 24px 20px;
    }

    .time-slots {
      grid-template-columns: repeat(2, 1fr);
    }

    .payment-methods {
      grid-template-columns: 1fr;
    }

    .step-actions {
      flex-direction: column;
    }

    .btn-next,
    .btn-pay,
    .btn-back-step {
      width: 100%;
    }

    .confirmation-actions {
      flex-direction: column;
    }

    .btn-dashboard,
    .btn-search-more {
      width: 100%;
    }
  }
`