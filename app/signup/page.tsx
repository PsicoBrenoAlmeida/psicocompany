// app/signup/page.tsx - Com CSS Module
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Cadastro com Google
  const handleGoogleSignup = async () => {
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
      console.error('Erro ao fazer cadastro com Google:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar com Google'
      setMessage({ type: 'error', text: errorMessage })
      setGoogleLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    if (!fullName.trim()) {
      setMessage({ type: 'error', text: 'Nome completo é obrigatório' })
      return false
    }

    if (!email.trim() || !validateEmail(email)) {
      setMessage({ type: 'error', text: 'Email válido é obrigatório' })
      return false
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' })
      return false
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return false
    }

    if (!acceptTerms) {
      setMessage({ type: 'error', text: 'Você deve aceitar os termos de uso' })
      return false
    }

    return true
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setMessage(null)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'patient'
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          user_type: 'patient',
          full_name: fullName,
          email: email,
          phone: phone || null
        })

      if (profileError) throw profileError

      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id
        })

      if (patientError) throw patientError

      setMessage({ type: 'success', text: 'Conta criada com sucesso! Redirecionando...' })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Erro no cadastro:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.signupPage}>
      {/* Decorações de fundo */}
      <div className={`${styles.bgDecoration} ${styles.bgDecoration1}`}></div>
      <div className={`${styles.bgDecoration} ${styles.bgDecoration2}`}></div>
      
      <div className={styles.signupContainer}>
        {/* Lado esquerdo - Branding */}
        <div className={styles.brandingSide}>
          <Link href="/" className={styles.logoLink}>
            <h1 className={styles.logo}>Psicocompany</h1>
          </Link>
          <h2 className={styles.brandingTitle}>
            Comece sua jornada de <span className={styles.gradientText}>evolução emocional</span>
          </h2>
          <p className={styles.brandingSubtitle}>
            Crie sua conta gratuita e tenha acesso a psicólogos qualificados, 
            cursos especializados e uma comunidade de apoio.
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✅</div>
              <span className={styles.featureText}>Primeira consulta com desconto</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎓</div>
              <span className={styles.featureText}>Acesso ao curso gratuito</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔒</div>
              <span className={styles.featureText}>Seus dados protegidos</span>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className={styles.formSide}>
          <div className={styles.signupCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Criar conta gratuita</h2>
              <p className={styles.formSubtitle}>Preencha seus dados para começar</p>
            </div>

            {/* Botão Google */}
            <button
              type="button"
              onClick={handleGoogleSignup}
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

            <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
              <div className={styles.formGroup}>
                <label>Nome completo *</label>
                <input
                  type="text"
                  placeholder="João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  disabled={googleLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>E-mail *</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={googleLoading}
                />
                <span className={styles.hint}>Usaremos para login e comunicações importantes</span>
              </div>

              <div className={styles.formGroup}>
                <label>Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  disabled={googleLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Senha *</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <span className={styles.hint}>Mínimo de 6 caracteres</span>
              </div>

              <div className={styles.formGroup}>
                <label>Confirmar senha *</label>
                <div className={styles.passwordInput}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={googleLoading}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={googleLoading}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className={styles.termsContainer}>
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={googleLoading}
                />
                <label htmlFor="terms" className={styles.termsLabel}>
                  Concordo com os{' '}
                  <Link href="/termos" className={styles.termsLink} target="_blank">
                    Termos de Uso
                  </Link>
                  {' '}e{' '}
                  <Link href="/privacidade" className={styles.termsLink} target="_blank">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              {/* Mensagem */}
              {message && (
                <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                  {message.type === 'success' ? '✓' : '⚠'} {message.text}
                </div>
              )}

              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    Criando conta...
                  </>
                ) : (
                  'Criar minha conta'
                )}
              </button>
            </form>

            <div className={styles.loginSection}>
              <p className={styles.loginText}>Já tem uma conta?</p>
              <Link href="/login" className={styles.btnLogin}>
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}