'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Se já estiver logado, redireciona para o dashboard
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single()

        if (profileData?.user_type === 'psychologist') {
          router.push('/dashboard')
        } else {
          // TODO: redirecionar para dashboard de paciente quando existir
          router.push('/buscar')
        }
        return
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <main className="landing-page">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

  return (
    <>
      <main className="landing-page">
        
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-bg-decoration"></div>
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Sua saúde mental em primeiro lugar
              </div>
              
              <h1 className="hero-title">
                Encontre o psicólogo <span className="gradient-text">perfeito para você</span>
              </h1>
              
              <p className="hero-subtitle">
                Conectamos você com profissionais qualificados especializados em diversas áreas da psicologia. 
                Terapia online ou presencial, no seu tempo e do seu jeito.
              </p>

              <div className="hero-cta">
                <Link href="/buscar" className="btn-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Buscar Psicólogo
                </Link>
                
                <Link href="#como-funciona" className="btn-secondary">
                  Como Funciona
                </Link>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <strong>✓</strong>
                  <span>Profissionais Verificados</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <strong>✓</strong>
                  <span>Diversas Especialidades</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <strong>✓</strong>
                  <span>Online ou Presencial</span>
                </div>
              </div>
            </div>

            <div className="hero-image">
              <div className="hero-image-card">
                <div className="floating-card card-1">
                  <div className="card-icon">💚</div>
                  <div className="card-text">
                    <strong>Ansiedade</strong>
                    <span>Especialistas disponíveis</span>
                  </div>
                </div>
                
                <div className="floating-card card-2">
                  <div className="card-icon">🧠</div>
                  <div className="card-text">
                    <strong>TCC</strong>
                    <span>Abordagem comprovada</span>
                  </div>
                </div>
                
                <div className="floating-card card-3">
                  <div className="card-icon">⭐</div>
                  <div className="card-text">
                    <strong>Qualidade</strong>
                    <span>Profissionais qualificados</span>
                  </div>
                </div>

                <div className="hero-image-main">
                  <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none">
                    <circle cx="200" cy="200" r="180" fill="url(#grad1)" opacity="0.2"/>
                    <circle cx="200" cy="200" r="140" fill="url(#grad2)" opacity="0.3"/>
                    <circle cx="200" cy="200" r="100" fill="url(#grad3)"/>
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c65b5"/>
                        <stop offset="100%" stopColor="#a996dd"/>
                      </linearGradient>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a996dd"/>
                        <stop offset="100%" stopColor="#7c65b5"/>
                      </linearGradient>
                      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c65b5"/>
                        <stop offset="100%" stopColor="#a996dd"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="hero-image-emoji">🧘‍♀️</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="how-it-works" id="como-funciona">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Como funciona?</h2>
              <p className="section-subtitle">
                Em apenas 3 passos simples, você encontra o profissional ideal e agenda sua primeira sessão
              </p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon">🔍</div>
                <h3>Busque seu psicólogo</h3>
                <p>
                  Use nossos filtros para encontrar profissionais especializados na sua necessidade. 
                  Filtre por especialidade, abordagem, preço e muito mais.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon">📅</div>
                <h3>Agende sua consulta</h3>
                <p>
                  Escolha o melhor horário na agenda do profissional e agende sua sessão de forma rápida e prática, 
                  online ou presencial.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon">💬</div>
                <h3>Comece sua jornada</h3>
                <p>
                  Realize sua sessão com total privacidade e segurança. Acesse o histórico, 
                  acompanhe sua evolução e reagende quando precisar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas de Especialização */}
        <section className="specialties">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Áreas de Especialização</h2>
              <p className="section-subtitle">
                Encontre profissionais especializados em diversas áreas da psicologia
              </p>
            </div>

            <div className="specialties-grid">
              {[
                { icon: '😰', name: 'Ansiedade e Pânico' },
                { icon: '😔', name: 'Depressão' },
                { icon: '💼', name: 'Burnout e Estresse' },
                { icon: '💑', name: 'Relacionamentos' },
                { icon: '👨‍👩‍👧', name: 'Terapia Familiar' },
                { icon: '🎯', name: 'Autoestima' },
                { icon: '🧠', name: 'TDAH e TEA' },
                { icon: '💔', name: 'Luto e Perdas' }
              ].map((specialty, idx) => (
                <Link 
                  key={idx} 
                  href={`/buscar?specialty=${encodeURIComponent(specialty.name)}`}
                  className="specialty-card"
                >
                  <div className="specialty-icon">{specialty.icon}</div>
                  <h3>{specialty.name}</h3>
                  <span className="specialty-count">Profissionais disponíveis</span>
                </Link>
              ))}
            </div>

            <div className="specialties-cta">
              <Link href="/buscar" className="btn-outline">
                Ver todas as especialidades
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="benefits">
          <div className="section-container">
            <div className="benefits-grid">
              <div className="benefits-content">
                <h2 className="section-title">Por que escolher a Psicocompany?</h2>
                <p className="benefits-intro">
                  Nossa plataforma foi criada pensando em conectar pessoas que precisam de suporte 
                  emocional com os melhores profissionais da área.
                </p>

                <div className="benefits-list">
                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="benefit-text">
                      <h3>Profissionais Verificados</h3>
                      <p>Todos os psicólogos são checados e validados pelo CRP</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <div className="benefit-text">
                      <h3>Segurança e Privacidade</h3>
                      <p>Seus dados e sessões são totalmente confidenciais</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div className="benefit-text">
                      <h3>Flexibilidade Total</h3>
                      <p>Agende no horário que funciona melhor para você</p>
                    </div>
                  </div>

                  <div className="benefit-item">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div className="benefit-text">
                      <h3>Preços Transparentes</h3>
                      <p>Veja o valor da sessão antes de agendar</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="benefits-visual">
                <div className="visual-card">
                  <div className="visual-example-badge">
                    ✨ Exemplo de Perfil
                  </div>
                  <div className="visual-header">
                    <div className="visual-avatar">👨‍⚕️</div>
                    <div className="visual-info">
                      <strong>Dr. João Silva</strong>
                      <span>Psicólogo(a) - CRP</span>
                    </div>
                  </div>
                  <div className="visual-tags">
                    <span className="tag">Especialidades</span>
                    <span className="tag">Abordagem</span>
                    <span className="tag">💻 Modalidade</span>
                  </div>
                  <div className="visual-rating">
                    ⭐⭐⭐⭐⭐ <strong>Avaliações</strong>
                  </div>
                  <div className="visual-price">
                    <span>Valor da sessão</span>
                    <strong>R$ 80</strong>
                  </div>
                  <div className="visual-features">
                    <div className="feature-item">✓ Verificado pelo CRP</div>
                    <div className="feature-item">✓ Agendamento online</div>
                    <div className="feature-item">✓ Primeira consulta</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios da Terapia */}
        <section className="therapy-benefits">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">Benefícios da Terapia</h2>
              <p className="section-subtitle">
                Cuidar da saúde mental traz transformações reais para sua vida
              </p>
            </div>

            <div className="therapy-grid">
              <div className="therapy-card">
                <div className="therapy-icon">🌟</div>
                <h3>Autoconhecimento</h3>
                <p>Compreenda melhor seus pensamentos, emoções e comportamentos</p>
              </div>

              <div className="therapy-card">
                <div className="therapy-icon">💪</div>
                <h3>Resiliência</h3>
                <p>Desenvolva ferramentas para lidar com desafios e adversidades</p>
              </div>

              <div className="therapy-card">
                <div className="therapy-icon">🎯</div>
                <h3>Clareza</h3>
                <p>Tome decisões mais conscientes e alinhadas com seus valores</p>
              </div>

              <div className="therapy-card">
                <div className="therapy-icon">❤️</div>
                <h3>Relacionamentos</h3>
                <p>Melhore a qualidade das suas relações pessoais e profissionais</p>
              </div>

              <div className="therapy-card">
                <div className="therapy-icon">😌</div>
                <h3>Bem-estar</h3>
                <p>Reduza ansiedade, estresse e outros sintomas emocionais</p>
              </div>

              <div className="therapy-card">
                <div className="therapy-icon">🚀</div>
                <h3>Crescimento</h3>
                <p>Alcance seu potencial e realize seus objetivos de vida</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="final-cta">
          <div className="section-container">
            <div className="final-cta-content">
              <h2>Pronto para cuidar da sua saúde mental?</h2>
              <p>Dê o primeiro passo hoje. Encontre o profissional ideal para você.</p>
              <Link href="/buscar" className="btn-cta">
                Encontrar Psicólogo Agora
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer para Psicólogos */}
        <section className="psychologist-cta">
          <div className="section-container">
            <div className="psychologist-cta-content">
              <div className="psychologist-info">
                <h3>Você é psicólogo?</h3>
                <p>Junte-se à nossa rede de profissionais e expanda sua prática</p>
              </div>
              <Link href="/cadastro-rapido" className="btn-psychologist">
                Cadastrar como Profissional
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{styles}</style>
    </>
  )
}

const styles = `
  .landing-page {
    min-height: 100vh;
    background: #fafafa;
  }

  /* Loading */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
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

  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
    padding: 140px 24px 80px;
    position: relative;
    overflow: hidden;
  }

  .hero-bg-decoration {
    position: absolute;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(124, 101, 181, 0.08) 0%, transparent 70%);
    top: -400px;
    right: -200px;
    animation: float 25s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    position: relative;
    z-index: 2;
  }

  .hero-content {
    animation: slideInLeft 0.8s ease;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(124, 101, 181, 0.1);
    border: 2px solid rgba(124, 101, 181, 0.2);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    color: #7c65b5;
    margin-bottom: 24px;
  }

  .hero-badge svg {
    color: #f59e0b;
  }

  .hero-title {
    font-size: 56px;
    font-weight: 900;
    color: #2d1f3e;
    line-height: 1.1;
    margin-bottom: 20px;
    letter-spacing: -2px;
  }

  .gradient-text {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 18px;
    line-height: 1.7;
    color: #6b5d7a;
    margin-bottom: 32px;
    max-width: 540px;
  }

  .hero-cta {
    display: flex;
    gap: 16px;
    margin-bottom: 48px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(124, 101, 181, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(124, 101, 181, 0.4);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    background: white;
    color: #7c65b5;
    text-decoration: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    border: 2px solid #7c65b5;
    transition: all 0.3s ease;
  }

  .btn-secondary:hover {
    background: #7c65b5;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(124, 101, 181, 0.2);
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
  }

  .stat-item strong {
    font-size: 28px;
    font-weight: 900;
    color: #7c65b5;
    margin-bottom: 4px;
  }

  .stat-item span {
    font-size: 13px;
    color: #6b5d7a;
    font-weight: 600;
  }

  .stat-divider {
    width: 2px;
    height: 40px;
    background: rgba(124, 101, 181, 0.2);
  }

  .hero-image {
    animation: slideInRight 0.8s ease;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .hero-image-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 500px;
    margin: 0 auto;
  }

  .floating-card {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(124, 101, 181, 0.15);
    border: 2px solid rgba(124, 101, 181, 0.1);
    z-index: 10;
  }

  .card-1 {
    top: 10%;
    left: -5%;
    animation: floatCard1 4s ease-in-out infinite;
  }

  .card-2 {
    top: 50%;
    right: -5%;
    animation: floatCard2 5s ease-in-out infinite;
  }

  .card-3 {
    bottom: 15%;
    left: 5%;
    animation: floatCard3 4.5s ease-in-out infinite;
  }

  @keyframes floatCard1 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes floatCard2 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }

  @keyframes floatCard3 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-18px); }
  }

  .card-icon {
    font-size: 28px;
  }

  .card-text strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 2px;
  }

  .card-text span {
    font-size: 12px;
    color: #9b8fab;
    font-weight: 600;
  }

  .hero-image-main {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .hero-image-emoji {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    animation: pulse 3s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }

  /* Sections Container */
  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .section-header {
    text-align: center;
    margin-bottom: 60px;
  }

  .section-title {
    font-size: 42px;
    font-weight: 900;
    color: #2d1f3e;
    margin-bottom: 16px;
    letter-spacing: -1px;
  }

  .section-subtitle {
    font-size: 18px;
    color: #6b5d7a;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* How It Works */
  .how-it-works {
    padding: 100px 24px;
    background: white;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
  }

  .step-card {
    text-align: center;
    position: relative;
    padding: 40px 32px;
    background: linear-gradient(135deg, rgba(124, 101, 181, 0.03) 0%, rgba(169, 150, 221, 0.03) 100%);
    border-radius: 20px;
    border: 2px solid rgba(124, 101, 181, 0.08);
    transition: all 0.3s ease;
  }

  .step-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(124, 101, 181, 0.15);
    border-color: #7c65b5;
  }

  .step-number {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
  }

  .step-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .step-card h3 {
    font-size: 22px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 12px;
  }

  .step-card p {
    font-size: 15px;
    color: #6b5d7a;
    line-height: 1.6;
  }

  /* Specialties */
  .specialties {
    padding: 100px 24px;
    background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
  }

  .specialties-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    margin-bottom: 48px;
  }

  .specialty-card {
    background: white;
    padding: 28px;
    border-radius: 16px;
    text-align: center;
    text-decoration: none;
    border: 2px solid rgba(124, 101, 181, 0.08);
    transition: all 0.3s ease;
  }

  .specialty-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(124, 101, 181, 0.2);
    border-color: #7c65b5;
  }

  .specialty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .specialty-card h3 {
    font-size: 17px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .specialty-count {
    font-size: 13px;
    color: #7c65b5;
    font-weight: 600;
  }

  .specialties-cta {
    text-align: center;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    background: white;
    color: #7c65b5;
    text-decoration: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    border: 2px solid #7c65b5;
    transition: all 0.3s ease;
  }

  .btn-outline:hover {
    background: #7c65b5;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(124, 101, 181, 0.3);
  }

  /* Benefits */
  .benefits {
    padding: 100px 24px;
    background: white;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .benefits-intro {
    font-size: 17px;
    color: #6b5d7a;
    line-height: 1.7;
    margin-bottom: 40px;
  }

  .benefits-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .benefit-item {
    display: flex;
    gap: 20px;
  }

  .benefit-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, rgba(124, 101, 181, 0.1) 0%, rgba(169, 150, 221, 0.1) 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .benefit-icon svg {
    color: #7c65b5;
  }

  .benefit-text h3 {
    font-size: 18px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 6px;
  }

  .benefit-text p {
    font-size: 15px;
    color: #6b5d7a;
    line-height: 1.6;
  }

  .benefits-visual {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .visual-card {
    width: 100%;
    max-width: 400px;
    background: white;
    padding: 28px;
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(124, 101, 181, 0.15);
    border: 2px solid rgba(124, 101, 181, 0.08);
    position: relative;
  }

  .visual-example-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 6px 14px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(124, 101, 181, 0.3);
  }

  .visual-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-top: 20px;
  }

  .visual-avatar {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }

  .visual-info strong {
    display: block;
    font-size: 16px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .visual-info span {
    font-size: 13px;
    color: #9b8fab;
    font-weight: 600;
  }

  .visual-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .tag {
    padding: 6px 12px;
    background: rgba(124, 101, 181, 0.1);
    color: #7c65b5;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
  }

  .visual-rating {
    font-size: 14px;
    color: #6b5d7a;
    margin-bottom: 16px;
  }

  .visual-rating strong {
    color: #2d1f3e;
    font-weight: 800;
  }

  .visual-price {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: linear-gradient(135deg, rgba(124, 101, 181, 0.05) 0%, rgba(169, 150, 221, 0.05) 100%);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .visual-price span {
    font-size: 12px;
    color: #9b8fab;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .visual-price strong {
    font-size: 28px;
    font-weight: 900;
    color: #7c65b5;
  }

  .visual-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #2d1f3e;
    font-weight: 600;
    padding: 8px 12px;
    background: rgba(124, 101, 181, 0.05);
    border-radius: 8px;
  }

  /* Therapy Benefits */
  .therapy-benefits {
    padding: 100px 24px;
    background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
  }

  .therapy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }

  .therapy-card {
    background: white;
    padding: 32px;
    border-radius: 16px;
    text-align: center;
    border: 2px solid rgba(124, 101, 181, 0.08);
    transition: all 0.3s ease;
  }

  .therapy-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 40px rgba(124, 101, 181, 0.2);
    border-color: #7c65b5;
  }

  .therapy-icon {
    font-size: 56px;
    margin-bottom: 20px;
  }

  .therapy-card h3 {
    font-size: 20px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 12px;
  }

  .therapy-card p {
    font-size: 15px;
    color: #6b5d7a;
    line-height: 1.6;
  }

  /* Final CTA */
  .final-cta {
    padding: 120px 24px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    position: relative;
    overflow: hidden;
  }

  .final-cta::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    top: -300px;
    left: -100px;
    animation: float 20s ease-in-out infinite;
  }

  .final-cta-content {
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .final-cta-content h2 {
    font-size: 48px;
    font-weight: 900;
    color: white;
    margin-bottom: 16px;
    letter-spacing: -1px;
  }

  .final-cta-content p {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 40px;
  }

  .btn-cta {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 18px 40px;
    background: white;
    color: #7c65b5;
    text-decoration: none;
    border-radius: 14px;
    font-size: 18px;
    font-weight: 800;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .btn-cta:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
  }

  /* Psychologist CTA */
  .psychologist-cta {
    padding: 60px 24px;
    background: #2d1f3e;
  }

  .psychologist-cta-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  .psychologist-info h3 {
    font-size: 24px;
    font-weight: 800;
    color: white;
    margin-bottom: 8px;
  }

  .psychologist-info p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }

  .btn-psychologist {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    background: white;
    color: #2d1f3e;
    text-decoration: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .btn-psychologist:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.2);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr;
      gap: 60px;
    }

    .hero-image {
      max-width: 400px;
      margin: 0 auto;
    }

    .benefits-grid {
      grid-template-columns: 1fr;
      gap: 60px;
    }

    .benefits-visual {
      order: -1;
    }
  }

  @media (max-width: 768px) {
    .hero {
      padding: 120px 20px 60px;
    }

    .hero-title {
      font-size: 36px;
    }

    .hero-subtitle {
      font-size: 16px;
    }

    .hero-cta {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }

    .hero-stats {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .stat-divider {
      display: none;
    }

    .section-title {
      font-size: 32px;
    }

    .section-subtitle {
      font-size: 16px;
    }

    .steps-grid {
      grid-template-columns: 1fr;
    }

    .specialties-grid {
      grid-template-columns: 1fr;
    }

    .therapy-grid {
      grid-template-columns: 1fr;
    }

    .psychologist-cta-content {
      flex-direction: column;
      text-align: center;
    }

    .btn-psychologist {
      width: 100%;
      justify-content: center;
    }

    .final-cta-content h2 {
      font-size: 32px;
    }

    .final-cta-content p {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 28px;
    }

    .floating-card {
      display: none;
    }

    .how-it-works,
    .specialties,
    .benefits,
    .therapy-benefits {
      padding: 60px 20px;
    }

    .final-cta {
      padding: 80px 20px;
    }
  }
`