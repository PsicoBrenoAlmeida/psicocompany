// components/layout/Footer.tsx
'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <footer className="footer">
        {/* Seção principal */}
        <div className="footer-main">
          <div className="footer-container">
            <div className="footer-content">
              {/* Logo e descrição */}
              <div className="footer-brand">
                <Link href="/" className="footer-logo">
                  Psicocompany
                </Link>
                <p className="footer-description">
                  Transformando o acesso à saúde mental através de tecnologia e cuidado humanizado.
                </p>
                <div className="footer-badges">
                  <span className="badge">🔒 100% Seguro</span>
                  <span className="badge">✨ Psicólogos Verificados</span>
                </div>
              </div>

              {/* Soluções */}
              <div className="footer-section">
                <h4 className="footer-title">Soluções</h4>
                <ul className="footer-list">
                  <li><Link href="/seja-psicologo">Seja um Parceiro</Link></li>
                  <li><Link href="/academy">Academy</Link></li>
                  <li><Link href="/empresas">Para Empresas</Link></li>
                  <li><Link href="/ajuda">Central de Ajuda</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="footer-section">
                <h4 className="footer-title">Legal</h4>
                <ul className="footer-list">
                  <li><Link href="/termos">Termos de Uso</Link></li>
                  <li><Link href="/privacidade">Privacidade</Link></li>
                  <li><Link href="/contato">Contato</Link></li>
                </ul>
              </div>

              {/* Conecte-se */}
              <div className="footer-section">
                <h4 className="footer-title">Conecte-se</h4>
                <div className="footer-social">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
                <div className="contact-info">
                  <a href="mailto:contato@psicocompany.com.br" className="contact-link">
                    📧 contato@psicocompany.com.br
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="footer-bottom">
          <div className="footer-container">
            <div className="bottom-content">
              <p className="copyright">
                © {currentYear} Psicocompany. Todos os direitos reservados.
              </p>
              <p className="made-with">
                Feito com <span className="heart">💜</span> em São Paulo, Brasil
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer {
          background: linear-gradient(180deg, #faf9fc 0%, #f4f2fa 100%);
          margin-top: 80px;
          position: relative;
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124, 101, 181, 0.2), transparent);
        }

        .footer-main {
          padding: 60px 0 40px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 48px;
        }

        /* Brand section */
        .footer-brand {
          padding-right: 32px;
        }

        .footer-logo {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 16px;
          transition: transform 0.3s ease;
        }

        .footer-logo:hover {
          transform: translateY(-2px);
        }

        .footer-description {
          color: #6b5d7a;
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .footer-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .badge {
          background: rgba(124, 101, 181, 0.1);
          color: #7c65b5;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Sections */
        .footer-section {
          min-width: 0;
        }

        .footer-title {
          color: #2d1f3e;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-list li {
          margin-bottom: 12px;
        }

        .footer-list a {
          color: #6b5d7a;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-list a:hover {
          color: #7c65b5;
          transform: translateX(4px);
        }

        /* Social links */
        .footer-social {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .social-link {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b5d7a;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .social-link:hover {
          background: linear-gradient(135deg, #7c65b5 0%, #a996dd 100%);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(124, 101, 181, 0.3);
        }

        .social-link svg {
          width: 20px;
          height: 20px;
        }

        /* Contact */
        .contact-info {
          margin-top: 8px;
        }

        .contact-link {
          color: #6b5d7a;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .contact-link:hover {
          color: #7c65b5;
        }

        /* Bottom section */
        .footer-bottom {
          background: white;
          padding: 24px 0;
          border-top: 1px solid rgba(124, 101, 181, 0.1);
        }

        .bottom-content {
          text-align: center;
        }

        .copyright {
          color: #6b5d7a;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .made-with {
          color: #9b8fab;
          font-size: 13px;
        }

        .heart {
          display: inline-block;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.1); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }

        /* Responsivo */
        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }

          .footer-brand {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .footer-main {
            padding: 48px 0 32px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .footer-brand {
            grid-column: span 1;
            padding-right: 0;
            text-align: center;
          }

          .footer-section {
            text-align: center;
          }

          .footer-list a:hover {
            transform: translateX(0);
          }

          .footer-social {
            justify-content: center;
          }

          .footer-badges {
            justify-content: center;
          }

          .contact-link {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            padding: 0 16px;
          }

          .footer-logo {
            font-size: 24px;
          }

          .footer-description {
            font-size: 14px;
          }

          .badge {
            font-size: 12px;
            padding: 4px 10px;
          }

          .footer-title {
            font-size: 15px;
          }

          .copyright {
            font-size: 13px;
          }

          .made-with {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  )
}