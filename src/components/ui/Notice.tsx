import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from './Icon';

type Tone = 'success' | 'info' | 'warning' | 'error';

const tones: Record<Tone, { box: string; icon: IconName; iconClass: string }> = {
  success: { box: 'border-success/40 bg-success-bg', icon: 'check-circle', iconClass: 'text-success' },
  info: { box: 'border-focus/30 bg-info-bg', icon: 'info', iconClass: 'text-focus' },
  warning: { box: 'border-[#e5a54b] bg-warning-bg', icon: 'alert', iconClass: 'text-[#b46b00]' },
  error: { box: 'border-deal/40 bg-deal-bg', icon: 'alert', iconClass: 'text-deal' },
};

/** Inline message box. Use role="alert" (via `urgent`) only for errors that need immediate attention. */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
  urgent = false,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  urgent?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div role={urgent ? 'alert' : 'status'} className={cn('flex gap-3 rounded-card border p-3 text-sm', t.box, className)}>
      <Icon name={t.icon} size={20} className={cn('mt-px shrink-0', t.iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="text-ink">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
