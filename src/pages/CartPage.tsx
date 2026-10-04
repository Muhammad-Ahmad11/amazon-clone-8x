import { useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from '../api/useProducts';
import { CartLineItem, variantDescription } from '../components/cart/CartLineItem';
import { CartSummary, CHECKOUT_BLOCKED_ID } from '../components/cart/CartSummary';
import { RemovedLineNotice } from '../components/cart/RemovedLineNotice';
import { Button, ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Skeleton } from '../components/ui/Skeleton';
import type { Product } from '../data/types';
import { deliveryFee } from '../lib/delivery';
import { pluralize } from '../lib/format';
import { formatMoney } from '../lib/money';
import { searchUrl } from '../lib/routes';
import { useInView } from '../lib/useInView';
import {
  cartTotals,
  removeLine,
  resolveLine,
  restoreLine,
  setLineQuantity,
  useCartLines,
  type RemovedLine,
  type ResolvedLine,
} from '../state/cart';

interface RemovedEntry extends RemovedLine {
  title: string;
  details: string;
}

/**
 * /cart — "What am I buying, how many, what will it cost, and am I ready to continue?"
 * Item details come from the catalogue (through the same data layer as other pages); the lines themselves
 * come from the cart store, so the header count, this page and checkout always agree.
 */
export function CartPage() {
  const lines = useCartLines();
  const catalogue = useProducts();
  const [removed, setRemoved] = useState<Map<string, RemovedEntry>>(new Map());
  // Display order, so a removed line's notice stays exactly where the line was.
  const [order, setOrder] = useState<string[]>(() => lines.map((l) => l.variantId));
  const [announcement, setAnnouncement] = useState('');
  const [focusTarget, setFocusTarget] = useState<{ kind: 'undo' | 'line'; id: string } | null>(null);
  const undoRefs = useRef(new Map<string, HTMLButtonElement>());
  const [checkoutRef, checkoutInView] = useInView<HTMLElement>();

  const lookup = useMemo(() => {
    if (catalogue.state.status !== 'ready') return null;
    const byId = new Map(catalogue.state.products.map((p) => [p.id, p]));
    return (id: string): Product | undefined => byId.get(id);
  }, [catalogue.state]);

  const resolved = useMemo(() => (lookup ? lines.map((l) => resolveLine(l, lookup)) : null), [lines, lookup]);
  const byVariant = useMemo(() => new Map(resolved?.map((r) => [r.line.variantId, r])), [resolved]);
  const totals = resolved ? cartTotals(resolved) : null;

  // Lines added elsewhere (another tab) are appended; removed lines keep their slot while their notice is shown.
  const inCart = new Set(lines.map((l) => l.variantId));
  const effectiveOrder = [...order.filter((id) => inCart.has(id) || removed.has(id)), ...lines.map((l) => l.variantId).filter((id) => !order.includes(id))];

  // Move focus somewhere sensible after the element that had it disappears (Remove -> Undo, Undo -> the line).
  useEffect(() => {
    if (!focusTarget) return;
    const el =
      focusTarget.kind === 'undo'
        ? undoRefs.current.get(focusTarget.id)
        : document.querySelector<HTMLElement>(`[data-remove-for="${CSS.escape(focusTarget.id)}"]`);
    el?.focus();
    setFocusTarget(null);
  }, [focusTarget, removed, lines]);

  function remove(item: ResolvedLine) {
    setOrder(effectiveOrder);
    const result = removeLine(item.line.variantId);
    if (!result) return;
    const title = item.product?.title ?? 'Item no longer available';
    const details = [variantDescription(item), `Qty ${item.line.quantity}`].filter(Boolean).join(' · ');
    setRemoved((prev) => new Map(prev).set(item.line.variantId, { ...result, title, details }));
    setAnnouncement(`Removed ${title} from your cart. Undo is available.`);
    setFocusTarget({ kind: 'undo', id: item.line.variantId });
  }

  function undo(id: string) {
    const entry = removed.get(id);
    if (!entry) return;
    // Put it back at its position among the lines still in the cart.
    const index = effectiveOrder.slice(0, effectiveOrder.indexOf(id)).filter((v) => inCart.has(v)).length;
    restoreLine({ line: entry.line, index });
    dismiss(id);
    setAnnouncement(`${entry.title} is back in your cart.`);
    setFocusTarget({ kind: 'line', id });
  }

  function dismiss(id: string) {
    setRemoved((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function changeQuantity(item: ResolvedLine, quantity: number) {
    setLineQuantity(item.line.variantId, quantity);
  }

  function announceLimit(item: ResolvedLine) {
    setAnnouncement(item.limit > 0 && item.limit < 10 ? `Only ${item.limit} in stock. You already have them all.` : 'That’s the most you can add of this item.');
  }

  const empty = lines.length === 0 && removed.size === 0;
  const count = totals?.count ?? lines.reduce((n, l) => n + l.quantity, 0);
  const total = totals ? totals.subtotal + deliveryFee('standard', totals.subtotal) : 0;
  const blocked = !totals || totals.issues > 0 || totals.payableCount === 0;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-canvas pb-28 focus:outline-none lg:pb-12">
      <title>{`Shopping cart${count ? ` (${count})` : ''} · Amazon Clone`}</title>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Container className="pt-4 sm:pt-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-[28px]">Shopping cart</h1>
          {!empty && <p className="text-sm text-ink-muted">{pluralize(count, 'item')}</p>}
        </div>

        {empty ? (
          <div className="rounded-card bg-surface">
            <EmptyState
              icon="cart"
              title="Your cart is empty"
              description="Items you add will appear here. Your cart is saved on this device, so it’ll still be here when you come back."
              actions={
                <>
                  <ButtonLink to="/" variant="dark">
                    Continue shopping
                  </ButtonLink>
                  <ButtonLink to={searchUrl({ deals: true })} variant="secondary">
                    See today’s deals
                  </ButtonLink>
                </>
              }
            />
          </div>
        ) : catalogue.state.status === 'error' ? (
          <div role="alert" className="rounded-card bg-surface">
            <EmptyState
              icon="alert"
              title="We couldn’t load your cart’s details"
              description={`${catalogue.state.message} Your cart is safe. Try again in a moment.`}
              actions={
                <Button icon={<Icon name="refresh" size={16} />} onClick={catalogue.retry}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
            <section aria-labelledby="items-heading" className="rounded-card bg-surface px-4 sm:px-5">
              <h2 id="items-heading" className="sr-only">
                Items in your cart
              </h2>
              {!resolved ? (
                <ul aria-busy="true" aria-label="Loading cart" className="divide-y divide-line-soft">
                  {lines.map((l) => (
                    <li key={l.variantId} className="flex gap-4 py-4">
                      <Skeleton className="size-[88px] shrink-0 rounded-lg sm:size-32" />
                      <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="mt-2 h-10 w-32 rounded-full" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {effectiveOrder.map((id) => {
                    const item = byVariant.get(id);
                    if (item) {
                      return (
                        <li key={id} className="py-4 sm:py-5">
                          <CartLineItem item={item} onQuantity={(q) => changeQuantity(item, q)} onRemove={() => remove(item)} onLimit={() => announceLimit(item)} />
                        </li>
                      );
                    }
                    const entry = removed.get(id);
                    return entry ? (
                      <li key={id} className="py-3">
                        <RemovedLineNotice
                          title={entry.title}
                          details={entry.details}
                          onUndo={() => undo(id)}
                          onDismiss={() => dismiss(id)}
                          undoRef={(el) => {
                            if (el) undoRefs.current.set(id, el);
                            else undoRefs.current.delete(id);
                          }}
                        />
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
              {lines.length === 0 && (
                <div className="flex flex-col items-start gap-3 border-t border-line-soft py-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink-muted">Your cart is now empty.</p>
                  <ButtonLink to="/" variant="dark" size="sm">
                    Continue shopping
                  </ButtonLink>
                </div>
              )}
            </section>

            {lines.length > 0 && (
              <aside aria-label="Order summary" className="lg:sticky lg:top-[76px]">
                {totals ? <CartSummary totals={totals} checkoutRef={checkoutRef} /> : <Skeleton className="h-80 w-full rounded-card" />}
              </aside>
            )}
          </div>
        )}
      </Container>

      {/* Phones: while the summary's checkout button is off screen, keep the total and checkout one tap away. */}
      {totals && lines.length > 0 && !checkoutInView && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-overlay backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-muted">Total ({pluralize(totals.payableCount, 'item')})</p>
              <p className="text-lg leading-6 font-bold tabular-nums">{formatMoney(total)}</p>
            </div>
            {blocked ? (
              <Button disabled aria-describedby={totals.issues > 0 ? CHECKOUT_BLOCKED_ID : undefined} className="shrink-0">
                {totals.issues > 0 ? `Fix ${pluralize(totals.issues, 'item')}` : 'Proceed to checkout'}
              </Button>
            ) : (
              <ButtonLink to="/checkout" className="shrink-0">
                Proceed to checkout
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
