// components/ui/Toast.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    // Retorna funções dummy ao invés de jogar erro
    console.warn('useToast sendo usado fora do ToastProvider. As notificações não funcionarão.')
    return {
      showToast: () => {},
      hideToast: () => {}
    }
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string, 
    type: Toast['type'] = 'info', 
    duration = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#10B981" opacity="0.2"/>
            <path d="M6 10L9 13L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#EF4444" opacity="0.2"/>
            <path d="M7 7L13 13M13 7L7 13" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#F59E0B" opacity="0.2"/>
            <path d="M10 6V11M10 14H10.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'info':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#3B82F6" opacity="0.2"/>
            <path d="M10 9V14M10 6H10.01" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
    }
  }

  const getColorClass = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'toast-success'
      case 'error':
        return 'toast-error'
      case 'warning':
        return 'toast-warning'
      case 'info':
        return 'toast-info'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast ${getColorClass(toast.type)}`}
              role="alert"
              aria-live="polite"
            >
              <div className="toast-icon">
                {getIcon(toast.type)}
              </div>
              <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
              </div>
              <button 
                className="toast-close"
                onClick={() => hideToast(toast.id)}
                aria-label="Fechar notificação"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
          min-width: 320px;
          max-width: 420px;
          pointer-events: all;
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transition: all 0.2s ease;
          border-left: 3px solid;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .toast:hover {
          transform: translateX(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
        }

        .toast-success {
          border-left-color: #10B981;
        }

        .toast-error {
          border-left-color: #EF4444;
        }

        .toast-warning {
          border-left-color: #F59E0B;
        }

        .toast-info {
          border-left-color: #3B82F6;
        }

        .toast-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-message {
          color: #2D1F3E;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 500;
          margin: 0;
          word-wrap: break-word;
        }

        .toast-close {
          flex-shrink: 0;
          background: none;
          border: none;
          color: #9B8FAB;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
          margin-top: 2px;
        }

        .toast-close:hover {
          background: rgba(139, 122, 184, 0.1);
          color: #2D1F3E;
        }

        .toast-close:active {
          transform: scale(0.95);
        }

        /* Responsivo */
        @media (max-width: 640px) {
          .toast-container {
            top: auto;
            bottom: 20px;
            left: 16px;
            right: 16px;
          }

          .toast {
            min-width: auto;
            max-width: 100%;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }

        /* Acessibilidade - reduzir movimento */
        @media (prefers-reduced-motion: reduce) {
          .toast {
            animation: none;
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export default ToastProvider