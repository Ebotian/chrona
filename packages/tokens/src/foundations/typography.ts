export const typographyFamilies = {
  heading: `'Monument Extended', 'Neue Machina', 'Inter', 'Helvetica Neue', Arial, sans-serif`,
  body: `'Inter', 'Söhne', 'Helvetica Neue', Arial, sans-serif`,
  mono: `'Fira Code', 'JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Consolas', monospace`,
} as const;

export const typographyWeights = {
  heading: 900,
  bodyRegular: 400,
  bodyMedium: 500,
  mono: 450,
} as const;

export const typographySizes = {
  display: '96px',
  h1: '72px',
  h2: '48px',
  h3: '30px',
  body: '18px',
  caption: '14px',
} as const;

export const typographyLineHeights = {
  display: 1.05,
  h1: 1.1,
  h2: 1.2,
  h3: 1.35,
  body: 1.7,
  caption: 1.5,
} as const;

export const typographyLetterSpacing = {
  display: '-0.04em',
  h1: '-0.032em',
  h2: '-0.024em',
  h3: '-0.012em',
  body: '0em',
  caption: '0.02em',
} as const;
