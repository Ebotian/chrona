'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type MotionPreferenceValue = {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
};

const MotionPreferenceContext = createContext<MotionPreferenceValue | undefined>(undefined);

export interface MotionPreferenceProviderProps {
  value: MotionPreferenceValue;
  children: ReactNode;
}

export function MotionPreferenceProvider({ value, children }: MotionPreferenceProviderProps) {
  return (
    <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>
  );
}

export function useChronoMotion(): MotionPreferenceValue {
  const context = useContext(MotionPreferenceContext);
  if (!context) {
    throw new Error('useChronoMotion must be used within a ChronoProvider');
  }
  return context;
}
