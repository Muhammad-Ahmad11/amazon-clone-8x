import { describe, expect, it } from 'vitest';
import { addBusinessDays, deliveryDate, deliveryFee, formatDeliveryDate, FREE_DELIVERY_MIN } from './delivery';

const sunday = new Date(2026, 9, 4); // Sun, Oct 4 2026
const friday = new Date(2026, 9, 9);

describe('delivery', () => {
  it('counts business days and skips weekends', () => {
    expect(formatDeliveryDate(addBusinessDays(sunday, 1))).toBe('Mon, Oct 5');
    expect(formatDeliveryDate(addBusinessDays(friday, 1))).toBe('Mon, Oct 12');
  });

  it('promises the latest date of each speed', () => {
    expect(formatDeliveryDate(deliveryDate('standard', sunday))).toBe('Fri, Oct 9');
    expect(formatDeliveryDate(deliveryDate('express', sunday))).toBe('Tue, Oct 6');
    expect(formatDeliveryDate(deliveryDate('express', friday))).toBe('Tue, Oct 13');
  });

  it('makes standard delivery free from $35, and never express', () => {
    expect(deliveryFee('standard', FREE_DELIVERY_MIN - 1)).toBe(499);
    expect(deliveryFee('standard', FREE_DELIVERY_MIN)).toBe(0);
    expect(deliveryFee('express', 100000)).toBe(999);
  });
});
