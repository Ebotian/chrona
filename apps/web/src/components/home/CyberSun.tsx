'use client';

import { motion } from 'framer-motion';
import styles from './cyberSun.module.css';

type ArcConfig = {
  id: string;
  path: string;
  stroke: string;
  delay: number;
  strokeWidth: number;
  opacity: number;
  dashArray?: string;
};

const arcs: ArcConfig[] = [
  {
    id: 'outer',
    path: 'M12 200 A248 248 0 0 1 508 200',
    stroke: 'rgba(0, 216, 255, 0.78)',
    delay: 2,
    strokeWidth: 2.2,
    opacity: 0.7,
    dashArray: '12 18',
  },
  {
    id: 'para-1',
    path: 'M48 200 A212 212 0 0 1 472 200',
    stroke: 'rgba(255, 64, 170, 0.92)',
    delay: 2.12,
    strokeWidth: 2.6,
    opacity: 0.85,
    dashArray: '16 14',
  },
  {
    id: 'para-2',
    path: 'M88 200 A172 172 0 0 1 432 200',
    stroke: 'rgba(0, 228, 255, 0.86)',
    delay: 2.24,
    strokeWidth: 2.8,
    opacity: 0.92,
    dashArray: '20 12',
  },
  {
    id: 'inner',
    path: 'M132 200 A128 128 0 0 1 388 200',
    stroke: 'rgba(255, 141, 0, 0.95)',
    delay: 2.36,
    strokeWidth: 3.2,
    opacity: 1,
  },
];

const conduits = [
  {
    id: 'left',
    d: 'M150 200 C206 176 238 152 264 132',
    delay: 1.85,
  },
  {
    id: 'right',
    d: 'M370 200 C314 176 282 152 256 132',
    delay: 1.85,
  },
];

const sunSegments = [
  {
    id: 'inner-left',
    d: 'M210 182 C230 174 240 168 260 160',
    delay: 2.05,
  },
  {
    id: 'inner-right',
    d: 'M310 182 C290 174 280 168 260 160',
    delay: 2.05,
  },
  {
    id: 'crest',
    d: 'M228 152 Q260 136 292 152',
    delay: 2.18,
  },
];

export default function CyberSun() {
  return (
    <motion.div
      className={styles.container}
      initial={{ y: 36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.9, duration: 1.2, ease: [0.7, 0, 0.3, 1] as const }}
    >
      <div className={styles.sunGlow} />
      <motion.svg className={styles.svg} viewBox="0 0 520 220" preserveAspectRatio="none">
        {conduits.map((conduit) => (
          <motion.path
            key={conduit.id}
            d={conduit.d}
            stroke="rgba(0, 247, 255, 0.6)"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{
              delay: conduit.delay,
              duration: 1,
              ease: [0.7, 0, 0.3, 1] as const,
            }}
          />
        ))}
        {sunSegments.map((segment) => (
          <motion.path
            key={segment.id}
            d={segment.d}
            stroke="rgba(255, 136, 0, 0.85)"
            strokeWidth={2.4}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.92 }}
            transition={{
              delay: segment.delay,
              duration: 0.9,
              ease: [0.65, 0, 0.35, 1] as const,
            }}
          />
        ))}
        {arcs.map((arc) => (
          <motion.path
            key={arc.id}
            d={arc.path}
            stroke={arc.stroke}
            strokeWidth={arc.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={arc.dashArray}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: arc.opacity }}
            transition={{
              delay: arc.delay,
              duration: 1.2,
              ease: [0.65, 0, 0.35, 1] as const,
            }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}
