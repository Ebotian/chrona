import { useEffect, useMemo, useRef } from 'react';
import { Color, Uniform, Vector2, Vector3, Vector4 } from 'three';

export type ChronoShaderUniformPrimitive = number | boolean;
export type ChronoShaderUniformTuple = readonly number[];
export type ChronoShaderUniformValue =
  | ChronoShaderUniformPrimitive
  | ChronoShaderUniformTuple
  | Vector2
  | Vector3
  | Vector4
  | Color;

export interface ChronoShaderUniformDefinition {
  value: ChronoShaderUniformValue;
  /**
   * Optional lerp factor (0-1). When supplied, uniform values will ease towards the target.
   */
  lerp?: number;
}

export type ChronoShaderUniformConfig = Record<string, ChronoShaderUniformDefinition>;

export function useChronoShaderUniforms(
  config: ChronoShaderUniformConfig,
): Record<string, Uniform> {
  const uniformsRef = useRef<Record<string, Uniform> | null>(null);

  if (!uniformsRef.current) {
    uniformsRef.current = createUniforms(config);
  }

  useEffect(() => {
    if (!uniformsRef.current) return;
    updateUniforms(uniformsRef.current, config);
  }, [config]);

  return useMemo(() => uniformsRef.current as Record<string, Uniform>, []);
}

function createUniforms(config: ChronoShaderUniformConfig): Record<string, Uniform> {
  const uniforms: Record<string, Uniform> = {};
  for (const [key, definition] of Object.entries(config)) {
    uniforms[key] = new Uniform(cloneValue(definition.value));
  }
  return uniforms;
}

function updateUniforms(uniforms: Record<string, Uniform>, config: ChronoShaderUniformConfig) {
  for (const [key, definition] of Object.entries(config)) {
    const uniform = uniforms[key];
    if (!uniform) continue;

    const target = definition.value;
    const lerp = typeof definition.lerp === 'number' ? clamp(definition.lerp, 0, 1) : undefined;

    if (lerp == null) {
      uniform.value = cloneValue(target);
      continue;
    }

    uniform.value = lerpUniformValue(uniform.value, target, lerp);
  }
}

function lerpUniformValue(
  current: unknown,
  target: ChronoShaderUniformValue,
  lerp: number,
): ChronoShaderUniformValue {
  if (typeof target === 'number' || typeof target === 'boolean') {
    if (typeof current !== 'number') {
      return target;
    }
    return current + (Number(target) - current) * lerp;
  }

  if (isNumberArray(target)) {
    const currentArray: number[] = Array.isArray(current)
      ? (current as number[])
      : Array.from({ length: target.length }, () => 0);
    const interpolated = target.map((value, index) => {
      const source = Number(currentArray[index] ?? 0);
      return source + (value - source) * lerp;
    });
    return interpolated;
  }

  if (target instanceof Color) {
    const color = current instanceof Color ? current : new Color();
    color.lerp(target, lerp);
    return color;
  }

  if (target instanceof Vector2) {
    const vector = current instanceof Vector2 ? current : new Vector2();
    vector.lerp(target, lerp);
    return vector;
  }

  if (target instanceof Vector3) {
    const vector = current instanceof Vector3 ? current : new Vector3();
    vector.lerp(target, lerp);
    return vector;
  }

  if (target instanceof Vector4) {
    const vector = current instanceof Vector4 ? current : new Vector4();
    vector.lerp(target, lerp);
    return vector;
  }

  return cloneValue(target);
}

function cloneValue(value: ChronoShaderUniformValue): ChronoShaderUniformValue {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isNumberArray(value)) {
    return [...value];
  }
  if (value instanceof Color) {
    return value.clone();
  }
  if (value instanceof Vector2 || value instanceof Vector3 || value instanceof Vector4) {
    return value.clone();
  }
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value);
}
