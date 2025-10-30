import { recipe } from '@vanilla-extract/recipes';
import { style } from '@vanilla-extract/css';
import { chronoVars } from '../../theme/global.css.js';

const baseClamp = style({
  display: 'block',
  margin: 0,
  color: chronoVars.color.text.primary,
  textRendering: 'geometricPrecision',
});

export const headingRecipe = recipe({
  base: [
    baseClamp,
    {
      letterSpacing: chronoVars.typography.h2.letterSpacing,
      fontFamily: chronoVars.typography.h2.fontFamily,
      fontWeight: chronoVars.typography.h2.fontWeight,
      lineHeight: chronoVars.typography.h2.lineHeight,
      fontSize: chronoVars.typography.h2.fontSize,
      marginBottom: chronoVars.spacing.sm,
      transition: `filter ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
    },
  ],
  variants: {
    level: {
      display: {
        fontFamily: chronoVars.typography.display.fontFamily,
        fontSize: chronoVars.typography.display.fontSize,
        lineHeight: chronoVars.typography.display.lineHeight,
        fontWeight: chronoVars.typography.display.fontWeight,
        letterSpacing: chronoVars.typography.display.letterSpacing,
        textTransform: 'uppercase',
        marginBottom: chronoVars.spacing.md,
      },
      h1: {
        fontFamily: chronoVars.typography.h1.fontFamily,
        fontSize: chronoVars.typography.h1.fontSize,
        lineHeight: chronoVars.typography.h1.lineHeight,
        fontWeight: chronoVars.typography.h1.fontWeight,
        letterSpacing: chronoVars.typography.h1.letterSpacing,
        textTransform: 'uppercase',
      },
      h2: {
        fontFamily: chronoVars.typography.h2.fontFamily,
        fontSize: chronoVars.typography.h2.fontSize,
        lineHeight: chronoVars.typography.h2.lineHeight,
        fontWeight: chronoVars.typography.h2.fontWeight,
        letterSpacing: chronoVars.typography.h2.letterSpacing,
      },
      h3: {
        fontFamily: chronoVars.typography.h3.fontFamily,
        fontSize: chronoVars.typography.h3.fontSize,
        lineHeight: chronoVars.typography.h3.lineHeight,
        fontWeight: chronoVars.typography.h3.fontWeight,
        letterSpacing: chronoVars.typography.h3.letterSpacing,
      },
    },
    accent: {
      none: {},
      glow: {
        textShadow: chronoVars.glow.hover,
        selectors: {
          '&::after': {
            content: '',
            display: 'block',
            width: '64px',
            height: '2px',
            marginTop: chronoVars.spacing.xs,
            background: chronoVars.gradient.veil,
            filter: 'blur(0.5px)',
          },
        },
      },
      glitch: {
        position: 'relative',
        selectors: {
          '&::before, &::after': {
            content: 'attr(data-content)',
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden',
            mixBlendMode: 'screen',
            opacity: 0.45,
            pointerEvents: 'none',
          },
          '&::before': {
            color: 'rgba(0, 240, 255, 0.85)',
            transform: 'translate3d(2px, 0, 0)',
          },
          '&::after': {
            color: 'rgba(255, 74, 0, 0.7)',
            transform: 'translate3d(-2px, 0, 0)',
          },
        },
      },
    },
    align: {
      left: {
        textAlign: 'left',
      },
      center: {
        textAlign: 'center',
      },
      right: {
        textAlign: 'right',
      },
    },
  },
  defaultVariants: {
    level: 'h2',
    accent: 'none',
    align: 'left',
  },
});
