// components/ui/Input.tsx
'use client'

import React, { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

    return (
      <>
        <div className="input-wrapper">
          {label && (
            <label className="input-label">
              {label}
              {props.required && <span className="input-required">*</span>}
            </label>
          )}
          
          <div className="input-container">
            {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
            
            <input
              ref={ref}
              type={inputType}
              className={`input ${error ? 'input-error' : ''} ${leftIcon ? 'has-left-icon' : ''} ${rightIcon || showPasswordToggle ? 'has-right-icon' : ''} ${className}`}
              {...props}
            />
            
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                className="input-icon input-icon-right input-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
            
            {rightIcon && !showPasswordToggle && (
              <span className="input-icon input-icon-right">{rightIcon}</span>
            )}
          </div>
          
          {error && <span className="input-error-message">{error}</span>}
          {hint && !error && <span className="input-hint">{hint}</span>}
        </div>

        <style jsx>{`
          .input-wrapper {
            width: 100%;
            margin-bottom: var(--spacing-md);
          }

          .input-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: var(--dark);
            margin-bottom: var(--spacing-sm);
          }

          .input-required {
            color: var(--error);
            margin-left: 2px;
          }

          .input-container {
            position: relative;
            width: 100%;
          }

          .input {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 2px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--white);
            transition: all var(--transition-base);
            font-family: inherit;
          }

          .input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(124, 101, 181, 0.1);
          }

          .input:disabled {
            background: var(--gray-lighter);
            cursor: not-allowed;
            opacity: 0.7;
          }

          .input.has-left-icon {
            padding-left: 44px;
          }

          .input.has-right-icon {
            padding-right: 44px;
          }

          .input-error {
            border-color: var(--error);
          }

          .input-error:focus {
            border-color: var(--error);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
          }

          .input-icon {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }

          .input-icon-left {
            left: 16px;
          }

          .input-icon-right {
            right: 16px;
          }

          .input-password-toggle {
            pointer-events: auto;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            font-size: 18px;
            transition: color var(--transition-base);
          }

          .input-password-toggle:hover {
            color: var(--primary);
          }

          .input-error-message {
            display: block;
            color: var(--error);
            font-size: 12px;
            margin-top: 4px;
            animation: fadeInUp 0.3s ease;
          }

          .input-hint {
            display: block;
            color: var(--gray);
            font-size: 12px;
            margin-top: 4px;
          }
        `}</style>
      </>
    )
  }
)

Input.displayName = 'Input'

export default Input