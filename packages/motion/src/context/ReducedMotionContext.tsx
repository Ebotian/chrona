'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

const ReducedMotionContext = createContext(false);

export interface ReducedMotionProviderProps {
  children: ReactNode;
}

export function ReducedMotionProvider({ children }: ReducedMotionProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <ReducedMotionContext.Provider value={prefersReducedMotion}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}

export function useReducedMotionGuard() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!prefersReducedMotion) {
      return undefined;
    }

    document.documentElement.setAttribute('data-prefers-reduced-motion', 'true');
    return () => document.documentElement.removeAttribute('data-prefers-reduced-motion');
  }, [prefersReducedMotion]);
}
