import { createElement, type ReactElement } from 'react';
import { NebulaParticlesScene } from './NebulaParticlesScene.js';
import { HudGridScene } from './HudGridScene.js';

export interface PlaygroundSceneMeta {
  label: string;
  description: string;
  render: () => ReactElement;
}

export const demoScenes: Record<string, PlaygroundSceneMeta> = {
  nebula: {
    label: 'Nebula Particles',
    description: '粒子星云随滚动流动，观察 Lenis 速度与 Uniform 联动效果。',
    render: () => createElement(NebulaParticlesScene),
  },
  hud: {
    label: 'HUD Grid',
    description: '全息 HUD 网格展示横向滚动偏移与扫描线动画。',
    render: () => createElement(HudGridScene),
  },
};
