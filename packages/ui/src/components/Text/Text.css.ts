import { recipe } from '@vanilla-extract/recipes';
import { style } from '@vanilla-extract/css';
import { chronoVars } from '../../theme/global.css.js';

export const textRecipe = recipe({
  base: {
    margin: 0,
    color: chronoVars.color.text.primary,
    fontFamily: chronoVars.typography.body.fontFamily,
    fontSize: chronoVars.typography.body.fontSize,
    lineHeight: chronoVars.typography.body.lineHeight,
    letterSpacing: chronoVars.typography.body.letterSpacing,
    transition: `color ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.navigation}`,
  },
  variants: {
    variant: {
      body: {},
      caption: {
        fontFamily: chronoVars.typography.caption.fontFamily,
        fontSize: chronoVars.typography.caption.fontSize,
        lineHeight: chronoVars.typography.caption.lineHeight,
        letterSpacing: chronoVars.typography.caption.letterSpacing,
      },
      mono: {
        fontFamily: chronoVars.typography.mono.fontFamily,
        fontSize: chronoVars.typography.mono.fontSize,
        lineHeight: chronoVars.typography.mono.lineHeight,
        letterSpacing: chronoVars.typography.mono.letterSpacing,
      },
    },
    tone: {
      primary: { color: chronoVars.color.text.primary },
      secondary: { color: chronoVars.color.text.secondary },
      accent: { color: chronoVars.color.text.accent },
      warning: { color: chronoVars.color.text.warning },
      muted: { color: 'rgba(197, 200, 209, 0.55)' },
    },
    emphasis: {
      normal: {},
      glow: {
        textShadow: chronoVars.glow.idle,
      },
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'primary',
    emphasis: 'normal',
  },
});

export const textTruncate = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
