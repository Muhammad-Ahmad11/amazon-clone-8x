/*
  Cart state. One shape for every stage: product page (add), cart (change, remove, undo) and checkout (read, clear).

  - Lines are { productId, variantId, quantity }; prices and stock are always read from the catalogue, never stored.
  - Pure reducer (tested) + a tiny external store read with useSyncExternalStore. No context provider needed.
  - Persisted to localStorage and kept in step across tabs via the "storage" event.
  - Stored lines are kept even if the catalogue no longer has them: resolveLine() classifies each one,
    so the cart can say "no longer available" instead of making an item silently disappear.
*/
import { useSyncExternalStore } from 'react';
import { productsById } from '../data/products';
import type { Product, Variant } from '../data/types';
import type { Cents } from '../lib/money';

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/** Per-line cap, matching the quantity stepper. */
export const MAX_PER_LINE = 10;

export type CartAction =
  | { type: 'add'; productId: string; variantId: string; quantity: number; stock: number }
  | { type: 'setQuantity'; variantId: string; quantity: number; stock: number }
  | { type: 'remove'; variantId: string }
  /** Undo a removal: put the exact line back where it was (merging if the same variant was added again meanwhile). */
  | { type: 'restore'; line: CartLine; index: number }
  | { type: 'clear' };

/** Most of a variant one line can hold: its stock, capped per line. */
export function lineLimit(stock: number): number {
  return Math.max(0, Math.min(MAX_PER_LINE, stock));
}

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((l) => l.variantId === action.variantId);
      const quantity = Math.min(lineLimit(action.stock), (existing?.quantity ?? 0) + action.quantity);
      if (quantity <= 0 || quantity === existing?.quantity) return lines;
      return existing
        ? lines.map((l) => (l === existing ? { ...l, quantity } : l))
        : [...lines, { productId: action.productId, variantId: action.variantId, quantity }];
    }
    case 'setQuantity': {
      const existing = lines.find((l) => l.variantId === action.variantId);
      const limit = lineLimit(action.stock);
      if (!existing || limit === 0) return lines;
      // Never below 1 (removing is its own action) and never above what can actually be bought.
      const quantity = Math.max(1, Math.min(limit, Math.round(action.quantity)));
      return quantity === existing.quantity ? lines : lines.map((l) => (l === existing ? { ...l, quantity } : l));
    }
    case 'remove': {
      const next = lines.filter((l) => l.variantId !== action.variantId);
      return next.length === lines.length ? lines : next;
    }
    case 'restore': {
      const existing = lines.find((l) => l.variantId === action.line.variantId);
      if (existing) {
        const quantity = Math.min(MAX_PER_LINE, existing.quantity + action.line.quantity);
        return lines.map((l) => (l === existing ? { ...l, quantity } : l));
      }
      const at = Math.max(0, Math.min(lines.length, action.index));
      return [...lines.slice(0, at), { ...action.line }, ...lines.slice(at)];
    }
    case 'clear':
      return lines.length ? [] : lines;
  }
}

/**
 * Reads stored JSON defensively. Malformed entries are dropped; well-formed lines are kept even when the catalogue
 * no longer has that product or variant, so the cart can explain what happened (see resolveLine).
 */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.flatMap((item): CartLine[] => {
      if (typeof item !== 'object' || item === null) return [];
      const { productId, variantId, quantity } = item as Record<string, unknown>;
      if (typeof productId !== 'string' || typeof variantId !== 'string' || !Number.isInteger(quantity) || seen.has(variantId)) return [];
      seen.add(variantId);
      return [{ productId, variantId, quantity: Math.max(1, Math.min(MAX_PER_LINE, quantity as number)) }];
    });
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* Resolving lines against the catalogue                                                           */

export type LineStatus =
  /** Can be bought as it is. */
  | 'ok'
  /** More in the cart than we have: the shopper must lower it before checkout. */
  | 'exceeds-stock'
  /** The variant exists but is sold out. */
  | 'unavailable'
  /** The product or variant is no longer in the catalogue. */
  | 'missing';

export interface ResolvedLine {
  line: CartLine;
  product?: Product;
  variant?: Variant;
  status: LineStatus;
  /** Most this line can hold right now (0 when it can't be bought). */
  limit: number;
}

export function resolveLine(line: CartLine, lookup: (productId: string) => Product | undefined = (id) => productsById.get(id)): ResolvedLine {
  const product = lookup(line.productId);
  const variant = product?.variants.find((v) => v.id === line.variantId);
  if (!product || !variant) return { line, product, status: 'missing', limit: 0 };
  const limit = lineLimit(variant.stock);
  const status: LineStatus = limit === 0 ? 'unavailable' : line.quantity > limit ? 'exceeds-stock' : 'ok';
  return { line, product, variant, status, limit };
}

export interface CartTotals {
  /** Every unit in the cart, including ones that need attention (matches the header count). */
  count: number;
  /** Units that will be charged: lines that still exist and are in stock. */
  payableCount: number;
  /** Price of the payable units. Unavailable and missing lines are excluded. */
  subtotal: Cents;
  /** Lines that block checkout until the shopper fixes them. */
  issues: number;
}

export function cartTotals(resolved: ResolvedLine[]): CartTotals {
  let count = 0;
  let payableCount = 0;
  let subtotal = 0;
  let issues = 0;
  for (const r of resolved) {
    count += r.line.quantity;
    if (r.status !== 'ok') issues += 1;
    if (r.variant && (r.status === 'ok' || r.status === 'exceeds-stock')) {
      payableCount += r.line.quantity;
      subtotal += r.variant.price * r.line.quantity;
    }
  }
  return { count, payableCount, subtotal, issues };
}

export function cartSummary(lines: CartLine[]): CartTotals {
  return cartTotals(lines.map((l) => resolveLine(l)));
}

/* ---------------------------------------------------------------------------------------------- */
/* Store                                                                                           */

const STORAGE_KEY = 'amazon-clone:cart:v1';
const listeners = new Set<() => void>();

function read(): CartLine[] {
  try {
    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return []; // storage blocked (private mode, disabled cookies): the cart still works for this visit
  }
}

let lines: CartLine[] = typeof window === 'undefined' ? [] : read();

function dispatch(action: CartAction) {
  const next = cartReducer(lines, action);
  if (next === lines) return;
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Not persisted, but the in-memory cart keeps working.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    lines = read();
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, () => lines, () => lines);
}

export function useCartSummary(): CartTotals {
  return cartSummary(useCartLines());
}

export interface AddResult {
  /** Units actually added (may be fewer than asked when stock or the per-line cap is reached). */
  added: number;
  /** Quantity of this variant now in the cart. */
  inCart: number;
}

export function addToCart(product: Product, variant: Variant, quantity: number): AddResult {
  const before = lines.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  dispatch({ type: 'add', productId: product.id, variantId: variant.id, quantity, stock: variant.stock });
  const inCart = lines.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  return { added: inCart - before, inCart };
}

/** Sets a line's quantity, clamped to 1…what can be bought. Stock is read from the catalogue. */
export function setLineQuantity(variantId: string, quantity: number): void {
  const line = lines.find((l) => l.variantId === variantId);
  if (!line) return;
  const { variant } = resolveLine(line);
  if (variant) dispatch({ type: 'setQuantity', variantId, quantity, stock: variant.stock });
}

export interface RemovedLine {
  line: CartLine;
  /** Position it had, so Undo can put it back in the same place. */
  index: number;
}

export function removeLine(variantId: string): RemovedLine | null {
  const index = lines.findIndex((l) => l.variantId === variantId);
  if (index < 0) return null;
  const line = lines[index]!;
  dispatch({ type: 'remove', variantId });
  return { line, index };
}

export function restoreLine(removed: RemovedLine): void {
  dispatch({ type: 'restore', line: removed.line, index: removed.index });
}

/** For checkout, once an order is placed. */
export function clearCart(): void {
  dispatch({ type: 'clear' });
}
