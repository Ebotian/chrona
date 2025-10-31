'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type Lenis from 'lenis';

export interface ScrollSnapshot {
  progress: number;
  position: number;
  velocity: number;
  direction: 'up' | 'down';
}

const ScrollContext = createContext<ScrollSnapshot | null>(null);

export interface ScrollContextProviderProps {
  children: ReactNode;
  lenis: Lenis;
}

export function ScrollContextProvider({ children, lenis }: ScrollContextProviderProps) {
  const [snapshot, setSnapshot] = useState<ScrollSnapshot>({
    progress: 0,
    position: 0,
    velocity: 0,
    direction: 'down',
  });

  useEffect(() => {
    const handler = (event: { scroll: number; velocity?: number; direction: 1 | -1 }) => {
      const documentHeight = document.body.scrollHeight - window.innerHeight;
      const progress = documentHeight > 0 ? event.scroll / documentHeight : 0;

      setSnapshot({
        progress: Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0,
        position: event.scroll,
        velocity: event.velocity ?? 0,
        direction: event.direction === -1 ? 'up' : 'down',
      });
    };

    lenis.on('scroll', handler as never);
    return () => {
      lenis.off('scroll', handler as never);
    };
  }, [lenis]);

  const value = useMemo(() => snapshot, [snapshot]);
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useScrollSnapshot() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollSnapshot must be used inside ScrollContextProvider');
  }
  return context;
}
