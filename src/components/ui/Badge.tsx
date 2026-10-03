import type { ReactNode } from 'react';
import type { Badge as BadgeKind } from '../../data/types';
import { cn } from '../../lib/cn';

type Tone = 'orange' | 'dark' | 'deal' | 'success' | 'neutral' | 'info';

const tones: Record<Tone, string> = {
  orange: 'bg-[#c45500] text-white',
  dark: 'bg-nav text-white',
  deal: 'bg-deal text-white',
  success: 'bg-success-bg text-success',
  neutral: 'bg-canvas text-ink',
  info: 'bg-info-bg text-focus',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-xs leading-4 font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

const productBadge: Record<BadgeKind, { tone: Tone; label: string }> = {
  'best-seller': { tone: 'orange', label: 'Best Seller' },
  'top-rated': { tone: 'dark', label: 'Top Rated' },
  new: { tone: 'info', label: 'New' },
  'limited-deal': { tone: 'deal', label: 'Limited time deal' },
};

export function ProductBadge({ kind, className }: { kind: BadgeKind; className?: string }) {
  const b = productBadge[kind];
  return (
    <Badge tone={b.tone} className={className}>
      {b.label}
    </Badge>
  );
}
