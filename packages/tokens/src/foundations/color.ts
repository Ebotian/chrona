export const colorPalette = {
  deepSpaceBlack: '#080A0F',
  stardustWhite: '#C5C8D1',
  plasmaBlue: '#00F0FF',
  magRidgePink: '#ff2d92',
  warningOrange: '#FF4A00',
  phantomGray: '#4A5568',
  riftViolet: '#3A1C5F',
  zeroCyan: '#03DAC5',
} as const;

export const colorGradients = {
  primaryVeil: `${colorPalette.riftViolet}, ${colorPalette.zeroCyan}`,
} as const;

export const colorAlpha = {
  glassLow: 'rgba(8, 10, 15, 0.35)',
  glassMedium: 'rgba(8, 10, 15, 0.55)',
  glassHigh: 'rgba(8, 10, 15, 0.75)',
  outlineSoft: 'rgba(197, 200, 209, 0.32)',
  glowBase: 'rgba(0, 240, 255, 0.66)',
} as const;
