'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './skyline.module.css';

// Baseline design size (used to scale numbers to the real container size)
const BASE_VIEW_WIDTH = 1200;
const BASE_VIEW_HEIGHT = 160;

// World/shaping parameters
const WORLD_WIDTH = 40; // number of world units across the skyline span
const WORLD_COMPLEXITY = 1;
const WORLD_BASE_HEIGHT = 2.0;
const WORLD_HEIGHT_VARIANCE = 2.8;

type Point = { x: number; y: number };

type LayerSpec = {
  id: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  delay: number;
  duration: number;
  zIndex: number;
  offsetY: number;
  dashArray?: string;
  baseLift: number;
  peakLift: number;
  noiseScale: number;
  detailScale: number;
  centerBoost: number;
  centerSpread: number;
};

type LayerPath = LayerSpec & { path: string; fillPath: string; xOffset: number };

const LAYER_SPECS: LayerSpec[] = [
  {
    id: 'background',
    stroke: 'rgba(0, 210, 255, 0.68)',
    strokeWidth: 2.4,
    opacity: 0.7,
    delay: 1.45,
    duration: 1.35,
    zIndex: 1,
    offsetY: 0,
    dashArray: '16 18',
    baseLift: 18,
    peakLift: 36,
    noiseScale: 0.35,
    detailScale: 0.25,
    centerBoost: 0.26,
    centerSpread: 0.32,
  },
  {
    id: 'mid',
    stroke: 'rgba(255, 66, 170, 0.82)',
    strokeWidth: 2.4,
    opacity: 0.92,
    delay: 1.58,
    duration: 1.45,
    zIndex: 2,
    offsetY: 0,
    dashArray: '18 14',
    baseLift: 28,
    peakLift: 48,
    noiseScale: 0.42,
    detailScale: 0.32,
    centerBoost: 0.58,
    centerSpread: 0.26,
  },
  {
    id: 'foreground',
    stroke: 'rgba(255, 148, 0, 0.9)',
    strokeWidth: 2.4,
    opacity: 1,
    delay: 1.72,
    duration: 1.6,
    zIndex: 3,
    offsetY: 0,
    dashArray: '26 12',
    baseLift: 34,
    peakLift: 62,
    noiseScale: 0.48,
    detailScale: 0.4,
    centerBoost: 0.82,
    centerSpread: 0.2,
  },
];

export default function Skyline() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { width, height } = useElementSize(ref);
  const viewportH = useViewportHeight();
  const reactId = useId();
  // debug mode: enable by adding `?sky_debug=1` to the page URL (client-only)
  const [debugMasks, setDebugMasks] = useState(false);
  // small client-only jitter to vary shapes slightly; initialized to 0 for SSR to avoid hydration
  const [jitter, setJitter] = useState(0);
  // per-layer horizontal offsets: SSR = all zeros, mounted = small random offsets (px)
  const [xOffsets, setXOffsets] = useState<number[]>(() => LAYER_SPECS.map(() => 0));
  const w = Math.max(1, width || BASE_VIEW_WIDTH);
  const h = Math.max(1, height || BASE_VIEW_HEIGHT);
  const scaleY = h / BASE_VIEW_HEIGHT; // scale legacy numbers to actual height

  const layers = useMemo<LayerPath[]>(() => {
    return LAYER_SPECS.map((spec, idx) =>
      generateLayerPath(spec, idx, w, h, scaleY, jitter, xOffsets[idx] ?? 0),
    );
  }, [w, h, scaleY, jitter, xOffsets]);

  // Reverse the layer order so we can flip which layers occlude which (user requested)
  const orderedLayers = useMemo(() => [...layers].reverse(), [layers]);

  // Map original delays onto the reversed order so the animation sequence is reversed too.
  const orderedLayersWithTiming = useMemo(() => {
    const originalDelays = layers.map((l) => l.delay);
    return orderedLayers.map((layer, idx) => ({
      ...layer,
      animDelay: originalDelays[idx] ?? layer.delay,
    }));
  }, [orderedLayers, layers]);

  // Compute the vertical gap between the true horizon and the grid's top-most horizontal
  // using the exact same math as GroundGrid. Align the skyline baseline to that line.
  const gridTopGapPx = useMemo(() => computeGridTopGapPx(viewportH), [viewportH]);

  useEffect(() => {
    // on mount, set a small random jitter to vary the skyline; keep initial 0 for SSR
    const j = (Math.random() - 0.5) * 0.6; // [-0.3, 0.3]
    setJitter(j);
    // small horizontal offsets in px (±~24px scaled by viewport width)
    const base = Math.max(10, Math.round((w || BASE_VIEW_WIDTH) * 0.02));
    const offsets = LAYER_SPECS.map(() => Math.round((Math.random() - 0.5) * base * 2));
    setXOffsets(offsets);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.location.search.includes('sky_debug')) setDebugMasks(true);
    } catch (e) {
      /* ignore */
    }
  }, []);

  return (
    <div
      className={styles.container}
      ref={ref}
      style={{ bottom: `calc(100% - var(--horizon-y) - ${gridTopGapPx}px)` }}
    >
      {/* Two-pass rendering: first draw fills for all layers, then draw strokes in a top SVG
          that uses masks (defined in the same SVG user-space) to hide stroke segments covered by
          earlier fills. This avoids cross-SVG coordinate misalignment and gives precise layering. */}

      {/* Fills SVG — draw all layer fills (back-to-front). These fill areas will occlude later strokes. */}
      <svg
        aria-hidden
        className={styles.layer}
        style={{ zIndex: 1 }}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        {orderedLayersWithTiming.map((layer, i) => (
          <g key={`fill-${layer.id}`}>
            <path d={layer.fillPath} fill="#01030a" opacity={1} />
            {debugMasks && <path d={layer.fillPath} fill={`rgba(255,0,0,${0.08 + i * 0.06})`} />}
          </g>
        ))}
      </svg>

      {/* Strokes SVG — define masks (userSpaceOnUse) and draw strokes clipped by the union of earlier fills */}
      <motion.svg
        aria-hidden={false}
        className={styles.layer}
        style={{ zIndex: 2 }}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        <defs>
          {orderedLayersWithTiming.map((layer, i) => (
            <mask
              key={`mask-${i}`}
              id={`${reactId}-mask-${i}`}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
            >
              <rect x={0} y={0} width={w} height={h} fill="white" />
              {orderedLayersWithTiming.slice(0, i).map((prev, j) => (
                <path key={j} d={prev.fillPath} fill="black" />
              ))}
            </mask>
          ))}
        </defs>

        {orderedLayersWithTiming.map((layer, i) => (
          <g key={`stroke-${layer.id}`} style={{ transform: `translateY(${layer.offsetY}px)` }}>
            <g mask={`url(#${reactId}-mask-${i})`}>
              <motion.path
                d={layer.path}
                stroke={layer.stroke}
                strokeWidth={layer.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={layer.dashArray}
                strokeDashoffset={getLayerDashOffset(layer.id, layer.dashArray)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                shapeRendering="crispEdges"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: layer.opacity }}
                transition={{
                  delay: (layer as any).animDelay ?? layer.delay,
                  duration: layer.duration,
                  ease: [0.7, 0, 0.3, 1],
                }}
              />
            </g>
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

function generateLayerPath(
  spec: LayerSpec,
  layerIndex: number,
  width: number,
  height: number,
  scaleY: number,
  jitter: number,
  xOffset: number,
): LayerPath {
  // incorporate small jitter into the noise seed so shapes vary slightly per layer
  const points = buildLayerPoints(layerIndex, width, height, scaleY, jitter, xOffset);
  const path = pointsToPath(points);
  // fill path closes the curve down to the horizon (y = height)
  const fillPath = `${path} L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`;
  return { ...spec, path, fillPath, xOffset };
}

function buildLayerPoints(
  layerIndex: number,
  width: number,
  height: number,
  scaleY: number,
  jitter = 0,
  xOffset = 0,
): Point[] {
  const segments = Math.max(24, Math.floor(16 + WORLD_COMPLEXITY * 36));
  const leftWorldX = -WORLD_WIDTH / 2;
  const worldStep = WORLD_WIDTH / segments;
  const layerFalloff = 1 - layerIndex / Math.max(1, LAYER_SPECS.length - 0.2);
  const UNIT = 22 * scaleY; // dynamic pixel unit following container height

  const path: Point[] = [];
  let lastY = height;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const worldX = leftWorldX + worldStep * i;
    const normalizedX = (worldX - leftWorldX) / WORLD_WIDTH;
    const x = normalizedX * width + xOffset;

    // Bell shape peaking near center; keep some baseline so sides are still visible
    const ridgeEnvelope = Math.pow(Math.sin(Math.PI * Math.min(t, 1 - t) || 0), 0.78);
    const heightEnvelope =
      WORLD_BASE_HEIGHT + WORLD_HEIGHT_VARIANCE * layerFalloff * (ridgeEnvelope + 0.32);

    // include jitter in the seed so the pattern shifts slightly after mount
    const noiseSample = pseudoRandom(i * 3.17 + layerIndex * 11.7 + jitter);
    const landmarkFactor = noiseSample > 0.74 ? 1.4 : 0.68;
    const easedNoise = easeInOutCubic(noiseSample);
    const heightUnits = heightEnvelope * landmarkFactor * easedNoise;

    const detailSample = pseudoRandom(i * 5.91 + layerIndex * 7.73 + jitter) - 0.5;
    const detail = detailSample * 16 * ridgeEnvelope * scaleY;

    // Limit max lift to within container height (leave a small headroom)
    const maxLift = height * 0.96;
    let y = height - Math.min(heightUnits * UNIT + detail, maxLift);
    if (y > height) y = height;
    if (i === 0 || i === segments) y = height;

    const current = { x, y };

    if (path.length === 0) {
      path.push(current);
    } else {
      const previous = path[path.length - 1]!;
      const midX = (previous.x + x) / 2;
      // Vertical stroke segment to keep crisp path when scaled
      path.push({ x: midX, y: lastY });
      path.push({ x: midX, y });
      path.push(current);
    }

    lastY = y;
  }

  return path;
}

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return `M 0 0`;
  const first = points[0]!;
  const segments = points.slice(1).map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  return [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`, ...segments].join(' ');
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

function easeInOutCubic(t: number): number {
  if (t < 0.5) return 4 * t * t * t;
  const f = 2 * t - 2;
  return 0.5 * f * f * f + 1;
}

// Stagger dash offsets per layer to avoid visible center gaps aligning
function getLayerDashOffset(id: string, dashArray?: string): number | undefined {
  if (!dashArray) return undefined;
  const parts = dashArray
    .split(/[ ,]+/)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length === 0) return undefined;
  const period = parts.reduce((a, b) => a + b, 0);
  const key = id === 'foreground' ? 0.33 : id === 'mid' ? 0.57 : 0.12;
  return period * key;
}

// Measure container size with ResizeObserver
function useElementSize<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size as { width: number; height: number };
}

// Viewport height (in px) with resize tracking; returns 0 on SSR until mounted.
function useViewportHeight() {
  // Ensure SSR and the first client render match (0), then update after mount to avoid hydration mismatches
  const [vh, setVh] = useState<number>(0);
  useEffect(() => {
    setVh(window.innerHeight);
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vh;
}

// Reproduce GroundGrid's top-most horizontal line offset from the horizon in pixels
function computeGridTopGapPx(viewportH: number): number {
  if (!viewportH || viewportH <= 0) return 0;
  const PHI = (1 + Math.sqrt(5)) / 2; // golden ratio
  const horizonY = viewportH / PHI;
  const nearY = Math.round(viewportH * 0.97);
  const deltaY = nearY - horizonY;
  const GRID_ROWS = 24;
  const p = 0.08;
  const epsilon = (p * GRID_ROWS) / (1 - p);
  const rawOffset = (deltaY * epsilon) / (GRID_ROWS + epsilon); // distance from horizon to top-most grid line
  // GroundGrid rounds line positions; also enforces a minimum gap of 4px above horizon.
  const rounded = Math.round(rawOffset);
  return Math.max(4, rounded);
}
