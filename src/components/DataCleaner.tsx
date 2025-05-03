'use client';

import { useEffect } from 'react';

/**
 * DataCleaner component
 * Clears all voyage, invoice, and related data from localStorage ONLY on browser refresh/restart
 * Uses sessionStorage to track if the app has already been initialized in this session
 */
export default function DataCleaner() {
  useEffect(() => {
    // Check if this is a fresh browser session (not just client-side navigation)
    const isInitialized = sessionStorage.getItem('app-initialized');

    if (!isInitialized) {
      // This is a fresh session - clear all sample data
      const keysToRemove: string[] = [];

      // Iterate through all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Remove voyage, invoice, milestone, and attestation data
          if (
            key.startsWith('voyage-') ||
            key.startsWith('milestone-') ||
            key.startsWith('attestation-') ||
            key.startsWith('inv-') ||
            key === 'walletAddress'
          ) {
            keysToRemove.push(key);
          }
        }
      }

      // Remove all identified keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Mark the app as initialized for this session
      sessionStorage.setItem('app-initialized', 'true');

      // Optional: Log cleanup for debugging (can be removed in production)
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleared ${keysToRemove.length} sample data items from localStorage`);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return null; // This component doesn't render anything
}
