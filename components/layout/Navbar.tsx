// components/layout/Navbar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabaseClient'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileData, setProfileData] = useState<{ full_name?: string; avatar_url?: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar usuário e buscar dados do perfil
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Buscar dados do perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', user.id)
            .single()
          
          setProfileData(profile)
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', session.user.id)
          .single()
        
        setProfileData(profile)
      } else {
        setProfileData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileData(null)
    setDropdownOpen(false)
    router.push('/')
  }

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo - sempre visível */}
          <Link href="/" className="navbar-logo">
            <span className="logo-text">Psicocompany</span>
          </Link>

          {/* Conteúdo quando logado */}
          {!loading && user && (
            <>
              {/* Links centrais */}
              <div className="navbar-center">
                <Link href="/psicologos" className={`navbar-link ${isActive('/psicologos') ? 'active' : ''}`}>
                  Psicólogos
                </Link>
              </div>

              {/* Avatar e dropdown */}
              <div className="navbar-profile" ref={dropdownRef}>
                <button
                  className="profile-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Menu do perfil"
                >
                  {profileData?.avatar_url ? (
                    <img 
                      src={profileData.avatar_url} 
                      alt="Avatar" 
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {getInitials(profileData?.full_name, user.email)}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                <div className={`profile-dropdown ${dropdownOpen ? 'active' : ''}`}>
                  <div className="dropdown-header">
                    <div className="dropdown-name">
                      {profileData?.full_name || 'Usuário'}
                    </div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <Link 
                    href="/perfil" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="dropdown-icon">👤</span>
                    Meu Perfil
                  </Link>
                  
                  <Link 
                    href="/configuracoes" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="dropdown-icon">⚙️</span>
                    Configurações
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Botões quando não logado */}
          {!loading && !user && (
            <div className="navbar-auth">
              <Link href="/login" className="auth-link">
                Entrar
              </Link>
              <Link href="/signup" className="auth-button">
                Começar agora
              </Link>
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(124, 101, 181, 0.08);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        /* Logo */
        .navbar-logo {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.3s ease;
        }

        .navbar-logo:hover {
          transform: translateY(-1px);
        }

        .logo-text {
          font-size: 24px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        /* Links centrais */
        .navbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .navbar-link {
          padding: 8px 20px;
          border-radius: 20px;
          color: #2d1f3e;
          font-weight: 500;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
        }

        .navbar-link:hover {
          background: rgba(124, 101, 181, 0.08);
          color: #7c65b5;
        }

        .navbar-link.active {
          background: rgba(124, 101, 181, 0.12);
          color: #7c65b5;
        }

        /* Perfil e Dropdown */
        .navbar-profile {
          position: relative;
        }

        .profile-button {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .profile-button:hover {
          transform: scale(1.05);
        }

        .profile-avatar,
        .profile-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid transparent;
          transition: border-color 0.3s ease;
        }

        .profile-avatar {
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .profile-button:hover .profile-avatar,
        .profile-button:hover .profile-avatar-placeholder {
          border-color: #7c65b5;
        }

        /* Dropdown */
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          min-width: 240px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .profile-dropdown.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-header {
          padding: 16px;
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 100%);
        }

        .dropdown-name {
          font-weight: 600;
          color: #2d1f3e;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .dropdown-email {
          font-size: 12px;
          color: #6b5d7a;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e5e5;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #2d1f3e;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s ease;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: rgba(124, 101, 181, 0.08);
          color: #7c65b5;
        }

        .dropdown-icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
        }

        .dropdown-logout:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        /* Botões de autenticação */
        .navbar-auth {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .auth-link {
          color: #6b5d7a;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          color: #7c65b5;
          background: rgba(124, 101, 181, 0.08);
        }

        .auth-button {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          padding: 10px 24px;
          border-radius: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(124, 101, 181, 0.25);
        }

        .auth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 101, 181, 0.35);
        }

        /* Mobile */
        @media (max-width: 768px) {
          .navbar-container {
            padding: 0 16px;
          }

          .logo-text {
            font-size: 20px;
          }

          .navbar-center {
            display: none;
          }

          .auth-link {
            font-size: 14px;
            padding: 6px 12px;
          }

          .auth-button {
            font-size: 14px;
            padding: 8px 20px;
          }

          .profile-dropdown {
            right: -16px;
          }
        }
      `}</style>
    </>
  )
}