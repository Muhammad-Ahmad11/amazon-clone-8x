/*
  Orders: a simulated "place order" call. Nothing is charged, sent or shipped.

  It behaves like a server would: it re-reads the catalogue, re-checks every cart line and the address,
  prices the order with the same rules as the cart, and only then records it. The recorded order is a
  snapshot (titles, options, prices at the time), so the confirmation page never changes afterwards.

  Orders are kept in sessionStorage for this tab only: there are no accounts or order history (decision 45).

  Dev/QA switches (URL query):
    ?simulate=order-error  -> placing an order fails (the catalogue still loads)
    ?simulate=slow         -> slower catalogue and order calls
*/
import { getVariant } from '../data/selectors';
import type { Product } from '../data/types';
import { deliveryDate, type DeliverySpeed } from '../lib/delivery';
import type { Cents } from '../lib/money';
import { describeVariant } from '../lib/variants';
import { cartTotals, resolveLine, type CartLine, type ResolvedLine } from '../state/cart';
import { normalizeAddress, priceOrder, validateAddress, type Address, type CheckoutDraft, type OrderPrice, type PaymentMethod } from '../state/checkout';
import { fetchProducts } from './catalog';

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  /** "Colour: Navy · Capacity: 32 oz", or '' when the product has no choices. */
  options: string;
  image: string;
  quantity: number;
  unitPrice: Cents;
}

export interface Order {
  id: string;
  /** ISO timestamp. */
  placedAt: string;
  /** ISO date of the latest promised arrival ("by"). */
  deliverBy: string;
  speed: DeliverySpeed;
  payment: PaymentMethod;
  address: Address;
  items: OrderItem[];
  price: OrderPrice;
}

export type OrderErrorReason = 'cart-changed' | 'address' | 'failed';

export class OrderError extends Error {
  readonly reason: OrderErrorReason;
  constructor(reason: OrderErrorReason, message: string) {
    super(message);
    this.name = 'OrderError';
    this.reason = reason;
  }
}

/** "261004-482913": the date plus six random digits. Readable aloud, unique enough for one browser. */
export function makeOrderId(now: Date, random: () => number = Math.random): string {
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const digits = String(Math.floor(random() * 1_000_000)).padStart(6, '0');
  return `${yy}${mm}${dd}-${digits}`;
}

/**
 * Builds the order snapshot from resolved cart lines. Pure, so it can be tested.
 * Throws if any line can't be bought as it is: an impossible purchase must never become an order.
 */
export function createOrder(resolved: ResolvedLine[], draft: Pick<CheckoutDraft, 'address' | 'speed' | 'payment'>, now: Date, id: string): Order {
  const totals = cartTotals(resolved);
  if (totals.issues > 0 || totals.payableCount === 0) {
    throw new OrderError('cart-changed', 'Your cart changed, so some items can’t be ordered as they are.');
  }
  const items = resolved.map(({ line, product, variant }): OrderItem => ({
    productId: line.productId,
    variantId: line.variantId,
    title: product!.title,
    options: describeVariant(product!, variant!),
    image: variant!.images[0] ?? getVariant(product!).images[0] ?? '',
    quantity: line.quantity,
    unitPrice: variant!.price,
  }));
  return {
    id,
    placedAt: now.toISOString(),
    deliverBy: deliveryDate(draft.speed, now).toISOString(),
    speed: draft.speed,
    payment: draft.payment,
    address: normalizeAddress(draft.address),
    items,
    price: priceOrder(totals, draft.speed),
  };
}

function simulateMode(): string | null {
  return typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('simulate');
}

/** Places the order: re-validates everything against the current catalogue, then records it. */
export async function placeOrder(lines: CartLine[], draft: CheckoutDraft): Promise<Order> {
  const products = await fetchProducts();
  const mode = simulateMode();
  const delay = mode === 'slow' ? 2500 : import.meta.env.MODE === 'test' ? 0 : 600 + Math.random() * 400;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Object.keys(validateAddress(draft.address)).length > 0) {
    throw new OrderError('address', 'Your delivery address needs attention.');
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved = lines.map((l) => resolveLine(l, (id): Product | undefined => byId.get(id)));
  const now = new Date();
  const order = createOrder(resolved, draft, now, makeOrderId(now));
  if (mode === 'order-error') {
    throw new OrderError('failed', 'We couldn’t place your order. You haven’t been charged, and your cart is unchanged.');
  }
  saveOrder(order);
  return order;
}

/* ---------------------------------------------------------------------------------------------- */
/* Storage                                                                                         */

const STORAGE_KEY = 'amazon-clone:orders:v1';
/** Only the most recent few: there is no order history, just the confirmation page. */
const KEEP = 5;

function readOrders(): Order[] {
  try {
    const data: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(data) ? data.filter(isOrder) : [];
  } catch {
    return [];
  }
}

function isOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Partial<Order>;
  return typeof o.id === 'string' && typeof o.placedAt === 'string' && typeof o.deliverBy === 'string' && Array.isArray(o.items) && typeof o.price === 'object' && typeof o.address === 'object';
}

function saveOrder(order: Order): void {
  try {
    const orders = [order, ...readOrders().filter((o) => o.id !== order.id)].slice(0, KEEP);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Not stored: the confirmation page falls back to the order passed in navigation state.
  }
}

export function getOrder(id: string): Order | null {
  return readOrders().find((o) => o.id === id) ?? null;
}
