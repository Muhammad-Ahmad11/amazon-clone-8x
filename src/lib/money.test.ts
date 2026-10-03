import { describe, expect, it } from 'vitest';
import { discountPercent, formatMoney, splitPrice } from './money';

describe('money', () => {
  it('formats cents as USD', () => {
    expect(formatMoney(12999)).toBe('$129.99');
    expect(formatMoney(100000)).toBe('$1,000.00');
    expect(formatMoney(5)).toBe('$0.05');
  });

  it('splits a price for the superscript style', () => {
    expect(splitPrice(129999)).toEqual({ symbol: '$', whole: '1,299', fraction: '99' });
    expect(splitPrice(1200)).toEqual({ symbol: '$', whole: '12', fraction: '00' });
  });

  it('computes whole-number discounts and ignores non-discounts', () => {
    expect(discountPercent(12999, 17999)).toBe(28);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, undefined)).toBe(0);
    expect(discountPercent(1200, 1000)).toBe(0);
  });
});
