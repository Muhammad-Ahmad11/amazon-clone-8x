import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { OrderError, placeOrder } from '../api/orders';
import { useProducts } from '../api/useProducts';
import { AddressForm, AddressSummary } from '../components/checkout/AddressForm';
import { CheckoutBlocked } from '../components/checkout/CheckoutBlocked';
import { CheckoutSection } from '../components/checkout/CheckoutSection';
import { CheckoutSummary, PLACE_ORDER_HINT_ID } from '../components/checkout/CheckoutSummary';
import { DeliveryOptions } from '../components/checkout/DeliveryOptions';
import { PaymentOptions } from '../components/checkout/PaymentOptions';
import { ReviewItems } from '../components/checkout/ReviewItems';
import { Button, ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import type { Product } from '../data/types';
import { deliveryDate, formatDeliveryDate } from '../lib/delivery';
import { pluralize } from '../lib/format';
import { formatMoney } from '../lib/money';
import { useInView } from '../lib/useInView';
import { cartTotals, clearCart, resolveLine, useCartLines } from '../state/cart';
import {
  ADDRESS_FIELDS,
  cityLine,
  clearDraft,
  loadDraft,
  normalizeAddress,
  priceOrder,
  saveDraft,
  validateAddress,
  type Address,
  type AddressField,
  type CheckoutDraft,
} from '../state/checkout';

type FocusRequest = { kind: 'field'; field: AddressField } | { kind: 'address-heading' } | { kind: 'change-address' } | { kind: 'place' };

/**
 * /checkout — one focused page: address, delivery speed, payment, review, place order.
 * What is bought, its price and whether it can be bought all come from the cart store and resolveLine(),
 * exactly as on /cart; this page only adds the shopper's checkout choices (state/checkout.ts).
 */
export function CheckoutPage() {
  const navigate = useNavigate();
  const lines = useCartLines();
  const catalogue = useProducts();
  const [draft, setDraft] = useState<CheckoutDraft>(loadDraft);
  // Errors appear after the first attempt to continue, then update live as the shopper fixes them.
  const [showErrors, setShowErrors] = useState(false);
  // The confirmed address before "Change", so Cancel can put it back.
  const [previousAddress, setPreviousAddress] = useState<Address | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderError, setOrderError] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const fields = useRef(new Map<AddressField, HTMLInputElement | HTMLSelectElement>());
  const addressHeading = useRef<HTMLHeadingElement>(null);
  const changeAddressButton = useRef<HTMLButtonElement>(null);
  const placeButton = useRef<HTMLButtonElement | null>(null);
  const [placeInViewRef, placeInView] = useInView<HTMLButtonElement>();

  useEffect(() => {
    if (!placed) saveDraft(draft);
  }, [draft, placed]);

  const lookup = useMemo(() => {
    if (catalogue.state.status !== 'ready') return null;
    const byId = new Map(catalogue.state.products.map((p) => [p.id, p]));
    return (id: string): Product | undefined => byId.get(id);
  }, [catalogue.state]);
  const resolved = useMemo(() => (lookup ? lines.map((l) => resolveLine(l, lookup)) : null), [lines, lookup]);
  const totals = resolved ? cartTotals(resolved) : null;
  const price = totals ? priceOrder(totals, draft.speed) : null;
  const errors = showErrors ? validateAddress(draft.address) : {};

  useEffect(() => {
    if (!focusRequest) return;
    const el =
      focusRequest.kind === 'field'
        ? fields.current.get(focusRequest.field)
        : focusRequest.kind === 'address-heading'
          ? addressHeading.current
          : focusRequest.kind === 'change-address'
            ? changeAddressButton.current
            : placeButton.current;
    el?.focus();
    if (focusRequest.kind === 'field') el?.scrollIntoView({ block: 'center' });
    setFocusRequest(null);
  }, [focusRequest]);

  const fieldRef = (field: AddressField) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    if (el) fields.current.set(field, el);
    else fields.current.delete(field);
  };

  function update(patch: Partial<CheckoutDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  /** Validates and confirms the address. Returns the confirmed draft, or null (and focuses the first problem). */
  function confirmAddress(): CheckoutDraft | null {
    const problems = validateAddress(draft.address);
    const first = ADDRESS_FIELDS.find((f) => problems[f]);
    if (first) {
      setShowErrors(true);
      const count = Object.keys(problems).length;
      setAnnouncement(`${pluralize(count, 'field')} in your address ${count === 1 ? 'needs' : 'need'} attention.`);
      setFocusRequest({ kind: 'field', field: first });
      return null;
    }
    const next = { ...draft, address: normalizeAddress(draft.address), addressConfirmed: true };
    setDraft(next);
    setShowErrors(false);
    setPreviousAddress(null);
    return next;
  }

  function submitAddress() {
    const next = confirmAddress();
    if (!next) return;
    setAnnouncement(`Address saved. Delivering to ${next.address.fullName}, ${cityLine(next.address)}.`);
    setFocusRequest({ kind: 'address-heading' });
  }

  function changeAddress() {
    setPreviousAddress(draft.address);
    update({ addressConfirmed: false });
    setFocusRequest({ kind: 'field', field: 'fullName' });
  }

  function cancelChange() {
    if (!previousAddress) return;
    update({ address: previousAddress, addressConfirmed: true });
    setPreviousAddress(null);
    setShowErrors(false);
    setFocusRequest({ kind: 'change-address' });
  }

  async function place() {
    if (placing || placed) return;
    // "Place your order" is never a dead button: if the address isn't confirmed yet, it tries to confirm it,
    // and if something is missing it takes the shopper straight to it.
    const ready = draft.addressConfirmed ? draft : confirmAddress();
    if (!ready) return;
    setPlacing(true);
    setOrderError(undefined);
    setAnnouncement('Placing your order…');
    try {
      const order = await placeOrder(lines, ready);
      setPlaced(true);
      clearDraft();
      navigate(`/order/${order.id}`, { replace: true, state: { order } });
      clearCart();
    } catch (e) {
      setPlacing(false);
      const message = e instanceof OrderError ? e.message : 'We couldn’t place your order. You haven’t been charged. Please try again.';
      setOrderError(message);
      setAnnouncement('');
      setFocusRequest({ kind: 'place' });
    }
  }

  const placeRef = (el: HTMLButtonElement | null) => {
    placeButton.current = el;
    placeInViewRef(el);
  };

  /* ---------------------------------------------------------------------------------------------- */

  let content;
  if (placed) {
    // The cart is being cleared while we move to the confirmation page; don't flash "empty cart" meanwhile.
    content = (
      <div className="flex items-center justify-center gap-3 rounded-card bg-surface p-10 text-ink-muted" role="status">
        <Spinner size={20} /> Opening your order confirmation…
      </div>
    );
  } else if (lines.length === 0) {
    content = (
      <div className="rounded-card bg-surface">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          description="There’s nothing to check out yet. Add something to your cart and come back."
          actions={
            <ButtonLink to="/" variant="dark">
              Continue shopping
            </ButtonLink>
          }
        />
      </div>
    );
  } else if (catalogue.state.status === 'error') {
    content = (
      <div role="alert" className="rounded-card bg-surface">
        <EmptyState
          icon="alert"
          title="We couldn’t load checkout"
          description={`${catalogue.state.message} Your cart is safe and nothing has been ordered.`}
          actions={
            <Button icon={<Icon name="refresh" size={16} />} onClick={catalogue.retry}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (!resolved || !totals || !price) {
    content = (
      <div aria-busy="true" aria-label="Loading checkout" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
        <Skeleton className="h-80 w-full rounded-card" />
      </div>
    );
  } else if (totals.issues > 0 || totals.payableCount === 0) {
    content = <CheckoutBlocked issues={resolved.filter((r) => r.status !== 'ok')} />;
  } else {
    const hint = draft.addressConfirmed ? undefined : 'Add a delivery address to place your order.';
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <CheckoutSection
            id="address"
            step={1}
            title="Delivery address"
            done={draft.addressConfirmed}
            headingRef={addressHeading}
            action={
              draft.addressConfirmed && (
                <Button ref={changeAddressButton} variant="ghost" size="sm" className="h-10 sm:h-8" onClick={changeAddress} aria-label="Change delivery address">
                  Change
                </Button>
              )
            }
          >
            {draft.addressConfirmed ? (
              <AddressSummary address={draft.address} />
            ) : (
              <AddressForm
                value={draft.address}
                errors={errors}
                onChange={(field, value) => update({ address: { ...draft.address, [field]: value } })}
                onSubmit={submitAddress}
                onCancel={previousAddress ? cancelChange : undefined}
                fieldRef={fieldRef}
              />
            )}
          </CheckoutSection>

          <CheckoutSection id="delivery" step={2} title="Delivery speed">
            <DeliveryOptions value={draft.speed} subtotal={totals.subtotal} onChange={(speed) => update({ speed })} labelledBy="delivery-heading" />
          </CheckoutSection>

          <CheckoutSection id="payment" step={3} title="Payment method">
            <PaymentOptions value={draft.payment} onChange={(payment) => update({ payment })} labelledBy="payment-heading" />
          </CheckoutSection>

          <CheckoutSection
            id="review"
            step={4}
            title="Review items"
            action={
              <ButtonLink to="/cart" variant="ghost" size="sm" className="h-10 sm:h-8" aria-label="Edit items in your cart">
                Edit in cart
              </ButtonLink>
            }
          >
            <p className="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-success">
              <Icon name="truck" size={18} />
              Arriving by {formatDeliveryDate(deliveryDate(draft.speed))}
            </p>
            <ReviewItems items={resolved} />
          </CheckoutSection>
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-4">
          <CheckoutSummary price={price} speed={draft.speed} onPlace={place} placing={placing} hint={hint} error={orderError} placeRef={placeRef} />
        </aside>
      </div>
    );
  }

  const showStickyBar = !placed && price && totals && totals.issues === 0 && totals.payableCount > 0 && !placeInView;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pb-28 focus:outline-none lg:pb-12">
      <title>Checkout · Amazon Clone</title>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Container className="pt-4 sm:pt-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-[28px]">Checkout</h1>
          {totals && totals.payableCount > 0 && totals.issues === 0 && !placed && <p className="text-sm text-ink-muted">{pluralize(totals.payableCount, 'item')}</p>}
        </div>
        {content}
      </Container>

      {/* Phones: while the summary's button is off screen, keep the total and "Place your order" one tap away. */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-overlay backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-muted">Order total</p>
              <p className="text-lg leading-6 font-bold tabular-nums">{formatMoney(price.total)}</p>
            </div>
            <Button
              loading={placing}
              onClick={place}
              className="shrink-0"
              aria-label={`Place your order, total ${formatMoney(price.total)}`}
              aria-describedby={draft.addressConfirmed ? undefined : PLACE_ORDER_HINT_ID}
            >
              Place your order
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
