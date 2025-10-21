// components/ui/Card.tsx
'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'bordered' | 'elevated' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  hoverable?: boolean
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
}) => {
  return (
    <>
      <div 
        className={`card card-${variant} card-padding-${padding} ${hoverable ? 'card-hoverable' : ''} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>

      <style jsx>{`
        .card {
          border-radius: var(--radius-lg);
          transition: all var(--transition-base);
          overflow: hidden;
        }

        /* Padding variants */
        .card-padding-none {
          padding: 0;
        }

        .card-padding-sm {
          padding: var(--spacing-md);
        }

        .card-padding-md {
          padding: var(--spacing-lg);
        }

        .card-padding-lg {
          padding: var(--spacing-xl);
        }

        /* Visual variants */
        .card-default {
          background: var(--white);
          border: 1px solid var(--border);
        }

        .card-bordered {
          background: var(--white);
          border: 2px solid var(--primary-light);
        }

        .card-elevated {
          background: var(--white);
          box-shadow: var(--shadow-lg);
          border: none;
        }

        .card-gradient {
          background: var(--gradient-bg);
          border: none;
          position: relative;
        }

        .card-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary);
        }

        /* Hoverable state */
        .card-hoverable {
          cursor: pointer;
        }

        .card-hoverable:hover {
          transform: translateY(-4px);
        }

        .card-default.card-hoverable:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .card-bordered.card-hoverable:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }

        .card-elevated.card-hoverable:hover {
          box-shadow: var(--shadow-xl);
        }

        .card-gradient.card-hoverable:hover {
          box-shadow: var(--shadow-lg);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .card-padding-lg {
            padding: var(--spacing-lg);
          }

          .card-padding-md {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </>
  )
}

export default Card

// Subcomponentes para estruturação
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <>
    <div className={`card-header ${className}`}>{children}</div>
    <style jsx>{`
      .card-header {
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border);
        margin-bottom: var(--spacing-md);
      }
    `}</style>
  </>
)

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <>
    <div className={`card-body ${className}`}>{children}</div>
    <style jsx>{`
      .card-body {
        flex: 1;
      }
    `}</style>
  </>
)

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <>
    <div className={`card-footer ${className}`}>{children}</div>
    <style jsx>{`
      .card-footer {
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border);
        margin-top: var(--spacing-md);
        display: flex;
        gap: var(--spacing-sm);
        justify-content: flex-end;
      }
    `}</style>
  </>
)