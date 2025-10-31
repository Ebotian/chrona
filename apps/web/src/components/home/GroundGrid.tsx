'use client';

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './groundGrid.module.css';

type LineSpec = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
};

const DEFAULT_W = 1200;
const DEFAULT_H = 700;

const GRID_COLS = 28; // verticals density
const GRID_ROWS = 24; // horizontals density

const strokeGrid = 'rgba(244, 244, 244, 0.88)';

export default function GroundGrid() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: DEFAULT_W, h: DEFAULT_H });

  // Minimal, safe ResizeObserver to match the screen/container size
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const Rz: typeof ResizeObserver | undefined = (window as any).ResizeObserver;
    if (Rz) {
      const ro = new Rz((entries) => {
        const cr = entries[0]?.contentRect as DOMRectReadOnly | undefined;
        if (cr)
          setSize({ w: Math.max(1, Math.round(cr.width)), h: Math.max(1, Math.round(cr.height)) });
      });
      ro.observe(el);
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) });
      return () => ro.disconnect();
    } else {
      // Fallback to window size
      const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, []);

  const { verticals, horizontals } = useMemo(
    () => buildGridLines(size.w, size.h),
    [size.w, size.h],
  );

  return (
    <div ref={wrapRef} className={styles.wrapper}>
      {/* 数学定位的纯 SVG 透视网格（无 CSS 3D、无景深雾化） */}
      <div className={styles.gridSurface}>
        <motion.svg
          className={styles.gridSvg}
          viewBox={`0 0 ${size.w} ${size.h}`}
          preserveAspectRatio="none"
          // 只保留射线从边缘入场的动画，不做整体淡入等其他动画
          initial={false}
          animate={false}
        >
          {/* Vertical rays stop at the top-most horizontal row to keep a clean grid cap */}
          {verticals.map((v) => (
            <motion.line
              key={v.key}
              x1={v.x1}
              y1={v.y1}
              x2={v.x2}
              y2={v.y2}
              stroke={strokeGrid}
              strokeWidth={1.6}
              strokeLinecap="butt"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: v.delay, duration: 1.0, ease: [0.7, 0, 0.3, 1] as const }}
            />
          ))}

          {/* Horizontal rays extended to full screen width */}
          {horizontals.map((h) => (
            <motion.line
              key={h.key}
              x1={h.x1}
              y1={h.y1}
              x2={h.x2}
              y2={h.y2}
              stroke={strokeGrid}
              strokeWidth={1.4}
              strokeLinecap="butt"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: h.delay, duration: 0.9, ease: [0.7, 0, 0.3, 1] as const }}
            />
          ))}
        </motion.svg>
      </div>
    </div>
  );
}

function buildGridLines(VIEW_W: number, VIEW_H: number) {
  // Parameters for pure 2D perspective layout (mathematically positioned)
  // Horizon positioned at the FULL-SCREEN golden point: y = H / φ ≈ 0.618H
  const PHI = (1 + Math.sqrt(5)) / 2;
  const horizonY = Math.round(VIEW_H / PHI);
  const nearY = Math.round(VIEW_H * 0.97); // bottom edge where the grid meets the camera
  const vanishingX = VIEW_W / 2; // centered vanishing point (no roll)

  // Horizontal lines: mathematically derived harmonic spacing towards the horizon
  // y(n) = horizon + Δy * ε / (n + ε), with y(0) = nearY, lim n→∞ y(n) = horizon
  const Δy = nearY - horizonY;
  const N = GRID_ROWS; // number of rows to show
  const p = 0.08; // how close the last row is to the horizon as a fraction of Δy
  const epsilon = (p * N) / (1 - p);

  const ys: number[] = [];
  let lastY = -99999;
  for (let n = 0; n <= N; n += 1) {
    const y = horizonY + (Δy * epsilon) / (n + epsilon);
    // skip if too close to horizon to avoid overdraw
    if (y <= horizonY + 4) continue;
    const yy = Math.round(y);
    if (yy !== lastY) {
      ys.push(yy);
      lastY = yy;
    }
  }
  ys.sort((a, b) => a - b);

  // Build full-width horizontals; one segment spans the entire screen.
  const horizontals: LineSpec[] = [];
  ys.forEach((yy, i) => {
    const fromLeft = i % 2 === 0;
    horizontals.push({
      key: `h-${i}`,
      x1: fromLeft ? 0 : VIEW_W,
      y1: yy,
      x2: fromLeft ? VIEW_W : 0,
      y2: yy,
      delay: 0.5 + 0.04 * i,
    });
  });

  // The top-most horizontal determines where vertical rays should stop
  const yTop = ys[0] ?? Math.round(horizonY + (nearY - horizonY) * 0.05);

  // Side-left, side-right, and bottom families — generated via one unified sampler on u
  const verticals: LineSpec[] = [];
  const OVER_X = Math.round(VIEW_W * 0.06);
  const OVER_Y = Math.round(VIEW_H * 0.12);
  // Use a practical near-horizon guard to keep side-family sampling in a stable numeric range
  const EPS_Y = Math.max(20, Math.round(VIEW_H * 0.02));
  const vx = vanishingX;
  const vy = horizonY;
  const yBottom = nearY + OVER_Y;

  const rayToTop = (xStart: number, yStart: number) => {
    const vySeg = vy - yStart;
    const vxSeg = vx - xStart;
    const tTop = (yTop - yStart) / vySeg;
    const xTop = xStart + vxSeg * tTop;
    return { x1: Math.round(xStart), y1: Math.round(yStart), x2: Math.round(xTop), y2: yTop };
  };

  const seenXTop: number[] = [];
  const DX_MIN = 6; // px, de-dup at the cap line

  // Emit left/right pairs using the same |u| to guarantee geometric symmetry
  function emitSidePairs(count: number, delayBase: number, delaySlope: number) {
    const dist = VIEW_W / 2 + OVER_X; // |x_side - vx|
    const uMagMin = dist / (yBottom - vy);
    const uMagMax = dist / EPS_Y;
    for (let i = 0; i <= count; i += 1) {
      const a = i / count;
      const uMag = uMagMin + a * (uMagMax - uMagMin);
      const yStart = vy + dist / uMag; // same for both sides
      if (yStart <= vy + EPS_Y || yStart > yBottom) continue;

      // left (negative u) at x=-OVER_X
      const segL = rayToTop(-OVER_X, yStart);
      const delay = delayBase + delaySlope * a;
      verticals.push({ key: `sl-${i}`, ...segL, delay });

      // right (positive u) at x=VIEW_W+OVER_X
      const segR = rayToTop(VIEW_W + OVER_X, yStart);
      verticals.push({ key: `sr-${i}`, ...segR, delay });
    }
  }

  // Bottom family with uniform u across width (and de-dup on xTop)
  function emitBottom(count: number, delayBase: number, delaySlope: number) {
    const uMin = (-OVER_X - vx) / (yBottom - vy);
    const uMax = (VIEW_W + OVER_X - vx) / (yBottom - vy);
    for (let i = 0; i <= count; i += 1) {
      const a = i / count;
      const u = uMin + a * (uMax - uMin);
      const xStart = vx + u * (yBottom - vy);
      const seg = rayToTop(xStart, yBottom);
      const dup = seenXTop.some((xx) => Math.abs(xx - seg.x2) < DX_MIN);
      if (dup) continue;
      seenXTop.push(seg.x2);
      const edge = Math.min(a, 1 - a);
      const delay = delayBase + delaySlope * edge;
      verticals.push({ key: `sb-${i}`, ...seg, delay });
    }
  }

  const COUNT_SIDE = Math.max(24, GRID_COLS * 2);
  const COUNT_BOTTOM = Math.max(12, GRID_COLS);
  emitSidePairs(COUNT_SIDE, 0.3, 0.45);
  emitBottom(COUNT_BOTTOM, 0.34, 0.42);

  return { verticals, horizontals };
}
