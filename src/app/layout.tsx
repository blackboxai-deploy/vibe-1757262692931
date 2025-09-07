import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Enterprise Sales CRM',
  description: 'Multi-tenant, Cloud-native Sales Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="root" className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}