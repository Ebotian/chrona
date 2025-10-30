import { useEffect, useMemo, useState } from 'react';
import { useScrollSnapshot } from '../context/ScrollContext.js';

export interface ChronoScrollContextOptions {
  /**
   * Smoothing factor applied when deriving the eased progress.
   * A value between 0 and 1, where higher values converge faster.
   */
  smoothing?: number;
  /**
   * Optional velocity clamp to avoid excessive spikes (px/ms).
   */
  maxVelocity?: number;
}

export interface ChronoScrollState {
  /** Normalised scroll progress between 0 - 1. */
  progress: number;
  /** Smoothed progress using exponential smoothing. */
  easedProgress: number;
  /** Raw scroll position in pixels. */
  position: number;
  /** Velocity in px/ms (clamped if configured). */
  velocity: number;
  /** Scroll direction. */
  direction: 'up' | 'down';
  /** Delta between instantaneous and smoothed progress. */
  delta: number;
}

export function useChronoScrollContext(
  options: ChronoScrollContextOptions = {},
): ChronoScrollState {
  const { smoothing = 0.1, maxVelocity } = options;
  const snapshot = useScrollSnapshot();
  const [easedProgress, setEasedProgress] = useState(snapshot.progress);

  useEffect(() => {
    setEasedProgress((prev) => smoothValue(prev, snapshot.progress, smoothing));
  }, [snapshot.progress, smoothing]);

  const safeVelocity = useMemo(() => {
    if (typeof maxVelocity !== 'number' || !Number.isFinite(maxVelocity)) {
      return snapshot.velocity;
    }
    return clamp(snapshot.velocity, -Math.abs(maxVelocity), Math.abs(maxVelocity));
  }, [snapshot.velocity, maxVelocity]);

  return useMemo(() => {
    const delta = snapshot.progress - easedProgress;
    return {
      progress: snapshot.progress,
      easedProgress,
      position: snapshot.position,
      velocity: safeVelocity,
      direction: snapshot.direction,
      delta,
    } satisfies ChronoScrollState;
  }, [snapshot.progress, snapshot.position, snapshot.direction, easedProgress, safeVelocity]);
}

function smoothValue(previous: number, next: number, smoothing: number) {
  const factor = clamp(smoothing, 0, 1);
  return previous + (next - previous) * factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
