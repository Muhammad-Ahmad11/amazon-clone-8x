/*
  Typeahead suggestions from the local catalogue (no external API).
  Three groups, kept short so the list is scannable:
    - searches:   query completions drawn from real product types, keywords, brands and categories
    - categories: browse a category whose name matches, or scope the query to a category it spans
    - products:   the top matches, straight to the product
*/
import { POPULAR_SEARCHES } from '../data/curation';
import { categories } from '../data/products';
import type { Category, Product } from '../data/types';
import { EMPTY_QUERY, productUrl, searchUrl } from './routes';
import { matchScore, normalize, searchProducts, tokenize } from './search';

export type Suggestion =
  | { kind: 'search'; id: string; text: string; url: string }
  | { kind: 'category'; id: string; category: Category; query: string; count: number; url: string }
  | { kind: 'product'; id: string; product: Product; url: string };

export interface Suggestions {
  /** True when the box is empty and we are showing popular searches instead of matches. */
  popular: boolean;
  searches: Suggestion[];
  categories: Suggestion[];
  products: Suggestion[];
}

const MAX_SEARCHES = 6;
const MAX_CATEGORIES = 2;
const MAX_PRODUCTS = 4;

const vocabularyCache = new WeakMap<Product[], string[]>();

/** Every phrase a shopper might type, from real catalogue fields. */
function vocabulary(products: Product[]): string[] {
  let words = vocabularyCache.get(products);
  if (!words) {
    const phrases = new Set<string>();
    for (const c of categories) phrases.add(normalize(c.name));
    for (const p of products) {
      phrases.add(normalize(p.type));
      phrases.add(normalize(p.brand));
      for (const k of p.keywords) phrases.add(normalize(k));
    }
    words = [...phrases].filter(Boolean);
    vocabularyCache.set(products, words);
  }
  return words;
}

const searchSuggestion = (text: string): Suggestion => ({ kind: 'search', id: `s:${text}`, text, url: searchUrl({ k: text }) });

export function suggest(products: Product[], rawQuery: string): Suggestions {
  const q = normalize(rawQuery);
  if (!q) return { popular: true, searches: POPULAR_SEARCHES.map(searchSuggestion), categories: [], products: [] };

  // Completions: phrases that start with the query, or contain a word starting with it.
  const counts = new Map<string, number>();
  const countFor = (phrase: string) => {
    if (!counts.has(phrase)) counts.set(phrase, products.filter((p) => matchScore(p, phrase) > 0).length);
    return counts.get(phrase)!;
  };
  const seen = new Set<string>();
  const searches = vocabulary(products)
    .filter((phrase) => phrase.startsWith(q) || phrase.includes(` ${q}`))
    .filter((phrase) => countFor(phrase) > 0)
    .sort((a, b) => Number(b.startsWith(q)) - Number(a.startsWith(q)) || countFor(b) - countFor(a) || a.length - b.length)
    .filter((phrase) => {
      // "book" and "books" are the same search; keep the first (best-ranked) spelling.
      const key = tokenize(phrase).join(' ');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SEARCHES)
    .map(searchSuggestion);

  const results = searchProducts(products, { ...EMPTY_QUERY, k: rawQuery });

  // Categories: a matching category name is a browse shortcut; otherwise offer to scope the query.
  const named = categories.filter((c) => normalize(c.name).startsWith(q) || normalize(c.name).includes(` ${q}`));
  const categorySuggestions: Suggestion[] = named.length
    ? named.map((c) => ({ kind: 'category', id: `c:${c.id}`, category: c, query: '', count: results.facets.category[c.id], url: searchUrl({ category: c.id }) }))
    : categories
        .filter((c) => results.facets.category[c.id] > 0)
        .sort((a, b) => results.facets.category[b.id] - results.facets.category[a.id])
        .map((c) => ({
          kind: 'category' as const,
          id: `c:${c.id}`,
          category: c,
          query: rawQuery.trim(),
          count: results.facets.category[c.id],
          url: searchUrl({ k: rawQuery, category: c.id }),
        }));
  // Scoping only helps when the matches span more than one category.
  const scoped = named.length || categorySuggestions.length > 1 ? categorySuggestions.slice(0, MAX_CATEGORIES) : [];

  return {
    popular: false,
    searches,
    categories: scoped,
    products: results.products.slice(0, MAX_PRODUCTS).map((product) => ({ kind: 'product', id: `p:${product.id}`, product, url: productUrl(product.id) })),
  };
}

/** Flattened in display order, for keyboard navigation. */
export function flattenSuggestions(s: Suggestions): Suggestion[] {
  return [...s.searches, ...s.categories, ...s.products];
}
