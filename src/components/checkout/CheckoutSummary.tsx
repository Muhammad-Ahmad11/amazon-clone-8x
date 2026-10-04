import type { Ref } from 'react';
import { deliveryDate, DELIVERY_OPTIONS, formatDeliveryDate, type DeliverySpeed } from '../../lib/delivery';
import { formatMoney } from '../../lib/money';
import type { OrderPrice } from '../../state/checkout';
import { Button } from '../ui/Button';
import { Notice } from '../ui/Notice';

export const PLACE_ORDER_HINT_ID = 'place-order-hint';

interface CheckoutSummaryProps {
  price: OrderPrice;
  speed: DeliverySpeed;
  onPlace: () => void;
  placing: boolean;
  /** What's still needed before the order can be placed, e.g. "Add a delivery address…". */
  hint?: string;
  error?: string;
  placeRef?: Ref<HTMLButtonElement>;
}

/**
 * Amazon's summary lists Items, Shipping & handling and Estimated tax, with "--" until an address exists (recon §2.9).
 * Ours has real numbers from the first moment: the cart's items, the chosen delivery's fee and the total.
 * No tax line: the store has no tax model (decision 35).
 */
export function CheckoutSummary({ price, speed, onPlace, placing, hint, error, placeRef }: CheckoutSummaryProps) {
  return (
    <section aria-labelledby="checkout-summary-heading" className="flex flex-col gap-4 rounded-card bg-surface p-4 sm:p-5">
      <h2 id="checkout-summary-heading" className="text-lg font-bold">
        Order summary
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Items ({price.items})</dt>
          <dd className="tabular-nums">{formatMoney(price.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>
            Delivery
            <span className="block text-[13px] text-ink-muted">
              {DELIVERY_OPTIONS[speed].label}, by {formatDeliveryDate(deliveryDate(speed))}
            </span>
          </dt>
          <dd className="tabular-nums">{price.delivery === 0 ? <span className="font-semibold text-success">FREE</span> : formatMoney(price.delivery)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line-soft pt-3 text-lg font-bold">
          <dt>Order total</dt>
          <dd className="tabular-nums">{formatMoney(price.total)}</dd>
        </div>
      </dl>

      {error && (
        <Notice tone="error" urgent>
          {error}
        </Notice>
      )}

      <div className="flex flex-col gap-2">
        <Button
          ref={placeRef}
          size="lg"
          fullWidth
          loading={placing}
          onClick={onPlace}
          aria-label={`Place your order, total ${formatMoney(price.total)}`}
          aria-describedby={hint ? PLACE_ORDER_HINT_ID : undefined}
        >
          {placing ? 'Placing your order…' : 'Place your order'}
        </Button>
        {hint && (
          <p id={PLACE_ORDER_HINT_ID} className="text-center text-[13px] text-ink-muted">
            {hint}
          </p>
        )}
      </div>
      <p className="text-[13px] text-ink-muted">Demo store: placing an order doesn’t charge you or ship anything. 30-day returns on every item.</p>
    </section>
  );
}
