import { cn } from '../../lib/cn';
import { Icon } from './Icon';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** When provided, the minus button becomes a bin at quantity 1 (Amazon cart behaviour, recon §2.8). */
  onRemove?: () => void;
  min?: number;
  max?: number;
  /** Used in accessible labels, e.g. the product name. */
  itemLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 10,
  itemLabel = 'item',
  size = 'md',
  disabled = false,
  className,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const showBin = atMin && Boolean(onRemove);
  const btn = cn(
    'grid place-items-center rounded-full text-ink transition-colors hover:bg-brand/40 disabled:opacity-40 disabled:hover:bg-transparent',
    size === 'sm' ? 'size-8' : 'size-10',
  );

  return (
    <div
      role="group"
      aria-label={`Quantity for ${itemLabel}`}
      className={cn(
        'inline-flex items-center rounded-full border-[3px] border-brand bg-surface',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        disabled={disabled || (atMin && !onRemove)}
        onClick={() => (showBin ? onRemove?.() : onChange(value - 1))}
        aria-label={showBin ? `Remove ${itemLabel} from cart` : `Decrease quantity of ${itemLabel}`}
      >
        <Icon name={showBin ? 'trash' : 'minus'} size={size === 'sm' ? 16 : 18} />
      </button>
      <output aria-live="polite" className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
        {value}
      </output>
      <button
        type="button"
        className={btn}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${itemLabel}`}
      >
        <Icon name="plus" size={size === 'sm' ? 16 : 18} />
      </button>
    </div>
  );
}
