import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { EMPTY_QUERY, type SearchQuery } from './routes';
import { displayPrice, matchScore, normalize, partialMatches, PRICE_BUCKETS, RATING_OPTIONS, searchProducts, tokenize } from './search';

const search = (q: Partial<SearchQuery>) => searchProducts(products, { ...EMPTY_QUERY, ...q });
const ids = (q: Partial<SearchQuery>) => search(q).products.map((p) => p.id);

describe('text normalisation', () => {
  it('normalises punctuation, case and accents', () => {
    expect(normalize("Children's T-Shirt — Café")).toBe('childrens t shirt cafe');
  });
  it('folds plurals', () => {
    expect(tokenize('bottles glasses accessories shoes dumbbells')).toEqual(['bottle', 'glass', 'accessory', 'shoe', 'dumbbell']);
  });
});

describe('matching and relevance', () => {
  it('finds products by type, ranking type matches first', () => {
    expect(ids({ k: 'headphones' }).slice(0, 2).sort()).toEqual(['aurora-anc-headphones', 'pulse-on-ear-headphones']);
  });

  it('matches partial words and plurals', () => {
    expect(ids({ k: 'head' })).toContain('aurora-anc-headphones');
    expect(ids({ k: 'water bottles' })).toEqual(expect.arrayContaining(['hearth-stainless-bottle', 'everyday-glass-bottle', 'trail-sport-bottle']));
  });

  it('requires every meaningful word to match, ignoring stop words', () => {
    expect(ids({ k: 'wireless mouse' })[0]).toBe('glide-wireless-mouse');
    expect(ids({ k: 'mouse for the desk' })).toEqual([]);
    expect(ids({ k: 'bag for travel' })).toContain('metro-sling-pack');
  });

  it('matches brands, authors and colours', () => {
    expect(ids({ k: 'voltix' }).length).toBeGreaterThanOrEqual(3);
    expect(ids({ k: 'mara ellison' })).toEqual(['book-tidewater']);
    expect(ids({ k: 'lilac yoga' })).toEqual(['flowline-yoga-mat']);
    // Colours match whole words only: "sun" is sunglasses, not "Sunset Orange" items.
    expect(search({ k: 'sun' }).products.every((p) => p.type === 'Accessories')).toBe(true);
  });

  it('returns nothing for nonsense, and everything for an empty query', () => {
    expect(ids({ k: 'qzxvbnmlkj' })).toEqual([]);
    expect(search({}).products).toHaveLength(products.length);
    expect(products.every((p) => matchScore(p, '') === 0)).toBe(true);
  });
});

describe('filters', () => {
  it('filters by category, price (inclusive), rating and deals', () => {
    expect(search({ category: 'books' }).products.every((p) => p.category === 'books')).toBe(true);
    const ranged = search({ min: 20, max: 50 }).products.map(displayPrice);
    expect(ranged.length).toBeGreaterThan(0);
    expect(ranged.every((c) => c >= 2000 && c <= 5000)).toBe(true);
    expect(search({ rating: 4.7 }).products.every((p) => p.rating >= 4.7)).toBe(true);
    expect(search({ deals: true }).products.every((p) => p.variants.some((v) => v.listPrice))).toBe(true);
  });

  it('counts each facet with the other filters applied but not its own', () => {
    const r = search({ k: 'bottle', category: 'sports' });
    expect(r.products.map((p) => p.id)).toEqual(['trail-sport-bottle']);
    expect(r.facets.anyCategory).toBe(3);
    expect(r.facets.category['home-kitchen']).toBe(2);
    expect(r.facets.price.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(1);
    expect(r.matchedCount).toBe(3);
  });

  it('offers price buckets and rating thresholds that each narrow the full catalogue', () => {
    const all = search({});
    expect(all.facets.price.every((n) => n > 0 && n < products.length)).toBe(true);
    expect(all.facets.rating.every((n) => n > 0 && n < products.length)).toBe(true);
    expect(PRICE_BUCKETS).toHaveLength(all.facets.price.length);
    expect(RATING_OPTIONS).toHaveLength(all.facets.rating.length);
  });
});

describe('sorting', () => {
  it('sorts by price both ways', () => {
    const asc = search({ sort: 'price-asc' }).products.map(displayPrice);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = search({ sort: 'price-desc' }).products.map(displayPrice);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it('sorts by rating, highest first', () => {
    const ratings = search({ sort: 'rating' }).products.map((p) => p.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });
});

describe('recovery for empty results', () => {
  it('suggests the words that work on their own', () => {
    expect(partialMatches(products, 'headphones qzxv')).toEqual([{ word: 'headphones', count: expect.any(Number) }]);
    expect(partialMatches(products, 'qzxv')).toEqual([]);
  });
});
