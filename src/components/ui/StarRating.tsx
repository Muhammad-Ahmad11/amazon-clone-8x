import { useId } from 'react';
import { cn } from '../../lib/cn';
import { compactNumber, formatCount } from '../../lib/format';

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z';

/** Five stars with fractional fill, e.g. 4.6 fills the fifth star 60%. */
export function Stars({ rating, size = 16, className }: { rating: number; size?: number; className?: string }) {
  const id = useId();
  return (
    <span className={cn('inline-flex', className)} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        const gid = `${id}-s${i}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={gid}>
                <stop offset={fill} stopColor="var(--color-star)" />
                <stop offset={fill} stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <path d={STAR} fill={`url(#${gid})`} stroke="var(--color-star)" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  /** Show the numeric rating before the stars (Amazon does on results and product pages). */
  showValue?: boolean;
  /** Compact counts ("18.3K") for cards; full counts ("18,342") on the product page. */
  compact?: boolean;
  className?: string;
}

export function StarRating({ rating, reviewCount, size = 16, showValue = true, compact = true, className }: StarRatingProps) {
  const label = `${rating.toFixed(1)} out of 5 stars${reviewCount !== undefined ? `, ${formatCount(reviewCount)} ratings` : ''}`;
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)} role="img" aria-label={label}>
      {showValue && <span className="text-ink" aria-hidden="true">{rating.toFixed(1)}</span>}
      <Stars rating={rating} size={size} />
      {reviewCount !== undefined && (
        <span className="text-link" aria-hidden="true">
          ({compact ? compactNumber(reviewCount) : formatCount(reviewCount)})
        </span>
      )}
    </span>
  );
}
