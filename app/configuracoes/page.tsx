// app/configuracoes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabaseClient'
import { User } from '@supabase/supabase-js'

interface Profile {
  user_type: 'patient' | 'psychologist'
  full_name: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
}

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('notificacoes')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true
  })

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // Aqui você salvaria as preferências no banco
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
      showMessage('success', 'Preferências de notificações salvas!')
    } catch (error) {
      showMessage('error', 'Erro ao salvar preferências.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showMessage('error', 'As senhas não coincidem.')
      return
    }

    if (passwordForm.new_password.length < 6) {
      showMessage('error', 'A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })

      if (error) throw error

      showMessage('success', 'Senha alterada com sucesso!')
      setPasswordForm({
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      showMessage('error', 'Erro ao alterar senha. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'ATENÇÃO: Esta é sua última chance. Todos os seus dados, agendamentos e histórico serão permanentemente excluídos. Deseja continuar?'
    )

    if (!doubleConfirm) return

    setSaving(true)

    try {
      showMessage('error', 'Para excluir sua conta, entre em contato com o suporte.')
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      showMessage('error', 'Erro ao excluir conta. Entre em contato com o suporte.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <main className="config-page">
          <div className="config-container">
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </main>
        <style jsx>{styles}</style>
      </>
    )
  }

  return (
    <>
      <main className="config-page">
        <div className="config-container">
          
          {/* Header */}
          <div className="config-header">
            <div>
              <h1>Configurações</h1>
              <p>Gerencie suas preferências e segurança</p>
            </div>
            <Link href="/dashboard" className="btn-back">
              ← Voltar
            </Link>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? '✓' : '⚠'} {message.text}
            </div>
          )}

          {/* Content Grid */}
          <div className="config-grid">
            
            {/* Sidebar */}
            <div className="config-sidebar">
              <button
                className={`sidebar-btn ${activeTab === 'notificacoes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notificacoes')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Notificações
              </button>

              <button
                className={`sidebar-btn ${activeTab === 'seguranca' ? 'active' : ''}`}
                onClick={() => setActiveTab('seguranca')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Segurança
              </button>

              <button
                className={`sidebar-btn ${activeTab === 'conta' ? 'active' : ''}`}
                onClick={() => setActiveTab('conta')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
                </svg>
                Conta
              </button>

              <div className="sidebar-divider"></div>

              <Link href="/perfil" className="sidebar-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Editar Perfil
              </Link>

              <button className="sidebar-link danger" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sair da Conta
              </button>
            </div>

            {/* Main Content */}
            <div className="config-content">
              
              {/* Notificações Tab */}
              {activeTab === 'notificacoes' && (
                <div className="content-panel">
                  <div className="panel-header">
                    <h2>Notificações</h2>
                    <p>Escolha como deseja ser notificado</p>
                  </div>

                  <div className="settings-list">
                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                        </div>
                        <div>
                          <strong>Notificações por E-mail</strong>
                          <span>Receba atualizações sobre agendamentos e lembretes</span>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.email_notifications}
                          onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <div className="setting-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </div>
                        <div>
                          <strong>Notificações Push</strong>
                          <span>Receba notificações instantâneas no navegador</span>
                        </div>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={notifications.push_notifications}
                          onChange={(e) => setNotifications({ ...notifications, push_notifications: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    className="btn-save"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Preferências'}
                  </button>
                </div>
              )}

              {/* Segurança Tab */}
              {activeTab === 'seguranca' && (
                <div className="content-panel">
                  <div className="panel-header">
                    <h2>Segurança</h2>
                    <p>Mantenha sua conta protegida</p>
                  </div>

                  <div className="security-section">
                    <h3>🔑 Alterar Senha</h3>
                    
                    <form onSubmit={handleUpdatePassword} className="password-form">
                      <div className="form-group">
                        <label htmlFor="new_password">Nova Senha</label>
                        <input
                          type="password"
                          id="new_password"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirm_password">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          id="confirm_password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          placeholder="Digite a senha novamente"
                          minLength={6}
                          required
                        />
                      </div>

                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Alterando...' : 'Alterar Senha'}
                      </button>
                    </form>
                  </div>

                  <div className="info-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div>
                      <strong>Dica de segurança</strong>
                      <p>Use uma senha forte com letras, números e caracteres especiais. Nunca compartilhe sua senha.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conta Tab */}
              {activeTab === 'conta' && (
                <div className="content-panel">
                  <div className="panel-header">
                    <h2>Sua Conta</h2>
                    <p>Informações e ações da conta</p>
                  </div>

                  <div className="account-info">
                    <div className="info-row">
                      <span className="info-label">Nome:</span>
                      <span className="info-value">{profile?.full_name || 'Usuário'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">E-mail:</span>
                      <span className="info-value">{user?.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Tipo de conta:</span>
                      <span className="info-value">
                        {profile?.user_type === 'psychologist' ? '👨‍⚕️ Psicólogo' : '👤 Paciente'}
                      </span>
                    </div>
                  </div>

                  <Link href="/perfil" className="btn-edit-profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar Informações do Perfil
                  </Link>

                  <div className="danger-zone">
                    <h3>⚠️ Zona de Perigo</h3>
                    
                    <div className="danger-box">
                      <div>
                        <strong>Excluir Conta Permanentemente</strong>
                        <p>Uma vez excluída, sua conta não poderá ser recuperada. Todos os seus dados serão permanentemente removidos.</p>
                      </div>
                      <button 
                        className="btn-danger"
                        onClick={handleDeleteAccount}
                        disabled={saving}
                      >
                        Excluir Conta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </>
  )
}

const styles = `
  .config-page {
    min-height: 100vh;
    background: #faf9fc;
    padding: 120px 24px 60px;
  }

  .config-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Header */
  .config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .config-header h1 {
    font-size: 32px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .config-header p {
    color: #6b5d7a;
    font-size: 16px;
  }

  .btn-back {
    padding: 10px 20px;
    border-radius: 10px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    background: white;
    color: #7c65b5;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .btn-back:hover {
    border-color: #7c65b5;
    background: rgba(124, 101, 181, 0.05);
  }

  /* Alert Messages */
  .alert {
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
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

  .alert-success {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    border: 2px solid rgba(34, 197, 94, 0.2);
  }

  .alert-error {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 2px solid rgba(239, 68, 68, 0.2);
  }

  /* Grid Layout */
  .config-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
  }

  /* Sidebar */
  .config-sidebar {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
    height: fit-content;
  }

  .sidebar-btn,
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: #6b5d7a;
    font-weight: 600;
    font-size: 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    margin-bottom: 4px;
  }

  .sidebar-btn:hover,
  .sidebar-link:hover {
    background: rgba(124, 101, 181, 0.05);
    color: #7c65b5;
  }

  .sidebar-btn.active {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
  }

  .sidebar-link.danger {
    color: #dc2626;
  }

  .sidebar-link.danger:hover {
    background: rgba(220, 38, 38, 0.05);
  }

  .sidebar-divider {
    height: 2px;
    background: rgba(124, 101, 181, 0.1);
    margin: 12px 0;
  }

  /* Content Panel */
  .config-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(124, 101, 181, 0.08);
  }

  .content-panel {
    padding: 32px;
  }

  .panel-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid rgba(124, 101, 181, 0.1);
  }

  .panel-header h2 {
    font-size: 24px;
    font-weight: 800;
    color: #2d1f3e;
    margin-bottom: 8px;
  }

  .panel-header p {
    color: #6b5d7a;
    font-size: 15px;
  }

  /* Settings List */
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border: 2px solid rgba(124, 101, 181, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .setting-item:hover {
    border-color: rgba(124, 101, 181, 0.3);
    background: rgba(124, 101, 181, 0.02);
  }

  .setting-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .setting-icon {
    width: 40px;
    height: 40px;
    background: rgba(124, 101, 181, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7c65b5;
    flex-shrink: 0;
  }

  .setting-info strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 4px;
  }

  .setting-info span {
    font-size: 13px;
    color: #6b5d7a;
  }

  /* Toggle Switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ddd;
    transition: 0.3s;
    border-radius: 34px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  .toggle input:checked + .toggle-slider {
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
  }

  .toggle input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }

  /* Security Section */
  .security-section {
    margin-bottom: 32px;
  }

  .security-section h3 {
    font-size: 18px;
    font-weight: 700;
    color: #2d1f3e;
    margin-bottom: 20px;
  }

  .password-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-weight: 600;
    color: #2d1f3e;
    font-size: 14px;
  }

  .form-group input {
    padding: 12px 16px;
    border: 2px solid rgba(124, 101, 181, 0.2);
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #7c65b5;
    box-shadow: 0 0 0 3px rgba(124, 101, 181, 0.1);
  }

  /* Account Info */
  .account-info {
    background: rgba(124, 101, 181, 0.05);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(124, 101, 181, 0.1);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 14px;
    color: #6b5d7a;
    font-weight: 600;
  }

  .info-value {
    font-size: 15px;
    color: #2d1f3e;
    font-weight: 600;
  }

  /* Buttons */
  .btn-save,
  .btn-edit-profile {
    padding: 14px 32px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
    color: white;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .btn-save:hover:not(:disabled),
  .btn-edit-profile:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(124, 101, 181, 0.3);
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-edit-profile {
    margin-bottom: 32px;
  }

  /* Info Box */
  .info-box {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: rgba(59, 130, 246, 0.05);
    border: 2px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    margin-top: 24px;
  }

  .info-box svg {
    color: #3b82f6;
    flex-shrink: 0;
  }

  .info-box strong {
    display: block;
    font-size: 15px;
    color: #2d1f3e;
    margin-bottom: 6px;
  }

  .info-box p {
    font-size: 14px;
    color: #6b5d7a;
    line-height: 1.5;
  }

  /* Danger Zone */
  .danger-zone {
    border-top: 2px solid rgba(239, 68, 68, 0.2);
    padding-top: 32px;
    margin-top: 32px;
  }

  .danger-zone h3 {
    font-size: 18px;
    font-weight: 700;
    color: #dc2626;
    margin-bottom: 20px;
  }

  .danger-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 24px;
    background: rgba(239, 68, 68, 0.05);
    border: 2px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
  }

  .danger-box strong {
    display: block;
    font-size: 16px;
    color: #dc2626;
    margin-bottom: 6px;
  }

  .danger-box p {
    font-size: 14px;
    color: #6b5d7a;
    line-height: 1.5;
  }

  .btn-danger {
    padding: 12px 24px;
    border: 2px solid #dc2626;
    border-radius: 10px;
    background: white;
    color: #dc2626;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
    color: white;
  }

  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading p {
    color: #6b5d7a;
    font-size: 16px;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .config-grid {
      grid-template-columns: 1fr;
    }

    .config-sidebar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .sidebar-divider {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .config-page {
      padding: 100px 16px 40px;
    }

    .config-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .config-header h1 {
      font-size: 26px;
    }

    .content-panel {
      padding: 24px 20px;
    }

    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .setting-info {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .toggle {
      align-self: flex-end;
    }

    .danger-box {
      flex-direction: column;
      align-items: flex-start;
    }

    .btn-danger,
    .btn-save,
    .btn-edit-profile {
      width: 100%;
      justify-content: center;
    }

    .config-sidebar {
      grid-template-columns: 1fr;
    }
  }
`