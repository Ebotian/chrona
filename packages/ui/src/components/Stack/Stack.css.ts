import { recipe } from '@vanilla-extract/recipes';
import { chronoVars } from '../../theme/global.css.js';

export const stackRecipe = recipe({
  base: {
    display: 'flex',
    width: '100%',
    gap: chronoVars.spacing.md,
  },
  variants: {
    direction: {
      column: { flexDirection: 'column' },
      row: { flexDirection: 'row' },
    },
    gap: {
      none: { gap: 0 },
      xs: { gap: chronoVars.spacing.xs },
      sm: { gap: chronoVars.spacing.sm },
      md: { gap: chronoVars.spacing.md },
      lg: { gap: chronoVars.spacing.lg },
      xl: { gap: chronoVars.spacing.xl },
    },
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
    },
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
    },
    wrap: {
      false: { flexWrap: 'nowrap' },
      true: { flexWrap: 'wrap' },
    },
  },
  defaultVariants: {
    direction: 'column',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false,
  },
});
