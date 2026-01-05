// app/perfil/page.tsx - Com CSS Modules
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import styles from './page.module.css'

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

  const checkUser = useCallback(async () => {
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
  }, [supabase, router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

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

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione apenas imagens' })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' })
        return
      }

      setUploading(true)
      setMessage(null)

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile({ ...profile, avatar_url: event.target.result as string })
        }
      }
      reader.readAsDataURL(file)

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
    } catch (error) {
      console.error('Erro ao salvar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar perfil'
      setMessage({ type: 'error', text: errorMessage })
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
      <main className={styles.profilePage}>
        <div className={styles.profileContainer}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando perfil...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.profilePage}>
      <div className={styles.profileContainer}>
        {/* Header */}
        <div className={styles.profileHeader}>
          <div>
            <h1>Meu Perfil</h1>
            <p>Mantenha suas informações atualizadas</p>
          </div>
          <button 
            className={styles.btnBack}
            onClick={() => router.push('/dashboard')}
          >
            ← Voltar
          </button>
        </div>

        {/* Info Alert */}
        <div className={styles.infoAlert}>
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
        <div className={styles.profileContent}>
          {/* Avatar Section */}
          <div className={styles.avatarCard}>
            <h2>Foto de Perfil</h2>
            <div className={styles.avatarUploadSection}>
              <div className={styles.avatarWrapper}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className={styles.avatarImage} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {getInitials()}
                  </div>
                )}
                {uploading && (
                  <div className={styles.avatarUploading}>
                    <div className={styles.spinnerSmall}></div>
                  </div>
                )}
              </div>
              
              <div className={styles.avatarActions}>
                <label htmlFor="avatar-upload" className={styles.btnUpload}>
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
                    className={styles.btnRemove}
                    onClick={() => setProfile({ ...profile, avatar_url: '' })}
                    disabled={uploading}
                  >
                    Remover
                  </button>
                )}
              </div>
              
              <p className={styles.avatarHint}>
                JPG, PNG ou GIF. Máximo 5MB.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className={styles.profileForm}>
            <h2>Informações Pessoais</h2>

            {/* Nome Completo */}
            <div className={styles.formGroup}>
              <label htmlFor="full_name">
                Nome Completo <span className={styles.required}>*</span>
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Digite seu nome completo"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className={errors.full_name ? styles.inputError : ''}
              />
              {errors.full_name && (
                <span className={styles.errorMessage}>{errors.full_name}</span>
              )}
            </div>

            {/* Email (readonly) */}
            <div className={styles.formGroup}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className={styles.inputDisabled}
              />
              <span className={styles.fieldHint}>
                O e-mail não pode ser alterado
              </span>
            </div>

            {/* Phone and Gender */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={profile.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={15}
                  className={errors.phone ? styles.inputError : ''}
                />
                {errors.phone && (
                  <span className={styles.errorMessage}>{errors.phone}</span>
                )}
              </div>

              <div className={styles.formGroup}>
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
            <div className={styles.formGroup}>
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
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="city">Cidade</label>
                <input
                  id="city"
                  type="text"
                  placeholder="São Paulo"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
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
            <div className={styles.formGroup}>
              <label htmlFor="bio">
                Sobre você
                <span className={styles.charCount}>{profile.bio.length}/500</span>
              </label>
              <textarea
                id="bio"
                placeholder="Conte um pouco sobre você, seus interesses, motivações para buscar terapia..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                maxLength={500}
                rows={4}
                className={errors.bio ? styles.inputError : ''}
              />
              {errors.bio && (
                <span className={styles.errorMessage}>{errors.bio}</span>
              )}
              <span className={styles.fieldHint}>
                Essas informações ajudam o psicólogo a conhecer melhor você antes da primeira sessão
              </span>
            </div>

            {/* Message */}
            {message && (
              <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                {message.type === 'success' ? '✓' : '⚠'} {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => router.push('/dashboard')}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className={styles.btnSpinner}></div>
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
  )
}