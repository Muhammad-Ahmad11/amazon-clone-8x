import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** Primary and secondary actions (buttons or links). */
  actions?: ReactNode;
  /** Extra content under the actions, e.g. suggestion chips. */
  children?: ReactNode;
  className?: string;
  /** 1 when the empty state is the whole page (404, not found), so the page still has an h1. */
  headingLevel?: 1 | 2;
}

/**
 * Used for empty search results, empty cart, nothing saved for later, 404 and load errors.
 * Amazon fills these moments with ads (recon §2.4); we always explain what happened and what to do next.
 */
export function EmptyState({ icon = 'package', title, description, actions, children, className, headingLevel = 2 }: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className={cn('flex flex-col items-center px-4 py-10 text-center sm:py-14', className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-canvas text-ink-muted">
        <Icon name={icon} size={30} strokeWidth={1.6} />
      </div>
      <Heading className="text-xl font-bold text-ink">{title}</Heading>
      {description && <div className="mt-2 max-w-md text-[15px] text-ink-muted">{description}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}
