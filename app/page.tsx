// app/page.tsx - Landing Page com CSS Module
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

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
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single()

        if (profileData?.user_type === 'psychologist') {
          router.push('/dashboard')
        } else {
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
      <main className={styles.landingPage}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.landingPage}>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBgDecoration}></div>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Sua saúde mental em primeiro lugar
            </div>
            
            <h1 className={styles.heroTitle}>
              Encontre o psicólogo <span className={styles.gradientText}>perfeito para você</span>
            </h1>
            
            <p className={styles.heroSubtitle}>
              Conectamos você com profissionais qualificados e verificados pelo CRP, 
              especializados em diversas áreas da psicologia. Terapia online ou presencial, 
              no seu tempo e do seu jeito.
            </p>

            <div className={styles.heroCta}>
              <Link href="/buscar" className={styles.btnPrimary}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Buscar Psicólogo
              </Link>
              
              <Link href="#como-funciona" className={styles.btnSecondary}>
                Como Funciona
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <strong>✓</strong>
                <span>CRP Verificado</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <strong>✓</strong>
                <span>Diversas Abordagens</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <strong>✓</strong>
                <span>Online ou Presencial</span>
              </div>
            </div>
          </div>

          <div className={styles.heroImage}>
            <div className={styles.heroImageCard}>
              <div className={`${styles.floatingCard} ${styles.card1}`}>
                <div className={styles.cardIcon}>💚</div>
                <div className={styles.cardText}>
                  <strong>Bem-estar</strong>
                  <span>Cuide da sua mente</span>
                </div>
              </div>
              
              <div className={`${styles.floatingCard} ${styles.card2}`}>
                <div className={styles.cardIcon}>🛡️</div>
                <div className={styles.cardText}>
                  <strong>Segurança</strong>
                  <span>Profissionais verificados</span>
                </div>
              </div>
              
              <div className={`${styles.floatingCard} ${styles.card3}`}>
                <div className={styles.cardIcon}>⭐</div>
                <div className={styles.cardText}>
                  <strong>Qualidade</strong>
                  <span>Atendimento humanizado</span>
                </div>
              </div>

              <div className={styles.heroImageMain}>
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
                <div className={styles.heroImageEmoji}>🧘‍♀️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className={styles.howItWorks} id="como-funciona">
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Como funciona?</h2>
            <p className={styles.sectionSubtitle}>
              Em apenas 3 passos simples, você encontra o profissional ideal e agenda sua primeira sessão
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>🔍</div>
              <h3>Busque seu psicólogo</h3>
              <p>
                Use nossos filtros para encontrar profissionais especializados na sua necessidade. 
                Filtre por especialidade, abordagem, preço e modalidade de atendimento.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>📅</div>
              <h3>Agende sua consulta</h3>
              <p>
                Escolha o melhor horário na agenda do profissional e agende sua sessão de forma 
                rápida e prática, online ou presencial.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>💬</div>
              <h3>Comece sua jornada</h3>
              <p>
                Realize sua sessão com total privacidade e segurança. Acompanhe sua evolução 
                e reagende quando precisar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas de Especialização */}
      <section className={styles.specialties}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Áreas de Especialização</h2>
            <p className={styles.sectionSubtitle}>
              Encontre profissionais especializados em diversas áreas da psicologia
            </p>
          </div>

          <div className={styles.specialtiesGrid}>
            {[
              { icon: '😰', name: 'Ansiedade e Pânico' },
              { icon: '😔', name: 'Depressão' },
              { icon: '💼', name: 'Burnout e Estresse' },
              { icon: '💑', name: 'Relacionamentos' },
              { icon: '👨‍👩‍👧', name: 'Terapia Familiar' },
              { icon: '🎯', name: 'Autoestima' },
              { icon: '🧒', name: 'Infância e Adolescência' },
              { icon: '💔', name: 'Luto e Perdas' }
            ].map((specialty, idx) => (
              <Link 
                key={idx} 
                href={`/buscar?specialty=${encodeURIComponent(specialty.name)}`}
                className={styles.specialtyCard}
              >
                <div className={styles.specialtyIcon}>{specialty.icon}</div>
                <h3>{specialty.name}</h3>
                <span className={styles.specialtyCount}>Ver profissionais</span>
              </Link>
            ))}
          </div>

          <div className={styles.specialtiesCta}>
            <Link href="/buscar" className={styles.btnOutline}>
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
      <section className={styles.benefits}>
        <div className={styles.sectionContainer}>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitsContent}>
              <h2 className={styles.sectionTitle}>Por que escolher a Psicocompany?</h2>
              <p className={styles.benefitsIntro}>
                Nossa plataforma foi criada para conectar pessoas que precisam de suporte 
                emocional com os melhores profissionais da área, de forma simples e segura.
              </p>

              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className={styles.benefitText}>
                    <h3>CRP Verificado</h3>
                    <p>Todos os psicólogos são checados e validados pelo Conselho Regional de Psicologia</p>
                  </div>
                </div>

                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div className={styles.benefitText}>
                    <h3>Segurança e Privacidade</h3>
                    <p>Seus dados e sessões são totalmente confidenciais e protegidos</p>
                  </div>
                </div>

                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className={styles.benefitText}>
                    <h3>Flexibilidade Total</h3>
                    <p>Agende no horário que funciona melhor para você, online ou presencial</p>
                  </div>
                </div>

                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className={styles.benefitText}>
                    <h3>Preços Transparentes</h3>
                    <p>Veja o valor da sessão antes de agendar, sem surpresas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.benefitsVisual}>
              <div className={styles.visualCard}>
                <div className={styles.visualExampleBadge}>
                  ✨ Exemplo de Perfil
                </div>
                <div className={styles.visualHeader}>
                  <div className={styles.visualAvatar}>👩‍⚕️</div>
                  <div className={styles.visualInfo}>
                    <strong>Dra. Maria Silva</strong>
                    <span>Psicóloga - CRP 06/123456</span>
                  </div>
                </div>
                <div className={styles.visualTags}>
                  <span className={styles.tag}>Ansiedade</span>
                  <span className={styles.tag}>Depressão</span>
                  <span className={styles.tag}>💻 Online</span>
                </div>
                <div className={styles.visualRating}>
                  ⭐⭐⭐⭐⭐ <strong>4.9</strong> (47 avaliações)
                </div>
                <div className={styles.visualPrice}>
                  <span>Valor da sessão</span>
                  <strong>R$ 150</strong>
                </div>
                <div className={styles.visualFeatures}>
                  <div className={styles.featureItem}>✓ CRP Verificado</div>
                  <div className={styles.featureItem}>✓ Agendamento online</div>
                  <div className={styles.featureItem}>✓ Aceita convênio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios da Terapia */}
      <section className={styles.therapyBenefits}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Benefícios da Terapia</h2>
            <p className={styles.sectionSubtitle}>
              Cuidar da saúde mental traz transformações reais para sua vida
            </p>
          </div>

          <div className={styles.therapyGrid}>
            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>🌟</div>
              <h3>Autoconhecimento</h3>
              <p>Compreenda melhor seus pensamentos, emoções e comportamentos</p>
            </div>

            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>💪</div>
              <h3>Resiliência</h3>
              <p>Desenvolva ferramentas para lidar com desafios e adversidades</p>
            </div>

            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>🎯</div>
              <h3>Clareza</h3>
              <p>Tome decisões mais conscientes e alinhadas com seus valores</p>
            </div>

            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>❤️</div>
              <h3>Relacionamentos</h3>
              <p>Melhore a qualidade das suas relações pessoais e profissionais</p>
            </div>

            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>😌</div>
              <h3>Bem-estar</h3>
              <p>Reduza ansiedade, estresse e outros sintomas emocionais</p>
            </div>

            <div className={styles.therapyCard}>
              <div className={styles.therapyIcon}>🚀</div>
              <h3>Crescimento</h3>
              <p>Alcance seu potencial e realize seus objetivos de vida</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.finalCta}>
        <div className={styles.sectionContainer}>
          <div className={styles.finalCtaContent}>
            <h2>Pronto para cuidar da sua saúde mental?</h2>
            <p>Dê o primeiro passo hoje. Encontre o profissional ideal para você.</p>
            <Link href="/buscar" className={styles.btnCta}>
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
      <section className={styles.psychologistCta}>
        <div className={styles.psychologistCtaContent}>
          <div className={styles.psychologistInfo}>
            <h3>Você é psicólogo(a) com CRP ativo?</h3>
            <p>Junte-se à nossa rede de profissionais e expanda sua prática clínica</p>
          </div>
          <Link href="/cadastro-rapido" className={styles.btnPsychologist}>
            Cadastrar como Profissional
          </Link>
        </div>
      </section>
    </main>
  )
}