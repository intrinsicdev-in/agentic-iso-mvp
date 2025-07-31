'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'SUPER_ADMIN':
            router.push('/admin');
            break;
          case 'ACCOUNT_ADMIN':
            router.push('/admin/organization');
            break;
          case 'USER':
            router.push('/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return null; // Will redirect
}