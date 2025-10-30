'use client';

import { useEffect, useMemo, type ElementType, type PropsWithChildren } from 'react';
import clsx from 'clsx';
import { chronoRootClass } from '../theme/global.css.js';
import { useMotionPreference } from '../hooks/useMotionPreference.js';
import { MotionPreferenceProvider } from '../context/MotionPreferenceContext.js';

export interface ChronoProviderProps {
  as?: ElementType;
  className?: string;
  enableSurfaceNoise?: boolean;
}

export function ChronoProvider({
  as,
  className,
  enableSurfaceNoise = true,
  children,
}: PropsWithChildren<ChronoProviderProps>) {
  const { reducedMotion, setReducedMotion } = useMotionPreference();
  const value = useMemo(
    () => ({ reducedMotion, setReducedMotion }),
    [reducedMotion, setReducedMotion],
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
    document.documentElement.dataset.surfaceNoise = enableSurfaceNoise ? 'on' : 'off';
  }, [reducedMotion, enableSurfaceNoise]);

  const Component: ElementType = as ?? 'div';

  return (
    <MotionPreferenceProvider value={value}>
      <Component
        className={clsx(chronoRootClass, className)}
        data-motion={reducedMotion ? 'reduced' : 'full'}
        data-surface-noise={enableSurfaceNoise ? 'on' : 'off'}
      >
        {children}
      </Component>
    </MotionPreferenceProvider>
  );
}
