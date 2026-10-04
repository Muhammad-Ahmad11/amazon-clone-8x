import { describe, expect, it } from 'vitest';
import { bestSellers, categoryHighlights, defaultDiscount, relatedProducts, todaysDeals } from './curation';
import { categories, products } from './products';

function maxPerCategory(list: typeof products): number {
  const counts = new Map<string, number>();
  for (const p of list) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return Math.max(...counts.values());
}

describe('homepage curation', () => {
  it('picks only discounted products for deals, biggest discount first', () => {
    const deals = todaysDeals(products);
    expect(deals).toHaveLength(6);
    const discounts = deals.map(defaultDiscount);
    expect(discounts.every((d) => d > 0)).toBe(true);
    expect(discounts).toEqual([...discounts].sort((a, b) => b - a));
  });

  it('mixes categories instead of letting one category fill a shelf', () => {
    expect(maxPerCategory(todaysDeals(products))).toBeLessThanOrEqual(2);
    expect(maxPerCategory(bestSellers(products))).toBeLessThanOrEqual(2);
  });

  it('keeps best sellers free of products already shown as deals', () => {
    const deals = todaysDeals(products);
    const sellers = bestSellers(products, { exclude: new Set(deals.map((p) => p.id)) });
    expect(sellers).toHaveLength(6);
    expect(sellers.some((p) => deals.includes(p))).toBe(false);
  });

  it('relates products by type first, then category popularity, never itself', () => {
    const headphones = products.find((p) => p.id === 'aurora-anc-headphones')!;
    const related = relatedProducts(products, headphones);
    expect(related[0]!.id).toBe('pulse-on-ear-headphones');
    expect(related.every((p) => p.category === 'electronics' && p.id !== headphones.id)).toBe(true);
    expect(related.length).toBeLessThanOrEqual(6);
  });

  it('gives each category card up to four distinct product types from that category', () => {
    for (const c of categories) {
      const tiles = categoryHighlights(products, c.id);
      expect(tiles.length, c.id).toBe(4);
      expect(new Set(tiles.map((t) => t.type)).size).toBe(tiles.length);
      expect(tiles.every((t) => t.product.category === c.id && t.product.type === t.type)).toBe(true);
    }
  });
});
