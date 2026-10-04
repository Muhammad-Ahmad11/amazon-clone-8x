import { describe, expect, it } from 'vitest';
import { productsById } from '../data/products';
import { cartReducer, cartSummary, cartTotals, MAX_PER_LINE, parseStoredCart, resolveLine, type CartLine } from './cart';

const add = (lines: CartLine[], variantId: string, quantity: number, stock = 24) =>
  cartReducer(lines, { type: 'add', productId: variantId.split('--')[0]!, variantId, quantity, stock });
const line = (variantId: string, quantity: number): CartLine => ({ productId: variantId.split('--')[0]!, variantId, quantity });

describe('cart reducer: add', () => {
  it('adds a new line, then increases the same variant instead of duplicating it', () => {
    let lines = add([], 'echo-buds-pro--black', 2);
    lines = add(lines, 'echo-buds-pro--black', 1);
    lines = add(lines, 'echo-buds-pro--white', 1);
    expect(lines).toEqual([line('echo-buds-pro--black', 3), line('echo-buds-pro--white', 1)]);
  });

  it('never exceeds stock or the per-line cap', () => {
    expect(add([], 'trailform-daypack--sand', 5, 2)[0]!.quantity).toBe(2);
    expect(add(add([], 'echo-buds-pro--black', 8), 'echo-buds-pro--black', 8)[0]!.quantity).toBe(MAX_PER_LINE);
  });

  it('ignores adds that change nothing (sold out, or already at the limit)', () => {
    const empty: CartLine[] = [];
    expect(add(empty, 'aurora-anc-headphones--sage', 1, 0)).toBe(empty);
    const full = add([], 'trailform-daypack--sand', 2, 2);
    expect(add(full, 'trailform-daypack--sand', 1, 2)).toBe(full);
  });
});

describe('cart reducer: quantity, remove, restore, clear', () => {
  const lines = [line('echo-buds-pro--black', 2), line('trailform-daypack--sand', 1), line('flowline-yoga-mat--teal', 1)];

  it('sets quantity within 1…stock', () => {
    const q = (n: number, stock = 24) => cartReducer(lines, { type: 'setQuantity', variantId: 'echo-buds-pro--black', quantity: n, stock })[0]!.quantity;
    expect(q(5)).toBe(5);
    expect(q(0)).toBe(1);
    expect(q(-3)).toBe(1);
    expect(q(50)).toBe(MAX_PER_LINE);
    expect(q(5, 3)).toBe(3);
  });

  it('ignores quantity changes for missing lines or sold-out variants', () => {
    expect(cartReducer(lines, { type: 'setQuantity', variantId: 'nope', quantity: 3, stock: 9 })).toBe(lines);
    expect(cartReducer(lines, { type: 'setQuantity', variantId: 'echo-buds-pro--black', quantity: 3, stock: 0 })).toBe(lines);
  });

  it('removes a line and restores the exact line in the same place', () => {
    const removed = cartReducer(lines, { type: 'remove', variantId: 'trailform-daypack--sand' });
    expect(removed.map((l) => l.variantId)).toEqual(['echo-buds-pro--black', 'flowline-yoga-mat--teal']);
    const restored = cartReducer(removed, { type: 'restore', line: lines[1]!, index: 1 });
    expect(restored).toEqual(lines);
  });

  it('merges an undo with the same variant if it was added again meanwhile', () => {
    const removed = cartReducer(lines, { type: 'remove', variantId: 'echo-buds-pro--black' });
    const readded = add(removed, 'echo-buds-pro--black', 1);
    const restored = cartReducer(readded, { type: 'restore', line: lines[0]!, index: 0 });
    expect(restored.find((l) => l.variantId === 'echo-buds-pro--black')!.quantity).toBe(3);
    expect(restored).toHaveLength(3);
  });

  it('clears the cart', () => {
    expect(cartReducer(lines, { type: 'clear' })).toEqual([]);
  });
});

describe('stored cart', () => {
  it('drops malformed entries but keeps lines the catalogue no longer has', () => {
    const raw = JSON.stringify([
      line('echo-buds-pro--black', 2),
      line('ghost-product--x', 1),
      { productId: 'echo-buds-pro', variantId: 'echo-buds-pro--white', quantity: 'lots' },
      line('echo-buds-pro--sage', 99),
      line('echo-buds-pro--black', 4), // duplicate variant
      null,
    ]);
    expect(parseStoredCart(raw)).toEqual([line('echo-buds-pro--black', 2), line('ghost-product--x', 1), line('echo-buds-pro--sage', MAX_PER_LINE)]);
    expect(parseStoredCart('{not json')).toEqual([]);
    expect(parseStoredCart(null)).toEqual([]);
  });
});

describe('resolving lines against the catalogue', () => {
  it('classifies every case', () => {
    expect(resolveLine(line('echo-buds-pro--black', 2)).status).toBe('ok');
    expect(resolveLine(line('trailform-daypack--sand', 5))).toMatchObject({ status: 'exceeds-stock', limit: 2 });
    expect(resolveLine(line('aurora-anc-headphones--sage', 1))).toMatchObject({ status: 'unavailable', limit: 0 });
    expect(resolveLine(line('ghost-product--x', 1)).status).toBe('missing');
    expect(resolveLine(line('echo-buds-pro--does-not-exist', 1)).status).toBe('missing');
  });

  it('charges only what can be bought, and counts the issues', () => {
    const echo = productsById.get('echo-buds-pro')!.variants.find((v) => v.id === 'echo-buds-pro--black')!;
    const sand = productsById.get('trailform-daypack')!.variants.find((v) => v.id === 'trailform-daypack--sand')!;
    const totals = cartTotals(
      [line('echo-buds-pro--black', 2), line('trailform-daypack--sand', 5), line('aurora-anc-headphones--sage', 1), line('ghost-product--x', 3)].map((l) => resolveLine(l)),
    );
    expect(totals).toEqual({ count: 11, payableCount: 7, subtotal: echo.price * 2 + sand.price * 5, issues: 3 });
  });

  it('summarises a clean cart', () => {
    expect(cartSummary([line('echo-buds-pro--black', 2)])).toEqual({ count: 2, payableCount: 2, subtotal: 2 * 8999, issues: 0 });
  });
});
