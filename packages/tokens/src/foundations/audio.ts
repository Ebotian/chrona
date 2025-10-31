export const audioBeats = {
  defaultBpm: 120,
  // semantic beats used across animations
  cues: {
    initiation: 4,
    skylineCycle: 12,
    ctaPulse: 16,
  },
} as const;

export const audioTiming = {
  beatMs: (bpm: number = audioBeats.defaultBpm) => 60000 / bpm,
  measureMs: (bars: number = 4, bpm: number = audioBeats.defaultBpm) => (60000 / bpm) * 4 * bars,
} as const;
