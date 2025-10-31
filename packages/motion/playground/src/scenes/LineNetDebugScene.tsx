/* eslint-disable react/no-unknown-property */
import { useControls } from 'leva';
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Group } from 'three';
import {
  defineLineNet,
  type LineNetCoordinate,
  type LineNetDefinition,
  type LineNetSegment,
  type LineNetTimelineClip,
} from '@chrono/line-net';
import { chronoTokens } from '@chrono/tokens';
import { useChronoScene, useChronoScrollContext, useReducedMotion } from '@chrono/motion';

type LineNetControls = {
  viewportWidth: number;
  viewportHeight: number;
  depthSpread: number;
  samplesPerSegment: number;
  lineScale: number;
  nodeSize: number;
  bpm: number;
  tempoMultiplier: number;
  scrollInfluence: number;
  glowStrength: number;
  showNodes: boolean;
  showTimeline: boolean;
};

type RenderEdge = {
  id: string;
  points: Array<[number, number, number]>;
  weight: number;
};

type RenderNode = {
  id: string;
  position: [number, number, number];
  label?: string;
};

const gridWidthPx = parseFloat(chronoTokens.semantic.lines.grid.width);
const tracerWidthPx = parseFloat(chronoTokens.semantic.lines.tracer.width);
const palette = chronoTokens.foundations.color.palette;
const edgeBaseColor = palette.zeroCyan;
const edgeHighlightColor = palette.plasmaBlue;
const nodeBaseColor = palette.phantomGray;
const nodeHighlightColor = palette.plasmaBlue;
const sequenceDefinition = createSynthwaveLineNet();
const sequenceLength = getSequenceLength(sequenceDefinition.timelines);

export function LineNetDebugScene() {
  useChronoScene({ background: [0.015, 0.019, 0.04] });
  const reducedMotion = useReducedMotion();
  const scroll = useChronoScrollContext({ smoothing: 0.18, maxVelocity: 2.2 });

  const controls = useControls('Line-Net 调试', {
    viewportWidth: { value: 14, min: 6, max: 26, step: 0.5 },
    viewportHeight: { value: 8, min: 4, max: 16, step: 0.5 },
    depthSpread: { value: 1.2, min: 0, max: 3, step: 0.05 },
    samplesPerSegment: { value: 24, min: 4, max: 72, step: 1 },
    lineScale: { value: 0.12, min: 0.02, max: 0.4, step: 0.01 },
    nodeSize: { value: 0.26, min: 0.1, max: 0.6, step: 0.02 },
    bpm: { value: chronoTokens.semantic.audio.defaultBpm, min: 60, max: 180, step: 1 },
    tempoMultiplier: { value: 1, min: 0.25, max: 3, step: 0.05 },
    scrollInfluence: { value: 0.6, min: 0, max: 2, step: 0.05 },
    glowStrength: { value: 1.2, min: 0, max: 3, step: 0.05 },
    showNodes: true,
    showTimeline: true,
  }) as unknown as LineNetControls;

  const {
    viewportWidth,
    viewportHeight,
    depthSpread,
    samplesPerSegment,
    lineScale,
    nodeSize,
    bpm,
    tempoMultiplier,
    scrollInfluence,
    glowStrength,
    showNodes,
    showTimeline,
  } = controls;

  const groupRef = useRef<Group>(null);
  const timelineRef = useRef(0);
  const elapsedRef = useRef(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [activeEdges, setActiveEdges] = useState<string[]>([]);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, LineNetCoordinate>();
    sequenceDefinition.nodes.forEach((node) => {
      map.set(node.id, node.position);
    });
    return map;
  }, []);

  const renderEdges = useMemo(() => {
    return sequenceDefinition.edges.map((edge, index) => {
      const from = nodeMap.get(edge.from);
      if (!from) {
        return { id: edge.id, points: [], weight: edge.weight ?? 1 } satisfies RenderEdge;
      }
      const depth = -index * depthSpread;
      const points: Array<[number, number, number]> = [
        projectPoint(from, viewportWidth, viewportHeight, depth),
      ];
      let cursor = from;
      edge.segments.forEach((segment) => {
        const segmentPoints = sampleSegment(cursor, segment, samplesPerSegment);
        segmentPoints.forEach((point) => {
          points.push(projectPoint(point, viewportWidth, viewportHeight, depth));
        });
        cursor = segment.to;
      });
      return { id: edge.id, points, weight: edge.weight ?? 1 } satisfies RenderEdge;
    });
  }, [depthSpread, nodeMap, samplesPerSegment, viewportHeight, viewportWidth]);

  const renderNodes = useMemo(() => {
    return sequenceDefinition.nodes.map((node) => {
      const projected = projectPoint(node.position, viewportWidth, viewportHeight, 0);
      return {
        id: node.id,
        position: projected,
        label: node.label,
      } as RenderNode;
    });
  }, [viewportHeight, viewportWidth]);

  const activeEdgeSet = useMemo(() => new Set(activeEdges), [activeEdges]);
  const activeNodeSet = useMemo(() => new Set(activeNodes), [activeNodes]);

  useEffect(() => {
    elapsedRef.current = 0;
  }, [bpm, tempoMultiplier]);

  useFrame((_, delta) => {
    elapsedRef.current += delta * tempoMultiplier;
    const beatDurationMs = chronoTokens.semantic.audio.beatMs(bpm);
    const beatValue = beatDurationMs > 0 ? (elapsedRef.current * 1000) / beatDurationMs : 0;
    const loopedBeat = sequenceLength > 0 ? beatValue % sequenceLength : beatValue;

    if (Math.abs(loopedBeat - timelineRef.current) > 0.01) {
      timelineRef.current = loopedBeat;
      setCurrentBeat(loopedBeat);
      const edgeTargets = extractActiveTargets(sequenceDefinition.timelines, loopedBeat, 'edge');
      const nodeTargets = extractActiveTargets(sequenceDefinition.timelines, loopedBeat, 'node');
      updateIfChanged(edgeTargets, activeEdges, setActiveEdges);
      updateIfChanged(nodeTargets, activeNodes, setActiveNodes);
    }

    if (groupRef.current) {
      const sway = reducedMotion ? 0 : Math.sin(loopedBeat * 0.6) * 0.08;
      groupRef.current.rotation.y = sway;
      const scrollOffset = scroll.delta * scrollInfluence;
      groupRef.current.position.x += (scrollOffset - groupRef.current.position.x) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -6]}>
      {renderEdges.map((edge) => (
        <Line
          key={edge.id}
          points={edge.points}
          color={activeEdgeSet.has(edge.id) ? edgeHighlightColor : edgeBaseColor}
          linewidth={computeLineWidth(edge.weight, lineScale)}
          transparent
          opacity={
            activeEdgeSet.has(edge.id) ? 0.78 * glowStrength : 0.32 + Math.abs(scroll.delta) * 0.2
          }
        />
      ))}

      {showNodes
        ? renderNodes.map((node, index) => (
            <mesh
              key={node.id}
              position={[
                node.position[0],
                node.position[1],
                node.position[2] - index * depthSpread * 0.05,
              ]}
            >
              <sphereGeometry args={[nodeSize, 24, 24]} />
              <meshStandardMaterial
                color={activeNodeSet.has(node.id) ? nodeHighlightColor : nodeBaseColor}
                emissive={activeNodeSet.has(node.id) ? nodeHighlightColor : edgeBaseColor}
                emissiveIntensity={
                  activeNodeSet.has(node.id) ? 1.6 * glowStrength : 0.4 * glowStrength
                }
                metalness={0.3}
                roughness={0.4}
              />
              {showTimeline && node.label ? (
                <Html position={[0, nodeSize * 2.4, 0]} center style={htmlLabelStyle}>
                  {node.label}
                </Html>
              ) : null}
            </mesh>
          ))
        : null}

      {showTimeline ? (
        <Html position={[0, viewportHeight * 0.6, 0]} center style={htmlTimelineStyle}>
          <div>当前节拍: {currentBeat.toFixed(2)}</div>
          <div>激活边: {activeEdges.join(', ') || '无'}</div>
          <div>激活节点: {activeNodes.join(', ') || '无'}</div>
        </Html>
      ) : null}

      <ambientLight intensity={0.42} color={edgeHighlightColor} />
      <pointLight position={[0, 6, 6]} intensity={2.4} color={edgeHighlightColor} />
      <pointLight position={[-4, -5, 4]} intensity={1.3} color={edgeBaseColor} />
    </group>
  );
}

function projectPoint(
  coordinate: LineNetCoordinate,
  viewportWidth: number,
  viewportHeight: number,
  depth: number,
): [number, number, number] {
  const x = (coordinate[0] - 0.5) * viewportWidth;
  const y = (coordinate[1] - 0.5) * viewportHeight;
  return [x, y, depth];
}

function sampleSegment(
  from: LineNetCoordinate,
  segment: LineNetSegment,
  samples: number,
): LineNetCoordinate[] {
  const total = Math.max(2, samples);
  const result: LineNetCoordinate[] = [];
  const kind = segment.kind ?? 'line';

  if (kind === 'line') {
    result.push(segment.to);
    return result;
  }

  if (kind === 'quadratic') {
    const controlPoints = segment.controlPoints ?? [];
    const cp = controlPoints[0] ?? from;
    for (let index = 1; index <= total; index += 1) {
      const t = index / total;
      result.push(quadraticBezier(from, cp, segment.to, t));
    }
    return result;
  }

  if (kind === 'cubic') {
    const controlPoints = segment.controlPoints ?? [];
    const cp1 = controlPoints[0] ?? from;
    const cp2 = controlPoints[1] ?? segment.to;
    for (let index = 1; index <= total; index += 1) {
      const t = index / total;
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
  return [x, y] satisfies LineNetCoordinate;
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
  return [x, y] satisfies LineNetCoordinate;
}

function computeLineWidth(weight: number, scale: number) {
  const base = gridWidthPx * scale;
  const tracer = tracerWidthPx * scale;
  return base * (weight || 1) + tracer * 0.2;
}

function extractActiveTargets(
  clips: LineNetTimelineClip[] | undefined,
  beat: number,
  type: LineNetTimelineClip['targetType'],
) {
  if (!clips) return [] as string[];
  return clips
    .filter((clip) => clip.targetType === type)
    .filter((clip) => beat >= clip.beat && beat < clip.beat + (clip.length ?? 1))
    .map((clip) => clip.targetId);
}

function updateIfChanged(next: string[], previous: string[], setter: (value: string[]) => void) {
  if (arraysEqual(next, previous)) return;
  setter(next);
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
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

const htmlTimelineStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  background: 'rgba(8, 10, 15, 0.72)',
  color: chronoTokens.semantic.color.text.primary,
  borderRadius: '0.6rem',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  border: `1px solid ${chronoTokens.semantic.color.border.accent}`,
  boxShadow: '0 0 24px rgba(0, 240, 255, 0.25)',
};

const htmlLabelStyle: CSSProperties = {
  padding: '0.2rem 0.4rem',
  background: 'rgba(8, 10, 15, 0.66)',
  color: chronoTokens.semantic.color.text.secondary,
  borderRadius: '0.4rem',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: `1px solid ${chronoTokens.semantic.color.border.subtle}`,
};

function createSynthwaveLineNet(): LineNetDefinition {
  return defineLineNet(
    {
      nodes: [
        { id: 'origin', position: [0.08, 0.18], label: 'Origin Gate' },
        { id: 'spire', position: [0.28, 0.34], label: 'Data Spire' },
        { id: 'relay', position: [0.48, 0.58], label: 'Relay Nexus' },
        { id: 'uplink', position: [0.76, 0.78], label: 'Sky Uplink' },
        { id: 'horizon', position: [0.92, 0.62], label: 'Horizon Node' },
        { id: 'downtown', position: [0.24, 0.68], label: 'Downtown Hub' },
        { id: 'catalyst', position: [0.58, 0.3], label: 'Catalyst Bridge' },
      ],
      edges: [
        {
          id: 'origin-spire',
          from: 'origin',
          to: 'spire',
          weight: chronoTokens.semantic.lines.tracer.weight,
          segments: [
            { kind: 'line', to: [0.18, 0.26] },
            { kind: 'quadratic', to: [0.28, 0.34], controlPoints: [[0.2, 0.38]] },
          ],
        },
        {
          id: 'spire-relay',
          from: 'spire',
          to: 'relay',
          weight: chronoTokens.semantic.lines.grid.weight,
          segments: [{ kind: 'quadratic', to: [0.48, 0.58], controlPoints: [[0.36, 0.66]] }],
        },
        {
          id: 'relay-uplink',
          from: 'relay',
          to: 'uplink',
          weight: chronoTokens.semantic.lines.horizon.weight,
          segments: [
            {
              kind: 'cubic',
              to: [0.76, 0.78],
              controlPoints: [
                [0.58, 0.68],
                [0.68, 0.88],
              ],
            },
          ],
        },
        {
          id: 'relay-horizon',
          from: 'relay',
          to: 'horizon',
          weight: chronoTokens.semantic.lines.grid.weight,
          segments: [
            { kind: 'line', to: [0.68, 0.62] },
            { kind: 'quadratic', to: [0.92, 0.62], controlPoints: [[0.82, 0.48]] },
          ],
        },
        {
          id: 'origin-downtown',
          from: 'origin',
          to: 'downtown',
          weight: chronoTokens.semantic.lines.tracer.weight,
          segments: [
            {
              kind: 'cubic',
              to: [0.24, 0.68],
              controlPoints: [
                [0.1, 0.42],
                [0.18, 0.62],
              ],
            },
          ],
        },
        {
          id: 'downtown-uplink',
          from: 'downtown',
          to: 'uplink',
          weight: chronoTokens.semantic.lines.grid.weight,
          segments: [
            { kind: 'quadratic', to: [0.58, 0.72], controlPoints: [[0.38, 0.82]] },
            { kind: 'line', to: [0.76, 0.78] },
          ],
        },
        {
          id: 'spire-catalyst',
          from: 'spire',
          to: 'catalyst',
          weight: chronoTokens.semantic.lines.tracer.weight,
          segments: [
            { kind: 'line', to: [0.4, 0.32] },
            { kind: 'line', to: [0.58, 0.3] },
          ],
        },
        {
          id: 'catalyst-horizon',
          from: 'catalyst',
          to: 'horizon',
          weight: chronoTokens.semantic.lines.horizon.weight,
          segments: [{ kind: 'quadratic', to: [0.92, 0.62], controlPoints: [[0.74, 0.28]] }],
        },
      ],
      timelines: [
        {
          id: 'intro-origin',
          targetType: 'node',
          targetId: 'origin',
          action: 'highlight',
          beat: 0,
          length: 1,
        },
        {
          id: 'trace-origin-spire',
          targetType: 'edge',
          targetId: 'origin-spire',
          action: 'draw',
          beat: 1,
          length: 2,
        },
        {
          id: 'cue-spire',
          targetType: 'node',
          targetId: 'spire',
          action: 'pulse',
          beat: 2.5,
          length: 1,
        },
        {
          id: 'trace-spire-relay',
          targetType: 'edge',
          targetId: 'spire-relay',
          action: 'draw',
          beat: 3,
          length: 2,
        },
        {
          id: 'cue-relay',
          targetType: 'node',
          targetId: 'relay',
          action: 'highlight',
          beat: 4.5,
          length: 1,
        },
        {
          id: 'trace-relay-uplink',
          targetType: 'edge',
          targetId: 'relay-uplink',
          action: 'draw',
          beat: 5,
          length: 2,
        },
        {
          id: 'trace-origin-downtown',
          targetType: 'edge',
          targetId: 'origin-downtown',
          action: 'draw',
          beat: 6,
          length: 1.5,
        },
        {
          id: 'cue-downtown',
          targetType: 'node',
          targetId: 'downtown',
          action: 'pulse',
          beat: 6.6,
          length: 1,
        },
        {
          id: 'trace-downtown-uplink',
          targetType: 'edge',
          targetId: 'downtown-uplink',
          action: 'highlight',
          beat: 7.2,
          length: 1.8,
        },
        {
          id: 'cue-uplink',
          targetType: 'node',
          targetId: 'uplink',
          action: 'highlight',
          beat: 8.4,
          length: 1.4,
        },
        {
          id: 'trace-relay-horizon',
          targetType: 'edge',
          targetId: 'relay-horizon',
          action: 'draw',
          beat: 9,
          length: 1.6,
        },
        {
          id: 'trace-spire-catalyst',
          targetType: 'edge',
          targetId: 'spire-catalyst',
          action: 'pulse',
          beat: 10,
          length: 1,
        },
        {
          id: 'trace-catalyst-horizon',
          targetType: 'edge',
          targetId: 'catalyst-horizon',
          action: 'draw',
          beat: 11,
          length: 1.8,
        },
      ],
      meta: {
        loop: 'synthwave-network',
      },
    },
    { strict: true },
  );
}
