export const anglePresets = {
  deg0: 0,
  deg30: 30,
  deg60: 60,
  deg120: 120,
} as const;

export const angleTolerance = {
  soft: 2, // degrees
  normal: 1,
  exact: 0.25,
} as const;
