import { cn } from '../../lib/cn';
import { discountPercent, formatMoney, splitPrice, type Cents } from '../../lib/money';

type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

/* Amazon's price style: small raised symbol and cents beside a large whole number (recon §2.5). */
const sizeClasses: Record<PriceSize, { whole: string; small: string }> = {
  sm: { whole: 'text-lg', small: 'text-[11px] mt-[0.15em]' },
  md: { whole: 'text-2xl', small: 'text-xs mt-[0.2em]' },
  lg: { whole: 'text-price', small: 'text-[13px] mt-[0.2em]' },
  xl: { whole: 'text-4xl', small: 'text-base mt-[0.2em]' },
};

interface PriceProps {
  cents: Cents;
  size?: PriceSize;
  className?: string;
}

export function Price({ cents, size = 'md', className }: PriceProps) {
  const { symbol, whole, fraction } = splitPrice(cents);
  const s = sizeClasses[size];
  return (
    <span className={cn('inline-flex items-start leading-none font-normal text-ink', className)}>
      {/* Screen readers get one plain amount instead of three fragments. */}
      <span className="sr-only">{formatMoney(cents)}</span>
      <span aria-hidden="true" className="inline-flex items-start">
        <span className={cn('leading-none', s.small)}>{symbol}</span>
        <span className={s.whole}>{whole}</span>
        <span className={cn('leading-none', s.small)}>{fraction}</span>
      </span>
    </span>
  );
}

/** "List: $179.99" struck through, with the label kept readable. */
export function ListPrice({ cents, label = 'List:', className }: { cents: Cents; label?: string; className?: string }) {
  return (
    <span className={cn('text-[13px] text-ink-muted', className)}>
      {label} <s>{formatMoney(cents)}</s>
    </span>
  );
}

/** "-28%" in the deal colour; renders nothing when there is no real saving. */
export function DiscountTag({ price, listPrice, className }: { price: Cents; listPrice?: Cents; className?: string }) {
  const pct = discountPercent(price, listPrice);
  if (!pct) return null;
  return (
    <span className={cn('font-light text-deal', className)}>
      <span className="sr-only">Save </span>-{pct}%
    </span>
  );
}

/** Price + optional discount and list price, laid out as one unit. */
export function PriceBlock({
  price,
  listPrice,
  size = 'md',
  layout = 'stacked',
  className,
}: {
  price: Cents;
  listPrice?: Cents;
  size?: PriceSize;
  layout?: 'stacked' | 'inline';
  className?: string;
}) {
  const hasDiscount = discountPercent(price, listPrice) > 0;
  return (
    <div className={cn(layout === 'inline' ? 'flex flex-wrap items-baseline gap-x-2' : 'flex flex-col gap-0.5', className)}>
      <div className="flex items-start gap-2">
        {hasDiscount && <DiscountTag price={price} listPrice={listPrice} className={size === 'lg' || size === 'xl' ? 'text-2xl' : 'text-lg'} />}
        <Price cents={price} size={size} />
      </div>
      {hasDiscount && listPrice && <ListPrice cents={listPrice} />}
    </div>
  );
}
