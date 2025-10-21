// components/ui/FormField.tsx
'use client'

import React from 'react'

interface FormFieldProps {
  children: React.ReactNode
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  error,
  hint,
  required,
  className = ''
}) => {
  return (
    <>
      <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
        {label && (
          <label className="form-field-label">
            {label}
            {required && <span className="form-field-required">*</span>}
          </label>
        )}
        
        <div className="form-field-input">
          {children}
        </div>
        
        {error && (
          <span className="form-field-error-message">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </span>
        )}
        
        {hint && !error && (
          <span className="form-field-hint">{hint}</span>
        )}
      </div>

      <style jsx>{`
        .form-field {
          margin-bottom: var(--spacing-lg);
        }

        .form-field-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--dark);
          margin-bottom: var(--spacing-sm);
        }

        .form-field-required {
          color: var(--error);
          margin-left: 4px;
        }

        .form-field-input {
          width: 100%;
        }

        .form-field-error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--error);
          font-size: 13px;
          margin-top: 6px;
          animation: fadeInUp 0.3s ease;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .form-field-hint {
          display: block;
          color: var(--gray);
          font-size: 13px;
          margin-top: 6px;
        }

        /* Estado de erro */
        .form-field-error .form-field-label {
          color: var(--error);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export default FormField