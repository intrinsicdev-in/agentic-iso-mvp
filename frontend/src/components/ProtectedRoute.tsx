'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('SUPER_ADMIN' | 'ACCOUNT_ADMIN' | 'USER')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User doesn't have permission, redirect to appropriate page
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
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect to appropriate page
  }

  return <>{children}</>;
}