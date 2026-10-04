import type { ReactNode, Ref } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

interface CheckoutSectionProps {
  step: number;
  title: string;
  /** Shows a tick beside the title once the step is complete. */
  done?: boolean;
  /** e.g. a "Change" button, top right. */
  action?: ReactNode;
  /** Lets the page move focus to this section's heading. */
  headingRef?: Ref<HTMLHeadingElement>;
  id: string;
  children: ReactNode;
  className?: string;
}

/** One numbered white panel, as on Amazon's checkout (recon §2.9). The heading can take focus for step changes. */
export function CheckoutSection({ step, title, done = false, action, headingRef, id, children, className }: CheckoutSectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className={cn('scroll-mt-4 rounded-card bg-surface p-4 sm:p-5', className)} id={id}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-lg font-bold focus:outline-none">
          <span
            aria-hidden="true"
            className={cn('grid size-7 shrink-0 place-items-center rounded-full text-sm', done ? 'bg-success text-white' : 'bg-nav-2 text-white')}
          >
            {done ? <Icon name="check" size={16} strokeWidth={2.5} /> : step}
          </span>
          <span>
            <span className="sr-only">Step {step}: </span>
            {title}
            {done && <span className="sr-only"> (complete)</span>}
          </span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Radio "card": the whole row is the label, so the touch target is large. Checked state is shown by border and fill. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  aside,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors sm:p-4',
        checked ? 'border-focus bg-info-bg ring-1 ring-focus' : 'border-line hover:bg-canvas-soft',
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-focus" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-muted">{description}</span>}
      </span>
      {aside && <span className="shrink-0 text-right text-[15px] tabular-nums">{aside}</span>}
    </label>
  );
}
