'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabaseClient'

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

      // Buscar psicólogo
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

      // Buscar perfil
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

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Carregando perfil...</p>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          }
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(124, 101, 181, 0.1);
            border-top-color: #7c65b5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-page p {
            color: #6b5d7a;
            font-size: 16px;
            font-weight: 500;
          }
        `}</style>
      </div>
    )
  }

  if (error || !psychologist) {
    return (
      <div className="error-page">
        <div className="error-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>{error || 'Psicólogo não encontrado'}</h2>
          <p>O perfil que você está procurando não está disponível</p>
          <Link href="/buscar" className="btn-back-search">
            Voltar para Busca
          </Link>
        </div>
        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
            padding: 20px;
          }
          .error-content {
            text-align: center;
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(124, 101, 181, 0.12);
            max-width: 500px;
          }
          .error-content svg {
            color: #ef4444;
            margin-bottom: 24px;
          }
          .error-content h2 {
            font-size: 24px;
            font-weight: 800;
            color: #2d1f3e;
            margin-bottom: 12px;
          }
          .error-content p {
            font-size: 16px;
            color: #6b5d7a;
            margin-bottom: 28px;
          }
          .btn-back-search {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.3s ease;
          }
          .btn-back-search:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div className="profile-page">
        {/* Header com Breadcrumb */}
        <section className="profile-header">
          <div className="header-container">
            <div className="breadcrumb">
              <Link href="/">Início</Link>
              <span>›</span>
              <Link href="/buscar">Buscar</Link>
              <span>›</span>
              <span>{psychologist.profile.full_name}</span>
            </div>
          </div>
        </section>

        {/* Informações Principais */}
        <section className="profile-main">
          <div className="main-container">
            <div className="profile-grid">
              
              {/* Coluna Esquerda - Avatar e Info Básica */}
              <div className="profile-sidebar">
                <div className="avatar-card">
                  {psychologist.plan_type === 'premium' && (
                    <div className="premium-badge-large">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Profissional Premium
                    </div>
                  )}
                  
                  <div className="avatar-wrapper">
                    {psychologist.profile.avatar_url ? (
                      <Image 
                        src={psychologist.profile.avatar_url}
                        alt={psychologist.profile.full_name}
                        width={240}
                        height={240}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {getInitials(psychologist.profile.full_name)}
                      </div>
                    )}
                  </div>

                  <h1 className="profile-name">{psychologist.profile.full_name}</h1>
                  <p className="profile-crp">CRP {psychologist.crp}</p>

                  {/* Tags Rápidas */}
                  <div className="quick-tags">
                    {psychologist.modality?.map((mod, idx) => (
                      <span key={idx} className="quick-tag">
                        {mod === 'online' && '💻 Online'}
                        {mod === 'presencial' && '🏢 Presencial'}
                        {mod === 'hibrido' && '🔄 Híbrido'}
                      </span>
                    ))}
                    <span className="quick-tag">⏱️ {psychologist.session_duration}min</span>
                  </div>

                  {/* Preço e Agendamento */}
                  <div className="price-section">
                    <div className="price-info">
                      <span className="price-label">Sessão</span>
                      <span className="price-value">R$ {psychologist.price_per_session.toFixed(2)}</span>
                    </div>
                    <button className="btn-schedule-main" onClick={handleSchedule}>
                      Agendar Consulta
                    </button>
                  </div>

                  {/* Dados de Afinidade */}
                  {(psychologist.gender || psychologist.pronouns) && (
                    <div className="affinity-section">
                      <h4>Informações Pessoais</h4>
                      <div className="affinity-list">
                        {psychologist.gender && (
                          <div className="affinity-item">
                            <span className="affinity-label">Gênero:</span>
                            <span className="affinity-value">{psychologist.gender}</span>
                          </div>
                        )}
                        {psychologist.pronouns && (
                          <div className="affinity-item">
                            <span className="affinity-label">Pronomes:</span>
                            <span className="affinity-value">{psychologist.pronouns}</span>
                          </div>
                        )}
                        {psychologist.race && (
                          <div className="affinity-item">
                            <span className="affinity-label">Raça/Cor:</span>
                            <span className="affinity-value">{psychologist.race}</span>
                          </div>
                        )}
                        {psychologist.sexual_orientation && (
                          <div className="affinity-item">
                            <span className="affinity-label">Orientação:</span>
                            <span className="affinity-value">{psychologist.sexual_orientation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita - Detalhes */}
              <div className="profile-content">
                
                {/* Bio */}
                <div className="content-card">
                  <h2 className="card-title">Sobre</h2>
                  <p className="bio-text">{psychologist.full_bio || psychologist.short_bio}</p>
                </div>

                {/* Especialidades */}
                {psychologist.specialties && psychologist.specialties.length > 0 && (
                  <div className="content-card">
                    <h2 className="card-title">
                      Áreas de Especialização
                      <span className="count-badge">{psychologist.specialties.length}</span>
                    </h2>
                    <div className="tags-grid">
                      {psychologist.specialties.map((specialty, idx) => (
                        <div key={idx} className="tag-item-large">
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
                  <div className="content-card">
                    <h2 className="card-title">
                      Abordagens Terapêuticas
                      <span className="count-badge">{psychologist.approaches.length}</span>
                    </h2>
                    <div className="tags-grid">
                      {psychologist.approaches.map((approach, idx) => (
                        <div key={idx} className="tag-item-large approach">
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
                  <div className="content-card">
                    <h2 className="card-title">Público Atendido</h2>
                    <div className="audience-list">
                      {psychologist.age_groups.map((age, idx) => (
                        <div key={idx} className="audience-item">
                          <div className="audience-icon">
                            {age.includes('Crianças') && '👶'}
                            {age.includes('Adolescentes') && '🧑'}
                            {age.includes('Adultos') && '👨‍💼'}
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
                  <div className="content-card">
                    <h2 className="card-title">
                      Formação e Especialização
                      <span className="count-badge">{psychologist.education_list.length}</span>
                    </h2>
                    <div className="education-list">
                      {psychologist.education_list.map((edu, idx) => (
                        <div key={idx} className="education-item">
                          <div className="education-year">{edu.year}</div>
                          <div className="education-details">
                            <h4>{edu.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Final */}
                <div className="cta-card">
                  <div className="cta-content">
                    <h3>Pronto para começar sua jornada?</h3>
                    <p>Agende uma consulta e dê o primeiro passo para o seu bem-estar</p>
                  </div>
                  <button className="btn-schedule-cta" onClick={handleSchedule}>
                    Agendar Consulta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: #fafafa;
        }

        .profile-header {
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          padding: 100px 24px 24px;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 500;
        }

        .breadcrumb a {
          color: #7c65b5;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .profile-main {
          padding: 40px 24px 80px;
        }

        .main-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 32px;
          align-items: start;
        }

        .profile-sidebar {
          position: sticky;
          top: 100px;
        }

        .avatar-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(124, 101, 181, 0.1);
          border: 2px solid rgba(124, 101, 181, 0.08);
          text-align: center;
        }

        .premium-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
          box-shadow: 0 2px 12px rgba(251, 191, 36, 0.3);
        }

        .avatar-wrapper {
          width: 240px;
          height: 240px;
          margin: 0 auto 20px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #7c65b5;
          box-shadow: 0 8px 32px rgba(124, 101, 181, 0.2);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e8e4f7 0%, #ddd8f0 100%);
          font-size: 64px;
          font-weight: 900;
          color: #7c65b5;
        }

        .profile-name {
          font-size: 26px;
          font-weight: 900;
          color: #2d1f3e;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .profile-crp {
          font-size: 14px;
          color: #9b8fab;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .quick-tag {
          padding: 6px 12px;
          background: rgba(124, 101, 181, 0.08);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6b5d7a;
        }

        .price-section {
          padding: 24px;
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.05) 0%, rgba(169, 150, 221, 0.05) 100%);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .price-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
        }

        .price-label {
          font-size: 13px;
          color: #9b8fab;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .price-value {
          font-size: 36px;
          font-weight: 900;
          color: #7c65b5;
        }

        .btn-schedule-main {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.25);
        }

        .btn-schedule-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(124, 101, 181, 0.4);
        }

        .affinity-section {
          padding-top: 24px;
          border-top: 2px solid rgba(124, 101, 181, 0.08);
        }

        .affinity-section h4 {
          font-size: 14px;
          font-weight: 700;
          color: #2d1f3e;
          margin-bottom: 16px;
        }

        .affinity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .affinity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .affinity-label {
          font-size: 13px;
          color: #9b8fab;
          font-weight: 600;
        }

        .affinity-value {
          font-size: 13px;
          color: #2d1f3e;
          font-weight: 700;
        }

        .profile-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          border: 2px solid rgba(124, 101, 181, 0.08);
        }

        .card-title {
          font-size: 22px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
        }

        .bio-text {
          font-size: 16px;
          line-height: 1.8;
          color: #2d1f3e;
          white-space: pre-wrap;
        }

        .tags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .tag-item-large {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(124, 101, 181, 0.05);
          border: 2px solid rgba(124, 101, 181, 0.1);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #2d1f3e;
          transition: all 0.2s ease;
        }

        .tag-item-large:hover {
          background: rgba(124, 101, 181, 0.1);
          border-color: #7c65b5;
          transform: translateX(4px);
        }

        .tag-item-large svg {
          color: #7c65b5;
          flex-shrink: 0;
        }

        .tag-item-large.approach {
          background: rgba(59, 130, 246, 0.05);
          border-color: rgba(59, 130, 246, 0.1);
        }

        .tag-item-large.approach:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
        }

        .tag-item-large.approach svg {
          color: #3b82f6;
        }

        .audience-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .audience-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.05) 0%, rgba(169, 150, 221, 0.05) 100%);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #2d1f3e;
        }

        .audience-icon {
          font-size: 24px;
        }

        .education-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .education-item {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: rgba(124, 101, 181, 0.03);
          border-left: 4px solid #7c65b5;
          border-radius: 12px;
        }

        .education-year {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
        }

        .education-details h4 {
          font-size: 16px;
          font-weight: 700;
          color: #2d1f3e;
          line-height: 1.5;
        }

        .cta-card {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          border-radius: 20px;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          box-shadow: 0 8px 32px rgba(124, 101, 181, 0.3);
        }

        .cta-content h3 {
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
        }

        .cta-content p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        .btn-schedule-cta {
          padding: 16px 32px;
          background: white;
          color: #7c65b5;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .btn-schedule-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .profile-sidebar {
            position: static;
          }

          .avatar-wrapper {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 640px) {
          .profile-header {
            padding: 80px 16px 16px;
          }

          .profile-main {
            padding: 24px 16px 60px;
          }

          .avatar-card {
            padding: 24px;
          }

          .content-card {
            padding: 24px;
          }

          .card-title {
            font-size: 18px;
          }

          .tags-grid {
            grid-template-columns: 1fr;
          }

          .cta-card {
            flex-direction: column;
            text-align: center;
            padding: 32px 24px;
          }

          .btn-schedule-cta {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}