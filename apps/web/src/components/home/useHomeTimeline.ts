'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';

export type HomeTimelinePhase = 'idle' | 'drawing' | 'signal' | 'dock' | 'complete';

export interface UseHomeTimelineOptions {
  onComplete?: () => void;
  prefersReducedMotion?: boolean;
}

export interface HomeTimelineState {
  phase: HomeTimelinePhase;
  drawProgress: number;
  signalStrength: number;
  dockProgress: number;
  isComplete: boolean;
}

export function useHomeTimeline(options: UseHomeTimelineOptions = {}): HomeTimelineState {
  const { onComplete, prefersReducedMotion } = options;
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [phase, setPhase] = useState<HomeTimelinePhase>('idle');
  const [drawProgress, setDrawProgress] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);
  const [dockProgress, setDockProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion) {
      return;
    }

    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      setPhase('complete');
      setDrawProgress(1);
      setSignalStrength(0);
      setDockProgress(1);
      setIsComplete(true);
      onComplete?.();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [onComplete, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    const drawProxy = { value: 0 };
    const signalProxy = { value: 0 };
    const dockProxy = { value: 0 };

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        setPhase('complete');
        setIsComplete(true);
        onComplete?.();
      },
    });

    timelineRef.current = timeline;

    timeline.add(() => setPhase('drawing'));
    timeline.to(drawProxy, {
      value: 1,
      duration: 1.1,
      onUpdate: () => setDrawProgress(drawProxy.value),
    });

    timeline.add(() => setPhase('signal'));
    timeline.to(
      signalProxy,
      {
        value: 1,
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
        onUpdate: () => setSignalStrength(signalProxy.value),
        onComplete: () => setSignalStrength(0),
      },
      '>-0.05',
    );

    timeline.add(() => setPhase('dock'));
    timeline.to(dockProxy, {
      value: 1,
      duration: 0.95,
      ease: 'power3.inOut',
      onUpdate: () => setDockProgress(dockProxy.value),
    });

    return () => {
      timeline.kill();
      timelineRef.current = null;
    };
  }, [onComplete, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({
      phase,
      drawProgress,
      signalStrength,
      dockProgress,
      isComplete,
    }),
    [phase, drawProgress, signalStrength, dockProgress, isComplete],
  );
}
