'use client';

import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@chrono/motion';
import { useAudioPreference } from '../../stores/useAudioPreference';
import type { AudioPreferenceState } from '../../stores/useAudioPreference';
import { useAmbientSound } from '../../hooks/useAmbientSound';
import styles from './AudioToggle.module.css';

export interface AudioToggleProps {
  className?: string;
  active: boolean;
}

export function AudioToggle({ className, active }: AudioToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  const muted = useAudioPreference((state: AudioPreferenceState) => state.muted);
  const toggleMuted = useAudioPreference((state: AudioPreferenceState) => state.toggleMuted);
  const setMuted = useAudioPreference((state: AudioPreferenceState) => state.setMuted);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = window.matchMedia('(max-width: 767px)');

    if (!media.matches) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setMuted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [setMuted]);

  useAmbientSound({ active, muted, volume: -22 });

  const handleClick = useCallback(() => {
    toggleMuted();
  }, [toggleMuted]);

  const isDisabled = prefersReducedMotion;

  return (
    <button
      type="button"
      className={[styles.root, className, isDisabled ? styles.disabled : undefined]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      aria-pressed={!muted}
      disabled={isDisabled}
    >
      <motion.span
        className={styles.pulse}
        animate={{ scale: muted || !active ? 0.75 : 1, opacity: muted || !active ? 0.35 : 0.9 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      />
      <motion.span
        className={styles.label}
        animate={{ opacity: muted ? 0.6 : 1, y: muted ? 2 : 0 }}
        transition={{ duration: 0.25 }}
      >
        {muted ? 'Audio Off' : 'Audio On'}
      </motion.span>
      <span className={styles.hint}>
        {prefersReducedMotion ? 'Motion reduced' : 'Ambient sound'}
      </span>
    </button>
  );
}

export default AudioToggle;
