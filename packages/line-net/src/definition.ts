import type {
  LineNetDefinition,
  LineNetDefinitionInput,
  LineNetEdge,
  LineNetNode,
  LineNetSegment,
  LineNetTimelineClip,
} from './types';

export interface DefineLineNetOptions {
  /**
   * 启用严格模式：遇到任意数据不合法时抛出错误；否则记录警告并尝试继续。
   */
  strict?: boolean;
}

export class LineNetDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LineNetDefinitionError';
  }
}

export function defineLineNet(
  input: LineNetDefinitionInput,
  options: DefineLineNetOptions = {},
): Readonly<LineNetDefinition> {
  const { strict = true } = options;

  const errors: string[] = [];

  const nodeIds = new Set<string>();
  const normalizedNodes: LineNetNode[] = input.nodes.map((node, index) => {
    if (!node.id) {
      errors.push(`nodes[${index}] 缺少 id`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`节点 ID 重复：${node.id}`);
    } else {
      nodeIds.add(node.id);
    }

    validateCoordinate(node.position, `nodes[${index}].position`, errors);

    const normalized: LineNetNode = {
      id: node.id,
      position: [...node.position] as LineNetNode['position'],
    };

    if (node.label) {
      normalized.label = node.label;
    }
    if (node.meta) {
      normalized.meta = { ...node.meta };
    }

    return normalized;
  });

  const edgeIds = new Set<string>();
  const normalizedEdges: LineNetEdge[] = input.edges.map((edge, index) => {
    if (!edge.id) {
      errors.push(`edges[${index}] 缺少 id`);
    } else if (edgeIds.has(edge.id)) {
      errors.push(`边 ID 重复：${edge.id}`);
    } else {
      edgeIds.add(edge.id);
    }

    if (!nodeIds.has(edge.from)) {
      errors.push(`边 ${edge.id ?? index} 起点 ${edge.from} 未在节点列表中定义`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`边 ${edge.id ?? index} 终点 ${edge.to} 未在节点列表中定义`);
    }

    if (!edge.segments || edge.segments.length === 0) {
      errors.push(`边 ${edge.id ?? index} 未提供 segments`);
    }

    const segments = (edge.segments ?? []).map((segment, segIndex) =>
      normalizeSegment(segment, `edges[${index}].segments[${segIndex}]`, errors),
    );

    const normalized: LineNetEdge = {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      segments,
    };

    if (edge.offset !== undefined) {
      normalized.offset = edge.offset;
    }
    if (edge.weight !== undefined) {
      normalized.weight = edge.weight;
    }
    if (edge.meta) {
      normalized.meta = { ...edge.meta };
    }

    return normalized;
  });

  const normalizedTimelines = input.timelines?.map((clip, index) => {
    if (!clip.id) {
      errors.push(`timelines[${index}] 缺少 id`);
    }
    const clipRef: string = clip.id ?? String(index);
    const targetTypeForError = clip.targetType as string;
    if (clip.targetType !== 'node' && clip.targetType !== 'edge') {
      errors.push(`timelines[${clipRef}] targetType 非法：${targetTypeForError}`);
    }
    if (clip.targetType === 'node' && !nodeIds.has(clip.targetId)) {
      errors.push(`timelines[${clipRef}] targetId 未在节点集合中找到：${clip.targetId}`);
    }
    if (clip.targetType === 'edge' && !edgeIds.has(clip.targetId)) {
      errors.push(`timelines[${clipRef}] targetId 未在边集合中找到：${clip.targetId}`);
    }
    if (clip.action !== undefined && typeof clip.action !== 'string') {
      errors.push(`timelines[${clipRef}] action 必须为字符串`);
    }
    if (!Number.isFinite(clip.beat)) {
      errors.push(`timelines[${clipRef}] beat 必须为有限数字`);
    }
    if (clip.length !== undefined && !Number.isFinite(clip.length)) {
      errors.push(`timelines[${clipRef}] length 必须为有限数字`);
    }

    const normalized: LineNetTimelineClip = {
      id: clip.id,
      targetType: clip.targetType,
      targetId: clip.targetId,
      action: clip.action,
      beat: clip.beat,
    };

    if (clip.length !== undefined) {
      normalized.length = clip.length;
    }
    if (clip.easing !== undefined) {
      const easingValue: Exclude<LineNetTimelineClip['easing'], undefined> = Array.isArray(
        clip.easing,
      )
        ? ([...clip.easing] as Exclude<LineNetTimelineClip['easing'], undefined>)
        : clip.easing;
      normalized.easing = easingValue;
    }
    if (clip.payload) {
      normalized.payload = { ...clip.payload };
    }

    return normalized;
  });

  if (errors.length > 0) {
    const message = `LineNet 定义校验失败：\n- ${errors.join('\n- ')}`;
    if (strict) {
      throw new LineNetDefinitionError(message);
    } else {
      console.warn(message);
    }
  }

  const definition: LineNetDefinition = {
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };

  if (normalizedTimelines) {
    definition.timelines = normalizedTimelines;
  }
  if (input.meta) {
    definition.meta = { ...input.meta };
  }

  return freezeDefinition(definition);
}

function validateCoordinate(coordinate: LineNetNode['position'], label: string, errors: string[]) {
  if (!Array.isArray(coordinate) || coordinate.length !== 2) {
    errors.push(`${label} 必须为长度为 2 的数组`);
    return;
  }
  coordinate.forEach((value, index) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${label}[${index}] 必须为数值`);
    }
  });
}

function normalizeSegment(
  segment: LineNetSegment,
  label: string,
  errors: string[],
): LineNetSegment {
  const kind = segment.kind ?? 'line';
  if (kind !== 'line' && kind !== 'quadratic' && kind !== 'cubic') {
    errors.push(`${label}.kind 非法：${segment.kind}`);
  }

  validateCoordinate(segment.to, `${label}.to`, errors);

  if (kind === 'quadratic') {
    const cp = segment.controlPoints ?? [];
    if (cp.length !== 1) {
      errors.push(`${label}.controlPoints 需要正好 1 个点（quadratic）`);
    }
    cp.slice(0, 1).forEach((point, index) => {
      validateCoordinate(point, `${label}.controlPoints[${index}]`, errors);
    });
  } else if (kind === 'cubic') {
    const cp = segment.controlPoints ?? [];
    if (cp.length !== 2) {
      errors.push(`${label}.controlPoints 需要正好 2 个点（cubic）`);
    }
    cp.slice(0, 2).forEach((point, index) => {
      validateCoordinate(point, `${label}.controlPoints[${index}]`, errors);
    });
  }

  const normalized: LineNetSegment = {
    kind,
    to: [...segment.to] as LineNetSegment['to'],
  };

  if (segment.controlPoints) {
    normalized.controlPoints = segment.controlPoints.map((cp) => [...cp] as LineNetSegment['to']);
  }

  return normalized;
}

function freezeDefinition(definition: LineNetDefinition): Readonly<LineNetDefinition> {
  definition.nodes.forEach((node) => Object.freeze(node));
  Object.freeze(definition.nodes);

  definition.edges.forEach((edge) => {
    edge.segments.forEach((segment) => {
      Object.freeze(segment.to);
      segment.controlPoints?.forEach((cp) => Object.freeze(cp));
      if (segment.controlPoints) {
        Object.freeze(segment.controlPoints);
      }
      Object.freeze(segment);
    });
    Object.freeze(edge.segments);
    if (edge.meta) {
      Object.freeze(edge.meta);
    }
    Object.freeze(edge);
  });
  Object.freeze(definition.edges);

  definition.timelines?.forEach((clip) => {
    if (clip.payload) {
      Object.freeze(clip.payload);
    }
    Object.freeze(clip);
  });
  if (definition.timelines) {
    Object.freeze(definition.timelines);
  }

  if (definition.meta) {
    Object.freeze(definition.meta);
  }

  return Object.freeze(definition);
}
