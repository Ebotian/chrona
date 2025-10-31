import { createElement, type ReactElement } from 'react';
import { NebulaParticlesScene } from './NebulaParticlesScene.js';
import { HudGridScene } from './HudGridScene.js';
import { SynthwaveSkylineScene } from './SynthwaveSkylineScene.js';
import { LineNetDebugScene } from './LineNetDebugScene.js';

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
  skyline: {
    label: 'Synthwave Skyline',
    description: '使用零面积线条和霓虹材质构建的霓虹城市天际线，滚动驱动视差与日冕脉冲。',
    render: () => createElement(SynthwaveSkylineScene),
  },
  lineNet: {
    label: 'Line-Net Debug',
    description: '可视化零面积网络拓扑，实时预览节拍驱动的边缘/节点动作序列。',
    render: () => createElement(LineNetDebugScene),
  },
};
