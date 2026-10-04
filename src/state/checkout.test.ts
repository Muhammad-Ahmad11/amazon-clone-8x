import { describe, expect, it } from 'vitest';
import { cartTotals, resolveLine, type CartLine } from './cart';
import { EMPTY_ADDRESS, EMPTY_DRAFT, normalizeAddress, parseStoredDraft, priceOrder, validateAddress, type Address } from './checkout';

const valid: Address = { fullName: 'Sam Rivera', line1: '400 Pine St', line2: '', city: 'Seattle', state: 'WA', zip: '98101', phone: '' };
const line = (variantId: string, quantity: number): CartLine => ({ productId: variantId.split('--')[0]!, variantId, quantity });

describe('address validation', () => {
  it('accepts a complete address, with or without the optional fields', () => {
    expect(validateAddress(valid)).toEqual({});
    expect(validateAddress({ ...valid, line2: 'Apt 4', phone: '(206) 555-0142', zip: '98101-1234' })).toEqual({});
    expect(validateAddress({ ...valid, phone: '+1 206 555 0142' })).toEqual({});
  });

  it('asks for every required field, and nothing optional', () => {
    expect(Object.keys(validateAddress(EMPTY_ADDRESS)).sort()).toEqual(['city', 'fullName', 'line1', 'state', 'zip']);
    expect(validateAddress({ ...valid, fullName: '   ' }).fullName).toMatch(/name/);
  });

  it('checks ZIP, state and phone formats', () => {
    expect(validateAddress({ ...valid, zip: '9810' }).zip).toMatch(/5-digit/);
    expect(validateAddress({ ...valid, zip: 'ABCDE' }).zip).toBeDefined();
    expect(validateAddress({ ...valid, state: 'ZZ' }).state).toBeDefined();
    expect(validateAddress({ ...valid, phone: '555-0142' }).phone).toMatch(/10-digit/);
  });

  it('normalises spacing before saving', () => {
    expect(normalizeAddress({ ...valid, fullName: '  Sam   Rivera ', city: ' Seattle ' })).toMatchObject({ fullName: 'Sam Rivera', city: 'Seattle' });
  });
});

describe('order price', () => {
  const totals = (lines: CartLine[]) => cartTotals(lines.map((l) => resolveLine(l)));

  it('uses the cart totals plus the chosen delivery fee', () => {
    const big = totals([line('echo-buds-pro--black', 2)]); // $179.98
    expect(priceOrder(big, 'standard')).toEqual({ items: 2, subtotal: 17998, delivery: 0, total: 17998 });
    expect(priceOrder(big, 'express')).toEqual({ items: 2, subtotal: 17998, delivery: 999, total: 18997 });
  });

  it('charges standard delivery under $35', () => {
    const small = totals([line('echo-buds-pro--black', 1)]);
    const cheap = { ...small, subtotal: 2000 };
    expect(priceOrder(cheap, 'standard')).toMatchObject({ delivery: 499, total: 2499 });
  });
});

describe('stored checkout draft', () => {
  it('round-trips a draft', () => {
    const draft = { address: valid, addressConfirmed: true, speed: 'express' as const, payment: 'pay-on-delivery' as const };
    expect(parseStoredDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it('falls back safely on bad data', () => {
    expect(parseStoredDraft(null)).toEqual(EMPTY_DRAFT);
    expect(parseStoredDraft('{oops')).toEqual(EMPTY_DRAFT);
    expect(parseStoredDraft(JSON.stringify({ speed: 'teleport', payment: 'bitcoin', address: { fullName: 7 } }))).toEqual(EMPTY_DRAFT);
  });

  it('never trusts "confirmed" for an address that does not validate', () => {
    const draft = parseStoredDraft(JSON.stringify({ address: { ...valid, zip: '' }, addressConfirmed: true }));
    expect(draft.addressConfirmed).toBe(false);
    expect(draft.address.city).toBe('Seattle');
  });
});
