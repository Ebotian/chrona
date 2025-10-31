'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './SloganCluster.module.css';

export interface SloganClusterProps {
  className?: string;
  reveal: number;
}

const TITLE = 'Chrono-Stasis Initiative';
const SUBTITLE = 'An immersion-grade chronicle interface engineered for future narrative systems.';
const CTA_LABEL = '> Enter Archive';

const titleLines = TITLE.split(' ');

function TitleLine({ word, index, reveal }: { word: string; index: number; reveal: number }) {
  const delay = index * 0.08;
  const progress = Math.min(1, Math.max(0, reveal - delay));

  return (
    <span
      className={styles.titleWord}
      data-index={index}
      style={{ '--progress': progress } as never}
    >
      {word}
    </span>
  );
}

export const SloganCluster = memo(function SloganCluster({
  className,
  reveal,
}: SloganClusterProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [pointerActive, setPointerActive] = useState(false);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = bounds.width ? ((event.clientX - bounds.left) / bounds.width) * 100 : 50;
    const y = bounds.height ? ((event.clientY - bounds.top) / bounds.height) * 100 : 50;

    setPointer({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
    setPointerActive(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointer({ x: 50, y: 50 });
    setPointerActive(false);
  }, []);

  const rootClassName = useMemo(
    () => [styles.root, className].filter(Boolean).join(' '),
    [className],
  );

  const interactiveStyle = useMemo(
    () =>
      ({
        '--pointer-x': `${pointer.x}%`,
        '--pointer-y': `${pointer.y}%`,
        '--pointer-active': pointerActive ? 1 : 0,
      }) as CSSProperties,
    [pointer.x, pointer.y, pointerActive],
  );

  return (
    <section
      className={rootClassName}
      aria-labelledby="chrono-slogan-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={interactiveStyle}
    >
      <div className={styles.headingGroup}>
        <h1 id="chrono-slogan-title" className={styles.title}>
          {titleLines.map((word, index) => (
            <TitleLine key={word + index} word={word} index={index} reveal={reveal} />
          ))}
        </h1>
        <motion.p
          className={styles.subtitle}
          animate={{ opacity: reveal > 0.6 ? 1 : 0.3, y: reveal > 0.6 ? 0 : 12 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {SUBTITLE}
        </motion.p>
      </div>
      <motion.a
        className={styles.cta}
        href="#articles"
        draggable={false}
        role="button"
        aria-label="Enter the Chrono-Stasis archive"
        animate={{
          scale: reveal > 0.75 ? 1 : 0.92,
          boxShadow:
            reveal > 0.75 ? '0 0 40px rgba(0, 240, 255, 0.45)' : '0 0 12px rgba(0, 240, 255, 0.2)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        data-active={reveal > 0.75}
      >
        <span className={styles.ctaLabel} data-text={CTA_LABEL}>
          {CTA_LABEL}
        </span>
        <span className={styles.ctaHint}>Primary Access Node</span>
      </motion.a>
    </section>
  );
});

export default SloganCluster;
