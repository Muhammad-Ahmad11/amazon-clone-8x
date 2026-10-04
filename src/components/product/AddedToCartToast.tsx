import { useEffect, useRef, useState } from 'react';
import type { Variant } from '../../data/types';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';
import { useCartSummary } from '../../state/cart';
import { ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ProductImage } from '../ui/ProductImage';

export interface AddedNotice {
  /** Changes on every add, so the toast restarts its timer. */
  id: number;
  title: string;
  variant: Variant;
  variantName: string;
  requested: number;
  added: number;
  inCart: number;
}

const AUTO_HIDE_MS = 8000;

/**
 * Amazon sends you to a separate "Added to cart" page (recon §2.7). We confirm in place and keep you on the product:
 * a toast with what was added, the cart total and a way to the cart. It stays while hovered or focused.
 * The live region is always mounted so screen readers announce each add.
 */
export function AddedToCartToast({ notice, onClose }: { notice: AddedNotice | null; onClose: () => void }) {
  const { count, subtotal } = useCartSummary();
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (notice && !paused) timer.current = window.setTimeout(onClose, AUTO_HIDE_MS);
    return () => window.clearTimeout(timer.current);
  }, [notice, paused, onClose]);

  const full = notice && notice.added === 0;
  const partial = notice && notice.added > 0 && notice.added < notice.requested;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-none fixed inset-x-3 bottom-[84px] z-40 flex justify-center lg:inset-x-auto lg:right-6 lg:bottom-6"
    >
      {notice && (
        <div key={notice.id} className={cn('pointer-events-auto w-full max-w-sm animate-slide-up rounded-card border bg-surface p-4 shadow-overlay', full ? 'border-[#e5a54b]' : 'border-success/40')}>
          <div className="flex items-start gap-3">
            <Icon name={full ? 'alert' : 'check-circle'} size={22} className={cn('mt-px shrink-0', full ? 'text-[#b46b00]' : 'text-success')} />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{full ? 'Already at the limit' : partial ? `Added ${notice.added} to cart` : 'Added to cart'}</p>
              {full && <p className="text-sm">You have {notice.inCart} of this item in your cart, the most we can sell you.</p>}
              {partial && <p className="text-sm">That’s all we have in stock: your cart now has {notice.inCart}.</p>}
            </div>
            <button type="button" onClick={onClose} className="-m-1.5 grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-canvas-soft" aria-label="Dismiss">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProductImage src={notice.variant.images[0]!} alt="" className="size-14 shrink-0 rounded-lg" />
            <div className="min-w-0 text-sm">
              <p className="line-clamp-1 font-medium">{notice.title}</p>
              <p className="text-ink-muted">
                {[notice.variantName, `Qty in cart: ${notice.inCart}`].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
            <p className="text-sm">
              Cart ({count} {count === 1 ? 'item' : 'items'}): <span className="font-bold">{formatMoney(subtotal)}</span>
            </p>
            <ButtonLink to="/cart" variant="secondary" size="sm">
              Go to cart
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
