// components/ui/Toast.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
    }
  }

  return (
    <>
      <ToastContext.Provider value={{ showToast }}>
        {children}
        
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
            >
              <span className="toast-icon">{getIcon(toast.type)}</span>
              <span className="toast-message">{toast.message}</span>
              <button 
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </ToastContext.Provider>

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 88px;
          right: var(--spacing-lg);
          z-index: var(--z-toast);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 14px 20px;
          background: var(--white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 300px;
          max-width: 500px;
          pointer-events: all;
          cursor: pointer;
          animation: slideInRight 0.3s ease;
          transition: all var(--transition-base);
          border-left: 4px solid;
        }

        .toast:hover {
          transform: translateX(-4px);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast-success {
          border-left-color: var(--success);
        }

        .toast-error {
          border-left-color: var(--error);
        }

        .toast-warning {
          border-left-color: var(--warning);
        }

        .toast-info {
          border-left-color: var(--info);
        }

        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          color: var(--dark);
          font-size: 14px;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--gray);
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all var(--transition-base);
          flex-shrink: 0;
        }

        .toast-close:hover {
          background: var(--gray-lighter);
          color: var(--dark);
        }

        @media (max-width: 640px) {
          .toast-container {
            top: auto;
            bottom: var(--spacing-lg);
            left: var(--spacing-md);
            right: var(--spacing-md);
          }

          .toast {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}

export default ToastProvider