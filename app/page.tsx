// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'

interface Psychologist {
  id: string
  user_id: string
  crp: string
  specialties: string[]
  approach: string | null
  price_per_session: number
  rating: number
  total_reviews: number
  bio: string | null
  profile: {
    full_name: string
    avatar_url: string | null
  }
}

interface Filters {
  search: string
  reason: string
  gender: string
  priceRange: [number, number]
  approach: string
}

export default function HomePage() {
  const supabase = createClient()
  const [psychologists, setPsychologists] = useState<Psychologist[]>([])
  const [filteredPsychologists, setFilteredPsychologists] = useState<Psychologist[]>([])
  const [loading, setLoading] = useState(true)
  const [reasonFilterOpen, setReasonFilterOpen] = useState(false)
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState('relevant')
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    reason: '',
    gender: '',
    priceRange: [0, 500],
    approach: ''
  })

  const reasons = [
    'Ansiedade',
    'Depressão',
    'Relacionamentos',
    'Autoestima',
    'Estresse',
    'Luto',
    'TDAH',
    'Autismo',
    'Traumas'
  ]

  const approaches = [
    'TCC',
    'Psicanálise',
    'Humanista',
    'Gestalt',
    'ACT',
    'DBT'
  ]

  useEffect(() => {
    loadPsychologists()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, sortBy, psychologists])

  const loadPsychologists = async () => {
    try {
      setLoading(true)

      // Buscar todos os psicólogos
      const { data: psychData, error: psychError } = await supabase
        .from('psychologists')
        .select('*')
        .order('rating', { ascending: false })

      if (psychError) throw psychError
      if (!psychData || psychData.length === 0) {
        setPsychologists([])
        setFilteredPsychologists([])
        return
      }

      // Buscar perfis dos psicólogos
      const psychologistsWithProfiles = await Promise.all(
        psychData.map(async (psych) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', psych.user_id)
            .single()

          return {
            ...psych,
            profile: {
              full_name: profileData?.full_name || 'Psicólogo',
              avatar_url: profileData?.avatar_url || null
            }
          }
        })
      )

      setPsychologists(psychologistsWithProfiles)
      setFilteredPsychologists(psychologistsWithProfiles)
    } catch (error) {
      console.error('Erro ao carregar psicólogos:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...psychologists]

    if (filters.search) {
      filtered = filtered.filter(p => 
        p.profile.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.specialties?.some(s => s.toLowerCase().includes(filters.search.toLowerCase()))
      )
    }

    if (filters.reason) {
      filtered = filtered.filter(p => 
        p.specialties?.some(s => s.toLowerCase().includes(filters.reason.toLowerCase()))
      )
    }

    filtered = filtered.filter(p => 
      p.price_per_session >= filters.priceRange[0] && 
      p.price_per_session <= filters.priceRange[1]
    )

    if (filters.approach) {
      filtered = filtered.filter(p => 
        p.approach?.toLowerCase().includes(filters.approach.toLowerCase())
      )
    }

    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price_per_session - b.price_per_session)
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price_per_session - a.price_per_session)
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    setFilteredPsychologists(filtered)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      reason: '',
      gender: '',
      priceRange: [0, 500],
      approach: ''
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.reason) count++
    if (filters.gender) count++
    if (filters.approach) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++
    return count
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <section className="hero">
        <div className="hero-container">
          <h1 className="hero-title">
            Encontre o psicólogo ideal para você
          </h1>
          <p className="hero-subtitle">
            Profissionais qualificados especializados em TCC, neurociência e bem-estar emocional
          </p>

          <div className="search-bar">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Busque por nome ou especialidade..."
                className="search-input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <button 
              className={`filter-button ${filters.reason ? 'active' : ''}`}
              onClick={() => setReasonFilterOpen(!reasonFilterOpen)}
            >
              <span>Motivo</span>
              {filters.reason && <span className="filter-badge">1</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <button 
              className={`filter-button ${getActiveFiltersCount() > 0 ? 'active' : ''}`}
              onClick={() => setAdvancedFilterOpen(!advancedFilterOpen)}
            >
              <span>Mais Filtros</span>
              {getActiveFiltersCount() > 0 && (
                <span className="filter-badge">{getActiveFiltersCount()}</span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
          </div>

          {reasonFilterOpen && (
            <div className="filter-modal-overlay" onClick={() => setReasonFilterOpen(false)}>
              <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
                <div className="filter-modal-header">
                  <h3>Motivo da Terapia</h3>
                  <button onClick={() => setReasonFilterOpen(false)}>✕</button>
                </div>
                <div className="filter-modal-content">
                  <div className="filter-options-grid">
                    {reasons.map(reason => (
                      <button
                        key={reason}
                        className={`filter-option ${filters.reason === reason ? 'selected' : ''}`}
                        onClick={() => {
                          setFilters({ ...filters, reason: filters.reason === reason ? '' : reason })
                          setReasonFilterOpen(false)
                        }}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {advancedFilterOpen && (
            <div className="filter-modal-overlay" onClick={() => setAdvancedFilterOpen(false)}>
              <div className="filter-modal advanced" onClick={(e) => e.stopPropagation()}>
                <div className="filter-modal-header">
                  <h3>Filtros Avançados</h3>
                  <button onClick={() => setAdvancedFilterOpen(false)}>✕</button>
                </div>
                <div className="filter-modal-content">
                  
                  <div className="filter-group">
                    <label>Preço por Sessão</label>
                    <div className="price-range">
                      <span>R$ {filters.priceRange[0]}</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters({ 
                          ...filters, 
                          priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
                        })}
                      />
                      <span>R$ {filters.priceRange[1]}</span>
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Abordagem Terapêutica</label>
                    <div className="filter-options-grid">
                      {approaches.map(approach => (
                        <button
                          key={approach}
                          className={`filter-option ${filters.approach === approach ? 'selected' : ''}`}
                          onClick={() => setFilters({ ...filters, approach: filters.approach === approach ? '' : approach })}
                        >
                          {approach}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-modal-footer">
                    <button className="btn-clear" onClick={clearFilters}>
                      Limpar Filtros
                    </button>
                    <button className="btn-apply" onClick={() => setAdvancedFilterOpen(false)}>
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="results">
        <div className="results-container">
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando psicólogos...</p>
            </div>
          ) : (
            <>
              <div className="results-header">
                <div className="results-count">
                  <strong>{filteredPsychologists.length}</strong> {filteredPsychologists.length === 1 ? 'psicólogo encontrado' : 'psicólogos encontrados'}
                </div>
                
                <div className="results-sort">
                  <label>Ordenar por:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="relevant">Mais Relevantes</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="rating">Melhor Avaliação</option>
                  </select>
                </div>
              </div>

              {filteredPsychologists.length === 0 ? (
                <div className="no-results">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <h3>Nenhum psicólogo encontrado</h3>
                  <p>Tente ajustar os filtros de busca ou aguarde novos cadastros</p>
                  {(filters.search || filters.reason || filters.approach || filters.priceRange[1] < 500) && (
                    <button className="btn-clear-filters" onClick={clearFilters}>
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="psychologists-grid">
                  {filteredPsychologists.map(psychologist => (
                    <div key={psychologist.id} className="psychologist-card">
                      <div className="card-image">
                        {psychologist.profile.avatar_url ? (
                          <img src={psychologist.profile.avatar_url} alt={psychologist.profile.full_name} />
                        ) : (
                          <div className="card-image-placeholder">
                            {getInitials(psychologist.profile.full_name)}
                          </div>
                        )}
                      </div>
                      
                      <div className="card-content">
                        <h3 className="card-name">{psychologist.profile.full_name}</h3>
                        <p className="card-crp">CRP {psychologist.crp}</p>
                        
                        {psychologist.specialties && psychologist.specialties.length > 0 && (
                          <div className="card-specialties">
                            {psychologist.specialties.slice(0, 3).map((specialty, idx) => (
                              <span key={idx} className="specialty-tag">{specialty}</span>
                            ))}
                            {psychologist.specialties.length > 3 && (
                              <span className="specialty-tag more">+{psychologist.specialties.length - 3}</span>
                            )}
                          </div>
                        )}

                        {psychologist.approach && (
                          <p className="card-approach">Abordagem: {psychologist.approach}</p>
                        )}
                        
                        {psychologist.bio && (
                          <p className="card-bio">{psychologist.bio.slice(0, 100)}...</p>
                        )}

                        {psychologist.rating > 0 && (
                          <div className="card-rating">
                            ⭐ {psychologist.rating.toFixed(1)} ({psychologist.total_reviews} {psychologist.total_reviews === 1 ? 'avaliação' : 'avaliações'})
                          </div>
                        )}
                        
                        <div className="card-footer">
                          <div className="card-price">
                            <span className="price-label">A partir de</span>
                            <span className="price-value">R$ {psychologist.price_per_session.toFixed(2)}</span>
                          </div>
                          
                          <Link href={`/psicologo/${psychologist.id}`} className="btn-schedule">
                            Ver Perfil
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
          padding: 120px 24px 60px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(124, 101, 181, 0.06) 0%, transparent 70%);
          top: -300px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        .hero-container {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: 42px;
          font-weight: 800;
          color: #2d1f3e;
          text-align: center;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 18px;
          color: #6b5d7a;
          text-align: center;
          margin-bottom: 40px;
          font-weight: 400;
        }

        .search-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9b8fab;
        }

        .search-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          font-size: 15px;
          background: white;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #7c65b5;
          box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.1);
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          background: white;
          font-size: 15px;
          font-weight: 500;
          color: #2d1f3e;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .filter-button:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
        }

        .filter-button.active {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
        }

        .filter-badge {
          background: #7c65b5;
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .filter-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .filter-modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        .filter-modal.advanced {
          max-width: 700px;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(124, 101, 181, 0.1);
        }

        .filter-modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d1f3e;
          margin: 0;
        }

        .filter-modal-header button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(124, 101, 181, 0.08);
          color: #2d1f3e;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-modal-header button:hover {
          background: rgba(124, 101, 181, 0.15);
        }

        .filter-modal-content {
          padding: 24px;
          overflow-y: auto;
        }

        .filter-group {
          margin-bottom: 28px;
        }

        .filter-group:last-child {
          margin-bottom: 0;
        }

        .filter-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #2d1f3e;
          margin-bottom: 12px;
        }

        .filter-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }

        .filter-option {
          padding: 10px 16px;
          border-radius: 10px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          background: white;
          font-size: 14px;
          font-weight: 500;
          color: #2d1f3e;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .filter-option:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
        }

        .filter-option.selected {
          border-color: #7c65b5;
          background: #7c65b5;
          color: white;
        }

        .price-range {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .price-range span {
          font-size: 14px;
          font-weight: 600;
          color: #7c65b5;
          min-width: 60px;
        }

        .price-range input[type="range"] {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: rgba(124, 101, 181, 0.15);
          outline: none;
        }

        .price-range input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #7c65b5;
          cursor: pointer;
        }

        .filter-modal-footer {
          display: flex;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid rgba(124, 101, 181, 0.1);
        }

        .btn-clear {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 2px solid rgba(124, 101, 181, 0.2);
          background: white;
          font-size: 15px;
          font-weight: 600;
          color: #6b5d7a;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear:hover {
          border-color: #7c65b5;
          color: #7c65b5;
        }

        .btn-apply {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          font-size: 15px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-apply:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
        }

        .results {
          padding: 60px 24px;
          background: #faf9fc;
        }

        .results-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading {
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

        .loading p {
          color: #6b5d7a;
          font-size: 16px;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .results-count {
          font-size: 18px;
          color: #6b5d7a;
        }

        .results-count strong {
          color: #2d1f3e;
          font-weight: 700;
        }

        .results-sort {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .results-sort label {
          font-size: 14px;
          color: #6b5d7a;
          font-weight: 500;
        }

        .results-sort select {
          padding: 8px 32px 8px 12px;
          border-radius: 8px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          background: white;
          font-size: 14px;
          font-weight: 500;
          color: #2d1f3e;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b5d7a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .results-sort select:focus {
          outline: none;
          border-color: #7c65b5;
        }

        .no-results {
          text-align: center;
          padding: 80px 20px;
        }

        .no-results svg {
          color: #9b8fab;
          margin-bottom: 20px;
        }

        .no-results h3 {
          font-size: 24px;
          color: #2d1f3e;
          margin-bottom: 8px;
        }

        .no-results p {
          color: #6b5d7a;
          font-size: 16px;
          margin-bottom: 24px;
        }

        .btn-clear-filters {
          padding: 12px 28px;
          border-radius: 10px;
          border: 2px solid #7c65b5;
          background: white;
          color: #7c65b5;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-clear-filters:hover {
          background: #7c65b5;
          color: white;
        }

        .psychologists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .psychologist-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
          transition: all 0.3s ease;
          border: 1px solid rgba(124, 101, 181, 0.08);
        }

        .psychologist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px rgba(124, 101, 181, 0.15);
        }

        .card-image {
          height: 200px;
          background: linear-gradient(135deg, #e8e4f7 0%, #ddd8f0 100%);
          position: relative;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: #7c65b5;
        }

        .card-content {
          padding: 20px;
        }

        .card-name {
          font-size: 18px;
          font-weight: 700;
          color: #2d1f3e;
          margin-bottom: 4px;
        }

        .card-crp {
          font-size: 13px;
          color: #9b8fab;
          margin-bottom: 12px;
        }

        .card-specialties {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .specialty-tag {
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          font-size: 12px;
          font-weight: 600;
        }

        .specialty-tag.more {
          background: rgba(124, 101, 181, 0.2);
        }

        .card-approach {
          font-size: 13px;
          color: #6b5d7a;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .card-bio {
          font-size: 14px;
          color: #6b5d7a;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .card-rating {
          font-size: 13px;
          color: #f59e0b;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(124, 101, 181, 0.1);
        }

        .card-price {
          display: flex;
          flex-direction: column;
        }

        .price-label {
          font-size: 12px;
          color: #9b8fab;
          margin-bottom: 2px;
        }

        .price-value {
          font-size: 20px;
          font-weight: 700;
          color: #7c65b5;
        }

        .btn-schedule {
          padding: 10px 20px;
          border-radius: 8px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-schedule:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 101, 181, 0.3);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 100px 16px 40px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .search-bar {
            flex-direction: column;
          }

          .search-input-wrapper {
            width: 100%;
            min-width: auto;
          }

          .filter-button {
            width: 100%;
            justify-content: center;
          }

          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .psychologists-grid {
            grid-template-columns: 1fr;
          }

          .filter-modal {
            max-width: 100%;
            max-height: 90vh;
          }

          .filter-options-grid {
            grid-template-columns: 1fr;
          }

          .filter-modal-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}