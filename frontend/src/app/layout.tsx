'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const isOnboardingPage = pathname === '/onboarding';
  const isLoginPage = pathname === '/login';

  if (isOnboardingPage || isLoginPage) {
    // Full-screen layout for onboarding and login
    return <main>{children}</main>;
  }

  if (isLoading) {
    // Show loading spinner while verifying authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Don't show navigation if not authenticated
    return <main>{children}</main>;
  }

  // Main app layout with navigation
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  )
}