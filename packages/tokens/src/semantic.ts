import {
  anglePresets,
  angleTolerance,
  audioBeats,
  audioTiming,
  blurLevels,
  colorAlpha,
  colorGradients,
  colorPalette,
  glowRadii,
  layerIndex,
  lineGap,
  lineWeights,
  lineWidths,
  motionDurations,
  motionEasings,
  noiseLevels,
  spacingScale,
  typographyFamilies,
  typographyLetterSpacing,
  typographyLineHeights,
  typographySizes,
  typographyWeights,
} from './foundations/index.js';

export const semanticColors = {
  background: {
    base: colorPalette.deepSpaceBlack,
    surface: colorAlpha.glassMedium,
    elevated: colorAlpha.glassHigh,
    overlay: 'rgba(8, 10, 15, 0.88)',
  },
  text: {
    primary: colorPalette.stardustWhite,
    secondary: colorPalette.phantomGray,
    accent: colorPalette.plasmaBlue,
    warning: colorPalette.warningOrange,
  },
  border: {
    subtle: colorAlpha.outlineSoft,
    accent: `rgba(0, 240, 255, 0.45)`,
  },
  brand: {
    primary: colorPalette.plasmaBlue,
    warning: colorPalette.warningOrange,
    gradientVeil: `linear-gradient(135deg, ${colorGradients.primaryVeil})`,
  },
  effects: {
    glow: colorAlpha.glowBase,
    glitch: `rgba(255, 74, 0, 0.4)`,
  },
} as const;

export const semanticTypography = {
  display: {
    fontFamily: typographyFamilies.heading,
    fontSize: typographySizes.display,
    lineHeight: typographyLineHeights.display,
    letterSpacing: typographyLetterSpacing.display,
    fontWeight: typographyWeights.heading,
  },
  h1: {
    fontFamily: typographyFamilies.heading,
    fontSize: typographySizes.h1,
    lineHeight: typographyLineHeights.h1,
    letterSpacing: typographyLetterSpacing.h1,
    fontWeight: typographyWeights.heading,
  },
  h2: {
    fontFamily: typographyFamilies.heading,
    fontSize: typographySizes.h2,
    lineHeight: typographyLineHeights.h2,
    letterSpacing: typographyLetterSpacing.h2,
    fontWeight: typographyWeights.heading,
  },
  h3: {
    fontFamily: typographyFamilies.heading,
    fontSize: typographySizes.h3,
    lineHeight: typographyLineHeights.h3,
    letterSpacing: typographyLetterSpacing.h3,
    fontWeight: typographyWeights.heading,
  },
  body: {
    fontFamily: typographyFamilies.body,
    fontSize: typographySizes.body,
    lineHeight: typographyLineHeights.body,
    letterSpacing: typographyLetterSpacing.body,
    fontWeight: typographyWeights.bodyRegular,
  },
  caption: {
    fontFamily: typographyFamilies.body,
    fontSize: typographySizes.caption,
    lineHeight: typographyLineHeights.caption,
    letterSpacing: typographyLetterSpacing.caption,
    fontWeight: typographyWeights.bodyMedium,
  },
  mono: {
    fontFamily: typographyFamilies.mono,
    fontSize: typographySizes.body,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
    fontWeight: typographyWeights.mono,
  },
} as const;

export const semanticSpacing = {
  stackXS: spacingScale[1],
  stackSM: spacingScale[2],
  stackMD: spacingScale[3],
  stackLG: spacingScale[4],
  stackXL: spacingScale[5],
} as const;

export const semanticMotion = {
  durations: {
    immediate: motionDurations.instant,
    hover: motionDurations.quick,
    reveal: motionDurations.rapid,
    transition: motionDurations.base,
    cinematic: motionDurations.cinematic,
  },
  easings: {
    logo: motionEasings.logo,
    navigation: motionEasings.hud,
    card: motionEasings.hoverCard,
    lightbox: motionEasings.lightbox,
    glitch: motionEasings.glitch,
  },
} as const;

export const semanticLines = {
  tracer: {
    width: lineWidths.hair,
    weight: lineWeights.tertiary,
  },
  grid: {
    width: lineWidths.base,
    weight: lineWeights.secondary,
    gap: lineGap.normal,
  },
  horizon: {
    width: lineWidths.heavy,
    weight: lineWeights.primary,
    accentGap: lineGap.tight,
  },
} as const;

export const semanticAngles = {
  skyline: anglePresets.deg60,
  ascent: anglePresets.deg30,
  descent: anglePresets.deg120,
  tolerance: {
    precision: angleTolerance.normal,
    cinematic: angleTolerance.soft,
    exact: angleTolerance.exact,
  },
} as const;

export const semanticAudio = {
  defaultBpm: audioBeats.defaultBpm,
  cues: audioBeats.cues,
  beatMs: audioTiming.beatMs,
  measureMs: audioTiming.measureMs,
} as const;

export const semanticEffects = {
  glow: {
    idle: glowRadii.xs,
    hover: glowRadii.sm,
    active: glowRadii.md,
    emphasis: glowRadii.lg,
  },
  blur: {
    hud: blurLevels.hud,
    overlay: blurLevels.overlay,
    depth: blurLevels.depth,
  },
  noise: {
    base: noiseLevels.base,
    hover: noiseLevels.hover,
    overlay: noiseLevels.overlay,
  },
} as const;

export const semanticLayers = {
  base: layerIndex.base,
  content: layerIndex.content,
  hud: layerIndex.hud,
  overlay: layerIndex.overlay,
  dialog: layerIndex.dialog,
  system: layerIndex.system,
} as const;

export type SemanticColors = typeof semanticColors;
export type SemanticTypography = typeof semanticTypography;
export type SemanticSpacing = typeof semanticSpacing;
export type SemanticMotion = typeof semanticMotion;
export type SemanticLines = typeof semanticLines;
export type SemanticAngles = typeof semanticAngles;
export type SemanticAudio = typeof semanticAudio;
export type SemanticEffects = typeof semanticEffects;
export type SemanticLayers = typeof semanticLayers;
