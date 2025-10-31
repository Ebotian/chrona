'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Color } from 'three';

export interface ChronoSceneOptions {
  background?: [number, number, number];
  onResize?: (width: number, height: number) => void;
}

export function useChronoScene(options: ChronoSceneOptions = {}) {
  const { background, onResize } = options;
  const { gl, scene, size } = useThree();

  useEffect(() => {
    if (!background) return;
    scene.background = null;
    gl.setClearColor(new Color(background[0], background[1], background[2]), 1);
  }, [background, gl, scene]);

  useEffect(() => {
    if (!onResize) return;
    onResize(size.width, size.height);
  }, [size, onResize]);
}
