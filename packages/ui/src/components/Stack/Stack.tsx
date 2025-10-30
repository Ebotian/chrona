import { forwardRef, type ForwardedRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { stackRecipe } from './Stack.css.js';

export type StackVariants = RecipeVariants<typeof stackRecipe>;

export type StackProps = StackVariants & HTMLAttributes<HTMLDivElement>;

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  props: StackProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    direction = 'column',
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    className,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      className={clsx(stackRecipe({ direction, gap, align, justify, wrap }), className)}
      {...rest}
    />
  );
});

Stack.displayName = 'Stack';
