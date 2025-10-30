import {
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type ForwardedRef,
} from 'react';
import clsx from 'clsx';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { textRecipe, textTruncate } from './Text.css.js';

export type TextVariants = RecipeVariants<typeof textRecipe>;

export type TextProps = TextVariants &
  HTMLAttributes<HTMLElement> & {
    as?: ElementType;
    children: ReactNode;
    truncate?: boolean;
  };

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  props: TextProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const {
    as,
    variant = 'body',
    tone = 'primary',
    emphasis = 'normal',
    truncate = false,
    className,
    children,
    ...rest
  } = props;

  const Component: ElementType = as ?? (variant === 'body' ? 'p' : 'span');

  return (
    <Component
      ref={ref}
      className={clsx(textRecipe({ variant, tone, emphasis }), truncate && textTruncate, className)}
      {...rest}
    >
      {children}
    </Component>
  );
});

Text.displayName = 'Text';
