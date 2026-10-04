import { Children, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface RailProps {
  children: ReactNode;
  /** Item width while the rail scrolls, e.g. "w-[44%] sm:w-[30%]". */
  itemClassName: string;
  /** Grid columns once the rail becomes a grid at lg, e.g. "lg:grid-cols-6". */
  columnsClassName: string;
  label?: string;
}

/**
 * A swipe row on phones and tablets that turns into a plain grid from lg up.
 * Amazon uses arrow carousels; on desktop we show every item instead of hiding some behind arrows.
 * The row bleeds to the screen edge (matching Container's gutters) so the cut-off item signals "swipe".
 */
export function Rail({ children, itemClassName, columnsClassName, label }: RailProps) {
  return (
    <ul
      aria-label={label}
      className={cn(
        'scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1',
        'sm:-mx-6 sm:scroll-px-6 sm:px-6',
        'lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0',
        columnsClassName,
      )}
    >
      {Children.map(children, (child) => (
        <li className={cn('shrink-0 snap-start lg:w-auto', itemClassName)}>{child}</li>
      ))}
    </ul>
  );
}
