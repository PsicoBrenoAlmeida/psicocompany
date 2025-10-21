// components/ui/Button.tsx
'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      btn
      btn-${variant}
      btn-${size}
      ${fullWidth ? 'btn-full' : ''}
      ${loading ? 'btn-loading' : ''}
      ${className}
    `.trim()

    return (
      <>
        <button
          ref={ref}
          className={baseStyles}
          disabled={disabled || loading}
          {...props}
        >
          {leftIcon && <span className="btn-icon">{leftIcon}</span>}
          <span className={loading ? 'btn-text-hidden' : ''}>
            {children}
          </span>
          {rightIcon && <span className="btn-icon">{rightIcon}</span>}
          {loading && <span className="btn-spinner"></span>}
        </button>

        <style jsx>{`
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-sm);
            font-weight: 600;
            border-radius: var(--radius-md);
            transition: all var(--transition-base);
            cursor: pointer;
            border: none;
            position: relative;
            overflow: hidden;
            text-decoration: none;
            white-space: nowrap;
          }

          /* Tamanhos */
          .btn-sm {
            padding: 8px 16px;
            font-size: 14px;
          }

          .btn-md {
            padding: 12px 24px;
            font-size: 15px;
          }

          .btn-lg {
            padding: 16px 32px;
            font-size: 16px;
          }

          /* Variantes */
          .btn-primary {
            background: var(--gradient-primary);
            color: var(--white);
            box-shadow: var(--shadow-md);
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }

          .btn-primary:active:not(:disabled) {
            transform: translateY(0);
          }

          .btn-secondary {
            background: var(--white);
            color: var(--primary);
            border: 2px solid var(--primary);
          }

          .btn-secondary:hover:not(:disabled) {
            background: var(--primary-lighter);
            border-color: var(--primary-dark);
          }

          .btn-outline {
            background: transparent;
            color: var(--primary);
            border: 2px solid var(--border);
          }

          .btn-outline:hover:not(:disabled) {
            background: var(--gray-lighter);
            border-color: var(--primary);
          }

          .btn-ghost {
            background: transparent;
            color: var(--dark);
            border: none;
          }

          .btn-ghost:hover:not(:disabled) {
            background: var(--gray-lighter);
          }

          .btn-danger {
            background: var(--error);
            color: var(--white);
          }

          .btn-danger:hover:not(:disabled) {
            background: #dc2626;
            transform: translateY(-2px);
          }

          /* Estados */
          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
          }

          .btn-full {
            width: 100%;
          }

          /* Loading */
          .btn-loading {
            color: transparent;
          }

          .btn-text-hidden {
            visibility: hidden;
          }

          .btn-spinner {
            position: absolute;
            width: 18px;
            height: 18px;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .btn-primary .btn-spinner,
          .btn-danger .btn-spinner {
            border-color: var(--white);
            border-top-color: transparent;
          }

          /* Ícones */
          .btn-icon {
            display: inline-flex;
            align-items: center;
            font-size: 1.1em;
          }

          /* Ripple effect */
          .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }

          .btn:active::before {
            width: 300px;
            height: 300px;
          }
        `}</style>
      </>
    )
  }
)

Button.displayName = 'Button'

export default Button