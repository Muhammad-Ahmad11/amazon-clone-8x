import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../ui/Icon';

/** Pill link to a search or category: used for popular searches and recovery suggestions. */
export function SearchChip({ to, children, icon = 'search', className }: { to: string; children: ReactNode; icon?: IconName; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 text-[13px] whitespace-nowrap text-ink transition-colors hover:border-ink-subtle hover:bg-surface',
        className,
      )}
    >
      <Icon name={icon} size={14} className="text-ink-muted" />
      {children}
    </Link>
  );
}
