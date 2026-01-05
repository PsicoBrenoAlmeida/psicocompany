// app/buscar/[id]/page.tsx - Com CSS Modules
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

interface Psychologist {
  id: string
  user_id: string
  crp: string
  specialties: string[]
  approaches: string[]
  price_per_session: number
  session_duration: number
  short_bio: string
  full_bio: string
  avatar_url: string | null
  plan_type: 'basic' | 'premium'
  education_list: Array<{ title: string; year: string }>
  age_groups: string[]
  modality: string[]
  gender: string | null
  race: string | null
  sexual_orientation: string | null
  pronouns: string | null
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

export default function PerfilPsicologoPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [psychologist, setPsychologist] = useState<Psychologist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadPsychologist()
    }
  }, [id])

  const loadPsychologist = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: psychData, error: psychError } = await supabase
        .from('psychologists')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .single()

      if (psychError) throw psychError
      if (!psychData) {
        setError('Psicólogo não encontrado')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', psychData.user_id)
        .single()

      setPsychologist({
        ...psychData,
        profile: {
          full_name: profileData?.full_name || 'Psicólogo',
          avatar_url: profileData?.avatar_url || psychData.avatar_url || null
        }
      })
    } catch (error) {
      console.error('Erro ao carregar psicólogo:', error)
      setError('Erro ao carregar informações do psicólogo')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSchedule = () => {
    if (!psychologist || !psychologist.id) {
      console.error('Erro: Psicólogo não encontrado')
      return
    }
    router.push(`/agendamento/${psychologist.id}`)
  }

  // Loading State
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner}></div>
        <p>Carregando perfil...</p>
      </div>
    )
  }

  // Error State
  if (error || !psychologist) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorContent}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>{error || 'Psicólogo não encontrado'}</h2>
          <p>O perfil que você está procurando não está disponível</p>
          <Link href="/buscar" className={styles.btnBackSearch}>
            Voltar para Busca
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.profilePage}>
      {/* Header com Breadcrumb */}
      <section className={styles.profileHeader}>
        <div className={styles.headerContainer}>
          <div className={styles.breadcrumb}>
            <Link href="/">Início</Link>
            <span>›</span>
            <Link href="/buscar">Buscar</Link>
            <span>›</span>
            <span>{psychologist.profile.full_name}</span>
          </div>
        </div>
      </section>

      {/* Informações Principais */}
      <section className={styles.profileMain}>
        <div className={styles.mainContainer}>
          <div className={styles.profileGrid}>
            
            {/* Coluna Esquerda - Avatar e Info Básica */}
            <div className={styles.profileSidebar}>
              <div className={styles.avatarCard}>
                {psychologist.plan_type === 'premium' && (
                  <div className={styles.premiumBadgeLarge}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    Profissional Premium
                  </div>
                )}
                
                <div className={styles.avatarWrapper}>
                  {psychologist.profile.avatar_url ? (
                    <Image 
                      src={psychologist.profile.avatar_url}
                      alt={psychologist.profile.full_name}
                      width={240}
                      height={240}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {getInitials(psychologist.profile.full_name)}
                    </div>
                  )}
                </div>

                <h1 className={styles.profileName}>{psychologist.profile.full_name}</h1>
                <p className={styles.profileCrp}>CRP {psychologist.crp}</p>

                {/* Tags Rápidas */}
                <div className={styles.quickTags}>
                  {psychologist.modality?.map((mod, idx) => (
                    <span key={idx} className={styles.quickTag}>
                      {mod === 'online' && '💻 Online'}
                      {mod === 'presencial' && '🏢 Presencial'}
                      {mod === 'hibrido' && '🔄 Híbrido'}
                    </span>
                  ))}
                  <span className={styles.quickTag}>⏱️ {psychologist.session_duration}min</span>
                </div>

                {/* Preço e Agendamento */}
                <div className={styles.priceSection}>
                  <div className={styles.priceInfo}>
                    <span className={styles.priceLabel}>Sessão</span>
                    <span className={styles.priceValue}>R$ {psychologist.price_per_session.toFixed(2)}</span>
                  </div>
                  <button className={styles.btnScheduleMain} onClick={handleSchedule}>
                    Agendar Consulta
                  </button>
                </div>

                {/* Dados de Afinidade */}
                {(psychologist.gender || psychologist.pronouns) && (
                  <div className={styles.affinitySection}>
                    <h4>Informações Pessoais</h4>
                    <div className={styles.affinityList}>
                      {psychologist.gender && (
                        <div className={styles.affinityItem}>
                          <span className={styles.affinityLabel}>Gênero:</span>
                          <span className={styles.affinityValue}>{psychologist.gender}</span>
                        </div>
                      )}
                      {psychologist.pronouns && (
                        <div className={styles.affinityItem}>
                          <span className={styles.affinityLabel}>Pronomes:</span>
                          <span className={styles.affinityValue}>{psychologist.pronouns}</span>
                        </div>
                      )}
                      {psychologist.race && (
                        <div className={styles.affinityItem}>
                          <span className={styles.affinityLabel}>Raça/Cor:</span>
                          <span className={styles.affinityValue}>{psychologist.race}</span>
                        </div>
                      )}
                      {psychologist.sexual_orientation && (
                        <div className={styles.affinityItem}>
                          <span className={styles.affinityLabel}>Orientação:</span>
                          <span className={styles.affinityValue}>{psychologist.sexual_orientation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita - Detalhes */}
            <div className={styles.profileContent}>
              
              {/* Bio */}
              <div className={styles.contentCard}>
                <h2 className={styles.cardTitle}>Sobre</h2>
                <p className={styles.bioText}>{psychologist.full_bio || psychologist.short_bio}</p>
              </div>

              {/* Especialidades */}
              {psychologist.specialties && psychologist.specialties.length > 0 && (
                <div className={styles.contentCard}>
                  <h2 className={styles.cardTitle}>
                    Áreas de Especialização
                    <span className={styles.countBadge}>{psychologist.specialties.length}</span>
                  </h2>
                  <div className={styles.tagsGrid}>
                    {psychologist.specialties.map((specialty, idx) => (
                      <div key={idx} className={styles.tagItemLarge}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {specialty}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abordagens */}
              {psychologist.approaches && psychologist.approaches.length > 0 && (
                <div className={styles.contentCard}>
                  <h2 className={styles.cardTitle}>
                    Abordagens Terapêuticas
                    <span className={styles.countBadge}>{psychologist.approaches.length}</span>
                  </h2>
                  <div className={styles.tagsGrid}>
                    {psychologist.approaches.map((approach, idx) => (
                      <div key={idx} className={`${styles.tagItemLarge} ${styles.tagItemLargeApproach}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        {approach}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Público Atendido */}
              {psychologist.age_groups && psychologist.age_groups.length > 0 && (
                <div className={styles.contentCard}>
                  <h2 className={styles.cardTitle}>Público Atendido</h2>
                  <div className={styles.audienceList}>
                    {psychologist.age_groups.map((age, idx) => (
                      <div key={idx} className={styles.audienceItem}>
                        <div className={styles.audienceIcon}>
                          {age.includes('Crianças') && '👶'}
                          {age.includes('Adolescentes') && '🧑'}
                          {age.includes('Adultos') && '👨‍💼'}
                          {age.includes('Idosos') && '👴'}
                          {age.includes('Casais') && '💑'}
                          {age.includes('Famílias') && '👨‍👩‍👧‍👦'}
                        </div>
                        <span>{age}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formação */}
              {psychologist.education_list && psychologist.education_list.length > 0 && (
                <div className={styles.contentCard}>
                  <h2 className={styles.cardTitle}>
                    Formação e Especialização
                    <span className={styles.countBadge}>{psychologist.education_list.length}</span>
                  </h2>
                  <div className={styles.educationList}>
                    {psychologist.education_list.map((edu, idx) => (
                      <div key={idx} className={styles.educationItem}>
                        <div className={styles.educationYear}>{edu.year}</div>
                        <div className={styles.educationDetails}>
                          <h4>{edu.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Final */}
              <div className={styles.ctaCard}>
                <div className={styles.ctaContent}>
                  <h3>Pronto para começar sua jornada?</h3>
                  <p>Agende uma consulta e dê o primeiro passo para o seu bem-estar</p>
                </div>
                <button className={styles.btnScheduleCta} onClick={handleSchedule}>
                  Agendar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}