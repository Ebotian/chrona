import { forwardRef, type ForwardedRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import { holoPanelRecipe, holoBackdrop, holoGrid, holoHeader } from './HoloPanel.css.js';
import { Text } from '../Text/Text.js';
import { Heading } from '../Heading/Heading.js';

export type HoloPanelVariants = RecipeVariants<typeof holoPanelRecipe>;

export type HoloPanelProps = HoloPanelVariants &
  Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'> & {
    title?: ReactNode;
    subtitle?: ReactNode;
  };

export const HoloPanel = forwardRef<HTMLDivElement, HoloPanelProps>(function HoloPanel(
  props: HoloPanelProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    title,
    subtitle,
    tone = 'neutral',
    padding = 'md',
    interactive = false,
    className,
    children,
    ...rest
  } = props;

  const hasHeader = Boolean(title ?? subtitle);

  return (
    <div
      ref={ref}
      className={clsx(holoPanelRecipe({ tone, padding, interactive }), className)}
      {...rest}
    >
      <span className={holoBackdrop} aria-hidden />
      <span className={holoGrid} aria-hidden />
      {hasHeader && (
        <header className={holoHeader} style={padding === 'none' ? { marginBottom: 0 } : undefined}>
          {title && (
            <Heading as="h3" level="h3" accent={tone === 'accent' ? 'glow' : 'none'}>
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text tone="secondary" variant="caption">
              {subtitle}
            </Text>
          )}
        </header>
      )}
      {children}
    </div>
  );
});

HoloPanel.displayName = 'HoloPanel';
