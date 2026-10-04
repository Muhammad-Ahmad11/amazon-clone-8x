import { categories } from '../data/products';
import type { CategoryId } from '../data/types';

/*
  URL builders and parsers, so every link in the app agrees on one scheme.
  Search state lives entirely in the URL, like Amazon's /s?k= (recon §2.3, §2.4), so refresh,
  back/forward and shared links all reproduce the same results:
    /s?k=<query>&category=<id>&min=<$>&max=<$>&rating=<stars>&deals=1&sort=<key>
*/

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'bestsellers';

export const SORT_KEYS: readonly SortKey[] = ['relevance', 'price-asc', 'price-desc', 'rating', 'bestsellers'];

export interface SearchQuery {
  /** Free-text query; '' browses everything. */
  k: string;
  category?: CategoryId;
  /** Price bounds in whole or decimal dollars, inclusive. */
  min?: number;
  max?: number;
  /** Minimum average rating, e.g. 4.5. */
  rating?: number;
  deals: boolean;
  sort: SortKey;
}

export const EMPTY_QUERY: SearchQuery = { k: '', deals: false, sort: 'relevance' };

/** "20", "24.5" — no trailing zeros in URLs or labels. */
function formatAmount(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function searchUrl({ k, category, min, max, rating, deals, sort }: Partial<SearchQuery> = {}): string {
  const params = new URLSearchParams();
  const query = k?.trim();
  if (query) params.set('k', query);
  if (category) params.set('category', category);
  if (min !== undefined) params.set('min', formatAmount(min));
  if (max !== undefined) params.set('max', formatAmount(max));
  if (rating !== undefined) params.set('rating', formatAmount(rating));
  if (deals) params.set('deals', '1');
  if (sort && sort !== 'relevance') params.set('sort', sort);
  const qs = params.toString();
  return qs ? `/s?${qs}` : '/s';
}

function parseAmount(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

/** Reads a search URL defensively: unknown or malformed values are dropped, never trusted. */
export function parseSearchParams(params: URLSearchParams): SearchQuery {
  const category = params.get('category');
  let min = parseAmount(params.get('min'));
  let max = parseAmount(params.get('max'));
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  const rating = parseAmount(params.get('rating'));
  const sort = params.get('sort');
  return {
    k: (params.get('k') ?? '').trim(),
    category: categories.some((c) => c.id === category) ? (category as CategoryId) : undefined,
    min,
    max,
    rating: rating !== undefined && rating > 0 && rating <= 5 ? rating : undefined,
    deals: params.get('deals') === '1',
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : 'relevance',
  };
}

/** True when any filter (not the query or sort) is applied. */
export function hasFilters(q: SearchQuery): boolean {
  return Boolean(q.category || q.min !== undefined || q.max !== undefined || q.rating !== undefined || q.deals);
}

export function productUrl(productId: string): string {
  return `/dp/${productId}`;
}
