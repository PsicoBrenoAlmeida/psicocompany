// app/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabaseClient'
import { User } from '@supabase/supabase-js'

interface ProfileData {
  full_name: string
  phone: string
  avatar_url: string
  bio: string
  birth_date: string
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    avatar_url: '',
    bio: '',
    birth_date: ''
  })

  const [errors, setErrors] = useState<Partial<ProfileData>>({})

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url, bio, birth_date')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
      } else if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || '',
          bio: profileData.bio || '',
          birth_date: profileData.birth_date || ''
        })
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {}

    if (!profile.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório'
    } else if (profile.full_name.trim().length < 3) {
      newErrors.full_name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (profile.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(profile.phone)) {
      newErrors.phone = 'Formato: (11) 98765-4321'
    }

    if (profile.bio && profile.bio.length > 500) {
      newErrors.bio = 'Bio deve ter no máximo 500 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setProfile({ ...profile, phone: formatted })
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Corrija os erros antes de salvar' })
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'Usuário não autenticado' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone || null,
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || null,
          birth_date: profile.birth_date || null
        })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      
      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (!profile.full_name) return 'U'
    return profile.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <>
        <main className="profile-page">
          <div className="profile-container">
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando perfil...</p>
            </div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

  return (
    <>
      <main className="profile-page">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais</p>
          </div>

          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="avatar-info">
              <h3>{profile.full_name || 'Usuário'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="profile-form">
            {/* Nome Completo */}
            <div className="form-group">
              <label htmlFor="full_name">
                Nome Completo <span className="required">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Digite seu nome completo"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && (
                <span className="error-message">{errors.full_name}</span>
              )}
            </div>

            {/* Telefone */}
            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={profile.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={15}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>

            {/* Data de Nascimento */}
            <div className="form-group">
              <label htmlFor="birth_date">Data de Nascimento</label>
              <input
                id="birth_date"
                type="date"
                value={profile.birth_date}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              />
            </div>

            {/* Avatar URL */}
            <div className="form-group">
              <label htmlFor="avatar_url">URL da Foto de Perfil</label>
              <input
                id="avatar_url"
                type="url"
                placeholder="https://exemplo.com/foto.jpg"
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              />
              <span className="field-hint">
                Cole o link de uma imagem online ou use serviços como Imgur, Cloudinary, etc.
              </span>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label htmlFor="bio">
                Sobre você
                <span className="char-count">{profile.bio.length}/500</span>
              </label>
              <textarea
                id="bio"
                placeholder="Conte um pouco sobre você..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                maxLength={500}
                rows={4}
                className={errors.bio ? 'error' : ''}
              />
              {errors.bio && (
                <span className="error-message">{errors.bio}</span>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`message ${message.type}`}>
                {message.type === 'success' ? '✓' : '⚠'} {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => router.push('/dashboard')}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="btn-spinner"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </>
  )
}

const styles = `
  .profile-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f4f2fa 0%, #e8e4f7 50%, #ddd8f0 100%);
    padding: 120px 24px 60px;
  }

  .profile-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .profile-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .profile-header h1 {
    font-size: 36px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .profile-header p {
    font-size: 16px;
    color: #6b5d7a;
  }

  /* Avatar Section */
  .avatar-section {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .avatar-wrapper {
    position: relative;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid transparent;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #7c65b5, #a996dd) border-box;
  }

  .avatar-image {
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 36px;
  }

  .avatar-info h3 {
    font-size: 24px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .avatar-info p {
    font-size: 14px;
    color: #6b5d7a;
  }

  /* Form */
  .profile-form {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-group:last-of-type {
    margin-bottom: 0;
  }

  .form-group label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 600;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .required {
    color: #ef4444;
    margin-left: 4px;
  }

  .char-count {
    font-size: 12px;
    font-weight: 500;
    color: #9b8fab;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.15);
    font-size: 15px;
    font-family: inherit;
    background: white;
    transition: all 0.3s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #7c65b5;
    box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.1);
  }

  .form-group input.error,
  .form-group textarea.error {
    border-color: #ef4444;
  }

  .form-group input.error:focus,
  .form-group textarea.error:focus {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .field-hint {
    display: block;
    font-size: 12px;
    color: #9b8fab;
    margin-top: 6px;
  }

  .error-message {
    display: block;
    font-size: 13px;
    color: #ef4444;
    margin-top: 6px;
    font-weight: 500;
  }

  /* Message */
  .message {
    padding: 16px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 24px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.success {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .message.error {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  /* Buttons */
  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
  }

  .btn-cancel,
  .btn-save {
    flex: 1;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-cancel {
    background: white;
    color: #6b5d7a;
    border: 2px solid rgba(124, 101, 181, 0.2);
  }

  .btn-cancel:hover:not(:disabled) {
    border-color: #7c65b5;
    color: #7c65b5;
  }

  .btn-save {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(124, 101, 181, 0.25);
  }

  .btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(124, 101, 181, 0.4);
  }

  .btn-cancel:disabled,
  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Loading */
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

  .loading p {
    color: #6b5d7a;
    font-size: 16px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .profile-page {
      padding: 100px 16px 40px;
    }

    .profile-header h1 {
      font-size: 28px;
    }

    .avatar-section {
      flex-direction: column;
      text-align: center;
      padding: 24px;
    }

    .avatar-image,
    .avatar-placeholder {
      width: 80px;
      height: 80px;
    }

    .avatar-placeholder {
      font-size: 28px;
    }

    .profile-form {
      padding: 24px;
    }

    .form-actions {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .profile-header h1 {
      font-size: 24px;
    }

    .profile-form {
      padding: 20px;
    }
  }
`