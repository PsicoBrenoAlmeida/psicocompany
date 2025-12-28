'use client'

import { useState } from 'react'

interface SearchFiltersProps {
  filters: {
    search: string
    specialty: string
    approach: string
    modality: string
    ageGroup: string
    priceRange: [number, number]
    gender: string
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

export default function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const [specialtyFilterOpen, setSpecialtyFilterOpen] = useState(false)
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false)
  const [specialtySearch, setSpecialtySearch] = useState('')

  // TODAS as especialidades
  const specialtiesList = [
    'Ansiedade e Crises de Pânico',
    'Depressão e Desmotivação',
    'Estresse e Síndrome de Burnout',
    'TDAH (Déficit de Atenção e Hiperatividade)',
    'Transtorno Bipolar (TAB)',
    'TOC (Transtorno Obsessivo-Compulsivo)',
    'Fobias e Medos Intensos',
    'Transtornos Alimentares',
    'Dependências (Química, Jogos, Internet)',
    'Transtorno de Estresse Pós-Traumático (TEPT)',
    'Autismo (TEA)',
    'Trauma e Abuso',
    'Conflitos Amorosos (Namoro, casamento)',
    'Separação, Divórcio e Recomeços',
    'Conflitos Familiares (Pais, Filhos, Irmãos)',
    'Dependência Emocional e Codependência',
    'Relacionamentos Abusivos ou Tóxicos',
    'Habilidades Sociais e Comunicação',
    'Orientação Sexual e Identidade de Gênero',
    'Bullying, Assédio e Violência',
    'Saúde Mental na Imigração/Adaptação Cultural',
    'Infância e Adolescência (Foco)',
    'Gestação, Maternidade e Paternidade',
    'Autoconhecimento e Propósito de Vida',
    'Autoestima e Autoconfiança',
    'Procrastinação e Organização',
    'Estresse no Trabalho e Carreira',
    'Orientação Profissional e de Carreira',
    'Dificuldades de Sono e Insônia',
    'Autocobrança e Perfeccionismo',
    'Luto e Perdas (Morte, Emprego, etc.)',
    'Regulação Emocional e Controle de Impulsos',
    'Espiritualidade e Existencialismo',
    'Imagem Corporal e Autoaceitação',
    'Suporte em Doenças Crônicas e Dor'
  ]

  // TODAS as abordagens
  const approachesList = [
    'TCC (Terapia Cognitivo-Comportamental)',
    'ACT (Terapia de Aceitação e Compromisso)',
    'DBT (Terapia Comportamental Dialética)',
    'FAP (Terapia Analítica Funcional)',
    'Terapia do Esquema',
    'Psicanálise / Psicodinâmica',
    'Psicologia Analítica (Junguiana)',
    'Análise do Comportamento',
    'Terapia Sistêmica / Familiar',
    'Terapia Humanista',
    'Fenomenológica / Existencial',
    'Gestalt-Terapia',
    'EMDR (para Trauma)',
    'Terapia Breve',
    'Mindfulness e Compaixão',
    'Terapia Integrativa',
    'Neuropsicologia Clínica',
    'Arteterapia',
    'Hipnoterapia',
    'Psicodrama'
  ]

  const modalitiesList = ['Online', 'Presencial', 'Híbrido']

  // ATUALIZADO: Adultos e Idosos separados
  const ageGroupsList = [
    'Crianças (0-12 anos)',
    'Adolescentes (13-17 anos)',
    'Adultos (18-59 anos)',
    'Idosos (60+ anos)',
    'Casais',
    'Famílias'
  ]

  const gendersList = ['Feminino', 'Masculino', 'Não-binário']

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.specialty) count++
    if (filters.approach) count++
    if (filters.modality) count++
    if (filters.ageGroup) count++
    if (filters.gender) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++
    return count
  }

  const filteredSpecialties = specialtiesList.filter(spec => 
    spec.toLowerCase().includes(specialtySearch.toLowerCase())
  )

  return (
    <>
      <section className="search-hero">
        <div className="search-container">
          <div className="hero-content">
            <div className="title-section">
              <h1 className="search-title">
                Encontre o psicólogo <span className="gradient-text">ideal</span> para você
              </h1>
              <p className="search-subtitle">
                Profissionais qualificados especializados em diversas áreas da psicologia
              </p>
            </div>

            <div className="search-box-wrapper">
              <div className="search-bar">
                <div className="search-input-wrapper">
                  <svg className="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Busque por nome, especialidade ou abordagem..."
                    className="search-input"
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  />
                  {filters.search && (
                    <button 
                      className="clear-search"
                      onClick={() => onFiltersChange({ ...filters, search: '' })}
                      aria-label="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button 
                  className={`filter-btn ${filters.specialty ? 'active' : ''}`}
                  onClick={() => setSpecialtyFilterOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <span>Especialidade</span>
                  {filters.specialty && <span className="filter-count">1</span>}
                </button>

                <button 
                  className={`filter-btn ${getActiveFiltersCount() > 0 ? 'active' : ''}`}
                  onClick={() => setAdvancedFilterOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>Mais Filtros</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="filter-count">{getActiveFiltersCount()}</span>
                  )}
                </button>
              </div>

              {/* Tags de Filtros Ativos */}
              {(filters.specialty || filters.approach || filters.modality || filters.ageGroup || filters.gender) && (
                <div className="active-filters">
                  {filters.specialty && (
                    <div className="filter-tag">
                      <span className="filter-tag-icon">🎯</span>
                      {filters.specialty}
                      <button onClick={() => onFiltersChange({ ...filters, specialty: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.approach && (
                    <div className="filter-tag">
                      <span className="filter-tag-icon">🧠</span>
                      {filters.approach}
                      <button onClick={() => onFiltersChange({ ...filters, approach: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.modality && (
                    <div className="filter-tag">
                      <span className="filter-tag-icon">
                        {filters.modality === 'Online' && '💻'}
                        {filters.modality === 'Presencial' && '🏢'}
                        {filters.modality === 'Híbrido' && '🔄'}
                      </span>
                      {filters.modality}
                      <button onClick={() => onFiltersChange({ ...filters, modality: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.ageGroup && (
                    <div className="filter-tag">
                      <span className="filter-tag-icon">👥</span>
                      {filters.ageGroup}
                      <button onClick={() => onFiltersChange({ ...filters, ageGroup: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.gender && (
                    <div className="filter-tag">
                      <span className="filter-tag-icon">⚧</span>
                      {filters.gender}
                      <button onClick={() => onFiltersChange({ ...filters, gender: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  <button className="clear-all-btn" onClick={onClearFilters}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                    Limpar todos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="decorative-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </section>

      {/* MODAL DE ESPECIALIDADES */}
      {specialtyFilterOpen && (
        <div className="modal-overlay" onClick={() => setSpecialtyFilterOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <span className="modal-icon">🎯</span>
                <h3>Selecione uma Especialidade</h3>
              </div>
              <button className="modal-close" onClick={() => setSpecialtyFilterOpen(false)} aria-label="Fechar modal">
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-search">
                <svg className="search-icon-small" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar especialidade..." 
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                />
              </div>

              <div className="options-list">
                {filteredSpecialties.length > 0 ? (
                  filteredSpecialties.map(specialty => (
                    <button
                      key={specialty}
                      className={`option-item ${filters.specialty === specialty ? 'selected' : ''}`}
                      onClick={() => {
                        onFiltersChange({ ...filters, specialty: filters.specialty === specialty ? '' : specialty })
                        setSpecialtyFilterOpen(false)
                        setSpecialtySearch('')
                      }}
                    >
                      <span className="option-text">{specialty}</span>
                      {filters.specialty === specialty && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="empty-search">
                    <span className="empty-icon">🔍</span>
                    <p>Nenhuma especialidade encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FILTROS AVANÇADOS */}
      {advancedFilterOpen && (
        <div className="modal-overlay" onClick={() => setAdvancedFilterOpen(false)}>
          <div className="modal-content advanced" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <span className="modal-icon">⚙️</span>
                <h3>Filtros Avançados</h3>
              </div>
              <button className="modal-close" onClick={() => setAdvancedFilterOpen(false)} aria-label="Fechar modal">
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              
              {/* Abordagem Terapêutica */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="section-icon">🧠</span>
                  <label className="filter-label">Abordagem Terapêutica</label>
                </div>
                <div className="options-grid">
                  {approachesList.map(approach => (
                    <button
                      key={approach}
                      className={`option-chip ${filters.approach === approach ? 'selected' : ''}`}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        approach: filters.approach === approach ? '' : approach 
                      })}
                    >
                      {approach}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modalidade de Atendimento */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="section-icon">📍</span>
                  <label className="filter-label">Modalidade de Atendimento</label>
                </div>
                <div className="options-row">
                  {modalitiesList.map(modality => (
                    <button
                      key={modality}
                      className={`option-chip ${filters.modality === modality ? 'selected' : ''}`}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        modality: filters.modality === modality ? '' : modality 
                      })}
                    >
                      {modality === 'Online' && '💻 '}
                      {modality === 'Presencial' && '🏢 '}
                      {modality === 'Híbrido' && '🔄 '}
                      {modality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atende */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="section-icon">👥</span>
                  <label className="filter-label">Atende</label>
                </div>
                <div className="options-grid">
                  {ageGroupsList.map(age => (
                    <button
                      key={age}
                      className={`option-chip ${filters.ageGroup === age ? 'selected' : ''}`}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        ageGroup: filters.ageGroup === age ? '' : age 
                      })}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor por Sessão */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="section-icon">💰</span>
                  <label className="filter-label">Valor por Sessão</label>
                </div>
                <div className="price-filter">
                  <div className="price-inputs">
                    <div className="price-input-group">
                      <label>Mínimo</label>
                      <div className="input-with-prefix">
                        <span className="prefix">R$</span>
                        <input
                          type="number"
                          value={filters.priceRange[0]}
                          onChange={(e) => onFiltersChange({ 
                            ...filters, 
                            priceRange: [parseInt(e.target.value) || 0, filters.priceRange[1]] 
                          })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <span className="price-divider">—</span>
                    <div className="price-input-group">
                      <label>Máximo</label>
                      <div className="input-with-prefix">
                        <span className="prefix">R$</span>
                        <input
                          type="number"
                          value={filters.priceRange[1]}
                          onChange={(e) => onFiltersChange({ 
                            ...filters, 
                            priceRange: [filters.priceRange[0], parseInt(e.target.value) || 500] 
                          })}
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={filters.priceRange[1]}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
                    })}
                    className="price-slider"
                  />
                  <div className="price-display">
                    <span className="price-badge">R$ {filters.priceRange[0]}</span>
                    <span className="price-separator">até</span>
                    <span className="price-badge">R$ {filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Gênero do Profissional */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="section-icon">⚧</span>
                  <label className="filter-label">Gênero do Profissional</label>
                </div>
                <div className="options-row">
                  {gendersList.map(gender => (
                    <button
                      key={gender}
                      className={`option-chip ${filters.gender === gender ? 'selected' : ''}`}
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        gender: filters.gender === gender ? '' : gender 
                      })}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClearFilters}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
                Limpar Tudo
              </button>
              <button className="btn-primary" onClick={() => setAdvancedFilterOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ===== HERO SECTION ===== */
        .search-hero {
          background: linear-gradient(135deg, #f8f6fc 0%, #f0ecf9 50%, #e8e3f5 100%);
          padding: 140px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        .decorative-shapes {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.08;
          filter: blur(60px);
        }

        .shape-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #7c65b5, #a996dd);
          top: -250px;
          right: -100px;
          animation: float1 25s ease-in-out infinite;
        }

        .shape-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #a996dd, #7c65b5);
          bottom: -200px;
          left: -150px;
          animation: float2 20s ease-in-out infinite;
        }

        .shape-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #7c65b5, #a996dd);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float3 30s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-40px, -40px) rotate(180deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        .search-container {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .title-section {
          text-align: center;
          animation: fadeInUp 0.8s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-title {
          font-size: 56px;
          font-weight: 900;
          color: #2d1f3e;
          margin-bottom: 16px;
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 50%, #c9b8e8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
        }

        .search-subtitle {
          font-size: 20px;
          color: #6b5d7a;
          font-weight: 400;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-box-wrapper {
          animation: fadeInUp 0.8s ease 0.2s backwards;
        }

        /* ===== BARRA DE BUSCA ===== */
        .search-bar {
          display: flex;
          gap: 12px;
          align-items: stretch;
          flex-wrap: wrap;
          background: white;
          padding: 12px;
          border-radius: 16px;
          box-shadow: 
            0 8px 32px rgba(124, 101, 181, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #9b8fab;
          pointer-events: none;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 16px 50px 16px 54px;
          border-radius: 12px;
          border: 2px solid transparent;
          font-size: 16px;
          background: #f8f7fb;
          transition: all 0.3s ease;
          font-family: inherit;
          color: #2d1f3e;
          font-weight: 500;
        }

        .search-input:focus {
          outline: none;
          border-color: #7c65b5;
          background: white;
          box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.08);
        }

        .search-input::placeholder {
          color: #9b8fab;
        }

        .clear-search {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .clear-search:hover {
          background: #7c65b5;
          color: white;
          transform: translateY(-50%) rotate(90deg);
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 22px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: #f8f7fb;
          font-size: 15px;
          font-weight: 700;
          color: #2d1f3e;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-family: inherit;
        }

        .filter-btn:hover {
          border-color: #7c65b5;
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.15);
        }

        .filter-btn.active {
          border-color: #7c65b5;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
        }

        .filter-count {
          background: white;
          color: #7c65b5;
          font-size: 12px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          min-width: 22px;
          text-align: center;
          line-height: 1;
        }

        .filter-btn.active .filter-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }

        /* ===== FILTROS ATIVOS ===== */
        .active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          border: 2px solid rgba(124, 101, 181, 0.1);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.06);
        }

        .filter-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(124, 101, 181, 0.08), rgba(169, 150, 221, 0.08));
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #7c65b5;
          border: 2px solid rgba(124, 101, 181, 0.15);
        }

        .filter-tag-icon {
          font-size: 16px;
          line-height: 1;
        }

        .filter-tag button {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(124, 101, 181, 0.15);
          color: #7c65b5;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: 700;
        }

        .filter-tag button:hover {
          background: #7c65b5;
          color: white;
          transform: rotate(90deg);
        }

        .clear-all-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 2px solid rgba(124, 101, 181, 0.2);
          background: white;
          font-size: 14px;
          font-weight: 700;
          color: #7c65b5;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .clear-all-btn:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
          transform: translateY(-2px);
        }

        /* ===== MODAIS ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
          backdrop-filter: blur(8px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 650px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 
            0 24px 80px rgba(0, 0, 0, 0.25),
            0 0 1px rgba(0, 0, 0, 0.2);
        }

        .modal-content.advanced {
          max-width: 900px;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 32px;
          border-bottom: 2px solid rgba(124, 101, 181, 0.1);
          background: linear-gradient(135deg, #f8f7fb 0%, #ffffff 100%);
        }

        .modal-header-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .modal-icon {
          font-size: 28px;
          line-height: 1;
        }

        .modal-header h3 {
          font-size: 24px;
          font-weight: 900;
          color: #2d1f3e;
          margin: 0;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: rgba(124, 101, 181, 0.08);
          color: #2d1f3e;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .modal-close:hover {
          background: rgba(124, 101, 181, 0.15);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }

        /* Scrollbar personalizada */
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: rgba(124, 101, 181, 0.05);
          border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: rgba(124, 101, 181, 0.2);
          border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 101, 181, 0.3);
        }

        .modal-search {
          margin-bottom: 24px;
          position: relative;
        }

        .search-icon-small {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9b8fab;
          pointer-events: none;
        }

        .modal-search input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          font-size: 15px;
          font-family: inherit;
          color: #2d1f3e;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .modal-search input:focus {
          outline: none;
          border-color: #7c65b5;
          box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.08);
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .option-item {
          padding: 16px 20px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.12);
          background: white;
          font-size: 15px;
          font-weight: 600;
          color: #2d1f3e;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: inherit;
        }

        .option-item:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.04);
          transform: translateX(4px);
        }

        .option-item.selected {
          border-color: #7c65b5;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
        }

        .option-text {
          flex: 1;
        }

        .empty-search {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-search p {
          color: #9b8fab;
          font-size: 16px;
          font-weight: 500;
        }

        .filter-section {
          margin-bottom: 36px;
        }

        .filter-section:last-child {
          margin-bottom: 0;
        }

        .filter-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-icon {
          font-size: 24px;
          line-height: 1;
        }

        .filter-label {
          font-size: 17px;
          font-weight: 800;
          color: #2d1f3e;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .options-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .option-chip {
          padding: 14px 18px;
          border-radius: 12px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          background: white;
          font-size: 14px;
          font-weight: 700;
          color: #2d1f3e;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          font-family: inherit;
        }

        .option-chip:hover {
          border-color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 101, 181, 0.1);
        }

        .option-chip.selected {
          border-color: #7c65b5;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
          transform: translateY(-2px);
        }

        .price-filter {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: rgba(124, 101, 181, 0.03);
          border-radius: 12px;
        }

        .price-inputs {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .price-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .price-input-group label {
          font-size: 13px;
          font-weight: 700;
          color: #6b5d7a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-with-prefix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .prefix {
          position: absolute;
          left: 14px;
          font-size: 14px;
          font-weight: 700;
          color: #7c65b5;
          pointer-events: none;
        }

        .price-input-group input {
          width: 100%;
          padding: 12px 14px 12px 38px;
          border-radius: 10px;
          border: 2px solid rgba(124, 101, 181, 0.15);
          font-size: 15px;
          font-weight: 700;
          color: #7c65b5;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .price-input-group input:focus {
          outline: none;
          border-color: #7c65b5;
          box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.08);
        }

        .price-divider {
          color: #9b8fab;
          font-size: 16px;
          font-weight: 700;
          margin-top: 28px;
        }

        .price-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(124, 101, 181, 0.15);
          outline: none;
          appearance: none;
        }

        .price-slider::-webkit-slider-thumb {
          appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(124, 101, 181, 0.4);
          transition: all 0.3s ease;
        }

        .price-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.6);
        }

        .price-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 3px 12px rgba(124, 101, 181, 0.4);
          transition: all 0.3s ease;
        }

        .price-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.6);
        }

        .price-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .price-badge {
          padding: 8px 16px;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          font-size: 16px;
          font-weight: 800;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(124, 101, 181, 0.25);
        }

        .price-separator {
          color: #9b8fab;
          font-size: 14px;
          font-weight: 600;
        }

        .modal-footer {
          display: flex;
          gap: 14px;
          padding: 28px 32px;
          border-top: 2px solid rgba(124, 101, 181, 0.1);
          background: linear-gradient(135deg, #ffffff 0%, #f8f7fb 100%);
        }

        .btn-secondary,
        .btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .btn-secondary {
          border: 2px solid rgba(124, 101, 181, 0.2);
          background: white;
          color: #6b5d7a;
        }

        .btn-secondary:hover {
          border-color: #7c65b5;
          color: #7c65b5;
          background: rgba(124, 101, 181, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.1);
        }

        .btn-primary {
          border: none;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          box-shadow: 0 6px 20px rgba(124, 101, 181, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124, 101, 181, 0.45);
        }

        /* ===== RESPONSIVIDADE ===== */
        @media (max-width: 900px) {
          .search-hero {
            padding: 120px 20px 60px;
          }

          .search-title {
            font-size: 40px;
          }

          .search-subtitle {
            font-size: 18px;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .search-hero {
            padding: 100px 16px 50px;
          }

          .search-title {
            font-size: 32px;
          }

          .search-subtitle {
            font-size: 16px;
          }

          .search-bar {
            flex-direction: column;
            padding: 10px;
          }

          .search-input-wrapper {
            width: 100%;
            min-width: auto;
          }

          .filter-btn {
            width: 100%;
            justify-content: center;
          }

          .modal-content {
            max-width: 100%;
            max-height: 95vh;
            border-radius: 24px 24px 0 0;
            margin: auto 0 0;
          }

          .modal-header {
            padding: 24px;
          }

          .modal-body {
            padding: 24px;
          }

          .modal-footer {
            flex-direction: column;
            padding: 24px;
          }

          .price-inputs {
            flex-direction: column;
            gap: 12px;
          }

          .price-divider {
            margin-top: 0;
          }

          .options-row {
            flex-direction: column;
          }

          .option-chip {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}