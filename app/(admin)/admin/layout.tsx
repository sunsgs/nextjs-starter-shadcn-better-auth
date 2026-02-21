import '@/app/globals.css'
import { Providers } from '@/components/providers/tanstack-provider'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Site administration',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* QueryClient lives here — available to all admin client components */}
          <Providers>
            <div className='max-w-5xl mx-auto px-4 py-8'>
              {children}
            </div>
            {/* Toaster here so toasts work everywhere in the admin shell */}
            <Toaster richColors closeButton />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}