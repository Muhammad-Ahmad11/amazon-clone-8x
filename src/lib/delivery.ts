/*
  The store's delivery model (decision 7): one simple rule set, shown as dates, reused by product page and checkout.
    Standard: 3–5 business days, free on orders of $35 or more, otherwise $4.99
    Express:  1–2 business days, $9.99
*/
import type { Cents } from './money';

export const FREE_DELIVERY_MIN: Cents = 3500;

export type DeliverySpeed = 'standard' | 'express';

export const DELIVERY_OPTIONS: Record<DeliverySpeed, { label: string; fee: Cents; maxBusinessDays: number }> = {
  standard: { label: 'Standard', fee: 499, maxBusinessDays: 5 },
  express: { label: 'Express', fee: 999, maxBusinessDays: 2 },
};

/** Adds business days (Mon–Fri), starting from the next day. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

/** Latest arrival date: we promise "by", never a date we might miss. */
export function deliveryDate(speed: DeliverySpeed, from: Date = new Date()): Date {
  return addBusinessDays(from, DELIVERY_OPTIONS[speed].maxBusinessDays);
}

export function deliveryFee(speed: DeliverySpeed, subtotal: Cents): Cents {
  if (speed === 'standard' && subtotal >= FREE_DELIVERY_MIN) return 0;
  return DELIVERY_OPTIONS[speed].fee;
}

/** "Fri, Oct 9" */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
