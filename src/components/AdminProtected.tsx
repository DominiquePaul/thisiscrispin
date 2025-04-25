"use client";

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectToHome?: boolean;
}

/**
 * A component that only renders its children if the user is authenticated as an admin.
 * Otherwise, it renders the fallback content.
 */
export default function AdminProtected({ 
  children, 
  fallback = null,
  redirectToHome = false
}: AdminProtectedProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // If redirectToHome is true and the user is not authenticated, redirect to homepage
  useEffect(() => {
    if (redirectToHome && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, redirectToHome, router]);
  
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
} 