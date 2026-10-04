/*
  Checkout draft: the shopper's address, delivery speed and payment choice while they check out.

  - The cart stays the single source of truth for what is bought; this holds only checkout choices.
  - Saved to sessionStorage, so a refresh keeps it but it is gone when the tab closes:
    an address is personal data and this store has no account to keep it in.
  - Prices come from cartTotals() and the delivery rules (decision 7); nothing is re-derived here.
*/
import { deliveryFee, type DeliverySpeed } from '../lib/delivery';
import type { Cents } from '../lib/money';
import type { CartTotals } from './cart';

export interface Address {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export type AddressField = keyof Address;
export type AddressErrors = Partial<Record<AddressField, string>>;

/** Demo payment choices only: no card details are ever asked for (decision 43). */
export type PaymentMethod = 'demo-card' | 'pay-on-delivery';

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; description: string }> = {
  'demo-card': { label: 'Demo card ending 4242', description: 'A built-in test card. You won’t be asked for card details.' },
  'pay-on-delivery': { label: 'Pay on delivery', description: 'Pay by cash or card when your order arrives.' },
};

export interface CheckoutDraft {
  address: Address;
  /** True once the address has passed validation and the shopper chose "Use this address". */
  addressConfirmed: boolean;
  speed: DeliverySpeed;
  payment: PaymentMethod;
}

export const EMPTY_ADDRESS: Address = { fullName: '', line1: '', line2: '', city: '', state: '', zip: '', phone: '' };

export const EMPTY_DRAFT: CheckoutDraft = { address: EMPTY_ADDRESS, addressConfirmed: false, speed: 'standard', payment: 'demo-card' };

/** US states plus DC, as [code, name]. Delivery is US-only, matching the store's single currency (decision 7). */
export const US_STATES: ReadonlyArray<readonly [string, string]> = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'],
  ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'],
  ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'],
  ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const stateCodes = new Set(US_STATES.map(([code]) => code));

/** Order the fields appear in the form, so the first error can be focused. */
export const ADDRESS_FIELDS: readonly AddressField[] = ['fullName', 'line1', 'line2', 'city', 'state', 'zip', 'phone'];

/** Validates an address. Messages say what to do, not just what is wrong. */
export function validateAddress(a: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (!a.fullName.trim()) errors.fullName = 'Enter the name of the person receiving the order.';
  if (!a.line1.trim()) errors.line1 = 'Enter a street address.';
  if (!a.city.trim()) errors.city = 'Enter a city.';
  if (!a.state) errors.state = 'Choose a state.';
  else if (!stateCodes.has(a.state)) errors.state = 'Choose a state from the list.';
  const zip = a.zip.trim();
  if (!zip) errors.zip = 'Enter a ZIP code.';
  else if (!/^\d{5}(-?\d{4})?$/.test(zip)) errors.zip = 'Enter a 5-digit ZIP code, like 98101.';
  const phoneDigits = a.phone.replace(/\D/g, '');
  if (a.phone.trim() && !(phoneDigits.length === 10 || (phoneDigits.length === 11 && phoneDigits.startsWith('1')))) {
    errors.phone = 'Enter a 10-digit US phone number, or leave it blank.';
  }
  return errors;
}

/** Trims every field so what is shown and saved matches what was meant. */
export function normalizeAddress(a: Address): Address {
  return {
    fullName: a.fullName.trim().replace(/\s+/g, ' '),
    line1: a.line1.trim().replace(/\s+/g, ' '),
    line2: a.line2.trim().replace(/\s+/g, ' '),
    city: a.city.trim().replace(/\s+/g, ' '),
    state: a.state,
    zip: a.zip.trim(),
    phone: a.phone.trim(),
  };
}

/** "Seattle, WA 98101" */
export function cityLine(a: Address): string {
  return `${a.city}, ${a.state} ${a.zip}`;
}

export interface OrderPrice {
  /** Units charged (lines that can be bought). */
  items: number;
  subtotal: Cents;
  delivery: Cents;
  total: Cents;
}

/** The order's price: the cart's own totals plus the chosen delivery fee. One rule set for cart, checkout and order. */
export function priceOrder(totals: CartTotals, speed: DeliverySpeed): OrderPrice {
  const delivery = deliveryFee(speed, totals.subtotal);
  return { items: totals.payableCount, subtotal: totals.subtotal, delivery, total: totals.subtotal + delivery };
}

/* ---------------------------------------------------------------------------------------------- */
/* Persistence                                                                                     */

const STORAGE_KEY = 'amazon-clone:checkout:v1';

/** Reads a stored draft defensively: anything malformed falls back to the empty draft's value. */
export function parseStoredDraft(raw: string | null): CheckoutDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | null;
    if (typeof data !== 'object' || data === null) return EMPTY_DRAFT;
    const stored = (typeof data.address === 'object' && data.address !== null ? data.address : {}) as Record<string, unknown>;
    const address = { ...EMPTY_ADDRESS };
    for (const field of ADDRESS_FIELDS) {
      const value = stored[field];
      if (typeof value === 'string') address[field] = value.slice(0, 200);
    }
    return {
      address,
      // Only trust "confirmed" if the stored address is actually valid.
      addressConfirmed: data.addressConfirmed === true && Object.keys(validateAddress(address)).length === 0,
      speed: data.speed === 'express' ? 'express' : 'standard',
      payment: data.payment === 'pay-on-delivery' ? 'pay-on-delivery' : 'demo-card',
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function loadDraft(): CheckoutDraft {
  try {
    return parseStoredDraft(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: CheckoutDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked: checkout still works for this visit.
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
