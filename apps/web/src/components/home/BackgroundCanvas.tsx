'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';
import { useReducedMotion } from '@chrono/motion';
import styles from './BackgroundCanvas.module.css';

interface BackgroundCanvasProps {
  active: boolean;
}

interface NebulaPointsProps {
  active: boolean;
}

const PARTICLE_COUNT = 2400;
const BASE_RADIUS = 6.5;

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}

function NebulaPoints({ active }: NebulaPointsProps) {
  const pointsRef = useRef<Points | null>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);

    const innerColor = new Color('#04d9ff');
    const outerColor = new Color('#3a1c5f');

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const seed = i * 1.37 + 1;
      const radius = BASE_RADIUS * (0.25 + pseudoRandom(seed) * 0.75);
      const theta = pseudoRandom(seed + 1.1) * Math.PI * 2;
      const phi = Math.acos(2 * pseudoRandom(seed + 2.7) - 1);
      const variance = 0.6 + pseudoRandom(seed + 3.9) * 0.4;

      const sinPhi = Math.sin(phi);
      const x = radius * sinPhi * Math.cos(theta);
      const y = radius * sinPhi * Math.sin(theta);
      const z = radius * Math.cos(phi) * variance;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y * 0.6;
      pos[i * 3 + 2] = z;

      const lerpFactor = Math.min(1, (radius - BASE_RADIUS * 0.25) / (BASE_RADIUS * 0.75));
      const color = innerColor.clone().lerp(outerColor, lerpFactor);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }

    return { positions: pos, colors: cols };
  }, []);

  const geometry = useMemo(() => {
    const instance = new BufferGeometry();
    instance.setAttribute('position', new Float32BufferAttribute(positions, 3));
    instance.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return instance;
  }, [positions, colors]);

  const material = useMemo(
    () =>
      new PointsMaterial({
        size: 0.085,
        sizeAttenuation: true,
        vertexColors: true,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) {
      return undefined;
    }

    points.geometry = geometry;
    points.material = material;
    points.rotation.set(Math.PI / 2.8, 0, 0);

    return undefined;
  }, [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    if (!pointsRef.current) {
      return;
    }

    const rotationSpeed = active ? 0.08 : 0.02;
    const pointer = state.pointer;

    pointsRef.current.rotation.y += delta * rotationSpeed;
    pointsRef.current.rotation.x += (pointer.y * 0.05 - pointsRef.current.rotation.x) * 0.08;
    pointsRef.current.rotation.z += (pointer.x * 0.04 - pointsRef.current.rotation.z) * 0.08;
  });

  return <points ref={pointsRef} />;
}

function NebulaCanvas({ active }: NebulaPointsProps) {
  return (
    <Canvas
      className={styles.canvas}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 9], fov: 60 }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <NebulaPoints active={active} />
      </Suspense>
    </Canvas>
  );
}

export function BackgroundCanvas({ active }: BackgroundCanvasProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.gradientLayer} />
      {!prefersReducedMotion && <NebulaCanvas active={active} />}
      <div className={styles.overlay} data-reduced={prefersReducedMotion} />
      <div className={styles.noiseLayer} />
    </div>
  );
}

export default BackgroundCanvas;
