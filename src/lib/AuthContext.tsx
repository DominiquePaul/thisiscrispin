"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLocked: boolean;
  errorMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Check authentication status on initial load and periodically
  const checkAuthStatus = async () => {
    try {
      // Simple request to see if authentication cookies are valid
      const response = await fetch('/api/contentful/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // If we get a 200 response, we're authenticated
      // If we get a 401, we're not
      setIsAuthenticated(response.status === 200);
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };
  
  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status every minute
    const interval = setInterval(checkAuthStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include', // Important to include cookies
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        // Too many requests - account is locked
        setIsLocked(true);
        setErrorMessage(data.message);
        return false;
      }
      
      if (data.success) {
        setIsAuthenticated(true);
        setErrorMessage('');
        return true;
      } else {
        setErrorMessage(data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An error occurred during authentication. Please try again.');
      return false;
    }
  };
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      isLocked,
      errorMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
} 