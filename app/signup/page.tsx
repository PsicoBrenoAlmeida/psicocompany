// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  // Estados do formulário
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})

  // Validação de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validação de senha forte
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres'
    }
    // Opcional: adicionar mais regras de senha forte
    // if (!/[A-Z]/.test(password)) {
    //   return 'A senha deve conter pelo menos uma letra maiúscula'
    // }
    // if (!/[0-9]/.test(password)) {
    //   return 'A senha deve conter pelo menos um número'
    // }
    return null
  }

  // Validação completa do formulário
  const validateForm = () => {
    const newErrors: typeof errors = {}
    
    // Validar nome
    if (!fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório'
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    // Validar email
    if (!email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    // Validar senha
    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else {
      const passwordError = validatePassword(password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }
    
    // Validar confirmação de senha
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }
    
    // Validar termos
    if (!acceptTerms) {
      newErrors.terms = 'Você deve aceitar os termos de uso'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error')
      return
    }
    
    setLoading(true)

    try {
      // Criar conta no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        // Tratamento de erros específicos do Supabase
        let message = 'Erro ao criar conta'
        
        if (error.message.includes('already registered')) {
          message = 'Este e-mail já está cadastrado'
        } else if (error.message.includes('invalid')) {
          message = 'Dados inválidos. Verifique as informações'
        } else if (error.message.includes('weak')) {
          message = 'Senha muito fraca. Use uma senha mais forte'
        } else {
          message = error.message
        }
        
        showToast(message, 'error')
        setLoading(false)
        return
      }

      const userId = data.user?.id
      if (userId) {
        // Criar registros nas tabelas profiles e patients
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: fullName,
            role: 'patient'
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }

        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            user_id: userId
          })

        if (patientError) {
          console.error('Erro ao criar registro de paciente:', patientError)
        }
      }

      // Sucesso
      showToast('Conta criada com sucesso! Redirecionando...', 'success')
      
      // Aguardar um pouco para mostrar a mensagem antes de redirecionar
      setTimeout(() => {
        router.push('/')
      }, 1500)
      
    } catch (err) {
      console.error('Erro inesperado:', err)
      showToast('Ocorreu um erro inesperado. Tente novamente.', 'error')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="signup-page">
        {/* Decorações de fundo */}
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>
        
        <div className="signup-container">
          {/* Lado esquerdo - Branding */}
          <div className="branding-side">
            <Link href="/" className="logo-link">
              <h1 className="logo">Psicocompany</h1>
            </Link>
            <h2 className="branding-title">
              Comece sua jornada de <span className="gradient-text">evolução emocional</span>
            </h2>
            <p className="branding-subtitle">
              Crie sua conta gratuita e tenha acesso a psicólogos qualificados, 
              cursos especializados e uma comunidade de apoio.
            </p>
            
            <div className="features">
              <div className="feature">
                <div className="feature-icon">✅</div>
                <span className="feature-text">Primeira consulta com desconto</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🎓</div>
                <span className="feature-text">Acesso ao curso gratuito</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🔒</div>
                <span className="feature-text">Seus dados protegidos</span>
              </div>
            </div>
          </div>

          {/* Lado direito - Formulário */}
          <div className="form-side">
            <Card variant="elevated" padding="lg" className="signup-card">
              <div className="form-header">
                <h2 className="form-title">Criar conta gratuita</h2>
                <p className="form-subtitle">Preencha seus dados para começar</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <Input
                  label="Nome completo"
                  type="text"
                  placeholder="João da Silva"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    setErrors({...errors, fullName: undefined})
                  }}
                  onBlur={() => {
                    if (fullName && fullName.trim().length < 3) {
                      setErrors({...errors, fullName: 'Nome deve ter pelo menos 3 caracteres'})
                    }
                  }}
                  error={errors.fullName}
                  required
                  autoFocus
                />

                <Input
                  label="E-mail"
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
                  error={errors.email}
                  hint="Usaremos para login e comunicações importantes"
                  required
                />

                <Input
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  showPasswordToggle
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors({...errors, password: undefined})
                    // Verificar confirmação de senha em tempo real
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setErrors({...errors, confirmPassword: 'As senhas não coincidem'})
                    } else if (confirmPassword) {
                      setErrors({...errors, confirmPassword: undefined})
                    }
                  }}
                  onBlur={() => {
                    if (password) {
                      const error = validatePassword(password)
                      if (error) {
                        setErrors({...errors, password: error})
                      }
                    }
                  }}
                  error={errors.password}
                  hint="Mínimo de 6 caracteres"
                  required
                />

                <Input
                  label="Confirmar senha"
                  type="password"
                  placeholder="••••••••"
                  showPasswordToggle
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrors({...errors, confirmPassword: undefined})
                  }}
                  onBlur={() => {
                    if (confirmPassword && password !== confirmPassword) {
                      setErrors({...errors, confirmPassword: 'As senhas não coincidem'})
                    }
                  }}
                  error={errors.confirmPassword}
                  required
                />

                <div className="terms-container">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked)
                      setErrors({...errors, terms: undefined})
                    }}
                  />
                  <label htmlFor="terms" className="terms-label">
                    Concordo com os{' '}
                    <Link href="/termos" className="terms-link" target="_blank">
                      Termos de Uso
                    </Link>
                    {' '}e{' '}
                    <Link href="/privacidade" className="terms-link" target="_blank">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
                {errors.terms && (
                  <span className="terms-error">{errors.terms}</span>
                )}

                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Criar minha conta
                </Button>
              </form>

              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">ou</span>
                <div className="divider-line"></div>
              </div>

              <div className="login-section">
                <p className="login-text">Já tem uma conta?</p>
                <Link href="/login">
                  <Button variant="outline" size="lg" fullWidth>
                    Fazer login
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: calc(100vh - 72px);
          display: flex;
          background: var(--gradient-bg);
          position: relative;
          overflow: hidden;
          padding: var(--spacing-2xl) var(--spacing-lg);
        }

        /* Decorações de fundo */
        .bg-decoration {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 101, 181, 0.08) 0%, transparent 70%);
          animation: float 20s ease-in-out infinite;
        }

        .bg-decoration-1 {
          width: 500px;
          height: 500px;
          top: -250px;
          left: -100px;
        }

        .bg-decoration-2 {
          width: 350px;
          height: 350px;
          bottom: -175px;
          right: -50px;
          animation-delay: -7s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Container principal */
        .signup-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-3xl);
          align-items: center;
          position: relative;
          z-index: 1;
        }

        /* Lado esquerdo - Branding */
        .branding-side {
          padding: var(--spacing-xl);
          animation: slideInLeft 0.8s ease;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .logo-link {
          display: inline-block;
          text-decoration: none;
        }

        .logo {
          font-size: 32px;
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-xl);
          display: inline-block;
          transition: transform var(--transition-base);
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .branding-title {
          font-size: 42px;
          font-weight: 900;
          color: var(--dark);
          margin-bottom: var(--spacing-lg);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .branding-subtitle {
          font-size: 18px;
          color: var(--gray);
          line-height: 1.6;
          margin-bottom: var(--spacing-2xl);
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .feature {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }

        .feature:nth-child(1) { animation-delay: 0.2s; }
        .feature:nth-child(2) { animation-delay: 0.3s; }
        .feature:nth-child(3) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .feature-text {
          color: var(--gray);
          font-size: 15px;
        }

        /* Lado direito - Formulário */
        .form-side {
          padding: var(--spacing-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: slideInRight 0.8s ease;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .signup-card {
          width: 100%;
          max-width: 480px;
          position: relative;
        }

        .signup-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }

        .form-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .form-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--dark);
          margin-bottom: var(--spacing-sm);
        }

        .form-subtitle {
          color: var(--gray);
          font-size: 14px;
        }

        /* Termos e condições */
        .terms-container {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .terms-container input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
          cursor: pointer;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .terms-label {
          color: var(--gray);
          font-size: 14px;
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
        }

        .terms-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .terms-link:hover {
          color: var(--primary-dark);
          text-decoration: underline;
        }

        .terms-error {
          display: block;
          color: var(--error);
          font-size: 12px;
          margin-top: -12px;
          margin-bottom: var(--spacing-md);
        }

        /* Divisor */
        .divider {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin: var(--spacing-lg) 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .divider-text {
          color: var(--gray-light);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .login-section {
          text-align: center;
        }

        .login-text {
          color: var(--gray);
          font-size: 14px;
          margin-bottom: var(--spacing-md);
        }

        /* Responsivo */
        @media (max-width: 968px) {
          .signup-container {
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
            max-width: 600px;
          }

          .branding-side {
            text-align: center;
            padding: var(--spacing-lg);
          }

          .branding-title {
            font-size: 32px;
          }

          .features {
            max-width: 400px;
            margin: 0 auto;
          }

          .form-side {
            padding: var(--spacing-lg);
          }
        }

        @media (max-width: 640px) {
          .signup-page {
            padding: var(--spacing-lg) var(--spacing-md);
          }

          .branding-title {
            font-size: 28px;
          }

          .form-title {
            font-size: 24px;
          }

          .logo {
            font-size: 28px;
          }

          .branding-side {
            padding: var(--spacing-md);
          }

          .form-side {
            padding: 0;
          }
        }
      `}</style>
    </>
  )
}