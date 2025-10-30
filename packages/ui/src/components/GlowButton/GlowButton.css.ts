import { recipe } from '@vanilla-extract/recipes';
import { style } from '@vanilla-extract/css';
import { chronoVars } from '../../theme/global.css.js';

export const ripple = style({
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
  background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.35), transparent 70%)',
  opacity: 0,
  transition: `opacity ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
});

export const glowButtonRecipe = recipe({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: chronoVars.spacing.xs,
    padding: `${chronoVars.spacing.xs} ${chronoVars.spacing.md}`,
    minHeight: '48px',
    minWidth: '140px',
    borderRadius: chronoVars.radius.lg,
    border: `1px solid ${chronoVars.color.border.accent}`,
    background: 'transparent',
    color: chronoVars.color.text.accent,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontFamily: chronoVars.typography.caption.fontFamily,
    fontWeight: chronoVars.typography.caption.fontWeight,
    fontSize: chronoVars.typography.caption.fontSize,
    lineHeight: chronoVars.typography.caption.lineHeight,
    cursor: 'pointer',
    overflow: 'hidden',
    isolation: 'isolate',
    boxShadow: chronoVars.glow.idle,
    transition: [
      `box-shadow ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
      `border-color ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
      `color ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
      `transform ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.card}`,
    ].join(', '),
    selectors: {
      '&::after': {
        content: '',
        position: 'absolute',
        inset: '1px',
        borderRadius: `calc(${chronoVars.radius.lg} - 1px)`,
        background: 'rgba(8, 10, 15, 0.75)',
        backdropFilter: `blur(${chronoVars.blur.hud})`,
        opacity: 0.9,
        transition: `opacity ${chronoVars.motion.durations.hover} ${chronoVars.motion.easings.navigation}`,
        zIndex: -1,
      },
      [`&:hover`]: {
        boxShadow: chronoVars.glow.hover,
        borderColor: chronoVars.color.text.accent,
        color: chronoVars.color.text.primary,
        transform: 'translateY(-1px)',
      },
      [`&:hover ${ripple}`]: {
        opacity: 1,
      },
      '&:active': {
        boxShadow: chronoVars.glow.active,
        transform: 'translateY(1px) scale(0.99)',
      },
      '&:focus-visible': {
        outline: `2px solid ${chronoVars.color.text.accent}`,
        outlineOffset: '3px',
      },
      '&[data-reduced-motion="true"]': {
        transform: 'none',
        transition: 'none',
      },
      '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.5,
        boxShadow: 'none',
      },
    },
  },
  variants: {
    intent: {
      primary: {
        background: 'rgba(0, 240, 255, 0.12)',
        selectors: {
          '&::after': {
            background: 'rgba(8, 10, 15, 0.65)',
          },
        },
      },
      ghost: {
        background: 'transparent',
        boxShadow: `inset 0 0 0 1px rgba(197, 200, 209, 0.25)`,
      },
      warning: {
        color: chronoVars.color.text.warning,
        borderColor: chronoVars.color.text.warning,
        boxShadow: `0 0 20px rgba(255, 74, 0, 0.4)`,
        selectors: {
          '&:hover': {
            boxShadow: `0 0 28px rgba(255, 74, 0, 0.6)`,
            color: chronoVars.color.text.primary,
          },
        },
      },
    },
    size: {
      sm: {
        minHeight: '40px',
        minWidth: '120px',
        padding: `${chronoVars.spacing.xs} ${chronoVars.spacing.sm}`,
        letterSpacing: '0.14em',
      },
      md: {},
      lg: {
        minHeight: '56px',
        minWidth: '180px',
        padding: `${chronoVars.spacing.sm} ${chronoVars.spacing.lg}`,
        letterSpacing: '0.22em',
        fontSize: '15px',
      },
    },
    fullWidth: {
      false: {
        width: 'auto',
      },
      true: {
        width: '100%',
      },
    },
    iconOnly: {
      false: {},
      true: {
        minWidth: chronoVars.spacing.lg,
        minHeight: chronoVars.spacing.lg,
        padding: chronoVars.spacing.xs,
        borderRadius: chronoVars.radius.md,
        letterSpacing: '0.1em',
      },
    },
  },
  compoundVariants: [
    {
      variants: { iconOnly: true },
      style: {
        gap: 0,
      },
    },
  ],
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    fullWidth: false,
    iconOnly: false,
  },
});
