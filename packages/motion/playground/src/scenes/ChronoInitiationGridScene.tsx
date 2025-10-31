/* eslint-disable react/no-unknown-property */
import { useControls } from 'leva';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject, type CSSProperties } from 'react';
import { Color, Group, MathUtils, Vector3 } from 'three';
import type { Line2 } from 'three/examples/jsm/lines/Line2.js';
import type { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import {
  chronoInitiationGridDefinition,
  type LineNetCoordinate,
  type LineNetEdge,
  type LineNetTimelineClip,
} from '@chrono/line-net';
import { chronoTokens } from '@chrono/tokens';
import { useChronoScene, useChronoScrollContext, useReducedMotion } from '@chrono/motion';

const definition = chronoInitiationGridDefinition;
const palette = chronoTokens.foundations.color.palette;
const gridWidth = parseFloat(chronoTokens.semantic.lines.grid.width);
const tracerWidth = parseFloat(chronoTokens.semantic.lines.tracer.width);
const loopBeatsDefault = Number(
  definition.meta?.loopBeats ?? getSequenceLength(definition.timelines),
);

interface ChronoControls {
  viewportWidth: number;
  viewportHeight: number;
  samplesPerSegment: number;
  lineScale: number;
  nodeRadius: number;
  bpm: number;
  tempoMultiplier: number;
  driftAmplitude: number;
  glowStrength: number;
  showLabels: boolean;
  loopBeats: number;
}

interface EdgeRenderData {
  id: string;
  points: Vector3[];
  weight: number;
  drawClip?: LineNetTimelineClip;
  secondaryClips: LineNetTimelineClip[];
}

interface NodeRenderData {
  id: string;
  position: Vector3;
  label?: string;
  clips: LineNetTimelineClip[];
}

export function ChronoInitiationGridScene() {
  useChronoScene({ background: [0.01, 0.008, 0.02] });
  const reducedMotion = useReducedMotion();
  const scroll = useChronoScrollContext({ smoothing: 0.22, maxVelocity: 1.2 });

  const controls = useControls('Chrono Initiation Grid', {
    viewportWidth: { value: 12, min: 6, max: 24, step: 0.5 },
    viewportHeight: { value: 10, min: 4, max: 20, step: 0.5 },
    samplesPerSegment: { value: 28, min: 6, max: 64, step: 1 },
    lineScale: { value: 0.11, min: 0.04, max: 0.3, step: 0.01 },
    nodeRadius: { value: 0.22, min: 0.08, max: 0.5, step: 0.01 },
    bpm: { value: chronoTokens.semantic.audio.defaultBpm, min: 60, max: 160, step: 1 },
    tempoMultiplier: { value: 1, min: 0.25, max: 3, step: 0.05 },
    driftAmplitude: { value: 0.12, min: 0, max: 0.6, step: 0.01 },
    glowStrength: { value: 1.4, min: 0.3, max: 3, step: 0.05 },
    showLabels: true,
    loopBeats: { value: loopBeatsDefault, min: 4, max: 16, step: 1 },
  }) as unknown as ChronoControls;

  const {
    viewportWidth,
    viewportHeight,
    samplesPerSegment,
    lineScale,
    nodeRadius,
    bpm,
    tempoMultiplier,
    driftAmplitude,
    glowStrength,
    showLabels,
    loopBeats,
  } = controls;

  const groupRef = useRef<Group>(null);
  const beatRef = useRef(0);
  const elapsedRef = useRef(0);

  const timelineIndex = useMemo(() => buildTimelineIndex(definition.timelines ?? []), []);
  const nodePositionMap = useMemo(() => buildNodeMap(definition.nodes), []);

  const edges = useMemo(() => {
    return definition.edges.map((edge) => {
      const from = nodePositionMap.get(edge.from);
      const drawClip = timelineIndex.edges
        .get(edge.id)
        ?.find((clip: LineNetTimelineClip) => clip.action === 'draw');
      const secondary =
        timelineIndex.edges
          .get(edge.id)
          ?.filter((clip: LineNetTimelineClip) => clip.action !== 'draw') ?? [];

      if (!from) {
        const data: EdgeRenderData = {
          id: edge.id,
          points: [],
          weight: edge.weight ?? 1,
          secondaryClips: secondary,
        };
        if (drawClip) data.drawClip = drawClip;
        return data;
      }

      const points = sampleEdgePoints({
        from,
        edge,
        samplesPerSegment,
        viewportWidth,
        viewportHeight,
      });

      const data: EdgeRenderData = {
        id: edge.id,
        points,
        weight: edge.weight ?? 1,
        secondaryClips: secondary,
      };
      if (drawClip) data.drawClip = drawClip;
      return data;
    });
  }, [nodePositionMap, samplesPerSegment, timelineIndex, viewportHeight, viewportWidth]);

  const nodes = useMemo(() => {
    return definition.nodes.map((node) => {
      const position = projectCoordinate(node.position, viewportWidth, viewportHeight, 0);
      const clips = timelineIndex.nodes.get(node.id) ?? [];
      const data: NodeRenderData = {
        id: node.id,
        position,
        clips,
      };

      if (node.label) {
        data.label = node.label;
      }

      return data;
    });
  }, [timelineIndex, viewportHeight, viewportWidth]);

  useFrame((_, delta) => {
    elapsedRef.current += delta * tempoMultiplier;
    const beatMs = chronoTokens.semantic.audio.beatMs(bpm);
    const beatValue = beatMs > 0 ? (elapsedRef.current * 1000) / beatMs : 0;
    const loopLength = Math.max(1, loopBeats);
    const loopBeat = beatValue % loopLength;
    beatRef.current = loopBeat;

    if (groupRef.current) {
      const sway = reducedMotion ? 0 : Math.sin(loopBeat * 0.6) * driftAmplitude;
      const offsetX = reducedMotion ? 0 : (scroll.delta ?? 0) * 0.35;
      groupRef.current.position.x = MathUtils.damp(groupRef.current.position.x, offsetX, 6, delta);
      groupRef.current.position.y = MathUtils.damp(
        groupRef.current.position.y,
        sway * 0.4,
        6,
        delta,
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {edges.map((edge) => (
        <AnimatedEdge
          key={edge.id}
          data={edge}
          beatRef={beatRef}
          loopBeats={loopBeats}
          lineScale={lineScale}
          glowStrength={glowStrength}
        />
      ))}

      {nodes.map((node) => (
        <NodeGlyph
          key={node.id}
          data={node}
          beatRef={beatRef}
          loopBeats={loopBeats}
          radius={nodeRadius}
          glowStrength={glowStrength}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
}

function AnimatedEdge({
  data,
  beatRef,
  loopBeats,
  lineScale,
  glowStrength,
}: {
  data: EdgeRenderData;
  beatRef: RefObject<number>;
  loopBeats: number;
  lineScale: number;
  glowStrength: number;
}) {
  const lineRef = useRef<Line2>(null);
  const baseColor = useMemo(() => new Color(palette.zeroCyan), []);
  const accentColor = useMemo(() => new Color(palette.plasmaBlue), []);
  const ignitionColor = useMemo(() => new Color(palette.magRidgePink), []);
  const initialPoints = useMemo(() => computePartialPoints(data.points, 0), [data.points]);

  useFrame((_, delta) => {
    const line = lineRef.current;
    if (!line || data.points.length === 0) return;
    const beat = wrapBeat(beatRef.current ?? 0, loopBeats);
    const progress = data.drawClip ? clipProgress(data.drawClip, beat) : 1;
    const partial = computePartialPoints(data.points, progress);
    const geometry = line.geometry as LineGeometry;
    if (geometry) {
      geometry.setPositions(flattenVectors(partial));
    }

    const material = line.material as LineMaterial;
    const targetColor =
      progress >= 0.999 ? ignitionColor : accentColor.clone().lerp(baseColor, 1 - progress * 0.85);
    material.color.lerp(targetColor, MathUtils.clamp(delta * 8, 0, 1));

    const clipBoost = data.secondaryClips.some((clip) => clipActive(clip, beat));
    const opacityTarget = clipBoost ? 0.95 * glowStrength : 0.4 + progress * 0.6 * glowStrength;
    material.opacity = MathUtils.clamp(
      MathUtils.damp(material.opacity, opacityTarget, 6, delta),
      0,
      1.2,
    );
    material.needsUpdate = true;
  });

  return (
    <Line
      ref={lineRef}
      points={initialPoints}
      linewidth={computeLineWidth(data.weight, lineScale)}
      color={palette.zeroCyan}
      transparent
      opacity={0.12}
    />
  );
}

function NodeGlyph({
  data,
  beatRef,
  loopBeats,
  radius,
  glowStrength,
  showLabel,
}: {
  data: NodeRenderData;
  beatRef: RefObject<number>;
  loopBeats: number;
  radius: number;
  glowStrength: number;
  showLabel: boolean;
}) {
  const ringRef = useRef<Line2>(null);
  const circlePoints = useMemo(
    () => createCirclePoints(radius, data.position.z + 0.002),
    [data.position.z, radius],
  );
  const baseColor = useMemo(() => new Color(palette.stardustWhite).multiplyScalar(0.6), []);
  const accentColor = useMemo(() => new Color(palette.plasmaBlue), []);
  const ignitionColor = useMemo(() => new Color(palette.magRidgePink), []);

  useFrame((_, delta) => {
    const ring = ringRef.current;
    if (!ring) return;
    const beat = wrapBeat(beatRef.current ?? 0, loopBeats);
    const intensity = evaluateNodeClips(data.clips, beat);
    const targetScale = 1 + intensity * 0.45;
    ring.scale.setScalar(MathUtils.damp(ring.scale.x, targetScale, 6, delta));

    const material = ring.material as LineMaterial;
    const targetColor = accentColor.clone().lerp(ignitionColor, intensity * 0.65);
    material.color.lerpColors(baseColor, targetColor, Math.min(1, intensity + 0.2));

    const targetOpacity = 0.2 + intensity * 0.9 * glowStrength;
    material.opacity = MathUtils.clamp(
      MathUtils.damp(material.opacity, targetOpacity, 8, delta),
      0.05,
      1.4,
    );
    material.needsUpdate = true;
  });

  return (
    <group position={[data.position.x, data.position.y, data.position.z]}>
      <Line
        ref={ringRef}
        points={circlePoints}
        linewidth={radius * 2.2}
        color={palette.zeroCyan}
        transparent
        opacity={0.2}
      />
      {showLabel && data.label ? (
        <Html position={[0, radius * 2.4, 0]} center style={labelStyle}>
          {data.label}
        </Html>
      ) : null}
    </group>
  );
}

function computePartialPoints(points: Vector3[], progress: number) {
  if (points.length === 0) return [] as Vector3[];
  const clamped = MathUtils.clamp(progress, 0, 1);
  if (clamped <= 0) {
    const start = points[0] ?? new Vector3();
    return [start.clone(), start.clone()];
  }
  if (clamped >= 1) {
    return points.map((point) => point.clone());
  }
  const totalSegments = points.length - 1;
  const scaled = clamped * totalSegments;
  const index = Math.floor(scaled);
  const fraction = scaled - index;
  const result = points.slice(0, index + 1).map((point) => point.clone());
  const a = points[index] ?? points[points.length - 1] ?? new Vector3();
  const b = points[index + 1] ?? a;
  const interpolated = a.clone().lerp(b, fraction);
  result.push(interpolated);
  if (result.length < 2) {
    result.push(interpolated.clone());
  }
  return result;
}

function clipProgress(clip: LineNetTimelineClip, beat: number) {
  const length = clip.length ?? 1;
  const start = clip.beat;
  const end = start + length;
  if (beat < start) return 0;
  if (beat >= end) return 1;
  return (beat - start) / length;
}

function clipActive(clip: LineNetTimelineClip, beat: number) {
  const length = clip.length ?? 1;
  const start = clip.beat;
  const end = start + length;
  return beat >= start && beat <= end;
}

function evaluateNodeClips(clips: LineNetTimelineClip[], beat: number) {
  if (clips.length === 0) return 0;
  let intensity = 0;
  clips.forEach((clip) => {
    const length = clip.length ?? 1;
    const start = clip.beat;
    const end = start + length;
    if (clip.action === 'highlight') {
      if (beat >= start) {
        intensity = Math.max(intensity, 1);
      }
    } else if (clip.action === 'pulse' && beat >= start && beat <= end) {
      const phase = (beat - start) / length;
      intensity = Math.max(intensity, Math.sin(phase * Math.PI));
    }
  });
  return MathUtils.clamp(intensity, 0, 1.4);
}

function buildNodeMap(nodes: typeof definition.nodes) {
  return nodes.reduce<Map<string, LineNetCoordinate>>((map, node) => {
    map.set(node.id, node.position);
    return map;
  }, new Map());
}

function sampleEdgePoints({
  from,
  edge,
  samplesPerSegment,
  viewportWidth,
  viewportHeight,
}: {
  from: LineNetCoordinate;
  edge: LineNetEdge;
  samplesPerSegment: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const points: Vector3[] = [];
  let cursor = from;
  points.push(projectCoordinate(cursor, viewportWidth, viewportHeight, 0));
  edge.segments.forEach((segment) => {
    const segmentPoints = sampleSegment(cursor, segment, samplesPerSegment);
    segmentPoints.forEach((point) => {
      points.push(projectCoordinate(point, viewportWidth, viewportHeight, 0));
    });
    cursor = segment.to;
  });
  return points;
}

function projectCoordinate(
  coordinate: LineNetCoordinate,
  viewportWidth: number,
  viewportHeight: number,
  depth: number,
) {
  const x = (coordinate[0] - 0.5) * viewportWidth;
  const y = (coordinate[1] - 0.5) * viewportHeight;
  return new Vector3(x, y, depth);
}

function sampleSegment(
  from: LineNetCoordinate,
  segment: LineNetEdge['segments'][number],
  samples: number,
) {
  const count = Math.max(2, samples);
  const result: LineNetCoordinate[] = [];
  const kind = segment.kind ?? 'line';

  if (kind === 'line') {
    result.push(segment.to);
    return result;
  }

  if (kind === 'quadratic') {
    const controlPoints = segment.controlPoints ?? [];
    const cp = controlPoints[0] ?? from;
    for (let index = 1; index <= count; index += 1) {
      const t = index / count;
      result.push(quadraticBezier(from, cp, segment.to, t));
    }
    return result;
  }

  if (kind === 'cubic') {
    const controlPoints = segment.controlPoints ?? [];
    const cp1 = controlPoints[0] ?? from;
    const cp2 = controlPoints[1] ?? segment.to;
    for (let index = 1; index <= count; index += 1) {
      const t = index / count;
      result.push(cubicBezier(from, cp1, cp2, segment.to, t));
    }
    return result;
  }

  result.push(segment.to);
  return result;
}

function quadraticBezier(
  a: LineNetCoordinate,
  b: LineNetCoordinate,
  c: LineNetCoordinate,
  t: number,
) {
  const u = 1 - t;
  const x = u * u * a[0] + 2 * u * t * b[0] + t * t * c[0];
  const y = u * u * a[1] + 2 * u * t * b[1] + t * t * c[1];
  return [x, y] as LineNetCoordinate;
}

function cubicBezier(
  a: LineNetCoordinate,
  b: LineNetCoordinate,
  c: LineNetCoordinate,
  d: LineNetCoordinate,
  t: number,
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  const x = uuu * a[0] + 3 * uu * t * b[0] + 3 * u * tt * c[0] + ttt * d[0];
  const y = uuu * a[1] + 3 * uu * t * b[1] + 3 * u * tt * c[1] + ttt * d[1];
  return [x, y] as LineNetCoordinate;
}

function createCirclePoints(radius: number, depth: number) {
  const segments = Math.max(24, Math.floor(radius * 120));
  const points: Vector3[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const theta = (index / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    points.push(new Vector3(x, y, depth));
  }
  return points;
}

function computeLineWidth(weight: number, scale: number) {
  const base = gridWidth * scale;
  const tracer = tracerWidth * scale;
  return base * (weight || 1) + tracer * 0.25;
}

function flattenVectors(points: Vector3[]) {
  const values = new Float32Array(points.length * 3);
  points.forEach((point, index) => {
    const offset = index * 3;
    values[offset] = point.x;
    values[offset + 1] = point.y;
    values[offset + 2] = point.z;
  });
  return values;
}

function wrapBeat(value: number, loopBeats: number) {
  const loop = Math.max(1, loopBeats);
  const wrapped = value % loop;
  return wrapped < 0 ? wrapped + loop : wrapped;
}

function getSequenceLength(clips: LineNetTimelineClip[] | undefined) {
  if (!clips || clips.length === 0) {
    return 8;
  }
  return clips.reduce((max, clip) => {
    const end = clip.beat + (clip.length ?? 1);
    return end > max ? end : max;
  }, 0);
}

const labelStyle: CSSProperties = {
  padding: '0.22rem 0.4rem',
  background: 'rgba(8, 10, 15, 0.7)',
  color: chronoTokens.semantic.color.text.secondary,
  borderRadius: '0.45rem',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  border: `1px solid ${chronoTokens.semantic.color.border.subtle}`,
};

interface TimelineIndex {
  edges: Map<string, LineNetTimelineClip[]>;
  nodes: Map<string, LineNetTimelineClip[]>;
}

function buildTimelineIndex(clips: LineNetTimelineClip[]): TimelineIndex {
  const edgeMap = new Map<string, LineNetTimelineClip[]>();
  const nodeMap = new Map<string, LineNetTimelineClip[]>();

  clips.forEach((clip) => {
    const targetCollection = clip.targetType === 'edge' ? edgeMap : nodeMap;
    const list = targetCollection.get(clip.targetId) ?? [];
    list.push(clip);
    list.sort((a, b) => a.beat - b.beat);
    targetCollection.set(clip.targetId, list);
  });

  return { edges: edgeMap, nodes: nodeMap };
}
