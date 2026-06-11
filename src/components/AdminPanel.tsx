"use client";

import { useState } from 'react';
import Link from 'next/link';
import KeySequenceDetector from './KeySequenceDetector';
import AdminLoginModal from './AdminLoginModal';
import { useAuth } from '@/lib/AuthContext';

export default function AdminPanel() {
  const [showModal, setShowModal] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  
  const handleSequenceDetected = () => {
    if (!isAuthenticated) {
      setShowModal(true);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <>
      <KeySequenceDetector 
        onSequenceDetected={handleSequenceDetected}
        targetKey="l"
        requiredCount={3}
        timeWindow={1000}
      />
      
      <AdminLoginModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
      
      {isAuthenticated && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 text-sm"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/70"
            title="Admin mode"
            aria-label="Admin mode"
          />
          <Link
            href="/admin/dashboard"
            className="text-[#9A9A9A] transition-colors duration-200 hover:text-[rgb(18,18,22)]"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-[#C8C8C8] transition-colors duration-200 hover:text-[rgb(18,18,22)]"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );
} 