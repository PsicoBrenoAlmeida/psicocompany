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
  gender: string
  city: string
  state: string
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    avatar_url: '',
    bio: '',
    birth_date: '',
    gender: '',
    city: '',
    state: ''
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
        .select('*')
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
          birth_date: profileData.birth_date || '',
          gender: profileData.gender || '',
          city: profileData.city || '',
          state: profileData.state || ''
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione apenas imagens' })
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' })
        return
      }

      setUploading(true)
      setMessage(null)

      // Preview da imagem
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile({ ...profile, avatar_url: event.target.result as string })
        }
      }
      reader.readAsDataURL(file)

      // Aqui você implementaria o upload real para um storage (Supabase Storage, Cloudinary, etc)
      // Por enquanto, vamos simular um delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      setMessage({ type: 'success', text: 'Foto carregada! Clique em "Salvar" para confirmar.' })
    } catch (error) {
      console.error('Erro no upload:', error)
      setMessage({ type: 'error', text: 'Erro ao fazer upload da imagem' })
    } finally {
      setUploading(false)
    }
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
          birth_date: profile.birth_date || null,
          gender: profile.gender || null,
          city: profile.city || null,
          state: profile.state || null
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
            <div>
              <h1>Meu Perfil</h1>
              <p>Mantenha suas informações atualizadas</p>
            </div>
            <button 
              className="btn-back"
              onClick={() => router.push('/dashboard')}
            >
              ← Voltar
            </button>
          </div>

          {/* Info Alert */}
          <div className="info-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
              <strong>Seu perfil será visível para os psicólogos</strong>
              <p>Quando você agendar uma sessão, o profissional terá acesso às suas informações de perfil para oferecer um melhor atendimento.</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            {/* Avatar Section */}
            <div className="avatar-card">
              <h2>Foto de Perfil</h2>
              <div className="avatar-upload-section">
                <div className="avatar-wrapper">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      {getInitials()}
                    </div>
                  )}
                  {uploading && (
                    <div className="avatar-uploading">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                </div>
                
                <div className="avatar-actions">
                  <label htmlFor="avatar-upload" className="btn-upload">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {uploading ? 'Carregando...' : 'Escolher Foto'}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  {profile.avatar_url && (
                    <button
                      className="btn-remove"
                      onClick={() => setProfile({ ...profile, avatar_url: '' })}
                      disabled={uploading}
                    >
                      Remover
                    </button>
                  )}
                </div>
                
                <p className="avatar-hint">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="profile-form">
              <h2>Informações Pessoais</h2>

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

              {/* Email (readonly) */}
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-disabled"
                />
                <span className="field-hint">
                  O e-mail não pode ser alterado
                </span>
              </div>

              {/* Phone and Gender */}
              <div className="form-row">
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

                <div className="form-group">
                  <label htmlFor="gender">Gênero</label>
                  <select
                    id="gender"
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="nao-binario">Não-binário</option>
                    <option value="prefiro-nao-dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>

              {/* Birth Date */}
              <div className="form-group">
                <label htmlFor="birth_date">Data de Nascimento</label>
                <input
                  id="birth_date"
                  type="date"
                  value={profile.birth_date}
                  onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* City and State */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Cidade</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="São Paulo"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">Estado</label>
                  <select
                    id="state"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label htmlFor="bio">
                  Sobre você
                  <span className="char-count">{profile.bio.length}/500</span>
                </label>
                <textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você, seus interesses, motivações para buscar terapia..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  maxLength={500}
                  rows={4}
                  className={errors.bio ? 'error' : ''}
                />
                {errors.bio && (
                  <span className="error-message">{errors.bio}</span>
                )}
                <span className="field-hint">
                  Essas informações ajudam o psicólogo a conhecer melhor você antes da primeira sessão
                </span>
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
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
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
    background: #faf9fc;
    padding: 120px 24px 60px;
  }

  .profile-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Header */
  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .profile-header h1 {
    font-size: 32px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .profile-header p {
    font-size: 16px;
    color: #6b5d7a;
  }

  .btn-back {
    padding: 10px 20px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #7c65b5;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .btn-back:hover {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  /* Info Alert */
  .info-alert {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: rgba(59, 130, 246, 0.05);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .info-alert svg {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-alert strong {
    display: block;
    font-size: 15px;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .info-alert p {
    font-size: 14px;
    color: #6b5d7a;
    line-height: 1.5;
  }

  /* Profile Content */
  .profile-content {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 24px;
  }

  /* Avatar Card */
  .avatar-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
    height: fit-content;
  }

  .avatar-card h2 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 24px;
  }

  .avatar-upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .avatar-wrapper {
    position: relative;
    margin-bottom: 20px;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 160px;
    height: 160px;
    border-radius: 50%;
  }

  .avatar-image {
    object-fit: cover;
    border: 4px solid #7c65b5;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 48px;
    border: 4px solid #7c65b5;
  }

  .avatar-uploading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spinner-small {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .avatar-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .btn-upload {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-upload:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.3);
  }

  .btn-remove {
    padding: 10px 20px;
    background: white;
    color: #dc2626;
    border: 2px solid #dc2626;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-remove:hover:not(:disabled) {
    background: #dc2626;
    color: white;
  }

  .btn-remove:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .avatar-hint {
    font-size: 13px;
    color: #9b8fab;
    text-align: center;
  }

  /* Form */
  .profile-form {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .profile-form h2 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 24px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
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
  .form-group select,
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
  .form-group select:focus,
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

  .form-group input.input-disabled {
    background: #f5f5f5;
    color: #9b8fab;
    cursor: not-allowed;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-group select {
    cursor: pointer;
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
    border: 2px solid rgba(34, 197, 94, 0.2);
  }

  .message.error {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 2px solid rgba(239, 68, 68, 0.2);
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
  @media (max-width: 1024px) {
    .profile-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .profile-page {
      padding: 100px 16px 40px;
    }

    .profile-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-header h1 {
      font-size: 26px;
    }

    .avatar-card,
    .profile-form {
      padding: 24px;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .avatar-image,
    .avatar-placeholder {
      width: 120px;
      height: 120px;
    }

    .avatar-placeholder {
      font-size: 36px;
    }
  }

  @media (max-width: 480px) {
    .profile-header h1 {
      font-size: 24px;
    }

    .avatar-card,
    .profile-form {
      padding: 20px;
    }

    .avatar-actions {
      flex-direction: column;
      width: 100%;
    }

    .btn-upload,
    .btn-remove {
      width: 100%;
      justify-content: center;
    }
  }
`