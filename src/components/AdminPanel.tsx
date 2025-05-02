"use client";

import { useState } from 'react';
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
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-100 border border-green-300 rounded-md px-3 py-1 text-sm flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Admin Mode</span>
            <button 
              onClick={handleLogout}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
} 