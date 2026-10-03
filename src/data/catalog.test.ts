import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { categories, products } from './products';
import { findVariant, getVariant, priceRange, variantLabel } from './selectors';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));

describe('catalogue integrity', () => {
  it('has unique product and variant ids', () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
    expect(new Set(variantIds).size).toBe(variantIds.length);
  });

  it('covers every category, and each category hero product exists in that category', () => {
    for (const c of categories) {
      const hero = products.find((p) => p.id === c.heroProductId);
      expect(hero?.category, c.id).toBe(c.id);
      expect(products.filter((p) => p.category === c.id).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('has a generated image file for every variant image', () => {
    const missing = products.flatMap((p) => p.variants.flatMap((v) => v.images)).filter((src) => !existsSync(join(PUBLIC_DIR, src)));
    expect(missing).toEqual([]);
  });

  it('defines exactly one variant per option combination', () => {
    for (const p of products) {
      const combos = p.options.reduce((n, o) => n * o.values.length, 1);
      expect(p.variants.length, p.id).toBe(combos);
      for (const v of p.variants) expect(findVariant(p, v.options)?.id, p.id).toBe(v.id);
    }
  });

  it('defaults to an in-stock variant whenever one exists', () => {
    for (const p of products) {
      if (p.variants.some((v) => v.stock > 0)) expect(getVariant(p).stock, p.id).toBeGreaterThan(0);
    }
  });

  it('only uses list prices that are higher than the selling price', () => {
    for (const v of products.flatMap((p) => p.variants)) {
      if (v.listPrice !== undefined) expect(v.listPrice, v.id).toBeGreaterThan(v.price);
    }
  });

  it('has sane ratings, breakdowns and reviews', () => {
    for (const p of products) {
      expect(p.rating).toBeGreaterThanOrEqual(1);
      expect(p.rating).toBeLessThanOrEqual(5);
      expect(p.ratingBreakdown.reduce((a, b) => a + b, 0), p.id).toBe(100);
      expect(p.ratingBreakdown.every((n) => n >= 0), p.id).toBe(true);
      expect(p.reviews.length).toBe(3);
    }
  });

  it('includes deliberate stock edge cases for the UI (low stock and sold-out variants)', () => {
    const all = products.flatMap((p) => p.variants);
    expect(all.some((v) => v.stock === 0)).toBe(true);
    expect(all.some((v) => v.stock > 0 && v.stock <= 5)).toBe(true);
  });
});

describe('selectors', () => {
  it('labels variants by their option values', () => {
    const shoes = products.find((p) => p.id === 'cloudstep-running-shoes')!;
    const v = findVariant(shoes, { Color: 'blue', Size: '9' })!;
    expect(variantLabel(shoes, v)).toBe('Ocean Blue · US 9');
  });

  it('computes a price range across variants', () => {
    const bottle = products.find((p) => p.id === 'hearth-stainless-bottle')!;
    expect(priceRange(bottle)).toEqual({ min: 2499, max: 3399 });
  });
});
