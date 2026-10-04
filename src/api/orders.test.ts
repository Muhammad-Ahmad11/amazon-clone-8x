import { describe, expect, it } from 'vitest';
import { productsById } from '../data/products';
import { resolveLine, type CartLine } from '../state/cart';
import type { Address } from '../state/checkout';
import { createOrder, makeOrderId, OrderError } from './orders';

const address: Address = { fullName: ' Sam Rivera ', line1: '400 Pine St', line2: '', city: 'Seattle', state: 'WA', zip: '98101', phone: '' };
const line = (variantId: string, quantity: number): CartLine => ({ productId: variantId.split('--')[0]!, variantId, quantity });
const sunday = new Date(2026, 9, 4, 10, 30);

describe('createOrder', () => {
  it('snapshots items and prices with the cart and delivery rules', () => {
    const resolved = [line('echo-buds-pro--black', 2), line('flowline-yoga-mat--teal', 1)].map((l) => resolveLine(l));
    const mat = productsById.get('flowline-yoga-mat')!.variants.find((v) => v.id === 'flowline-yoga-mat--teal')!;
    const order = createOrder(resolved, { address, speed: 'express', payment: 'demo-card' }, sunday, 'test-1');
    expect(order.items.map((i) => [i.variantId, i.quantity, i.unitPrice])).toEqual([
      ['echo-buds-pro--black', 2, 8999],
      ['flowline-yoga-mat--teal', 1, mat.price],
    ]);
    expect(order.items[0]!.options).toBe('Colour: Midnight Black');
    expect(order.price).toEqual({ items: 3, subtotal: 17998 + mat.price, delivery: 999, total: 17998 + mat.price + 999 });
    expect(new Date(order.deliverBy).getDate()).toBe(6); // express: 2 business days after Sun Oct 4
    expect(order.address.fullName).toBe('Sam Rivera');
  });

  it('refuses any cart that has a problem line, or nothing to buy', () => {
    const place = (lines: CartLine[]) => () => createOrder(lines.map((l) => resolveLine(l)), { address, speed: 'standard', payment: 'demo-card' }, sunday, 'x');
    expect(place([line('echo-buds-pro--black', 1), line('trailform-daypack--sand', 5)])).toThrow(OrderError);
    expect(place([line('aurora-anc-headphones--sage', 1)])).toThrow(OrderError);
    expect(place([line('ghost-product--x', 1)])).toThrow(OrderError);
    expect(place([])).toThrow(OrderError);
  });
});

describe('makeOrderId', () => {
  it('is the date plus six digits', () => {
    expect(makeOrderId(sunday, () => 0.0421)).toBe('261004-042100');
  });
});
