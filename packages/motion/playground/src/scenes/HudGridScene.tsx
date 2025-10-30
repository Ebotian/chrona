/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  MeshPhongMaterial,
  RingGeometry,
} from 'three';
import type { Group, LineSegments, Mesh } from 'three';
import { useChronoScene, useReducedMotion, useChronoScrollContext } from '@chrono/motion';

export function HudGridScene() {
  useChronoScene({ background: [0.01, 0.015, 0.04] });
  const reducedMotion = useReducedMotion();
  const scroll = useChronoScrollContext({ smoothing: 0.12, maxVelocity: 3 });

  const controls = useControls('HUD 网格', {
    gridSize: { value: 12, min: 6, max: 24, step: 1 },
    divisions: { value: 16, min: 6, max: 32, step: 1 },
    horizontalRange: { value: 6, min: 0, max: 12, step: 0.1 },
    beamSpeed: { value: 0.6, min: 0, max: 1.5, step: 0.01 },
    beamThickness: { value: 0.28, min: 0.1, max: 0.8, step: 0.01 },
    holoColor: '#2bf6ff',
    gridColor: '#0f5fe7',
  });

  const groupRef = useRef<Group>(null);
  const beamRef = useRef<Mesh>(null);
  const gridRef = useRef<LineSegments>(null);
  const highlightRef = useRef<Mesh>(null);
  const beamPhase = useRef(0);

  const gridGeometry = useMemo(
    () => buildGridGeometry(controls.gridSize, controls.divisions),
    [controls.gridSize, controls.divisions],
  );

  const frameGeometry = useMemo(() => buildFrameGeometry(controls.gridSize), [controls.gridSize]);

  useEffect(() => {
    if (!gridRef.current) return;
    const material = gridRef.current.material as LineBasicMaterial;
    material.color = new Color(controls.gridColor);
  }, [controls.gridColor]);

  useEffect(() => {
    if (!highlightRef.current) return;
    const material = highlightRef.current.material as MeshPhongMaterial;
    material.color = new Color(controls.holoColor);
    material.emissive = new Color(controls.holoColor).multiplyScalar(0.4);
  }, [controls.holoColor]);

  useEffect(() => {
    if (!beamRef.current) return;
    const material = beamRef.current.material as MeshPhongMaterial;
    material.color = new Color(controls.holoColor);
    material.emissive = new Color(controls.holoColor).multiplyScalar(0.6);
  }, [controls.holoColor]);

  useFrame((_, delta) => {
    if (!groupRef.current || !beamRef.current || !highlightRef.current) return;

    const targetX = (scroll.easedProgress - 0.5) * controls.horizontalRange;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;

    if (!reducedMotion) {
      beamPhase.current += delta * (1.0 + controls.beamSpeed * 1.5);
    }

    const scanOffset = (Math.sin(beamPhase.current) * 0.5 + 0.5) * controls.gridSize * 0.5;
    beamRef.current.position.y = scanOffset;
    highlightRef.current.position.y = scroll.progress * controls.gridSize - controls.gridSize * 0.5;
  });

  return (
    <group ref={groupRef} position={[0, -controls.gridSize * 0.15, 0]}>
      <lineSegments ref={gridRef} geometry={gridGeometry}>
        <lineBasicMaterial transparent opacity={0.75} linewidth={1} />
      </lineSegments>

      <mesh geometry={frameGeometry} frustumCulled={false}>
        <meshBasicMaterial color="#04142c" wireframe opacity={0.3} transparent />
      </mesh>

      <mesh ref={highlightRef} position={[0, 0, 0]}>
        <planeGeometry args={[controls.gridSize, controls.beamThickness]} />
        <meshPhongMaterial
          transparent
          opacity={0.32}
          emissiveIntensity={2}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh ref={beamRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[controls.gridSize * 1.2, controls.beamThickness * 0.6]} />
        <meshPhongMaterial transparent opacity={0.45} emissiveIntensity={3} side={DoubleSide} />
      </mesh>

      <ambientLight intensity={0.7} color={controls.holoColor} />
      <pointLight position={[0, 8, 6]} intensity={6} distance={40} color={controls.holoColor} />
    </group>
  );
}

function buildGridGeometry(size: number, divisions: number) {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const half = size / 2;
  for (let i = 0; i <= divisions; i += 1) {
    const ratio = i / divisions;
    const position = -half + ratio * size;
    vertices.push(-half, 0, position, half, 0, position);
    vertices.push(position, 0, -half, position, 0, half);
  }
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  return geometry;
}

function buildFrameGeometry(size: number) {
  const geometry = new RingGeometry(size * 0.96, size, 90, 1, 0, Math.PI * 2);
  return geometry;
}
