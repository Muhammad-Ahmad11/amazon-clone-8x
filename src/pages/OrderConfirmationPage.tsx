import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getOrder, type Order } from '../api/orders';
import { AddressSummary } from '../components/checkout/AddressForm';
import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProductImage } from '../components/ui/ProductImage';
import { DELIVERY_OPTIONS, formatDeliveryDate } from '../lib/delivery';
import { pluralize } from '../lib/format';
import { formatMoney } from '../lib/money';
import { productUrl } from '../lib/routes';
import { PAYMENT_METHODS } from '../state/checkout';

/**
 * /order/:orderId — "Order placed, thanks!" (recon §2.9, inferred). It shows the saved snapshot of the order,
 * so it never changes after the fact, and it says plainly that nothing was charged or shipped.
 */
export function OrderConfirmationPage() {
  const { orderId = '' } = useParams();
  const location = useLocation();
  const fromNavigation = (location.state as { order?: Order } | null)?.order;
  const order = getOrder(orderId) ?? (fromNavigation?.id === orderId ? fromNavigation : null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Arriving from "Place your order", focus was on a button that no longer exists: start at the good news.
  useEffect(() => {
    heading.current?.focus();
  }, [orderId]);

  if (!order) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1 bg-canvas py-10 focus:outline-none">
        <title>Order not found · Amazon Clone</title>
        <Container className="max-w-2xl">
          <div className="rounded-card bg-surface">
            <EmptyState
              icon="package"
              headingLevel={1}
              title="We can’t find that order"
              description="In this demo store, orders are kept only in the browser tab they were placed in, and are cleared when it closes. There are no accounts or order history."
              actions={<ButtonLink to="/">Continue shopping</ButtonLink>}
            />
          </div>
        </Container>
      </main>
    );
  }

  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const deliverBy = formatDeliveryDate(new Date(order.deliverBy));

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-canvas py-4 focus:outline-none sm:py-6">
      <title>Order placed · Amazon Clone</title>
      <Container className="flex max-w-3xl flex-col gap-4">
        <section aria-labelledby="order-heading" className="rounded-card bg-surface p-5 sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-white sm:size-12">
              <Icon name="check" size={26} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h1 id="order-heading" ref={heading} tabIndex={-1} className="text-2xl font-bold text-success focus:outline-none sm:text-[28px]">
                Order placed, thank you!
              </h1>
              <p className="mt-1 text-[15px]">
                Order number <span className="font-semibold tabular-nums">{order.id}</span>
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold">
                <Icon name="truck" size={18} className="text-ink-muted" />
                Arriving by {deliverBy}
                <span className="font-normal text-ink-muted">· {DELIVERY_OPTIONS[order.speed].label} delivery</span>
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2 rounded-card border border-focus/30 bg-info-bg p-3 text-sm">
            <Icon name="info" size={18} className="mt-px shrink-0 text-focus" />
            <p>
              <span className="font-semibold">This is a demo order.</span> No payment was taken and nothing will be shipped. Your cart has been emptied.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/" size="lg">
              Continue shopping
            </ButtonLink>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section aria-labelledby="ship-to-heading" className="rounded-card bg-surface p-5">
            <h2 id="ship-to-heading" className="mb-2 text-base font-bold">
              Delivering to
            </h2>
            <AddressSummary address={order.address} />
          </section>
          <section aria-labelledby="payment-heading" className="rounded-card bg-surface p-5">
            <h2 id="payment-heading" className="mb-2 text-base font-bold">
              Payment
            </h2>
            <p className="text-[15px]">{PAYMENT_METHODS[order.payment]?.label ?? 'Demo payment'}</p>
            <p className="mt-1 text-[13px] text-ink-muted">Nothing was charged.</p>
          </section>
        </div>

        <section aria-labelledby="items-heading" className="rounded-card bg-surface p-5">
          <h2 id="items-heading" className="mb-3 text-base font-bold">
            {pluralize(units, 'item')}
          </h2>
          <ul className="divide-y divide-line-soft">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex gap-3 py-3 first:pt-0 sm:gap-4">
                <ProductImage src={item.image} alt="" className="size-16 shrink-0 rounded-lg sm:size-20" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium sm:text-[15px]">
                    <Link to={`${productUrl(item.productId)}?variant=${encodeURIComponent(item.variantId)}`} className="hover:text-link-hover hover:underline">
                      {item.title}
                    </Link>
                  </p>
                  {item.options && <p className="mt-0.5 text-[13px] text-ink-muted">{item.options}</p>}
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Qty {item.quantity}
                    {item.quantity > 1 && <> · {formatMoney(item.unitPrice)} each</>}
                  </p>
                </div>
                <p className="shrink-0 text-[15px] font-semibold tabular-nums">{formatMoney(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4">
              <dt>Items ({order.price.items})</dt>
              <dd className="tabular-nums">{formatMoney(order.price.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Delivery ({DELIVERY_OPTIONS[order.speed].label})</dt>
              <dd className="tabular-nums">{order.price.delivery === 0 ? 'FREE' : formatMoney(order.price.delivery)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-base font-bold">
              <dt>Order total</dt>
              <dd className="tabular-nums">{formatMoney(order.price.total)}</dd>
            </div>
          </dl>
        </section>
      </Container>
    </main>
  );
}
