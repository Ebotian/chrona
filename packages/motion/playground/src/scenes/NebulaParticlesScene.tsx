/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { AdditiveBlending, Color, Uniform } from 'three';
import type { Points } from 'three';
import {
  useChronoScene,
  useReducedMotion,
  useChronoScrollContext,
  useChronoShaderUniforms,
} from '@chrono/motion';

const vertexShader = /* glsl */ `
  attribute float aScale;
  uniform float uTime;
  uniform float uScroll;
  varying float vStrength;

  float snoise(vec3 v) {
    return sin(v.x) * sin(v.y) * sin(v.z);
  }

  void main() {
    vec3 displaced = position;
    float noiseStrength = snoise(vec3(position.xy * 0.3, uTime * 0.2));
    displaced += normalize(displaced + 0.001) * noiseStrength * (0.6 + uScroll * 1.4) * aScale;
    float scale = (4.0 + aScale * 18.0) * (1.0 + uScroll * 0.6);

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vStrength = smoothstep(0.6, 0.1, length(displaced) * 0.12);
    gl_PointSize = scale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uGlow;
  varying float vStrength;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, distanceToCenter);
    vec3 color = mix(uSecondaryColor, uPrimaryColor, alpha);
    alpha *= (0.55 + uGlow * 0.5) * vStrength;
    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function NebulaParticlesScene() {
  useChronoScene({ background: [0.02, 0.03, 0.06] });
  const reducedMotion = useReducedMotion();
  const scroll = useChronoScrollContext({ smoothing: 0.08, maxVelocity: 2 });
  const pointsRef = useRef<Points>(null);
  const elapsedRef = useRef(0);
  const smoothedScroll = useRef(scroll.easedProgress);

  type NebulaControls = {
    particleCount: number;
    radius: number;
    swirl: number;
    rotationSpeed: number;
    glow: number;
    primaryColor: string;
    secondaryColor: string;
  };

  const controls = useControls('星云粒子场', {
    particleCount: { value: 9000, min: 2000, max: 20000, step: 1000 },
    radius: { value: 9, min: 3, max: 16, step: 1 },
    swirl: { value: 1.6, min: 0, max: 4, step: 0.1 },
    rotationSpeed: { value: 0.18, min: 0, max: 0.6, step: 0.01 },
    glow: { value: 0.75, min: 0, max: 1, step: 0.01 },
    primaryColor: '#3fd0f9',
    secondaryColor: '#6133ff',
  }) as NebulaControls;

  const { particleCount, radius, swirl, rotationSpeed, glow, primaryColor, secondaryColor } =
    controls;

  const positions = useMemo(
    () => generatePositions(particleCount, radius, swirl),
    [particleCount, radius, swirl],
  );

  const scales = useMemo(() => generateScales(particleCount), [particleCount]);

  type NebulaUniforms = {
    uTime: Uniform<number>;
    uScroll: Uniform<number>;
    uGlow: Uniform<number>;
    uPrimaryColor: Uniform<Color>;
    uSecondaryColor: Uniform<Color>;
  };

  const uniforms = useChronoShaderUniforms(
    useMemo(
      () => ({
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uGlow: { value: 0.75 },
        uPrimaryColor: { value: new Color('#3fd0f9') },
        uSecondaryColor: { value: new Color('#6133ff') },
      }),
      [],
    ),
  ) as NebulaUniforms;

  const { uTime, uScroll, uGlow, uPrimaryColor, uSecondaryColor } = uniforms;

  useEffect(() => {
    uGlow.value = glow;
  }, [uGlow, glow]);

  useEffect(() => {
    uPrimaryColor.value.set(primaryColor);
  }, [uPrimaryColor, primaryColor]);

  useEffect(() => {
    uSecondaryColor.value.set(secondaryColor);
  }, [uSecondaryColor, secondaryColor]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    if (!reducedMotion) {
      elapsedRef.current += delta;
      pointsRef.current.rotation.y += delta * rotationSpeed;
      pointsRef.current.rotation.x = (scroll.easedProgress - 0.5) * 0.6;
    }

    smoothedScroll.current += (scroll.easedProgress - smoothedScroll.current) * 0.08;
    uTime.value = elapsedRef.current;
    uScroll.value = smoothedScroll.current;
  });

  return (
    <group>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function generatePositions(count: number, radius: number, swirl: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = radius * Math.pow(Math.random(), 0.5);
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * radius * 0.6;
    const twist = swirl * (r / radius);
    positions[i * 3] = Math.cos(angle + twist) * r;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle + twist) * r;
  }
  return positions;
}

function generateScales(count: number) {
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    scales[i] = 0.5 + Math.random() * 0.8;
  }
  return scales;
}
