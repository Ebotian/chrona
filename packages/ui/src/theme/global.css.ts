import { createGlobalTheme, globalStyle, style } from '@vanilla-extract/css';
import { chronoTokens } from '@chrono/tokens';

const { semantic, foundations } = chronoTokens;

type TypographyScale = {
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
};

type ChronoThemeContract = {
  color: {
    background: {
      base: string;
      surface: string;
      elevated: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      accent: string;
      warning: string;
    };
    border: {
      subtle: string;
      accent: string;
    };
    brand: {
      primary: string;
      warning: string;
    };
  };
  gradient: {
    veil: string;
  };
  glow: {
    idle: string;
    hover: string;
    active: string;
    emphasis: string;
  };
  blur: {
    hud: string;
    overlay: string;
    depth: string;
  };
  noise: {
    base: string;
    hover: string;
    overlay: string;
  };
  typography: {
    display: TypographyScale;
    h1: TypographyScale;
    h2: TypographyScale;
    h3: TypographyScale;
    body: TypographyScale;
    caption: TypographyScale;
    mono: TypographyScale;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    pill: string;
  };
  shadow: {
    subtle: string;
    medium: string;
    intense: string;
  };
  motion: {
    durations: {
      immediate: string;
      hover: string;
      reveal: string;
      transition: string;
      cinematic: string;
    };
    easings: {
      logo: string;
      navigation: string;
      card: string;
      lightbox: string;
      glitch: string;
    };
  };
  layer: {
    base: string;
    content: string;
    hud: string;
    overlay: string;
    dialog: string;
    system: string;
  };
};

export const chronoVars = createGlobalTheme(':root', {
  color: {
    background: {
      base: semantic.color.background.base,
      surface: semantic.color.background.surface,
      elevated: semantic.color.background.elevated,
      overlay: semantic.color.background.overlay,
    },
    text: {
      primary: semantic.color.text.primary,
      secondary: semantic.color.text.secondary,
      accent: semantic.color.text.accent,
      warning: semantic.color.text.warning,
    },
    border: {
      subtle: semantic.color.border.subtle,
      accent: semantic.color.border.accent,
    },
    brand: {
      primary: semantic.color.brand.primary,
      warning: semantic.color.brand.warning,
    },
  },
  gradient: {
    veil: semantic.color.brand.gradientVeil,
  },
  glow: {
    idle: semantic.effects.glow.idle,
    hover: semantic.effects.glow.hover,
    active: semantic.effects.glow.active,
    emphasis: semantic.effects.glow.emphasis,
  },
  blur: {
    hud: semantic.effects.blur.hud,
    overlay: semantic.effects.blur.overlay,
    depth: semantic.effects.blur.depth,
  },
  noise: {
    base: `${semantic.effects.noise.base}`,
    hover: `${semantic.effects.noise.hover}`,
    overlay: `${semantic.effects.noise.overlay}`,
  },
  typography: {
    display: {
      fontFamily: semantic.typography.display.fontFamily,
      fontWeight: `${semantic.typography.display.fontWeight}`,
      fontSize: semantic.typography.display.fontSize,
      lineHeight: `${semantic.typography.display.lineHeight}`,
      letterSpacing: semantic.typography.display.letterSpacing,
    },
    h1: {
      fontFamily: semantic.typography.h1.fontFamily,
      fontWeight: `${semantic.typography.h1.fontWeight}`,
      fontSize: semantic.typography.h1.fontSize,
      lineHeight: `${semantic.typography.h1.lineHeight}`,
      letterSpacing: semantic.typography.h1.letterSpacing,
    },
    h2: {
      fontFamily: semantic.typography.h2.fontFamily,
      fontWeight: `${semantic.typography.h2.fontWeight}`,
      fontSize: semantic.typography.h2.fontSize,
      lineHeight: `${semantic.typography.h2.lineHeight}`,
      letterSpacing: semantic.typography.h2.letterSpacing,
    },
    h3: {
      fontFamily: semantic.typography.h3.fontFamily,
      fontWeight: `${semantic.typography.h3.fontWeight}`,
      fontSize: semantic.typography.h3.fontSize,
      lineHeight: `${semantic.typography.h3.lineHeight}`,
      letterSpacing: semantic.typography.h3.letterSpacing,
    },
    body: {
      fontFamily: semantic.typography.body.fontFamily,
      fontWeight: `${semantic.typography.body.fontWeight}`,
      fontSize: semantic.typography.body.fontSize,
      lineHeight: `${semantic.typography.body.lineHeight}`,
      letterSpacing: semantic.typography.body.letterSpacing,
    },
    caption: {
      fontFamily: semantic.typography.caption.fontFamily,
      fontWeight: `${semantic.typography.caption.fontWeight}`,
      fontSize: semantic.typography.caption.fontSize,
      lineHeight: `${semantic.typography.caption.lineHeight}`,
      letterSpacing: semantic.typography.caption.letterSpacing,
    },
    mono: {
      fontFamily: semantic.typography.mono.fontFamily,
      fontWeight: `${semantic.typography.mono.fontWeight}`,
      fontSize: semantic.typography.mono.fontSize,
      lineHeight: `${semantic.typography.mono.lineHeight}`,
      letterSpacing: semantic.typography.mono.letterSpacing,
    },
  },
  spacing: {
    xs: semantic.spacing.stackXS,
    sm: semantic.spacing.stackSM,
    md: semantic.spacing.stackMD,
    lg: semantic.spacing.stackLG,
    xl: semantic.spacing.stackXL,
  },
  radius: {
    xs: foundations.radius.xs,
    sm: foundations.radius.sm,
    md: foundations.radius.md,
    lg: foundations.radius.lg,
    xl: foundations.radius.xl,
    pill: foundations.radius.pill,
  },
  shadow: {
    subtle: foundations.shadow.subtle,
    medium: foundations.shadow.medium,
    intense: foundations.shadow.intense,
  },
  motion: {
    durations: {
      immediate: semantic.motion.durations.immediate,
      hover: semantic.motion.durations.hover,
      reveal: semantic.motion.durations.reveal,
      transition: semantic.motion.durations.transition,
      cinematic: semantic.motion.durations.cinematic,
    },
    easings: {
      logo: semantic.motion.easings.logo,
      navigation: semantic.motion.easings.navigation,
      card: semantic.motion.easings.card,
      lightbox: semantic.motion.easings.lightbox,
      glitch: semantic.motion.easings.glitch,
    },
  },
  layer: {
    base: `${semantic.layers.base}`,
    content: `${semantic.layers.content}`,
    hud: `${semantic.layers.hud}`,
    overlay: `${semantic.layers.overlay}`,
    dialog: `${semantic.layers.dialog}`,
    system: `${semantic.layers.system}`,
  },
} satisfies ChronoThemeContract);

globalStyle(':root', {
  colorScheme: 'dark',
  backgroundColor: chronoVars.color.background.base,
  fontFamily: chronoVars.typography.body.fontFamily,
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('html, body', {
  margin: 0,
  padding: 0,
  minHeight: '100%',
  backgroundColor: chronoVars.color.background.base,
  color: chronoVars.color.text.primary,
  fontFamily: chronoVars.typography.body.fontFamily,
  fontSize: chronoVars.typography.body.fontSize,
  lineHeight: chronoVars.typography.body.lineHeight,
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});

globalStyle('body', {
  display: 'flex',
  flexDirection: 'column',
  backgroundImage: `radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.08), transparent 45%), radial-gradient(circle at 80% 0%, rgba(58, 28, 95, 0.25), transparent 55%)`,
  backgroundAttachment: 'fixed',
  overscrollBehaviorY: 'none',
});

globalStyle('a', {
  color: chronoVars.color.text.accent,
  textDecoration: 'none',
  transition: `color ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.navigation}`,
});

globalStyle('a:hover', {
  color: chronoVars.color.text.primary,
});

globalStyle('p', {
  marginTop: 0,
  marginBottom: chronoVars.spacing.md,
});

globalStyle('code', {
  fontFamily: chronoVars.typography.mono.fontFamily,
  fontSize: chronoVars.typography.mono.fontSize,
  backgroundColor: 'rgba(197, 200, 209, 0.08)',
  padding: '2px 6px',
  borderRadius: chronoVars.radius.sm,
});

globalStyle('::selection', {
  backgroundColor: 'rgba(0, 240, 255, 0.35)',
  color: chronoVars.color.text.primary,
});

export const chronoRootClass = style({
  minHeight: '100vh',
  backgroundColor: chronoVars.color.background.base,
  color: chronoVars.color.text.primary,
  fontFamily: chronoVars.typography.body.fontFamily,
  position: 'relative',
  isolation: 'isolate',
});
