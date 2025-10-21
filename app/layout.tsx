// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Psicocompany - Saúde Mental Acessível e Inteligente',
  description: 'Conectamos pessoas, psicólogos e ciência em um ecossistema completo de saúde mental.',
  keywords: 'psicologia, terapia online, saúde mental, TCC, neurociência',
  authors: [{ name: 'Psicocompany' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#7c65b5',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1" style={{ paddingTop: '72px' }}>
              {children}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}