export const motionDurations = {
  instant: '80ms',
  quick: '120ms',
  rapid: '240ms',
  base: '350ms',
  cinematic: '500ms',
  slow: '1200ms',
} as const;

export const motionEasings = {
  logo: 'cubic-bezier(0.45, 0, 0.55, 1)',
  hud: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  hoverCard: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  lightbox: 'cubic-bezier(0.4, 0, 0.2, 1)',
  glitch: 'steps(2, end)',
} as const;
