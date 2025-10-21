// components/ui/Spinner.tsx
'use client'

import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  fullScreen?: boolean
  label?: string
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  label = 'Carregando...'
}) => {
  const spinner = (
    <>
      <div className={`spinner spinner-${size} spinner-${color}`}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {label && <span className="spinner-label">{label}</span>}
    </>
  )

  if (fullScreen) {
    return (
      <>
        <div className="spinner-overlay">
          <div className="spinner-container">
            {spinner}
          </div>
        </div>
        <style jsx>{`
          .spinner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(4px);
            z-index: var(--z-overlay);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .spinner-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-md);
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <div className="spinner-wrapper">
        {spinner}
      </div>

      <style jsx>{`
        .spinner-wrapper {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .spinner {
          display: inline-flex;
          gap: 4px;
        }

        /* Tamanhos */
        .spinner-sm .spinner-circle {
          width: 8px;
          height: 8px;
        }

        .spinner-md .spinner-circle {
          width: 12px;
          height: 12px;
        }

        .spinner-lg .spinner-circle {
          width: 16px;
          height: 16px;
        }

        .spinner-xl .spinner-circle {
          width: 20px;
          height: 20px;
        }

        /* Cores */
        .spinner-primary .spinner-circle {
          background: var(--primary);
        }

        .spinner-white .spinner-circle {
          background: var(--white);
        }

        .spinner-gray .spinner-circle {
          background: var(--gray);
        }

        /* Animação */
        .spinner-circle {
          border-radius: 50%;
          animation: spinner-bounce 1.4s infinite ease-in-out both;
        }

        .spinner-circle:nth-child(1) {
          animation-delay: -0.32s;
        }

        .spinner-circle:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes spinner-bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .spinner-label {
          color: var(--gray);
          font-size: 14px;
          margin-top: var(--spacing-sm);
        }
      `}</style>
    </>
  )
}

export default Spinner