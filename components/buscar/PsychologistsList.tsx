'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
      <section className="results-section">
        <div className="results-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando psicólogos...</p>
          </div>
        </div>

        <style jsx>{`
          .results-section {
            padding: 40px 24px 80px;
            background: #fafafa;
            min-height: 60vh;
          }

          .results-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .loading-state {
            text-align: center;
            padding: 80px 20px;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(124, 101, 181, 0.1);
            border-top-color: #7c65b5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-state p {
            color: #6b5d7a;
            font-size: 16px;
            font-weight: 500;
          }
        `}</style>
      </section>
    )
  }

  return (
    <>
      <section className="results-section">
        <div className="results-container">
          
          {/* Header com contador e ordenação */}
          <div className="results-header">
            <div className="results-count">
              Encontramos <strong>{psychologists.length}</strong> {psychologists.length === 1 ? 'psicólogo' : 'psicólogos'}
            </div>
            
            <div className="results-sort">
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
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>Nenhum psicólogo encontrado</h3>
              <p>Tente ajustar os filtros de busca para encontrar mais profissionais</p>
            </div>
          ) : (
            <div className="psychologists-grid">
              {psychologists.map(psychologist => (
                <Link 
                  key={psychologist.id} 
                  href={`/buscar/${psychologist.id}`}
                  className="psychologist-card"
                >
                  {/* CABEÇALHO DO CARD - Avatar + Info Básica */}
                  <div className="card-header">
                    <div className="card-avatar">
                      {psychologist.plan_type === 'premium' && (
                        <div className="premium-badge">💎</div>
                      )}
                      {psychologist.profile.avatar_url ? (
                        <Image 
                          src={psychologist.profile.avatar_url} 
                          alt={psychologist.profile.full_name}
                          width={80}
                          height={80}
                          className="avatar-img"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(psychologist.profile.full_name)}
                        </div>
                      )}
                    </div>

                    <div className="card-info">
                      <h3 className="card-name">{psychologist.profile.full_name}</h3>
                      <p className="card-crp">CRP {psychologist.crp}</p>
                      
                      {/* Tags inline - Modalidade + Duração */}
                      <div className="card-tags">
                        {psychologist.modality?.map((mod, idx) => (
                          <span key={idx} className="tag">
                            {mod === 'online' && '💻'}
                            {mod === 'presencial' && '🏢'}
                            {mod === 'hibrido' && '🔄'}
                          </span>
                        ))}
                        <span className="tag">⏱️ {psychologist.session_duration}min</span>
                      </div>
                    </div>
                  </div>

                  {/* ESPECIALIDADES */}
                  {psychologist.specialties && psychologist.specialties.length > 0 && (
                    <div className="card-specialties">
                      {psychologist.specialties.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="specialty-chip">{specialty}</span>
                      ))}
                      {psychologist.specialties.length > 3 && (
                        <span className="specialty-chip more">+{psychologist.specialties.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* BIO RESUMIDA */}
                  {psychologist.short_bio && (
                    <p className="card-bio">{psychologist.short_bio}</p>
                  )}

                  {/* ABORDAGENS */}
                  {psychologist.approaches && psychologist.approaches.length > 0 && (
                    <p className="card-approaches">
                      {psychologist.approaches.slice(0, 2).join(' • ')}
                      {psychologist.approaches.length > 2 && '...'}
                    </p>
                  )}

                  {/* FOOTER - Preço + Botão */}
                  <div className="card-footer">
                    <div className="card-price">
                      <span className="price-label">Sessão</span>
                      <span className="price-value">R$ {psychologist.price_per_session.toFixed(2)}</span>
                    </div>
                    
                    <button className="btn-view">
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

      <style jsx>{`
        .results-section {
          padding: 40px 24px 80px;
          background: #fafafa;
          min-height: 60vh;
        }

        .results-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* HEADER */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .results-count {
          font-size: 17px;
          color: #6b5d7a;
          font-weight: 500;
        }

        .results-count strong {
          color: #2d1f3e;
          font-weight: 800;
          font-size: 18px;
        }

        .results-sort {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .results-sort label {
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 600;
        }

        .results-sort select {
          padding: 10px 36px 10px 14px;
          border-radius: 10px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          background: white;
          font-size: 14px;
          font-weight: 600;
          color: #2d1f3e;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b5d7a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .results-sort select:focus {
          outline: none;
          border-color: #7c65b5;
        }

        .results-sort select:hover {
          border-color: #7c65b5;
        }

        /* EMPTY STATE */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 16px;
          border: 2px dashed rgba(124, 101, 181, 0.2);
        }

        .empty-state svg {
          color: #9b8fab;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 24px;
          font-weight: 800;
          color: #2d1f3e;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6b5d7a;
          font-size: 16px;
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        }

        /* GRID DE PSICÓLOGOS */
        .psychologists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        .psychologist-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(124, 101, 181, 0.08);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .psychologist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(124, 101, 181, 0.2);
          border-color: #7c65b5;
        }

        /* HEADER DO CARD */
        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .card-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .premium-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
          z-index: 10;
        }

        .avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(124, 101, 181, 0.1);
        }

        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: white;
          border: 3px solid rgba(124, 101, 181, 0.2);
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-name {
          font-size: 19px;
          font-weight: 800;
          color: #2d1f3e;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .card-crp {
          font-size: 13px;
          color: #9b8fab;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          padding: 4px 8px;
          background: rgba(124, 101, 181, 0.08);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #6b5d7a;
        }

        /* ESPECIALIDADES */
        .card-specialties {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .specialty-chip {
          padding: 6px 12px;
          border-radius: 6px;
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
        }

        .specialty-chip.more {
          background: rgba(124, 101, 181, 0.2);
        }

        /* BIO */
        .card-bio {
          font-size: 14px;
          color: #6b5d7a;
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ABORDAGENS */
        .card-approaches {
          font-size: 13px;
          color: #6b5d7a;
          margin: 0;
          font-weight: 500;
        }

        /* FOOTER */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 2px solid rgba(124, 101, 181, 0.08);
          margin-top: auto;
        }

        .card-price {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .price-label {
          font-size: 12px;
          color: #9b8fab;
          font-weight: 600;
        }

        .price-value {
          font-size: 22px;
          font-weight: 900;
          color: #7c65b5;
          line-height: 1;
        }

        .btn-view {
          padding: 10px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .btn-view svg {
          transition: transform 0.3s ease;
        }

        .psychologist-card:hover .btn-view {
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.4);
        }

        .psychologist-card:hover .btn-view svg {
          transform: translateX(3px);
        }

        /* RESPONSIVIDADE */
        @media (max-width: 768px) {
          .results-section {
            padding: 30px 16px 60px;
          }

          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .psychologists-grid {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .card-info {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .card-tags {
            justify-content: center;
          }

          .card-footer {
            flex-direction: column;
            gap: 12px;
          }

          .btn-view {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 400px) {
          .card-name {
            font-size: 17px;
          }

          .price-value {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  )
}