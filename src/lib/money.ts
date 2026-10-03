/** All prices are stored as integer cents (USD) to avoid floating-point drift. */
export type Cents = number;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** "$1,234.50" */
export function formatMoney(cents: Cents): string {
  return usd.format(cents / 100);
}

/** Splits a price for the superscript style: { symbol: "$", whole: "1,234", fraction: "50" }. */
export function splitPrice(cents: Cents): { symbol: string; whole: string; fraction: string } {
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100).toLocaleString('en-US');
  const fraction = String(abs % 100).padStart(2, '0');
  return { symbol: '$', whole: (cents < 0 ? '-' : '') + whole, fraction };
}

/** Whole-number percentage saved versus a list price, or 0 if there is no real saving. */
export function discountPercent(price: Cents, listPrice?: Cents): number {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round(((listPrice - price) / listPrice) * 100);
}
