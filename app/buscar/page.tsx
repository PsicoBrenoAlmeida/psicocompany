// app/buscar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import SearchFilters from '@/components/buscar/SearchFilters'
import PsychologistsList from '@/components/buscar/PsychologistsList'

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

interface Filters {
  search: string
  specialty: string
  approach: string
  modality: string
  ageGroup: string
  priceRange: [number, number]
  gender: string
}

export default function BuscarPage() {
  const supabase = createClient()
  const [psychologists, setPsychologists] = useState<Psychologist[]>([])
  const [filteredPsychologists, setFilteredPsychologists] = useState<Psychologist[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('relevant')
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    specialty: '',
    approach: '',
    modality: '',
    ageGroup: '',
    priceRange: [0, 500],
    gender: ''
  })

  useEffect(() => {
    loadPsychologists()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, sortBy, psychologists])

  const loadPsychologists = async () => {
    try {
      setLoading(true)

      const { data: psychData, error: psychError } = await supabase
        .from('psychologists')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('plan_type', { ascending: false })

      if (psychError) throw psychError
      if (!psychData || psychData.length === 0) {
        setPsychologists([])
        setFilteredPsychologists([])
        return
      }

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
              avatar_url: profileData?.avatar_url || psych.avatar_url || null
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
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.profile.full_name.toLowerCase().includes(searchLower) ||
        p.short_bio?.toLowerCase().includes(searchLower) ||
        p.full_bio?.toLowerCase().includes(searchLower) ||
        p.specialties?.some(s => s.toLowerCase().includes(searchLower)) ||
        p.approaches?.some(a => a.toLowerCase().includes(searchLower))
      )
    }

    if (filters.specialty) {
      filtered = filtered.filter(p => 
        p.specialties?.some(s => s.includes(filters.specialty))
      )
    }

    if (filters.approach) {
      filtered = filtered.filter(p => 
        p.approaches?.some(a => a.includes(filters.approach))
      )
    }

    if (filters.modality) {
      filtered = filtered.filter(p => 
        p.modality?.some(m => m.toLowerCase() === filters.modality.toLowerCase())
      )
    }

    if (filters.ageGroup) {
      filtered = filtered.filter(p => 
        p.age_groups?.some(age => age === filters.ageGroup)
      )
    }

    filtered = filtered.filter(p => 
      p.price_per_session >= filters.priceRange[0] && 
      p.price_per_session <= filters.priceRange[1]
    )

    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender)
    }

    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price_per_session - b.price_per_session)
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price_per_session - a.price_per_session)
    } else if (sortBy === 'relevant') {
      filtered.sort((a, b) => {
        if (a.plan_type === 'premium' && b.plan_type !== 'premium') return -1
        if (a.plan_type !== 'premium' && b.plan_type === 'premium') return 1
        return a.price_per_session - b.price_per_session
      })
    }

    setFilteredPsychologists(filtered)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      approach: '',
      modality: '',
      ageGroup: '',
      priceRange: [0, 500],
      gender: ''
    })
  }

  return (
    <>
      <SearchFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />
      
      <PsychologistsList 
        psychologists={filteredPsychologists}
        loading={loading}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </>
  )
}