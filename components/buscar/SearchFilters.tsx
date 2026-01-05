// components/buscar/SearchFilters.tsx
'use client'

import { useState } from 'react'
import styles from './SearchFilters.module.css'

type FiltersType = {
  search: string
  specialty: string
  approach: string
  modality: string
  ageGroup: string
  priceRange: [number, number]
  gender: string
}

interface SearchFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: FiltersType) => void
  onClearFilters: () => void
}

export default function SearchFilters({ filters, onFiltersChange, onClearFilters }: SearchFiltersProps) {
  const [specialtyFilterOpen, setSpecialtyFilterOpen] = useState(false)
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false)
  const [specialtySearch, setSpecialtySearch] = useState('')

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

  const approachesList = [
    'Terapia Cognitivo-Comportamental',
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

  const hasActiveFilters = filters.specialty || filters.approach || filters.modality || filters.ageGroup || filters.gender

  return (
    <>
      <section className={styles.searchHero}>
        <div className={styles.searchContainer}>
          <div className={styles.heroContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.searchTitle}>
                Encontre o psicólogo <span className={styles.gradientText}>ideal</span> para você
              </h1>
              <p className={styles.searchSubtitle}>
                Profissionais qualificados especializados em diversas áreas da psicologia
              </p>
            </div>

            <div className={styles.searchBoxWrapper}>
              <div className={styles.searchBar}>
                <div className={styles.searchInputWrapper}>
                  <svg className={styles.searchIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Busque por nome, especialidade ou abordagem..."
                    className={styles.searchInput}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  />
                  {filters.search && (
                    <button 
                      className={styles.clearSearch}
                      onClick={() => onFiltersChange({ ...filters, search: '' })}
                      aria-label="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button 
                  className={`${styles.filterBtn} ${filters.specialty ? styles.filterBtnActive : ''}`}
                  onClick={() => setSpecialtyFilterOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <span>Especialidade</span>
                  {filters.specialty && <span className={styles.filterCount}>1</span>}
                </button>

                <button 
                  className={`${styles.filterBtn} ${getActiveFiltersCount() > 0 ? styles.filterBtnActive : ''}`}
                  onClick={() => setAdvancedFilterOpen(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>Mais Filtros</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className={styles.filterCount}>{getActiveFiltersCount()}</span>
                  )}
                </button>
              </div>

              {/* Tags de Filtros Ativos */}
              {hasActiveFilters && (
                <div className={styles.activeFilters}>
                  {filters.specialty && (
                    <div className={styles.filterTag}>
                      <span className={styles.filterTagIcon}>🎯</span>
                      {filters.specialty}
                      <button className={styles.filterTagClose} onClick={() => onFiltersChange({ ...filters, specialty: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.approach && (
                    <div className={styles.filterTag}>
                      <span className={styles.filterTagIcon}>🧠</span>
                      {filters.approach}
                      <button className={styles.filterTagClose} onClick={() => onFiltersChange({ ...filters, approach: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.modality && (
                    <div className={styles.filterTag}>
                      <span className={styles.filterTagIcon}>
                        {filters.modality === 'Online' && '💻'}
                        {filters.modality === 'Presencial' && '🏢'}
                        {filters.modality === 'Híbrido' && '🔄'}
                      </span>
                      {filters.modality}
                      <button className={styles.filterTagClose} onClick={() => onFiltersChange({ ...filters, modality: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.ageGroup && (
                    <div className={styles.filterTag}>
                      <span className={styles.filterTagIcon}>👥</span>
                      {filters.ageGroup}
                      <button className={styles.filterTagClose} onClick={() => onFiltersChange({ ...filters, ageGroup: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  {filters.gender && (
                    <div className={styles.filterTag}>
                      <span className={styles.filterTagIcon}>⚧</span>
                      {filters.gender}
                      <button className={styles.filterTagClose} onClick={() => onFiltersChange({ ...filters, gender: '' })} aria-label="Remover filtro">
                        ✕
                      </button>
                    </div>
                  )}
                  <button className={styles.clearAllBtn} onClick={onClearFilters}>
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

        <div className={styles.decorativeShapes}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
          <div className={`${styles.shape} ${styles.shape3}`}></div>
        </div>
      </section>

      {/* MODAL DE ESPECIALIDADES */}
      {specialtyFilterOpen && (
        <div className={styles.modalOverlay} onClick={() => setSpecialtyFilterOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <span className={styles.modalIcon}>🎯</span>
                <h3 className={styles.modalTitle}>Selecione uma Especialidade</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSpecialtyFilterOpen(false)} aria-label="Fechar modal">
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalSearch}>
                <svg className={styles.searchIconSmall} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

              <div className={styles.optionsList}>
                {filteredSpecialties.length > 0 ? (
                  filteredSpecialties.map(specialty => (
                    <button
                      key={specialty}
                      className={`${styles.optionItem} ${filters.specialty === specialty ? styles.optionItemSelected : ''}`}
                      onClick={() => {
                        onFiltersChange({ ...filters, specialty: filters.specialty === specialty ? '' : specialty })
                        setSpecialtyFilterOpen(false)
                        setSpecialtySearch('')
                      }}
                    >
                      <span className={styles.optionText}>{specialty}</span>
                      {filters.specialty === specialty && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className={styles.emptySearch}>
                    <span className={styles.emptyIcon}>🔍</span>
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
        <div className={styles.modalOverlay} onClick={() => setAdvancedFilterOpen(false)}>
          <div className={`${styles.modalContent} ${styles.modalContentAdvanced}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <span className={styles.modalIcon}>⚙️</span>
                <h3 className={styles.modalTitle}>Filtros Avançados</h3>
              </div>
              <button className={styles.modalClose} onClick={() => setAdvancedFilterOpen(false)} aria-label="Fechar modal">
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              
              {/* Abordagem Terapêutica */}
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <span className={styles.sectionIcon}>🧠</span>
                  <label className={styles.filterLabel}>Abordagem Terapêutica</label>
                </div>
                <div className={styles.optionsGrid}>
                  {approachesList.map(approach => (
                    <button
                      key={approach}
                      className={`${styles.optionChip} ${filters.approach === approach ? styles.optionChipSelected : ''}`}
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
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <span className={styles.sectionIcon}>📍</span>
                  <label className={styles.filterLabel}>Modalidade de Atendimento</label>
                </div>
                <div className={styles.optionsRow}>
                  {modalitiesList.map(modality => (
                    <button
                      key={modality}
                      className={`${styles.optionChip} ${filters.modality === modality ? styles.optionChipSelected : ''}`}
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
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <span className={styles.sectionIcon}>👥</span>
                  <label className={styles.filterLabel}>Atende</label>
                </div>
                <div className={styles.optionsGrid}>
                  {ageGroupsList.map(age => (
                    <button
                      key={age}
                      className={`${styles.optionChip} ${filters.ageGroup === age ? styles.optionChipSelected : ''}`}
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
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <span className={styles.sectionIcon}>💰</span>
                  <label className={styles.filterLabel}>Valor por Sessão</label>
                </div>
                <div className={styles.priceFilter}>
                  <div className={styles.priceInputs}>
                    <div className={styles.priceInputGroup}>
                      <label>Mínimo</label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.prefix}>R$</span>
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
                    <span className={styles.priceDivider}>—</span>
                    <div className={styles.priceInputGroup}>
                      <label>Máximo</label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.prefix}>R$</span>
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
                    className={styles.priceSlider}
                  />
                  <div className={styles.priceDisplay}>
                    <span className={styles.priceBadge}>R$ {filters.priceRange[0]}</span>
                    <span className={styles.priceSeparator}>até</span>
                    <span className={styles.priceBadge}>R$ {filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Gênero do Profissional */}
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <span className={styles.sectionIcon}>⚧</span>
                  <label className={styles.filterLabel}>Gênero do Profissional</label>
                </div>
                <div className={styles.optionsRow}>
                  {gendersList.map(gender => (
                    <button
                      key={gender}
                      className={`${styles.optionChip} ${filters.gender === gender ? styles.optionChipSelected : ''}`}
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

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClearFilters}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
                Limpar Tudo
              </button>
              <button className={styles.btnPrimary} onClick={() => setAdvancedFilterOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}