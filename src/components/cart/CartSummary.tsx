import type { Ref } from 'react';
import { deliveryDate, deliveryFee, DELIVERY_OPTIONS, formatDeliveryDate, FREE_DELIVERY_MIN } from '../../lib/delivery';
import { formatMoney } from '../../lib/money';
import { pluralize } from '../../lib/format';
import type { CartTotals } from '../../state/cart';
import { Button, ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';

interface CartSummaryProps {
  totals: CartTotals;
  checkoutRef?: Ref<HTMLElement>;
}

export const CHECKOUT_BLOCKED_ID = 'checkout-blocked-reason';

/**
 * Items, delivery and total, using only the store's real rules (decision 7). No tax, import charges,
 * coupons or fees we don't have. Checkout stays locked while any line can't be bought as it is.
 */
export function CartSummary({ totals, checkoutRef }: CartSummaryProps) {
  const fee = deliveryFee('standard', totals.subtotal);
  const total = totals.subtotal + fee;
  const toFree = FREE_DELIVERY_MIN - totals.subtotal;
  const blocked = totals.issues > 0 || totals.payableCount === 0;

  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-4 rounded-card bg-surface p-4 sm:p-5">
      <h2 id="summary-heading" className="text-lg font-bold">
        Order summary
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Items ({totals.payableCount})</dt>
          <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>
            Delivery
            <span className="block text-[13px] text-ink-muted">Standard, by {formatDeliveryDate(deliveryDate('standard'))}</span>
          </dt>
          <dd className="tabular-nums">{fee === 0 ? <span className="font-semibold text-success">FREE</span> : formatMoney(fee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line-soft pt-3 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(total)}</dd>
        </div>
      </dl>

      {totals.payableCount > 0 && (
        <p className="flex gap-2 text-[13px] text-ink-muted">
          <Icon name="truck" size={16} className="mt-px shrink-0" />
          <span>
            {toFree > 0 ? (
              <>
                Add <span className="font-semibold text-ink">{formatMoney(toFree)}</span> more for FREE standard delivery.{' '}
              </>
            ) : (
              'Your order qualifies for FREE standard delivery. '
            )}
            Express ({formatMoney(DELIVERY_OPTIONS.express.fee)}) can be chosen at checkout.
          </span>
        </p>
      )}

      {totals.issues > 0 && (
        <Notice tone="warning">
          <span id={CHECKOUT_BLOCKED_ID}>
            {totals.issues === 1 ? '1 item needs' : `${totals.issues} items need`} your attention before you can check out.
          </span>
        </Notice>
      )}

      {blocked ? (
        <Button ref={checkoutRef as Ref<HTMLButtonElement>} size="lg" fullWidth disabled aria-describedby={totals.issues > 0 ? CHECKOUT_BLOCKED_ID : undefined}>
          Proceed to checkout
        </Button>
      ) : (
        <ButtonLink ref={checkoutRef as Ref<HTMLAnchorElement>} to="/checkout" size="lg" fullWidth aria-label={`Proceed to checkout, ${pluralize(totals.payableCount, 'item')}, total ${formatMoney(total)}`}>
          Proceed to checkout
        </ButtonLink>
      )}
      <ButtonLink to="/" variant="secondary" fullWidth>
        Continue shopping
      </ButtonLink>
    </section>
  );
}
