import { describe, expect, it } from 'vitest';
import { POPULAR_SEARCHES } from '../data/curation';
import { products } from '../data/products';
import { matchScore } from './search';
import { flattenSuggestions, suggest } from './suggest';

describe('typeahead suggestions', () => {
  it('shows popular searches for an empty box', () => {
    const s = suggest(products, '  ');
    expect(s.popular).toBe(true);
    expect(s.searches.map((x) => x.kind === 'search' && x.text)).toEqual(POPULAR_SEARCHES);
  });

  it('completes queries from real catalogue phrases, prefix matches first', () => {
    const texts = suggest(products, 'head').searches.map((x) => x.kind === 'search' && x.text);
    expect(texts[0]).toMatch(/^head/);
    expect(texts).toContain('headphones');
  });

  it('dedupes singular and plural spellings', () => {
    const texts = suggest(products, 'book').searches.map((x) => x.kind === 'search' && x.text);
    expect(texts.filter((t) => t === 'book' || t === 'books')).toHaveLength(1);
  });

  it('suggests only products that actually match, at most four', () => {
    const s = suggest(products, 'bottle');
    expect(s.products.length).toBeGreaterThan(0);
    expect(s.products.length).toBeLessThanOrEqual(4);
    expect(s.products.every((x) => x.kind === 'product' && matchScore(x.product, 'bottle') > 0)).toBe(true);
  });

  it('offers a category browse shortcut when the category name matches', () => {
    const [first] = suggest(products, 'elec').categories;
    expect(first?.kind === 'category' && first.category.id).toBe('electronics');
    expect(first?.url).toBe('/s?category=electronics');
  });

  it('offers to scope a query when matches span several categories', () => {
    const cats = suggest(products, 'bottle').categories;
    expect(cats.length).toBe(2);
    expect(cats.every((c) => c.url.includes('k=bottle') && c.url.includes('category='))).toBe(true);
  });

  it('returns nothing to suggest for nonsense', () => {
    expect(flattenSuggestions(suggest(products, 'qzxv'))).toEqual([]);
  });
});
