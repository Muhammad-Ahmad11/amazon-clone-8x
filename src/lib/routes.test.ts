import { describe, expect, it } from 'vitest';
import { hasFilters, parseSearchParams, productUrl, searchUrl, type SearchQuery } from './routes';

const parse = (qs: string) => parseSearchParams(new URLSearchParams(qs));

describe('search URLs', () => {
  it('builds URLs with only the params that are set', () => {
    expect(searchUrl()).toBe('/s');
    expect(searchUrl({ k: '  water bottle ' })).toBe('/s?k=water+bottle');
    expect(searchUrl({ k: '   ' })).toBe('/s');
    expect(searchUrl({ category: 'books', deals: true })).toBe('/s?category=books&deals=1');
    expect(searchUrl({ min: 20, max: 49.5, rating: 4.5 })).toBe('/s?min=20&max=49.5&rating=4.5');
  });

  it('leaves the default sort out of the URL', () => {
    expect(searchUrl({ sort: 'relevance' })).toBe('/s');
    expect(searchUrl({ sort: 'bestsellers' })).toBe('/s?sort=bestsellers');
  });

  it('round-trips a full query through the URL', () => {
    const q: SearchQuery = { k: 'yoga mat', category: 'sports', min: 20, max: 50, rating: 4.5, deals: true, sort: 'price-asc' };
    expect(parse(searchUrl(q).slice(3))).toEqual(q);
  });

  it('drops malformed values instead of trusting them', () => {
    expect(parse('category=toys&min=-5&max=abc&rating=9&sort=newest')).toEqual({
      k: '', category: undefined, min: undefined, max: undefined, rating: undefined, deals: false, sort: 'relevance',
    });
  });

  it('swaps a reversed price range', () => {
    const q = parse('min=80&max=20');
    expect([q.min, q.max]).toEqual([20, 80]);
  });

  it('knows when filters are applied', () => {
    expect(hasFilters(parse('k=mug&sort=rating'))).toBe(false);
    expect(hasFilters(parse('k=mug&max=20'))).toBe(true);
  });

  it('builds product URLs', () => {
    expect(productUrl('echo-buds-pro')).toBe('/dp/echo-buds-pro');
  });
});
