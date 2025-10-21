'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabaseClient'

export default function PerfilPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return
      setLogged(true)
      supabase.from('profiles').select('full_name, phone').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) { setFullName(data.full_name ?? ''); setPhone(data.phone ?? '') }
        })
    })
  }, [])

  const save = async () => {
    setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Faça login')
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user.id)
    setMsg(error ? error.message : 'Salvo!')
  }

  if (!logged) return <p>Faça <a href="/login">login</a> para acessar seu perfil.</p>

  return (
    <main style={{ display:'grid', gap:12, maxWidth:360 }}>
      <h1>Meu perfil</h1>
      <input placeholder="nome completo" value={fullName} onChange={e=>setFullName(e.target.value)} />
      <input placeholder="telefone" value={phone} onChange={e=>setPhone(e.target.value)} />
      <button onClick={save}>Salvar</button>
      {msg && <p>{msg}</p>}
    </main>
  )
}
