// app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processando login...')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Pega o código da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          throw new Error('Token de acesso não encontrado')
        }

        // Seta a sessão no Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (sessionError) throw sessionError
        if (!session) throw new Error('Sessão não criada')

        console.log('Session criada:', session)
        console.log('Provider token:', session.provider_token)
        console.log('Provider refresh token:', session.provider_refresh_token)

        // Verificar se é primeiro login
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single()

        setStatus('success')
        setMessage('Login realizado com sucesso!')

        // Aguardar 1 segundo para mostrar mensagem
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Se não tem perfil criado, redireciona para onboarding
        if (!profile) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }

      } catch (error) {
        console.error('Erro no callback:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar login'
        setStatus('error')
        setMessage(errorMessage)

        // Redireciona para login após 3 segundos
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <>
      <div className="callback-page">
        <div className="callback-container">
          <div className="callback-content">
            {status === 'loading' && (
              <>
                <div className="spinner"></div>
                <h2>{message}</h2>
                <p>Aguarde um momento...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="success-icon">✓</div>
                <h2>{message}</h2>
                <p>Redirecionando...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="error-icon">✕</div>
                <h2>Erro no login</h2>
                <p>{message}</p>
                <p className="redirect-text">Redirecionando para a página de login...</p>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          padding: 20px;
        }

        .callback-container {
          max-width: 500px;
          width: 100%;
        }

        .callback-content {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(124, 101, 181, 0.15);
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

        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          animation: scaleIn 0.5s ease;
        }

        .error-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .callback-content h2 {
          font-size: 24px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 12px;
        }

        .callback-content p {
          font-size: 16px;
          color: #6b5d7a;
          margin-bottom: 8px;
        }

        .redirect-text {
          font-size: 14px;
          color: #9b8fab;
          margin-top: 16px;
        }

        @media (max-width: 640px) {
          .callback-content {
            padding: 40px 24px;
          }

          .callback-content h2 {
            font-size: 20px;
          }

          .success-icon,
          .error-icon {
            width: 64px;
            height: 64px;
            font-size: 36px;
          }
        }
      `}</style>
    </>
  )
}