// app/pagamento/[appointmentId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import QRCode from 'qrcode'
import Link from 'next/link'

interface PaymentData {
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  expires_at: string
  amount: number
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  payment_status: string
  modality: string
  duration_minutes: number
  psychologist: {
    user_id: string
    price_per_session: number
    session_duration: number
    profile: {
      full_name: string
    }
  }
}

export default function PagamentoPage({ params }: { params: { appointmentId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string[]>([]) // Para mostrar logs

  // Função para adicionar logs
  const addLog = (message: string) => {
    console.log(`[DEBUG] ${message}`)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Função para calcular horário de término
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  // Unwrap params (Next.js 15+)
  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await Promise.resolve(params)
      setAppointmentId(resolvedParams.appointmentId)
      addLog(`Appointment ID obtido: ${resolvedParams.appointmentId}`)
    }
    unwrapParams()
  }, [params])

  // Buscar dados do appointment
  useEffect(() => {
    if (!appointmentId) return

    async function fetchAppointment() {
      try {
        addLog('Iniciando busca do agendamento...')
        
        const { data: aptData, error: aptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single()

        if (aptError) {
          addLog(`Erro ao buscar agendamento: ${aptError.message}`)
          setError('Agendamento não encontrado')
          setLoading(false)
          return
        }

        addLog(`Agendamento encontrado: status=${aptData.status}, payment_status=${aptData.payment_status}`)

        // Buscar psicólogo
        addLog('Buscando dados do psicólogo...')
        const { data: psychData, error: psychError } = await supabase
          .from('psychologists')
          .select('*')
          .eq('id', aptData.psychologist_id)
          .single()

        if (psychError) {
          addLog(`Erro ao buscar psicólogo: ${psychError.message}`)
        }

        // Buscar profile
        addLog('Buscando profile do psicólogo...')
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', psychData?.user_id)
          .single()

        const fullAppointment = {
          ...aptData,
          psychologist: {
            ...psychData,
            profile: {
              full_name: profileData?.full_name || 'Psicólogo'
            }
          }
        }

        setAppointment(fullAppointment)
        addLog('Dados do agendamento carregados com sucesso')

        // Se já está confirmado, redirecionar
        if (aptData.status === 'confirmed') {
          addLog('Agendamento já confirmado, redirecionando...')
          router.push(`/confirmacao/${appointmentId}`)
          return
        }

        // Se expirou, redirecionar de volta
        if (aptData.status === 'cancelled') {
          addLog('Agendamento cancelado/expirado')
          setError('Este agendamento expirou')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Erro completo:', err)
        addLog(`Erro catch: ${err}`)
        setError('Erro ao carregar agendamento')
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [appointmentId, router, supabase])

  // Gerar pagamento
  useEffect(() => {
    if (!appointment) return

    async function createPayment() {
      try {
        addLog('Iniciando criação do pagamento...')
        
        // Verificar sessão
        addLog('Verificando sessão do usuário...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addLog(`Erro ao obter sessão: ${sessionError.message}`)
          setError('Erro ao verificar autenticação')
          setLoading(false)
          return
        }

        if (!session) {
          addLog('Usuário não autenticado, redirecionando para login...')
          router.push('/login')
          return
        }

        addLog(`Sessão encontrada. User ID: ${session.user.id}`)
        addLog(`Access Token (primeiros 20 chars): ${session.access_token.substring(0, 20)}...`)

        // Preparar requisição
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment`
        addLog(`URL da Edge Function: ${url}`)

        const requestBody = {
          appointment_id: appointmentId
        }
        addLog(`Request body: ${JSON.stringify(requestBody)}`)

        addLog('Enviando requisição para Edge Function...')
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(requestBody)
        })

        addLog(`Response status: ${response.status} ${response.statusText}`)

        // Ler resposta como texto primeiro
        const responseText = await response.text()
        addLog(`Response text: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`)

        // Tentar parsear JSON
        let data
        try {
          data = JSON.parse(responseText)
          addLog('Response parseado como JSON com sucesso')
        } catch (parseError) {
          addLog(`Erro ao parsear JSON: ${parseError}`)
          setError(`Erro ao processar resposta do servidor: ${responseText}`)
          setLoading(false)
          return
        }

        if (!response.ok) {
          addLog(`Requisição falhou. Erro: ${data.error || 'Erro desconhecido'}`)
          setError(data.error || 'Erro ao gerar pagamento')
          setLoading(false)
          return
        }

        addLog('Pagamento criado com sucesso!')
        addLog(`Payment data: ${JSON.stringify(data.payment)}`)

        setPayment(data.payment)

        // Gerar QR Code image
        if (data.payment.qr_code) {
          addLog('Gerando QR Code...')
          const qrImage = await QRCode.toDataURL(data.payment.qr_code, {
            width: 300,
            margin: 2,
            color: {
              dark: '#2d1f3e',
              light: '#ffffff'
            }
          })
          setQrCodeImage(qrImage)
          addLog('QR Code gerado com sucesso')
        }

        // Calcular tempo restante
        const expiresAt = new Date(data.payment.expires_at).getTime()
        const now = Date.now()
        const diff = Math.floor((expiresAt - now) / 1000)
        setTimeLeft(diff > 0 ? diff : 0)
        addLog(`Tempo restante: ${diff} segundos`)

        setLoading(false)
        addLog('Processo de pagamento concluído')
      } catch (err) {
        console.error('Erro completo:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        const errorStack = err instanceof Error ? err.stack : 'N/A'
        addLog(`Erro catch na criação do pagamento: ${errorMessage}`)
        addLog(`Stack trace: ${errorStack || 'N/A'}`)
        setError(`Erro ao gerar pagamento: ${errorMessage}`)
        setLoading(false)
      }
    }

    createPayment()
  }, [appointment, appointmentId, router, supabase])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  // Polling de status
  useEffect(() => {
    if (!appointment || appointment.status === 'confirmed' || !appointmentId) return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('appointments')
        .select('status, payment_status')
        .eq('id', appointmentId)
        .single()

      if (data?.status === 'confirmed' && data?.payment_status === 'paid') {
        clearInterval(interval)
        addLog('Pagamento confirmado! Redirecionando...')
        router.push(`/confirmacao/${appointmentId}`)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [appointment, appointmentId, router, supabase])

  // Copiar código PIX
  function copyPixCode() {
    if (payment?.qr_code) {
      navigator.clipboard.writeText(payment.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Formatar tempo
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="spinner"></div>
          <h3>Gerando pagamento</h3>
          <p>Aguarde enquanto preparamos seu pagamento...</p>
          
          {/* Debug Info */}
          <div className="debug-box">
            <h4>Debug Info (desenvolvimento)</h4>
            <div className="debug-logs">
              {debugInfo.map((log, idx) => (
                <div key={idx} className="debug-log">{log}</div>
              ))}
            </div>
          </div>
        </div>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
            padding: 20px;
          }
          .loading-content {
            text-align: center;
            max-width: 600px;
            width: 100%;
          }
          .spinner {
            width: 56px;
            height: 56px;
            border: 5px solid rgba(124, 101, 181, 0.1);
            border-top-color: #7c65b5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-content h3 {
            font-size: 24px;
            font-weight: 800;
            color: #2d1f3e;
            margin-bottom: 8px;
          }
          .loading-content p {
            font-size: 16px;
            color: #6b5d7a;
            font-weight: 500;
            margin-bottom: 32px;
          }
          .debug-box {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: left;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin-top: 32px;
          }
          .debug-box h4 {
            font-size: 14px;
            font-weight: 800;
            color: #2d1f3e;
            margin-bottom: 12px;
          }
          .debug-logs {
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.6;
          }
          .debug-log {
            padding: 4px 8px;
            background: #f8f9fa;
            border-left: 3px solid #7c65b5;
            margin-bottom: 4px;
            color: #2d1f3e;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
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
          <h2>Erro no Pagamento</h2>
          <p>{error}</p>
          
          {/* Debug Info */}
          <div className="debug-box">
            <h4>Debug Info (desenvolvimento)</h4>
            <div className="debug-logs">
              {debugInfo.map((log, idx) => (
                <div key={idx} className="debug-log">{log}</div>
              ))}
            </div>
          </div>
          
          <div className="error-actions">
            <button onClick={() => router.back()} className="btn-back">
              Voltar
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
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(124, 101, 181, 0.12);
            max-width: 700px;
            width: 100%;
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
          .debug-box {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            text-align: left;
            margin-bottom: 24px;
            border: 2px solid #e9ecef;
          }
          .debug-box h4 {
            font-size: 14px;
            font-weight: 800;
            color: #2d1f3e;
            margin-bottom: 12px;
          }
          .debug-logs {
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.6;
          }
          .debug-log {
            padding: 4px 8px;
            background: white;
            border-left: 3px solid #7c65b5;
            margin-bottom: 4px;
            color: #2d1f3e;
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

  if (!appointment || !payment) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
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
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Formatação da data corrigida
  const appointmentDate = appointment.appointment_date 
    ? new Date(appointment.appointment_date + 'T12:00:00')
    : new Date()
  
  const dateFormatted = appointmentDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })

  // Calcular horário de término
  const endTime = appointment.appointment_time && appointment.duration_minutes
    ? calculateEndTime(appointment.appointment_time, appointment.duration_minutes)
    : null

  return (
    <>
      <div className="payment-page">
        {/* Header com Breadcrumb */}
        <section className="payment-header">
          <div className="header-container">
            <div className="breadcrumb">
              <Link href="/">Início</Link>
              <span>›</span>
              <Link href="/buscar">Buscar</Link>
              <span>›</span>
              <span>Pagamento</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="payment-main">
          <div className="main-container">
            
            {/* Timer Card */}
            <div className="timer-card">
              <div className="timer-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="timer-content">
                <h3>Tempo para completar o pagamento</h3>
                <div className={`timer-display ${timeLeft < 60 ? 'urgent' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
                {timeLeft === 0 ? (
                  <div className="timer-expired">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <span>Tempo expirado! Faça um novo agendamento.</span>
                  </div>
                ) : timeLeft < 60 ? (
                  <p className="timer-warning">⚡ Menos de 1 minuto restante!</p>
                ) : (
                  <p className="timer-info">Não perca tempo, finalize seu pagamento</p>
                )}
              </div>
            </div>

            <div className="payment-grid">
              
              {/* Coluna Esquerda - QR Code e Instruções */}
              <div className="payment-main-content">
                
                {timeLeft > 0 ? (
                  <>
                    {/* QR Code Card */}
                    <div className="qrcode-card">
                      <div className="qrcode-header">
                        <div className="pix-logo">
                          <svg width="32" height="32" viewBox="0 0 512 512" fill="currentColor">
                            <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.5H112.6C132.6 391.5 151.5 383.7 165.7 369.5L242.4 292.5zM262.5 218.9C256.1 224.4 247.9 224.5 242.4 218.9L165.7 142.1C151.5 127.9 132.6 120.1 112.6 120.1H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.8 120.1H392.6C372.6 120.1 353.7 127.9 339.5 142.1L262.5 218.9zM112.6 142.1C126.4 142.1 139.1 148.3 149.7 158.1L226.4 236.5C239.9 250.5 260.5 250.5 273.1 236.5L350.7 158.1C361.3 148.3 374.1 142.1 387.4 142.1H392.6C398.6 142.1 403.6 147.1 403.6 152.1V159.6C403.6 162.2 402.7 164.6 401.1 166.5L357.1 211.9C354.2 214.1 354.2 219.5 357.1 222.5L401.1 267.9C402.7 269.8 403.6 272.2 403.6 274.8V282.3C403.6 287.3 398.6 292.3 392.6 292.3H387.4C374.1 292.3 361.3 286.1 350.7 276.3L273.1 197.9C260.5 183.9 239.9 183.9 226.4 197.9L149.7 276.3C139.1 286.1 126.4 292.3 112.6 292.3H108.4C102.4 292.3 97.37 287.3 97.37 282.3V274.8C97.37 272.2 98.28 269.8 99.97 267.9L143.1 222.5C146.9 219.5 146.9 214.1 143.1 211.9L99.97 166.5C98.28 164.6 97.37 162.2 97.37 159.6V152.1C97.37 147.1 102.4 142.1 108.4 142.1H112.6z"/>
                          </svg>
                        </div>
                        <div>
                          <h2>Pagar com PIX</h2>
                          <p>Escaneie o QR Code ou copie o código</p>
                        </div>
                      </div>

                      {qrCodeImage && (
                        <div className="qrcode-wrapper">
                          <div className="qrcode-frame">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={qrCodeImage} 
                              alt="QR Code PIX"
                              className="qrcode-image"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pix-code-section">
                        <label>Código PIX Copia e Cola</label>
                        <div className="pix-code-input">
                          <input
                            type="text"
                            value={payment.qr_code}
                            readOnly
                            className="code-input"
                          />
                          <button
                            onClick={copyPixCode}
                            className={`btn-copy ${copied ? 'copied' : ''}`}
                          >
                            {copied ? (
                              <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Instruções */}
                    <div className="instructions-card">
                      <h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Como pagar?
                      </h3>
                      <ol className="instruction-steps">
                        <li>
                          <div className="step-number">1</div>
                          <div className="step-content">
                            <strong>Abra o app do seu banco</strong>
                            <span>Entre no aplicativo bancário do seu celular</span>
                          </div>
                        </li>
                        <li>
                          <div className="step-number">2</div>
                          <div className="step-content">
                            <strong>Escolha pagar com PIX</strong>
                            <span>Selecione a opção &quot;PIX&quot; no menu</span>
                          </div>
                        </li>
                        <li>
                          <div className="step-number">3</div>
                          <div className="step-content">
                            <strong>Escaneie ou cole o código</strong>
                            <span>Use a câmera ou cole o código copiado</span>
                          </div>
                        </li>
                        <li>
                          <div className="step-number">4</div>
                          <div className="step-content">
                            <strong>Confirme o pagamento</strong>
                            <span>Revise os dados e finalize</span>
                          </div>
                        </li>
                      </ol>
                    </div>

                    {/* Status de Aguardando */}
                    <div className="status-waiting">
                      <div className="waiting-spinner">
                        <div className="spinner-ring"></div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        </svg>
                      </div>
                      <div className="waiting-content">
                        <h4>Aguardando pagamento...</h4>
                        <p>Assim que confirmarmos o pagamento, você será redirecionado automaticamente</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="expired-card">
                    <div className="expired-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                    <h3>Tempo Expirado</h3>
                    <p>O tempo para realizar o pagamento expirou. Por favor, faça um novo agendamento.</p>
                    <Link href="/buscar" className="btn-new-search">
                      Fazer Novo Agendamento
                    </Link>
                  </div>
                )}
              </div>

              {/* Coluna Direita - Resumo */}
              <aside className="payment-sidebar">
                <div className="summary-card">
                  <h3>Resumo do Agendamento</h3>
                  
                  <div className="summary-items">
                    <div className="summary-item">
                      <div className="item-icon psychologist">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="item-content">
                        <span className="item-label">Psicólogo(a)</span>
                        <span className="item-value">{appointment.psychologist.profile.full_name}</span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <div className="item-icon calendar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div className="item-content">
                        <span className="item-label">Data</span>
                        <span className="item-value">{dateFormatted}</span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <div className="item-icon time">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="item-content">
                        <span className="item-label">Horário</span>
                        <span className="item-value">
                          {appointment.appointment_time?.slice(0, 5)}
                          {endTime && ` - ${endTime.slice(0, 5)}`}
                        </span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <div className="item-icon modality">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      <div className="item-content">
                        <span className="item-label">Modalidade</span>
                        <span className="item-value">
                          {appointment.modality === 'online' ? 'Online' : 'Presencial'}
                        </span>
                      </div>
                    </div>

                    <div className="summary-item">
                      <div className="item-icon duration">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="item-content">
                        <span className="item-label">Duração</span>
                        <span className="item-value">{appointment.duration_minutes} minutos</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-total">
                    <span className="total-label">Valor Total</span>
                    <span className="total-value">R$ {payment.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Segurança */}
                <div className="security-card">
                  <div className="security-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="security-content">
                    <h4>Pagamento Seguro</h4>
                    <p>Seus dados estão protegidos e o pagamento é processado de forma segura.</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .payment-page {
          min-height: 100vh;
          background: #fafafa;
        }

        .payment-header {
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

        .payment-main {
          padding: 40px 24px 80px;
        }

        .main-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Timer Card */
        .timer-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.1);
          border: 2px solid rgba(124, 101, 181, 0.08);
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .timer-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.1) 0%, rgba(169, 150, 221, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .timer-icon svg {
          color: #7c65b5;
        }

        .timer-content {
          flex: 1;
        }

        .timer-content h3 {
          font-size: 16px;
          font-weight: 700;
          color: #6b5d7a;
          margin-bottom: 12px;
        }

        .timer-display {
          font-size: 56px;
          font-weight: 900;
          color: #7c65b5;
          line-height: 1;
          margin-bottom: 8px;
          font-variant-numeric: tabular-nums;
        }

        .timer-display.urgent {
          color: #ef4444;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .timer-info {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 500;
        }

        .timer-warning {
          font-size: 14px;
          color: #ef4444;
          font-weight: 700;
        }

        .timer-expired {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border-radius: 12px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 600;
          max-width: fit-content;
        }

        .timer-expired svg {
          color: #ef4444;
          flex-shrink: 0;
        }

        /* Payment Grid */
        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: start;
        }

        /* Main Content */
        .payment-main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* QR Code Card */
        .qrcode-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .qrcode-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }

        .pix-logo {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, #32bcad 0%, #00a991 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pix-logo svg {
          color: white;
        }

        .qrcode-header h2 {
          font-size: 24px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .qrcode-header p {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 500;
        }

        .qrcode-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .qrcode-frame {
          padding: 24px;
          background: white;
          border-radius: 20px;
          border: 4px solid #7c65b5;
          box-shadow: 0 8px 32px rgba(124, 101, 181, 0.15);
        }

        .qrcode-image {
          display: block;
          border-radius: 12px;
        }

        .pix-code-section {
          margin-top: 32px;
        }

        .pix-code-section label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #2d1f3e;
          margin-bottom: 12px;
        }

        .pix-code-input {
          display: flex;
          gap: 12px;
        }

        .code-input {
          flex: 1;
          padding: 14px 16px;
          background: rgba(124, 101, 181, 0.05);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 12px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          color: #2d1f3e;
          font-weight: 600;
        }

        .btn-copy {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .btn-copy:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
        }

        .btn-copy.copied {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        /* Instructions */
        .instructions-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .instructions-card h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 24px;
        }

        .instructions-card h3 svg {
          color: #7c65b5;
        }

        .instruction-steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .instruction-steps li {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
          padding-top: 4px;
        }

        .step-content strong {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .step-content span {
          display: block;
          font-size: 13px;
          color: #9b8fab;
          font-weight: 500;
        }

        /* Status Waiting */
        .status-waiting {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
          border: 2px solid rgba(251, 191, 36, 0.2);
          border-radius: 16px;
        }

        .waiting-spinner {
          position: relative;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top-color: #f59e0b;
          border-right-color: #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .waiting-spinner svg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #f59e0b;
        }

        .waiting-content h4 {
          font-size: 16px;
          font-weight: 800;
          color: #92400e;
          margin-bottom: 4px;
        }

        .waiting-content p {
          font-size: 13px;
          color: #b45309;
          font-weight: 500;
        }

        /* Expired Card */
        .expired-card {
          text-align: center;
          padding: 60px 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .expired-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .expired-icon svg {
          color: #ef4444;
        }

        .expired-card h3 {
          font-size: 24px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 12px;
        }

        .expired-card p {
          font-size: 16px;
          color: #6b5d7a;
          margin-bottom: 28px;
        }

        .btn-new-search {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .btn-new-search:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
        }

        /* Sidebar */
        .payment-sidebar {
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .summary-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.1);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .summary-card h3 {
          font-size: 18px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 24px;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid rgba(124, 101, 181, 0.08);
        }

        .summary-item {
          display: flex;
          gap: 16px;
        }

        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-icon.psychologist {
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.1) 0%, rgba(169, 150, 221, 0.1) 100%);
        }

        .item-icon.calendar {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
        }

        .item-icon.time {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(110, 231, 183, 0.1) 100%);
        }

        .item-icon.modality {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
        }

        .item-icon.duration {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(196, 181, 253, 0.1) 100%);
        }

        .item-icon svg {
          color: #7c65b5;
        }

        .item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .item-label {
          font-size: 12px;
          color: #9b8fab;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .item-value {
          font-size: 14px;
          color: #2d1f3e;
          font-weight: 700;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 16px;
          font-weight: 700;
          color: #6b5d7a;
        }

        .total-value {
          font-size: 32px;
          font-weight: 900;
          color: #7c65b5;
        }

        /* Security Card */
        .security-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(110, 231, 183, 0.1) 100%);
          border: 2px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
        }

        .security-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .security-icon svg {
          color: #10b981;
        }

        .security-content h4 {
          font-size: 14px;
          font-weight: 800;
          color: #065f46;
          margin-bottom: 4px;
        }

        .security-content p {
          font-size: 12px;
          color: #047857;
          font-weight: 500;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .payment-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .payment-sidebar {
            position: static;
          }

          .timer-card {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .payment-header {
            padding: 80px 16px 16px;
          }

          .payment-main {
            padding: 24px 16px 60px;
          }

          .timer-card {
            padding: 24px;
          }

          .timer-display {
            font-size: 42px;
          }

          .qrcode-card {
            padding: 24px;
          }

          .qrcode-frame {
            padding: 16px;
          }

          .pix-code-input {
            flex-direction: column;
          }

          .btn-copy {
            width: 100%;
            justify-content: center;
          }

          .instructions-card {
            padding: 24px;
          }

          .status-waiting {
            flex-direction: column;
            text-align: center;
          }

          .summary-card {
            padding: 20px;
          }

          .total-value {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  )
}