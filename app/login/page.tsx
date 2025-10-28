// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  // Estados do formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, password?: string}>({})

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
      showToast('Por favor, corrija os erros no formulário', 'error')
      return
    }
    
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        const message = error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos' 
          : error.message
        showToast(message, 'error')
        setLoading(false)
        return
      }

      // Login bem-sucedido - REDIRECIONA PARA O DASHBOARD
      showToast('Login realizado com sucesso!', 'success')
      router.push('/dashboard')
    } catch (err) {
      showToast('Ocorreu um erro ao fazer login. Tente novamente.', 'error')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="login-page">
        {/* Decorações de fundo */}
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>
        
        <div className="login-container">
          {/* Lado esquerdo - Branding */}
          <div className="branding-side">
            <Link href="/" className="logo-link">
              <h1 className="logo">Psicocompany</h1>
            </Link>
            <h2 className="branding-title">
              Bem-vindo de volta ao seu <span className="gradient-text">espaço de cuidado</span>
            </h2>
            <p className="branding-subtitle">
              Continue sua jornada de evolução emocional com acesso a psicólogos, cursos e conteúdos personalizados.
            </p>
            
            <div className="features">
              <div className="feature">
                <div className="feature-icon">🧠</div>
                <span className="feature-text">Acesse seu histórico de sessões</span>
              </div>
              <div className="feature">
                <div className="feature-icon">📚</div>
                <span className="feature-text">Continue seus cursos no Academy</span>
              </div>
              <div className="feature">
                <div className="feature-icon">💜</div>
                <span className="feature-text">Acompanhe sua evolução</span>
              </div>
            </div>
          </div>

          {/* Lado direito - Formulário */}
          <div className="form-side">
            <Card variant="elevated" padding="lg" className="login-card">
              <div className="form-header">
                <h2 className="form-title">Entrar na conta</h2>
                <p className="form-subtitle">Acesse sua conta Psicocompany</p>
              </div>

              <form onSubmit={handleSubmit}>
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
                  }}
                  error={errors.password}
                  required
                />

                <div className="form-options">
                  <div className="checkbox-container">
                    <input 
                      type="checkbox" 
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember" className="checkbox-label">
                      Lembrar-me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="forgot-link">
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Entrar
                </Button>
              </form>

              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">ou</span>
                <div className="divider-line"></div>
              </div>

              <div className="signup-section">
                <p className="signup-text">Não tem uma conta?</p>
                <Link href="/signup">
                  <Button variant="outline" size="lg" fullWidth>
                    Cadastre-se grátis
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
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
          width: 400px;
          height: 400px;
          top: -200px;
          right: -100px;
        }

        .bg-decoration-2 {
          width: 300px;
          height: 300px;
          bottom: -150px;
          left: -50px;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Container principal */
        .login-container {
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

        .login-card {
          width: 100%;
          max-width: 440px;
          position: relative;
        }

        .login-card::before {
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

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .checkbox-container input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
          cursor: pointer;
        }

        .checkbox-label {
          color: var(--gray);
          font-size: 14px;
          cursor: pointer;
          user-select: none;
        }

        .forgot-link {
          color: var(--primary);
          font-size: 14px;
          text-decoration: none;
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .forgot-link:hover {
          color: var(--primary-dark);
        }

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

        .signup-section {
          text-align: center;
        }

        .signup-text {
          color: var(--gray);
          font-size: 14px;
          margin-bottom: var(--spacing-md);
        }

        /* Responsivo */
        @media (max-width: 968px) {
          .login-container {
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
          .login-page {
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