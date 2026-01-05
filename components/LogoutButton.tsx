'use client'
import { createClient } from '@/utils/supabase/client'

export default function LogoutButton() {
  const supabase = createClient()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // redireciona para a home após sair
  }

  return (
    <button onClick={handleLogout} style={{ marginTop: 12 }}>
      Sair
    </button>
  )
}
