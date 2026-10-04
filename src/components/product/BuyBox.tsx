import type { Ref } from 'react';
import type { Variant } from '../../data/types';
import { cn } from '../../lib/cn';
import { deliveryDate, deliveryFee, DELIVERY_OPTIONS, formatDeliveryDate, FREE_DELIVERY_MIN } from '../../lib/delivery';
import { formatMoney } from '../../lib/money';
import { MAX_PER_LINE } from '../../state/cart';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { QuantityStepper } from '../ui/QuantityStepper';

export const LOW_STOCK = 5;

export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  if (stock === 0) return <p className={cn('text-lg font-medium text-warning', className)}>Currently unavailable</p>;
  if (stock <= LOW_STOCK) return <p className={cn('text-[15px] font-semibold text-warning', className)}>Only {stock} left in stock</p>;
  return <p className={cn('text-lg text-success', className)}>In stock</p>;
}

interface BuyBoxProps {
  variant: Variant;
  /** e.g. "Navy · 32 oz", used in accessible labels. */
  variantName: string;
  productTitle: string;
  quantity: number;
  onQuantityChange: (n: number) => void;
  onAdd: () => void;
  /** Briefly true after adding, to confirm on the button itself. */
  justAdded: boolean;
  addButtonRef?: Ref<HTMLButtonElement>;
}

/**
 * Amazon's buy box holds price, import charges, delivery, location, stock, quantity, Add to cart, Buy Now,
 * seller, returns, gift options, Add to List and Auto Buy (recon §2.6). Ours keeps what decides the purchase:
 * stock, a dated delivery promise, quantity and one clear Add to cart. Price sits once, above, next to the options.
 */
export function BuyBox({ variant, variantName, productTitle, quantity, onQuantityChange, onAdd, justAdded, addButtonRef }: BuyBoxProps) {
  const available = variant.stock > 0;
  const subtotal = variant.price * quantity;
  const fee = deliveryFee('standard', subtotal);
  const maxQuantity = Math.min(MAX_PER_LINE, variant.stock);

  return (
    <section aria-label="Purchase options" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div>
        <StockStatus stock={variant.stock} />
        {!available && <p className="mt-1 text-sm text-ink-muted">This option is sold out. Choose another option above.</p>}
      </div>

      {available && (
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex gap-2">
            <Icon name="truck" size={20} className="mt-px shrink-0 text-ink-muted" />
            <span>
              {fee === 0 ? <span className="font-semibold">FREE delivery</span> : <span><span className="font-semibold">{formatMoney(fee)}</span> delivery</span>} by{' '}
              <span className="font-semibold">{formatDeliveryDate(deliveryDate('standard'))}</span>
              {fee > 0 && <span className="block text-[13px] text-ink-muted">Free on orders over {formatMoney(FREE_DELIVERY_MIN).replace('.00', '')}</span>}
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="clock" size={20} className="mt-px shrink-0 text-ink-muted" />
            <span>
              Express by <span className="font-semibold">{formatDeliveryDate(deliveryDate('express'))}</span> · {formatMoney(DELIVERY_OPTIONS.express.fee)}
            </span>
          </li>
        </ul>
      )}

      {available && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" aria-hidden="true">
            Quantity
          </span>
          <QuantityStepper value={quantity} onChange={onQuantityChange} max={maxQuantity} itemLabel={`${productTitle}, ${variantName}`} />
        </div>
      )}

      <Button
        ref={addButtonRef}
        size="lg"
        fullWidth
        disabled={!available}
        onClick={onAdd}
        icon={justAdded ? <Icon name="check" size={18} /> : <Icon name="cart" size={18} />}
        aria-label={available ? `Add ${quantity} to cart: ${productTitle}, ${variantName}` : undefined}
      >
        {!available ? 'Currently unavailable' : justAdded ? 'Added to cart' : 'Add to cart'}
      </Button>

      <ul className="flex flex-col gap-1.5 border-t border-line-soft pt-3 text-[13px] text-ink-muted">
        <li className="flex items-center gap-2">
          <Icon name="return" size={16} className="shrink-0" /> 30-day returns
        </li>
        <li className="flex items-center gap-2">
          <Icon name="lock" size={16} className="shrink-0" /> Secure checkout
        </li>
      </ul>
    </section>
  );
}
