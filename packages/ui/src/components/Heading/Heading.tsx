import {
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type ElementType,
  type ForwardedRef,
} from 'react';
import clsx from 'clsx';
import { headingRecipe } from './Heading.css.js';

export type HeadingVariants = NonNullable<Parameters<typeof headingRecipe>[0]>;

export type HeadingProps = HeadingVariants &
  Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> & {
    /**
     * Optional override for the rendered element. Defaults to a semantic heading based on `level`.
     */
    as?: ElementType;
    /**
     * Raw heading content. Non-string children will gracefully degrade glitch effects.
     */
    children: ReactNode;
  };

type HeadingLevel = 'display' | 'h1' | 'h2' | 'h3';

const defaultTag: Record<HeadingLevel, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
};

export const Heading = forwardRef<HTMLElement, HeadingProps>(function Heading(
  props: HeadingProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const {
    as,
    level: levelProp = 'h2',
    accent: accentProp = 'none',
    align: alignProp = 'left',
    className,
    children,
    ...rest
  } = props;

  const level: HeadingLevel = levelProp ?? 'h2';
  const accent: HeadingVariants['accent'] = accentProp ?? 'none';
  const align: HeadingVariants['align'] = alignProp ?? 'left';
  const Component: ElementType = as ?? defaultTag[level];
  const glitchPayload = typeof children === 'string' ? children : undefined;

  return (
    <Component
      ref={ref}
      data-content={accent === 'glitch' ? glitchPayload : undefined}
      className={clsx(headingRecipe({ level, accent, align }), className)}
      {...rest}
    >
      {children}
    </Component>
  );
});

Heading.displayName = 'Heading';
