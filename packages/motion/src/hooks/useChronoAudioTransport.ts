'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '../context/ReducedMotionContext';

export interface ChronoAudioTransportOptions {
  bpm?: number;
  loopBeats?: number;
  loopSeconds?: number;
  autoplay?: boolean;
  audioUrl?: string;
  volume?: number;
}

export interface ChronoAudioTransport {
  beatRef: React.MutableRefObject<number>;
  loopProgressRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
  playingRef: React.MutableRefObject<boolean>;
  audioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  setPlaying(next: boolean): void;
  toggle(): void;
  bpm: number;
  loopDuration: number;
}

const DEFAULT_BPM = 96;
const RAF_FALLBACK_DELAY = 1 / 60;

export function useChronoAudioTransport(
  options: ChronoAudioTransportOptions = {},
): ChronoAudioTransport {
  const {
    bpm = DEFAULT_BPM,
    loopBeats = 16,
    loopSeconds,
    autoplay = false,
    audioUrl,
    volume = 0.55,
  } = options;

  const reducedMotion = useReducedMotion();
  const beatRef = useRef(0);
  const elapsedRef = useRef(0);
  const loopProgressRef = useRef(0);
  const playingRef = useRef(autoplay && !reducedMotion);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const loopDuration = useMemo(() => {
    if (typeof loopSeconds === 'number' && loopSeconds > 0) {
      return loopSeconds;
    }
    const beatDuration = 60 / bpm;
    const beats = Math.max(1, loopBeats);
    return beatDuration * beats;
  }, [bpm, loopBeats, loopSeconds]);

  useEffect(() => {
    if (!audioUrl || typeof window === 'undefined') {
      return;
    }

    const element = document.createElement('audio');
    element.src = audioUrl;
    element.loop = true;
    element.crossOrigin = 'anonymous';
    element.preload = 'auto';
    element.volume = Math.max(0, Math.min(1, volume));
    audioElementRef.current = element;

    const playIfAllowed = async () => {
      if (!playingRef.current || reducedMotion) return;
      try {
        await element.play();
      } catch (error) {
        playingRef.current = false;
        // Autoplay may be blocked; we silently ignore.
      }
    };

    playIfAllowed();

    return () => {
      element.pause();
      audioElementRef.current = null;
    };
  }, [audioUrl, reducedMotion, volume]);

  useEffect(() => {
    if (reducedMotion && playingRef.current) {
      const element = audioElementRef.current;
      if (element) {
        element.pause();
      }
      playingRef.current = false;
    }
  }, [reducedMotion]);

  useEffect(() => {
    let frame: number | undefined;
    let lastTime: number | undefined;

    const step = (time: number) => {
      if (lastTime === undefined) {
        lastTime = time;
      }
      const deltaSeconds = playingRef.current ? (time - lastTime) / 1000 : RAF_FALLBACK_DELAY;
      lastTime = time;

      if (playingRef.current) {
        elapsedRef.current += deltaSeconds;
        const beatDuration = 60 / bpm;
        beatRef.current += deltaSeconds / beatDuration;
        const loop = loopDuration > 0 ? elapsedRef.current % loopDuration : 0;
        loopProgressRef.current = loopDuration > 0 ? loop / loopDuration : 0;
      }

      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [bpm, loopDuration]);

  const setPlaying = useCallback(
    (next: boolean) => {
      if (reducedMotion) {
        playingRef.current = false;
        const element = audioElementRef.current;
        if (element) element.pause();
        return;
      }

      playingRef.current = next;
      const element = audioElementRef.current;
      if (!element) return;

      if (next) {
        element.play().catch(() => {
          playingRef.current = false;
        });
      } else {
        element.pause();
      }
    },
    [reducedMotion],
  );

  const toggle = useCallback(() => {
    setPlaying(!playingRef.current);
  }, [setPlaying]);

  return {
    beatRef,
    loopProgressRef,
    elapsedRef,
    playingRef,
    audioElementRef,
    setPlaying,
    toggle,
    bpm,
    loopDuration,
  };
}
