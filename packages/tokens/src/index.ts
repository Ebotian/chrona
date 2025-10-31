import {
  blurLevels,
  colorAlpha,
  colorGradients,
  colorPalette,
  glowRadii,
  lineWidths,
  lineWeights,
  lineGap,
  anglePresets,
  angleTolerance,
  audioBeats,
  audioTiming,
  layerIndex,
  motionDurations,
  motionEasings,
  noiseLevels,
  radiusScale,
  shadowLayers,
  spacingScale,
  typographyFamilies,
  typographyLetterSpacing,
  typographyLineHeights,
  typographySizes,
  typographyWeights,
} from './foundations';
import {
  semanticAudio,
  semanticColors,
  semanticEffects,
  semanticLayers,
  semanticLines,
  semanticMotion,
  semanticSpacing,
  semanticTypography,
  semanticAngles,
} from './semantic';

export * from './foundations';
export * from './semantic';

export const chronoTokens = {
  foundations: {
    color: {
      palette: colorPalette,
      alpha: colorAlpha,
      gradients: colorGradients,
    },
    typography: {
      families: typographyFamilies,
      weights: typographyWeights,
      sizes: typographySizes,
      lineHeights: typographyLineHeights,
      letterSpacing: typographyLetterSpacing,
    },
    space: spacingScale,
    radius: radiusScale,
    line: {
      widths: lineWidths,
      weights: lineWeights,
      gap: lineGap,
    },
    angles: {
      presets: anglePresets,
      tolerance: angleTolerance,
    },
    motion: {
      durations: motionDurations,
      easings: motionEasings,
    },
    shadow: shadowLayers,
    glow: glowRadii,
    layers: layerIndex,
    noise: noiseLevels,
    audio: {
      beats: audioBeats,
      timing: audioTiming,
    },
    blur: blurLevels,
  },
  semantic: {
    color: semanticColors,
    typography: semanticTypography,
    spacing: semanticSpacing,
    motion: semanticMotion,
    lines: semanticLines,
    angles: semanticAngles,
    audio: semanticAudio,
    effects: semanticEffects,
    layers: semanticLayers,
  },
} as const;

export type ChronoTokens = typeof chronoTokens;
