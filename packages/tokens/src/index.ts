import {
  blurLevels,
  colorAlpha,
  colorGradients,
  colorPalette,
  glowRadii,
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
} from './foundations/index.js';
import {
  semanticColors,
  semanticEffects,
  semanticLayers,
  semanticMotion,
  semanticSpacing,
  semanticTypography,
} from './semantic.js';

export * from './foundations/index.js';
export * from './semantic.js';

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
    motion: {
      durations: motionDurations,
      easings: motionEasings,
    },
    shadow: shadowLayers,
    glow: glowRadii,
    layers: layerIndex,
    noise: noiseLevels,
    blur: blurLevels,
  },
  semantic: {
    color: semanticColors,
    typography: semanticTypography,
    spacing: semanticSpacing,
    motion: semanticMotion,
    effects: semanticEffects,
    layers: semanticLayers,
  },
} as const;

export type ChronoTokens = typeof chronoTokens;
