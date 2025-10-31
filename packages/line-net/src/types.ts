export type LineNetCoordinate = Readonly<[number, number]>;

export type LineSegmentType = 'line' | 'quadratic' | 'cubic';

export interface LineNetSegment {
  /**
   * Path command type. Defaults to `line` （直线段）.
   */
  kind?: LineSegmentType;
  /** 目标点坐标，使用归一化画布坐标（0-1）。 */
  to: LineNetCoordinate;
  /**
   * 控制点集合，用于二阶/三阶贝塞尔曲线。
   * - quadratic: 1 个控制点
   * - cubic: 2 个控制点（按顺序）
   */
  controlPoints?: LineNetCoordinate[];
}

export interface LineNetNode {
  /** 节点唯一 ID。 */
  id: string;
  /** 节点坐标，使用归一化画布坐标（0-1）。 */
  position: LineNetCoordinate;
  /** 可选标签，用于无障碍朗读/调试。 */
  label?: string;
  /**
   * 任意扩展元数据，可在运行时传递到渲染层。
   */
  meta?: Record<string, unknown>;
}

export interface LineNetEdge {
  /** 边唯一 ID。 */
  id: string;
  /** 起点节点 ID。 */
  from: string;
  /** 终点节点 ID。 */
  to: string;
  /** 零面积绘制路径，由若干线段组成。 */
  segments: LineNetSegment[];
  /**
   * 起始绘制偏移（0-1），可用于仅展示部分线段。
   */
  offset?: number;
  /** 线宽倍率，用于在语义上区分主线/支线。 */
  weight?: number;
  /** 任意自定义属性。 */
  meta?: Record<string, unknown>;
}

export type LineNetTimelineTargetType = 'node' | 'edge';
export type LineNetTimelineAction = 'draw' | 'erase' | 'pulse' | 'highlight' | 'deemphasize';

export interface LineNetTimelineClip {
  /** 片段唯一 ID。 */
  id: string;
  /** 目标类型（节点或边）。 */
  targetType: LineNetTimelineTargetType;
  /** 目标 ID。 */
  targetId: string;
  /** 动作类型。 */
  action: LineNetTimelineAction;
  /** 起始节拍（beat）。 */
  beat: number;
  /** 持续节拍长度，默认 1。 */
  length?: number;
  /** 自定义缓动函数，可使用 cubic-bezier 数组或字符串关键字。 */
  easing?: string | [number, number, number, number];
  /** 可选附加数据。 */
  payload?: Record<string, unknown>;
}

export interface LineNetDefinition {
  nodes: LineNetNode[];
  edges: LineNetEdge[];
  timelines?: LineNetTimelineClip[];
  /** 用于渲染器/运行时的额外配置。 */
  meta?: Record<string, unknown>;
}

export type LineNetDefinitionInput = LineNetDefinition;
