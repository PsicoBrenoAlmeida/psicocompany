'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabaseClient'

type Therapist = {
  id: string
  crp: string | null
  bio: string | null
  price_cents: number
  session_duration_min: number
  is_active: boolean
}

export default function PsicologosPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<Therapist[]>([])

  useEffect(() => {
    supabase.from('therapists')
      .select('id, crp, bio, price_cents, session_duration_min, is_active')
      .eq('is_active', true)
      .then(({ data }) => setRows(data ?? []))
  }, [])

  return (
    <main>
      <h1>Psicólogos</h1>
      <ul>
        {rows.map(t => (
          <li key={t.id} style={{ marginBottom:12 }}>
            <div>CRP: {t.crp ?? '-'}</div>
            <div>Bio: {t.bio ?? '-'}</div>
            <div>Valor: R$ {(t.price_cents/100).toFixed(2)} / {t.session_duration_min}min</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
