'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@chrono/motion';
import BackgroundCanvas from './BackgroundCanvas';
import Preloader from './Preloader';
import SloganCluster from './SloganCluster';
import AudioToggle from './AudioToggle';
import styles from './HomeImmersionLayer.module.css';

const REVEAL_DURATION_MS = 900;

function easeOutCubic(t: number) {
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

export function HomeImmersionLayer() {
  const prefersReducedMotion = useReducedMotion();
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const [revealProgress, setRevealProgress] = useState(prefersReducedMotion ? 1 : 0);
  const animationFrame = useRef<number | null>(null);

  const handlePreloaderComplete = useCallback(() => {
    setPreloaderComplete(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      const frame = requestAnimationFrame(() => {
        setPreloaderComplete(true);
        setRevealProgress(1);
      });

      return () => cancelAnimationFrame(frame);
    }

    if (!preloaderComplete) {
      return () => undefined;
    }

    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) {
        start = timestamp;
      }

      const elapsed = timestamp - start;
      const rawProgress = Math.min(1, elapsed / REVEAL_DURATION_MS);
      setRevealProgress(easeOutCubic(rawProgress));

      if (rawProgress < 1) {
        animationFrame.current = requestAnimationFrame(step);
      }
    };

    animationFrame.current = requestAnimationFrame(step);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [prefersReducedMotion, preloaderComplete]);

  useEffect(() => {
    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.background}>
        <BackgroundCanvas active={preloaderComplete} />
      </div>

      <div className={styles.inner}>
        <div className={styles.content}>
          <SloganCluster reveal={revealProgress} />
        </div>
      </div>

      <AudioToggle className={styles.audioToggle ?? ''} active={preloaderComplete} />

      <div className={styles.preloader}>
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    </div>
  );
}

export default HomeImmersionLayer;
