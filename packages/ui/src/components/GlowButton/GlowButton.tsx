'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ForwardedRef } from 'react';
import clsx from 'clsx';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { glowButtonRecipe, ripple } from './GlowButton.css.js';
import { useChronoMotion } from '../../context/MotionPreferenceContext.js';

export type GlowButtonVariants = RecipeVariants<typeof glowButtonRecipe>;

export type GlowButtonProps = GlowButtonVariants &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    loading?: boolean;
  };

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  props: GlowButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { reducedMotion } = useChronoMotion();
  const {
    leftIcon,
    rightIcon,
    loading = false,
    intent = 'primary',
    size = 'md',
    fullWidth = false,
    iconOnly = false,
    className,
    children,
    disabled,
    ...rest
  } = props;

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={clsx(glowButtonRecipe({ intent, size, fullWidth, iconOnly }), className)}
      data-reduced-motion={reducedMotion}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      <span className={ripple} aria-hidden />
      {leftIcon && <span aria-hidden>{leftIcon}</span>}
      {children && !iconOnly && <span>{children}</span>}
      {rightIcon && <span aria-hidden>{rightIcon}</span>}
    </button>
  );
});

GlowButton.displayName = 'GlowButton';
