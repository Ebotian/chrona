'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'chrono-motion-preference';

type StoredPreference = 'reduced' | 'full';

function readStoredPreference(): StoredPreference | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.localStorage.getItem(STORAGE_KEY) as StoredPreference | null;
  return value === 'reduced' || value === 'full' ? value : null;
}

function getSystemPreference(): StoredPreference {
  if (typeof window === 'undefined') {
    return 'full';
  }
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches ? 'reduced' : 'full';
}

export function useMotionPreference() {
  const [preference, setPreference] = useState<StoredPreference>(
    () => readStoredPreference() ?? getSystemPreference(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      const stored = readStoredPreference();
      setPreference(stored ?? (mediaQuery.matches ? 'reduced' : 'full'));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updatePreference = useCallback((next: boolean) => {
    const value: StoredPreference = next ? 'reduced' : 'full';
    setPreference(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  return {
    reducedMotion: preference === 'reduced',
    setReducedMotion: updatePreference,
  };
}
