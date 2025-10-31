import { colorPalette } from './color';

export const shadowLayers = {
  subtle: `0 12px 24px rgba(8, 10, 15, 0.35)`,
  medium: `0 24px 48px rgba(8, 10, 15, 0.5)`,
  intense: `0 48px 80px rgba(8, 10, 15, 0.65)`,
} as const;

export const glowRadii = {
  xs: `0 0 8px ${colorPalette.plasmaBlue}`,
  sm: `0 0 12px ${colorPalette.plasmaBlue}`,
  md: `0 0 18px ${colorPalette.plasmaBlue}`,
  lg: `0 0 24px ${colorPalette.plasmaBlue}`,
} as const;
