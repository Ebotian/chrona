'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@chrono/motion';

type UseAmbientSoundOptions = {
  active: boolean;
  muted: boolean;
  src?: string;
  volume?: number;
};

type TonePlayer = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  volume: {
    value: number;
  };
};

type ToneModule = {
  start: () => Promise<void>;
  getContext: () => { state: string };
  Player: new (config: { url: string; loop: boolean; volume: number }) => TonePlayer;
};

const DEFAULT_VOLUME_DB = -24;
const DEFAULT_SRC = '/audio/ambient-loop.mp3';

export function useAmbientSound(options: UseAmbientSoundOptions): void {
  const { active, muted, src = DEFAULT_SRC, volume = DEFAULT_VOLUME_DB } = options;
  const prefersReducedMotion = useReducedMotion();
  const playerRef = useRef<TonePlayer | null>(null);
  const toneRef = useRef<ToneModule | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let disposed = false;

    async function ensurePlayer() {
      if (playerRef.current || disposed) {
        return;
      }

      if (!toneRef.current) {
        const tone = await import('tone');
        toneRef.current = tone as unknown as ToneModule;
      }

      if (!toneRef.current || disposed) {
        return;
      }

      playerRef.current = new toneRef.current.Player({
        url: src,
        loop: true,
        volume,
      });
    }

    void ensurePlayer();

    return () => {
      disposed = true;
      playerRef.current?.stop();
      playerRef.current?.dispose();
      playerRef.current = null;
      toneRef.current = null;
    };
  }, [src, volume]);

  useEffect(() => {
    if (!toneRef.current || !playerRef.current) {
      return undefined;
    }

    let cancelled = false;

    async function handleState() {
      if (!toneRef.current || !playerRef.current || cancelled) {
        return;
      }

      const shouldPlay = active && !muted && !prefersReducedMotion;

      if (!shouldPlay) {
        playerRef.current.stop();
        return;
      }

      if (toneRef.current.getContext().state !== 'running') {
        await toneRef.current.start();
      }

      if (!cancelled) {
        playerRef.current.volume.value = volume;
        playerRef.current.start();
      }
    }

    void handleState();

    return () => {
      cancelled = true;
    };
  }, [active, muted, prefersReducedMotion, volume]);
}
