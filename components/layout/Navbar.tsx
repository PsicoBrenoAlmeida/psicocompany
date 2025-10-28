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
  const [scrolled, setScrolled] = useState(false)
  const [profileData, setProfileData] = useState<{ full_name?: string; avatar_url?: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="navbar-logo">
            <span className="logo-text">Psicocompany</span>
          </Link>

          {/* Loading skeleton */}
          {loading ? (
            <div className="navbar-skeleton">
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn primary"></div>
            </div>
          ) : (
            <>
              {/* PRÉ-LOGIN */}
              {!user && (
                <div className="navbar-auth">
                  <Link href="/login" className="btn-login">
                    Entrar
                  </Link>
                  <Link href="/signup" className="btn-signup">
                    Criar conta
                  </Link>
                </div>
              )}

              {/* PÓS-LOGIN */}
              {user && (
                <>
                  <div className="navbar-center">
                    <Link 
                      href="/dashboard" 
                      className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                      title="Minhas sessões e histórico"
                    >
                      Dashboard
                    </Link>
                    
                    <Link 
                      href="/" 
                      className={`nav-link ${isActive('/') ? 'active' : ''}`}
                      title="Buscar psicólogos"
                    >
                      Psicólogos
                    </Link>
                  </div>

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
                          className="avatar"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(profileData?.full_name, user.email)}
                        </div>
                      )}
                    </button>

                    {dropdownOpen && (
                      <div className="dropdown-menu">
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
                          Meu Perfil
                        </Link>
                        
                        <Link 
                          href="/configuracoes" 
                          className="dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Configurações
                        </Link>
                        
                        <div className="dropdown-divider"></div>
                        
                        <button 
                          className="dropdown-item logout"
                          onClick={handleLogout}
                        >
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </nav>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(124, 101, 181, 0.08);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .navbar.scrolled {
          box-shadow: 0 4px 30px rgba(124, 101, 181, 0.12);
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          text-decoration: none;
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .navbar-logo:hover {
          transform: scale(1.05);
        }

        .logo-text {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
          white-space: nowrap;
        }

        /* Skeleton Loading */
        .navbar-skeleton {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .skeleton-btn {
          height: 36px;
          width: 80px;
          border-radius: 10px;
          background: linear-gradient(90deg, #e8e4f7 0%, #ddd8f0 50%, #e8e4f7 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-btn.primary {
          width: 120px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* PRÉ-LOGIN */
        .navbar-auth {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .btn-login {
          text-decoration: none;
          color: #3c2e50;
          font-weight: 600;
          font-size: 15px;
          padding: 10px 20px;
          border-radius: 10px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .btn-login:hover {
          background: rgba(169, 150, 221, 0.1);
          color: #7c65b5;
        }

        .btn-signup {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 15px rgba(124, 101, 181, 0.25);
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-signup::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #6952a0 0%, #8b72c4 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-signup:hover::before {
          opacity: 1;
        }

        .btn-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(124, 101, 181, 0.4);
        }

        /* PÓS-LOGIN - CENTRO */
        .navbar-center {
          display: flex;
          align-items: center;
          gap: 200px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .nav-link {
          text-decoration: none;
          color: #3c2e50;
          font-weight: 600;
          font-size: 15px;
          padding: 10px 20px;
          border-radius: 10px;
          transition: all 0.3s ease;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(169, 150, 221, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .nav-link:hover::before {
          left: 100%;
        }

        .nav-link:hover {
          background: rgba(169, 150, 221, 0.1);
          color: #7c65b5;
        }

        .nav-link.active {
          background: rgba(124, 101, 181, 0.15);
          color: #7c65b5;
          font-weight: 700;
        }

        .navbar-profile {
          position: relative;
          flex-shrink: 0;
        }

        .profile-button {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .profile-button:hover {
          transform: scale(1.05);
        }

        .avatar,
        .avatar-placeholder {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 2px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #7c65b5, #a996dd) border-box;
          transition: all 0.2s ease;
        }

        .avatar {
          object-fit: cover;
        }

        .avatar-placeholder {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
        }

        .profile-button:hover .avatar,
        .profile-button:hover .avatar-placeholder {
          box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: white;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          min-width: 240px;
          overflow: hidden;
          animation: dropdownFade 0.2s ease;
          border: 1px solid rgba(124, 101, 181, 0.1);
        }

        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
          background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 100%);
        }

        .dropdown-name {
          font-weight: 700;
          color: #2d1f3e;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .dropdown-email {
          font-size: 13px;
          color: #6b5d7a;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(124, 101, 181, 0.1);
          margin: 8px 0;
        }

        .dropdown-item {
          display: block;
          padding: 12px 16px;
          color: #2d1f3e;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
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

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        @media (max-width: 900px) {
          .navbar-container {
            padding: 0 24px;
          }

          .navbar-center {
            position: static;
            transform: none;
            gap: 12px;
          }

          .nav-link {
            padding: 8px 14px;
            font-size: 14px;
          }
        }

        @media (max-width: 640px) {
          .navbar {
            height: 64px;
          }

          .navbar-container {
            padding: 0 16px;
          }

          .logo-text {
            font-size: 22px;
          }

          .btn-login,
          .btn-signup {
            padding: 8px 16px;
            font-size: 14px;
          }

          .navbar-center {
            display: none;
          }

          .avatar,
          .avatar-placeholder {
            width: 38px;
            height: 38px;
          }

          .dropdown-menu {
            right: -8px;
            min-width: 90vw;
            max-width: 280px;
          }
        }

        @media (max-width: 400px) {
          .btn-login {
            display: none;
          }

          .logo-text {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  )
}