'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';

export type AudioPreferenceState = {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
};

const storageKey = 'chrono-audio-preference';

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storageFactory = () => (typeof window !== 'undefined' ? window.localStorage : memoryStorage);

export const useAudioPreference = create<AudioPreferenceState>()(
  persist(
    (set) => ({
      muted: true,
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
    }),
    {
      name: storageKey,
      storage: createJSONStorage(storageFactory),
      skipHydration: true,
    },
  ),
);
