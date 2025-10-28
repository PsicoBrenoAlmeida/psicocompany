// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Dados do paciente
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

      // 1. Criar usuário no Supabase Auth
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

      // 2. Criar perfil básico
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

      // 3. Criar registro de paciente
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: authData.user.id
        })

      if (patientError) throw patientError

      // 4. Sucesso
      setMessage({ 
        type: 'success', 
        text: 'Conta criada com sucesso! Redirecionando...' 
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao criar conta' 
      })
    } finally {
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
            <div className="signup-card">
              <div className="form-header">
                <h2 className="form-title">Criar conta gratuita</h2>
                <p className="form-subtitle">Preencha seus dados para começar</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input
                    type="text"
                    placeholder="João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>E-mail *</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="hint">Usaremos para login e comunicações importantes</span>
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </div>

                <div className="form-group">
                  <label>Senha *</label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <span className="hint">Mínimo de 6 caracteres</span>
                </div>

                <div className="form-group">
                  <label>Confirmar senha *</label>
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="terms-container">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
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

                {/* Mensagem */}
                {message && (
                  <div className={`message ${message.type}`}>
                    {message.type === 'success' ? '✓' : '⚠'} {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Criando conta...
                    </>
                  ) : (
                    'Criar minha conta'
                  )}
                </button>
              </form>

              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">ou</span>
                <div className="divider-line"></div>
              </div>

              <div className="login-section">
                <p className="login-text">Já tem uma conta?</p>
                <Link href="/login" className="btn-login">
                  Fazer login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          position: relative;
          overflow: hidden;
          padding: 80px 24px 40px;
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
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        /* Lado esquerdo - Branding */
        .branding-side {
          padding: 32px;
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
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 32px;
          display: inline-block;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .branding-title {
          font-size: 42px;
          font-weight: 900;
          color: #2d1f3e;
          margin-bottom: 20px;
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .branding-subtitle {
          font-size: 18px;
          color: #6b5d7a;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 16px;
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
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .feature-text {
          color: #6b5d7a;
          font-size: 15px;
        }

        /* Lado direito - Formulário */
        .form-side {
          padding: 32px;
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
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(124, 101, 181, 0.12);
          position: relative;
        }

        .signup-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          border-radius: 20px 20px 0 0;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 8px;
        }

        .form-subtitle {
          color: #6b5d7a;
          font-size: 14px;
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
          border: 2px solid rgba(124, 101, 181, 0.15);
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #7c65b5;
          box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.1);
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          padding-right: 48px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .toggle-password:hover {
          opacity: 1;
        }

        .hint {
          display: block;
          font-size: 12px;
          color: #9b8fab;
          margin-top: 6px;
        }

        /* Termos */
        .terms-container {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 24px;
        }

        .terms-container input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #7c65b5;
          cursor: pointer;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .terms-label {
          color: #6b5d7a;
          font-size: 14px;
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
        }

        .terms-link {
          color: #7c65b5;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .terms-link:hover {
          color: #5b4a8a;
          text-decoration: underline;
        }

        .message {
          padding: 16px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.success {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(124, 101, 181, 0.25);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(124, 101, 181, 0.4);
        }

        .btn-submit:disabled {
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Divisor */
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(124, 101, 181, 0.15);
        }

        .divider-text {
          color: #9b8fab;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .login-section {
          text-align: center;
        }

        .login-text {
          color: #6b5d7a;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .btn-login {
          display: block;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.2);
          background: white;
          color: #7c65b5;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          transition: all 0.3s ease;
        }

        .btn-login:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
        }

        /* Responsivo */
        @media (max-width: 968px) {
          .signup-container {
            grid-template-columns: 1fr;
            gap: 40px;
            max-width: 600px;
          }

          .branding-side {
            text-align: center;
            padding: 20px;
          }

          .branding-title {
            font-size: 32px;
          }

          .features {
            max-width: 400px;
            margin: 0 auto;
          }

          .form-side {
            padding: 0;
          }
        }

        @media (max-width: 640px) {
          .signup-page {
            padding: 100px 16px 40px;
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

          .signup-card {
            padding: 32px 24px;
          }
        }
      `}</style>
    </>
  )
}