// app/login/page.tsx - Com CSS Module
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, password?: string}>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Verificar se veio erro do callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMessage({ type: 'error', text: 'Erro na autenticação. Tente novamente.' })
    }
  }, [searchParams])

  // Login com Google
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setMessage(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.events'
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login com Google'
      setMessage({ type: 'error', text: errorMessage })
      setGoogleLoading(false)
    }
  }

  // Validação de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validação dos campos
  const validateForm = () => {
    const newErrors: {email?: string, password?: string} = {}
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Por favor, corrija os erros no formulário' })
      return
    }
    
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        const errorMessage = error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos' 
          : error.message
        setMessage({ type: 'error', text: errorMessage })
        setLoading(false)
        return
      }

      setMessage({ type: 'success', text: 'Login realizado com sucesso!' })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setMessage({ type: 'error', text: 'Ocorreu um erro ao fazer login. Tente novamente.' })
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      {/* Decorações de fundo */}
      <div className={`${styles.bgDecoration} ${styles.bgDecoration1}`}></div>
      <div className={`${styles.bgDecoration} ${styles.bgDecoration2}`}></div>
      
      <div className={styles.loginContainer}>
        {/* Lado esquerdo - Branding */}
        <div className={styles.brandingSide}>
          <Link href="/" className={styles.logoLink}>
            <h1 className={styles.logo}>Psicocompany</h1>
          </Link>
          <h2 className={styles.brandingTitle}>
            Bem-vindo de volta ao seu <span className={styles.gradientText}>espaço de cuidado</span>
          </h2>
          <p className={styles.brandingSubtitle}>
            Continue sua jornada de evolução emocional com acesso a psicólogos, cursos e conteúdos personalizados.
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🧠</div>
              <span className={styles.featureText}>Acesse seu histórico de sessões</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📚</div>
              <span className={styles.featureText}>Continue seus cursos no Academy</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💜</div>
              <span className={styles.featureText}>Acompanhe sua evolução</span>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className={styles.formSide}>
          <div className={styles.loginCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Entrar na conta</h2>
              <p className={styles.formSubtitle}>Acesse sua conta Psicocompany</p>
            </div>

            {/* Botão Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className={styles.googleButton}
            >
              <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Conectando...' : 'Continuar com Google'}
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerText}>ou</span>
              <div className={styles.dividerLine}></div>
            </div>

            {/* Mensagem */}
            {message && (
              <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                {message.type === 'success' ? '✓' : '⚠'} {message.text}
              </div>
            )}

            {/* Formulário Email/Senha */}
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>E-mail *</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors({...errors, email: undefined})
                  }}
                  onBlur={() => {
                    if (email && !validateEmail(email)) {
                      setErrors({...errors, email: 'E-mail inválido'})
                    }
                  }}
                  className={errors.email ? styles.inputError : ''}
                  disabled={googleLoading}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Senha *</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors({...errors, password: undefined})
                    }}
                    className={errors.password ? styles.inputError : ''}
                    disabled={googleLoading}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={googleLoading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>

              <div className={styles.formOptions}>
                <div className={styles.checkboxContainer}>
                  <input 
                    type="checkbox" 
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={googleLoading}
                  />
                  <label htmlFor="remember" className={styles.checkboxLabel}>
                    Lembrar-me
                  </label>
                </div>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Esqueceu a senha?
                </Link>
              </div>

              <button 
                type="submit"
                className={styles.btnSubmit}
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className={styles.signupSection}>
              <p className={styles.signupText}>Não tem uma conta?</p>
              <Link href="/signup" className={styles.btnSignup}>
                Cadastre-se grátis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}