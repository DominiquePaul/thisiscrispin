"use client";

import { useState, useEffect } from 'react';

interface KeySequenceDetectorProps {
  onSequenceDetected: () => void;
  targetKey: string;
  requiredCount: number;
  timeWindow: number;
}

export default function KeySequenceDetector({
  onSequenceDetected,
  targetKey = 'l',
  requiredCount = 3,
  timeWindow = 1000, // time window in milliseconds
}: KeySequenceDetectorProps) {
  const [keyPresses, setKeyPresses] = useState<number[]>([]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key presses if the user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      if (event.key.toLowerCase() === targetKey.toLowerCase()) {
        const now = Date.now();
        setKeyPresses(prevKeyPresses => [...prevKeyPresses, now]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKey]);
  
  useEffect(() => {
    // Check if we have at least the required number of key presses
    if (keyPresses.length >= requiredCount) {
      const recentPresses = keyPresses.slice(-requiredCount);
      
      // Check if all key presses happened within the time window
      const firstPress = recentPresses[0];
      const lastPress = recentPresses[recentPresses.length - 1];
      
      if (lastPress - firstPress <= timeWindow) {
        onSequenceDetected();
        // Reset key presses
        setKeyPresses([]);
      }
      
      // Clean up old key presses that are outside the time window
      const now = Date.now();
      setKeyPresses(prevKeyPresses => 
        prevKeyPresses.filter(time => now - time <= timeWindow)
      );
    }
  }, [keyPresses, requiredCount, timeWindow, onSequenceDetected]);
  
  return null; // This component doesn't render anything
} 