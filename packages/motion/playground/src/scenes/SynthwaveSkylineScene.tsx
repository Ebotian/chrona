/* eslint-disable react/no-unknown-property */
import { useControls } from 'leva';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Group, MathUtils, Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { chronoTokens } from '@chrono/tokens';
import {
  useChronoAudioTransport,
  useChronoScene,
  useChronoScrollContext,
  useReducedMotion,
} from '@chrono/motion';

// --- Constants and Tokens ---
const { foundations } = chronoTokens;
const { plasmaBlue, magRidgePink, stardustWhite, zeroCyan } = foundations.color.palette;

// --- Types ---
type SkylineLayer = {
  points: Vector3[];
  color: string;
  linewidth: number;
  depth: number;
};

type SkylineControls = {
  horizonY: number;
  gridDivisions: number;
  gridFade: number;
  skylineLayers: number;
  layerSeparation: number;
  baseHeight: number;
  heightVariance: number;
  complexity: number;
  sunRadius: number;
  parallax: number;
  animSpeed: number;
  bpm: number;
  loopBeats: number;
};

type SkylineLayerConfig = Pick<
  SkylineControls,
  'skylineLayers' | 'layerSeparation' | 'baseHeight' | 'heightVariance' | 'complexity' | 'horizonY'
>;

// --- Main Scene Component ---
export function SynthwaveSkylineScene() {
  useChronoScene({ background: [0.01, 0.005, 0.02] });
  const reducedMotion = useReducedMotion();
  const scroll = useChronoScrollContext({ smoothing: 0.08 });
  const groupRef = useRef<Group>(null);
  const skylineStateRef = useRef<SkylineState>(createSkylineState());

  const controls = useControls('Synthwave Skyline', {
    horizonY: { value: -2, min: -5, max: 0, step: 0.1 },
    gridDivisions: { value: 20, min: 4, max: 40, step: 1 },
    gridFade: { value: 0.7, min: 0, max: 1, step: 0.05 },
    skylineLayers: { value: 3, min: 1, max: 5, step: 1 },
    layerSeparation: { value: 4, min: 1, max: 10, step: 0.5 },
    baseHeight: { value: 1.5, min: 0.5, max: 5, step: 0.1 },
    heightVariance: { value: 2.5, min: 0, max: 8, step: 0.1 },
    complexity: { value: 0.6, min: 0.1, max: 1, step: 0.05 },
    sunRadius: { value: 3, min: 1, max: 8, step: 0.1 },
    parallax: { value: 1.2, min: 0, max: 4, step: 0.1 },
    bpm: { value: 96, min: 60, max: 160, step: 1 },
    loopBeats: { value: 16, min: 4, max: 64, step: 1 },
    animSpeed: { value: 0.1, min: 0.01, max: 0.5, step: 0.01 },
  }) as unknown as SkylineControls;

  const transport = useChronoAudioTransport({
    bpm: controls.bpm,
    loopBeats: controls.loopBeats,
    autoplay: !reducedMotion,
    audioUrl: 'https://cdn.seffola.net/audio/lost-years-converter-v1.mp3',
    volume: 0.42,
  });

  const {
    horizonY,
    gridDivisions,
    gridFade,
    skylineLayers,
    layerSeparation,
    baseHeight,
    heightVariance,
    complexity,
    sunRadius,
    parallax,
    bpm,
    loopBeats,
    animSpeed,
  } = controls;

  const skylineLayersData = useMemo(
    () =>
      generateSkylineLayers({
        skylineLayers,
        layerSeparation,
        baseHeight,
        heightVariance,
        complexity,
        horizonY,
      }),
    [skylineLayers, layerSeparation, baseHeight, heightVariance, complexity, horizonY],
  );

  const redrawProfile = useMemo(
    () => createLayerRedrawProfile({ skylineLayers, loopBeats }),
    [skylineLayers, loopBeats],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetOffset = -(scroll.easedProgress - 0.5) * parallax;
    const lerpFactor = reducedMotion ? 12 : Math.max(4, 12 * animSpeed * 4);
    groupRef.current.position.x = MathUtils.damp(
      groupRef.current.position.x,
      targetOffset,
      lerpFactor,
      delta,
    );

    const loopProgress = transport.loopProgressRef.current;
    const beat = transport.beatRef.current;
    const skylineState = skylineStateRef.current;
    const baseOpacities = skylineLayersData.map((layer) =>
      layerOpacity(layer.depth, skylineLayers, layerSeparation),
    );

    updateRedrawState({
      state: skylineState,
      loopProgress,
      redrawProfile,
      reducedMotion,
      delta,
      baseOpacities,
    });

    skylineState.layers.forEach((layerState, index) => {
      const layer = skylineLayersData[index];
      if (!layer) return;

      const parallaxStrength = reducedMotion ? 0 : 0.22 * (index + 1);
      const swayX = Math.sin(beat * 0.12 + index * 0.6) * parallaxStrength;
      const swayY = Math.cos(beat * 0.1 + index * 1.2) * parallaxStrength * 0.4;
      layerState.parallaxX = MathUtils.damp(layerState.parallaxX, swayX, 6, delta);
      layerState.parallaxY = MathUtils.damp(layerState.parallaxY, swayY, 6, delta);
    });
  });

  return (
    <group ref={groupRef}>
      {/* Sun */}
      <Sun radius={sunRadius} y={horizonY + 2.2} depth={-skylineLayers * layerSeparation} />

      {/* Skyline Layers */}
      {skylineLayersData.map((layer, index) => {
        const state = skylineStateRef.current.layers[index];
        const opacity = state
          ? state.opacity
          : layerOpacity(layer.depth, skylineLayers, layerSeparation);
        const offsetX = state?.parallaxX ?? 0;
        const offsetY = state?.parallaxY ?? 0;
        return (
          <group key={`layer-${layer.depth}`} position={[offsetX, offsetY, -layer.depth]}>
            <Line
              points={layer.points}
              color={layer.color}
              linewidth={layer.linewidth}
              transparent
              opacity={opacity}
            />
          </group>
        );
      })}

      {/* Ground Grid */}
      <GroundGrid divisions={gridDivisions} horizonY={horizonY} fade={gridFade} />

      {/* Lights */}
      <ambientLight color={plasmaBlue} intensity={0.2} />
      <pointLight color={magRidgePink} position={[0, horizonY, -4]} intensity={2.8} />
    </group>
  );
}

// --- Sub-components ---

function Sun({ radius, y, depth }: { radius: number; y: number; depth: number }) {
  const outerRing = useMemo(() => createCirclePoints(radius * 1.15, 96), [radius]);
  const innerRing = useMemo(() => createCirclePoints(radius, 96), [radius]);

  return (
    <group position={[0, y, depth]}>
      <Line points={outerRing} color={magRidgePink} linewidth={1.2} transparent opacity={0.35} />
      <Line points={innerRing} color={magRidgePink} linewidth={2.2} transparent opacity={0.85} />
      <Line
        points={[new Vector3(-radius * 1.6, 0, 0), new Vector3(radius * 1.6, 0, 0)]}
        color={stardustWhite}
        linewidth={1.6}
        transparent
        opacity={0.45}
      />
    </group>
  );
}

function GroundGrid({
  divisions,
  horizonY,
  fade,
}: {
  divisions: number;
  horizonY: number;
  fade: number;
}) {
  const lines = useMemo(() => buildGridLines(divisions, horizonY), [divisions, horizonY]);

  return (
    <group>
      {lines.map((points, index) => (
        <Line
          key={`grid-${index}`}
          points={points}
          color={zeroCyan}
          linewidth={1.2}
          transparent
          opacity={0.55 * fade}
        />
      ))}
      <Line
        points={[new Vector3(-15, horizonY, 0), new Vector3(15, horizonY, 0)]}
        color={stardustWhite}
        linewidth={3.6}
        transparent
        opacity={0.9 * fade}
      />
    </group>
  );
}

// --- Helper Functions ---

function generateSkylineLayers(config: SkylineLayerConfig): SkylineLayer[] {
  const baseColor = new Color(plasmaBlue);
  const accentColor = new Color(magRidgePink);

  return Array.from({ length: config.skylineLayers }, (_, layerIndex) => {
    const depth = layerIndex * config.layerSeparation;
    const points = generateSkylinePath(config, layerIndex);
    const colorMix = layerIndex / Math.max(1, config.skylineLayers - 1);
    const color = baseColor.clone().lerp(accentColor, colorMix).getStyle();

    return {
      points,
      color,
      linewidth: Math.max(1, 2.6 - layerIndex * 0.5),
      depth,
    } satisfies SkylineLayer;
  });
}

function generateSkylinePath(config: SkylineLayerConfig, layerIndex: number): Vector3[] {
  const width = 40;
  const segments = Math.max(6, Math.floor(10 + config.complexity * 28));
  const yBase = config.horizonY;
  const path: Vector3[] = [new Vector3(-width / 2, yBase, 0)];

  let lastY = yBase;
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const x = -width / 2 + t * width;
    const noise = pseudoRandom(i, layerIndex);
    const landmarkFactor = noise > 0.72 ? 1.4 : 0.6;
    const heightEnvelope =
      config.baseHeight +
      config.heightVariance * (1 - layerIndex / Math.max(1, config.skylineLayers)) * landmarkFactor;
    const eased = easeInOutCubic(noise);
    const y = yBase + heightEnvelope * eased;

    const previous = path[path.length - 1] ?? new Vector3(-width / 2, yBase, 0);
    const midX = (previous.x + x) / 2;
    path.push(new Vector3(midX, lastY, 0));
    path.push(new Vector3(midX, y, 0));
    path.push(new Vector3(x, y, 0));

    lastY = y;
  }

  path.push(new Vector3(width / 2, yBase, 0));
  return path;
}

function buildGridLines(divisions: number, horizonY: number) {
  const lines: Vector3[][] = [];
  const width = 24;
  const depth = 42;

  for (let i = 0; i <= divisions; i += 1) {
    const p = i / divisions;
    const x = -width / 2 + p * width;
    const perspective = 1 + p * 0.4;
    lines.push([
      new Vector3(x, horizonY, 0),
      new Vector3(x * perspective, horizonY - depth, depth),
    ]);

    const z = p * depth;
    const y = horizonY - z;
    const span = width * (1 + z / depth);
    lines.push([new Vector3(-span / 2, y, z), new Vector3(span / 2, y, z)]);
  }

  return lines;
}

function createCirclePoints(radius: number, segments: number) {
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
  }
  return points;
}

function pseudoRandom(index: number, layerIndex: number) {
  const value = Math.sin(index * 12.9898 + layerIndex * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function easeInOutCubic(t: number) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  const f = 2 * t - 2;
  return 0.5 * f * f * f + 1;
}

function layerOpacity(depth: number, totalLayers: number, separation: number) {
  if (totalLayers <= 1) return 1;
  const index = depth / separation;
  const base = 1 - index / (totalLayers - 0.2);
  return Math.min(1, Math.max(0.25, base));
}

type SkylineLayerState = {
  opacity: number;
  parallaxX: number;
  parallaxY: number;
};

type SkylineState = {
  layers: SkylineLayerState[];
};

type RedrawProfile = {
  layerOffsets: number[];
  redrawWindow: number;
};

function createSkylineState(): SkylineState {
  return { layers: [] };
}

function ensureLayerState(state: SkylineState, layerCount: number) {
  if (state.layers.length < layerCount) {
    const missing = layerCount - state.layers.length;
    for (let i = 0; i < missing; i += 1) {
      state.layers.push({ opacity: 1, parallaxX: 0, parallaxY: 0 });
    }
  } else if (state.layers.length > layerCount) {
    state.layers.length = layerCount;
  }
}

function createLayerRedrawProfile({
  skylineLayers,
  loopBeats,
}: {
  skylineLayers: number;
  loopBeats: number;
}): RedrawProfile {
  const totalLayers = Math.max(1, skylineLayers);
  const offsetStep = 1 / totalLayers;
  const layerOffsets = Array.from({ length: totalLayers }, (_, index) => index * offsetStep);
  const redrawWindow = Math.min(0.4, 4 / Math.max(4, loopBeats));
  return { layerOffsets, redrawWindow };
}

function updateRedrawState({
  state,
  loopProgress,
  redrawProfile,
  reducedMotion,
  delta,
  baseOpacities,
}: {
  state: SkylineState;
  loopProgress: number;
  redrawProfile: RedrawProfile;
  reducedMotion: boolean;
  delta: number;
  baseOpacities: number[];
}) {
  const { layerOffsets, redrawWindow } = redrawProfile;
  ensureLayerState(state, layerOffsets.length);

  const speed = reducedMotion ? 0 : Math.min(1, delta * 12);

  state.layers.forEach((layer, index) => {
    const offset = layerOffsets[index] ?? 0;
    const baseOpacity = baseOpacities[index] ?? 1;
    const phase = (((loopProgress - offset) % 1) + 1) % 1;

    let intensity = 1;
    if (!reducedMotion && redrawWindow > 0) {
      if (phase < redrawWindow) {
        const local = phase / redrawWindow;
        intensity = Math.pow(local, 0.45);
      } else if (phase > 1 - redrawWindow * 0.6) {
        const local = (phase - (1 - redrawWindow * 0.6)) / (redrawWindow * 0.6);
        intensity = Math.pow(1 - local, 0.6);
      }
    }

    const targetOpacity = Math.max(0.1, baseOpacity * intensity);
    layer.opacity = MathUtils.damp(layer.opacity, targetOpacity, 4 + speed * 6, delta);
  });
}
