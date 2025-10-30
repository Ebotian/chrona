import { recipe } from '@vanilla-extract/recipes';
import { style } from '@vanilla-extract/css';
import { chronoVars } from '../../theme/global.css.js';

export const holoBackdrop = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  backgroundImage: `linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(58, 28, 95, 0.08) 100%)`,
  opacity: 0,
  transition: `opacity ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
});

export const holoGrid = style({
  position: 'absolute',
  inset: '1px',
  pointerEvents: 'none',
  backgroundImage:
    'linear-gradient(90deg, rgba(197, 200, 209, 0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(197, 200, 209, 0.04) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
  opacity: 0.6,
});

export const holoHeader = style({
  display: 'grid',
  gap: chronoVars.spacing.sm,
  marginBottom: chronoVars.spacing.sm,
});

export const holoPanelRecipe = recipe({
  base: {
    position: 'relative',
    padding: chronoVars.spacing.md,
    borderRadius: chronoVars.radius.lg,
    border: `1px solid rgba(197, 200, 209, 0.12)`,
    background: 'rgba(8, 10, 15, 0.55)',
    backdropFilter: `blur(${chronoVars.blur.hud})`,
    boxShadow: `${chronoVars.shadow.subtle}, inset 0 0 0 1px rgba(197, 200, 209, 0.08)`,
    overflow: 'hidden',
    transition: [
      `border-color ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.navigation}`,
      `box-shadow ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.navigation}`,
      `transform ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
    ].join(', '),
    selectors: {
      [`&:hover ${holoBackdrop}`]: {
        opacity: 1,
      },
    },
  },
  variants: {
    tone: {
      neutral: {
        borderColor: 'rgba(197, 200, 209, 0.18)',
      },
      accent: {
        borderColor: chronoVars.color.text.accent,
        boxShadow: `${chronoVars.glow.idle}, inset 0 0 0 1px rgba(0, 240, 255, 0.45)`,
      },
      warning: {
        borderColor: chronoVars.color.text.warning,
        boxShadow: `0 0 26px rgba(255, 74, 0, 0.35)`,
      },
    },
    padding: {
      none: {
        padding: 0,
      },
      sm: {
        padding: chronoVars.spacing.sm,
      },
      md: {
        padding: chronoVars.spacing.md,
      },
      lg: {
        padding: chronoVars.spacing.lg,
      },
    },
    interactive: {
      false: {},
      true: {
        cursor: 'pointer',
        selectors: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: chronoVars.shadow.medium,
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
        },
      },
    },
  },
  defaultVariants: {
    tone: 'neutral',
    padding: 'md',
    interactive: false,
  },
});
