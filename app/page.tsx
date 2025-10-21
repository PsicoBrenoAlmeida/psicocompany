'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabaseClient'
import LogoutButton from '@/components/LogoutButton'

export default function Home() {
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  return (
    <main>
      <h1>Home</h1>
      {email ? (
        <>
          <p>Logado como <b>{email}</b></p>
          <p>(Aqui depois: histórico e próximas sessões)</p>
          <LogoutButton />
        </>
      ) : (
        <p>Você não está logado. <a href="/login">Entrar</a></p>
      )}
    </main>
  )
}
