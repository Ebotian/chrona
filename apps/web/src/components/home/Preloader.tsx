'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import type { Group, Mesh, RingGeometry } from 'three';
import styles from './Preloader.module.css';
import { useReducedMotion } from '@chrono/motion';
import { useHomeTimeline } from './useHomeTimeline';

export interface PreloaderProps {
  onComplete?: () => void;
  className?: string;
}

interface SymbolProps {
  drawProgress: number;
  signalStrength: number;
}

const RING_CONFIG = [
  { inner: 0.58, outer: 0.68, offset: 0 },
  { inner: 0.72, outer: 0.82, offset: Math.PI * 0.12 },
  { inner: 0.88, outer: 0.98, offset: Math.PI * 0.28 },
];

function SymbolRings({ drawProgress, signalStrength }: SymbolProps) {
  const groupRef = useRef<Group | null>(null);
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const geometryRefs = useRef<(RingGeometry | null)[]>([]);

  useEffect(() => {
    if (!groupRef.current) return;
    const scaleFactor = 1 + signalStrength * 0.05;
    groupRef.current.scale.setScalar(scaleFactor);
  }, [signalStrength]);

  useEffect(() => {
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const material = mesh.material;
      if (!('opacity' in material)) return;
      material.opacity = 0.55 + signalStrength * 0.4;
    });
  }, [signalStrength]);

  useEffect(() => {
    geometryRefs.current.forEach((geometry) => {
      if (!geometry) return;
      const total = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
      const drawCount = Math.max(0, Math.floor(total * drawProgress));
      geometry.setDrawRange(0, drawCount);
    });
  }, [drawProgress]);

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {RING_CONFIG.map((ring, index) => (
        <mesh
          key={ring.inner}
          ref={(value) => {
            meshRefs.current[index] = value;
          }}
          rotation={[0, 0, ring.offset]}
        >
          <ringGeometry
            ref={(value) => {
              geometryRefs.current[index] = value;
            }}
            args={[ring.inner, ring.outer, 128, 1]}
          />
          <meshBasicMaterial color={0x00f0ff} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Preloader({ onComplete, className }: PreloaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const { phase, drawProgress, signalStrength, dockProgress, isComplete } = useHomeTimeline({
    onComplete,
    prefersReducedMotion,
  });

  const rootClassName = useMemo(
    () => (className ? `${styles.root} ${className}` : styles.root),
    [className],
  );

  const canvasStyle = useMemo(
    () => ({
      transform: `scale(${1 - dockProgress * 0.55})`,
    }),
    [dockProgress],
  );

  return (
    <div
      className={rootClassName}
      data-phase={phase}
      data-complete={isComplete}
      style={{
        opacity: isComplete ? 0 : 1,
        pointerEvents: isComplete ? 'none' : 'auto',
      }}
      aria-hidden={isComplete}
    >
      <div className={styles.content} style={canvasStyle}>
        <div
          className={styles.canvasShell}
          style={{
            boxShadow: `0 0 40px rgba(0, 240, 255, ${0.15 + signalStrength * 0.25}), inset 0 0 24px rgba(0, 240, 255, 0.08)`,
          }}
        >
          <div
            className={styles.signalPulse}
            style={{
              ['--signal-opacity' as string]: `${signalStrength}`,
            }}
          />
          <Canvas camera={{ position: [0, 0, 4.5], fov: 40 }} gl={{ preserveDrawingBuffer: false }}>
            <ambientLight intensity={0.4} />
            <SymbolRings drawProgress={drawProgress} signalStrength={signalStrength} />
          </Canvas>
        </div>
        <p className={styles.hint}>initializing chrono-stasis</p>
      </div>
    </div>
  );
}

export default Preloader;
