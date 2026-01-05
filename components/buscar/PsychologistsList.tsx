// components/buscar/PsychologistsList.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import styles from './PsychologistsList.module.css'

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
  is_active: boolean
  approval_status: string
  age_groups: string[]
  modality: string[]
  gender: string | null
  race: string | null
  sexual_orientation: string | null
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

interface PsychologistsListProps {
  psychologists: Psychologist[]
  loading: boolean
  sortBy: string
  onSortChange: (sort: string) => void
}

export default function PsychologistsList({ 
  psychologists, 
  loading, 
  sortBy, 
  onSortChange 
}: PsychologistsListProps) {
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <section className={styles.resultsSection}>
        <div className={styles.resultsContainer}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Carregando psicólogos...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.resultsSection}>
      <div className={styles.resultsContainer}>
        
        {/* Header com contador e ordenação */}
        <div className={styles.resultsHeader}>
          <div className={styles.resultsCount}>
            Encontramos <strong>{psychologists.length}</strong> {psychologists.length === 1 ? 'psicólogo' : 'psicólogos'}
          </div>
          
          <div className={styles.resultsSort}>
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
              <option value="relevant">Mais Relevantes</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Lista de psicólogos OU estado vazio */}
        {psychologists.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>Nenhum psicólogo encontrado</h3>
            <p>Tente ajustar os filtros de busca para encontrar mais profissionais</p>
          </div>
        ) : (
          <div className={styles.psychologistsGrid}>
            {psychologists.map(psychologist => (
              <Link 
                key={psychologist.id} 
                href={`/buscar/${psychologist.id}`}
                className={styles.psychologistCard}
              >
                {/* CABEÇALHO DO CARD - Avatar + Info Básica */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardAvatar}>
                    {psychologist.plan_type === 'premium' && (
                      <div className={styles.premiumBadge}>💎</div>
                    )}
                    {psychologist.profile.avatar_url ? (
                      <Image 
                        src={psychologist.profile.avatar_url} 
                        alt={psychologist.profile.full_name}
                        width={80}
                        height={80}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {getInitials(psychologist.profile.full_name)}
                      </div>
                    )}
                  </div>

                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{psychologist.profile.full_name}</h3>
                    <p className={styles.cardCrp}>CRP {psychologist.crp}</p>
                    
                    {/* Tags inline - Modalidade + Duração */}
                    <div className={styles.cardTags}>
                      {psychologist.modality?.map((mod, idx) => (
                        <span key={idx} className={styles.tag}>
                          {mod === 'online' && '💻'}
                          {mod === 'presencial' && '🏢'}
                          {mod === 'hibrido' && '🔄'}
                        </span>
                      ))}
                      <span className={styles.tag}>⏱️ {psychologist.session_duration}min</span>
                    </div>
                  </div>
                </div>

                {/* ESPECIALIDADES */}
                {psychologist.specialties && psychologist.specialties.length > 0 && (
                  <div className={styles.cardSpecialties}>
                    {psychologist.specialties.slice(0, 3).map((specialty, idx) => (
                      <span key={idx} className={styles.specialtyChip}>{specialty}</span>
                    ))}
                    {psychologist.specialties.length > 3 && (
                      <span className={`${styles.specialtyChip} ${styles.specialtyChipMore}`}>
                        +{psychologist.specialties.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* BIO RESUMIDA */}
                {psychologist.short_bio && (
                  <p className={styles.cardBio}>{psychologist.short_bio}</p>
                )}

                {/* ABORDAGENS */}
                {psychologist.approaches && psychologist.approaches.length > 0 && (
                  <p className={styles.cardApproaches}>
                    {psychologist.approaches.slice(0, 2).join(' • ')}
                    {psychologist.approaches.length > 2 && '...'}
                  </p>
                )}

                {/* FOOTER - Preço + Botão */}
                <div className={styles.cardFooter}>
                  <div className={styles.cardPrice}>
                    <span className={styles.priceLabel}>Sessão</span>
                    <span className={styles.priceValue}>R$ {psychologist.price_per_session.toFixed(2)}</span>
                  </div>
                  
                  <button className={styles.btnView}>
                    Ver perfil
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}