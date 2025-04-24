"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';

interface AdminProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that only renders its children if the user is authenticated as an admin.
 * Otherwise, it renders the fallback content.
 */
export default function AdminProtected({ 
  children, 
  fallback = null 
}: AdminProtectedProps) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
} 