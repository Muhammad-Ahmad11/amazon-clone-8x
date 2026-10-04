/*
  Local catalogue search: matching, filtering, sorting and facet counts. Pure functions, no I/O.

  Matching: every meaningful query word must match some word in the product (AND), either exactly
  or as the start of a word ("head" -> "headphones"). Simple plural folding means "bottles" finds
  "bottle". Fields are weighted, so a product whose *type* is "Headphones" outranks one that only
  mentions headphones in a keyword.
*/
import { popularity } from '../data/curation';
import { categories } from '../data/products';
import { getVariant } from '../data/selectors';
import type { CategoryId, Product } from '../data/types';
import { discountPercent } from './money';
import type { SearchQuery, SortKey } from './routes';

const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'for', 'with', 'of', 'in', 'to', 'by']);

/** Lowercase, strip accents and apostrophes, turn punctuation into spaces: "Children's T-Shirt" -> "childrens t shirt". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Folds common English plurals so "bottles", "glasses" and "accessories" match their singulars. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(sh|ch|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean).map(stem);
}

/** Query words worth matching on: stop words are dropped unless the query is nothing but stop words. */
function queryTokens(query: string): string[] {
  const words = normalize(query).split(' ').filter(Boolean);
  const meaningful = words.filter((w) => !STOP_WORDS.has(w));
  return (meaningful.length ? meaningful : words).map(stem);
}

interface IndexedProduct {
  product: Product;
  fields: Array<{ tokens: string[]; weight: number }>;
  title: string;
  phrases: string[];
}

const categoryName = new Map(categories.map((c) => [c.id, c.name]));
const indexCache = new WeakMap<Product, IndexedProduct>();

function indexed(product: Product): IndexedProduct {
  let entry = indexCache.get(product);
  if (!entry) {
    const optionLabels = product.options.flatMap((o) => o.values.map((v) => v.label)).join(' ');
    entry = {
      product,
      fields: [
        { tokens: tokenize(product.type), weight: 5 },
        { tokens: tokenize(product.title), weight: 3 },
        { tokens: tokenize(product.brand), weight: 3 },
        { tokens: tokenize(categoryName.get(product.category) ?? ''), weight: 2 },
        { tokens: tokenize(product.keywords.join(' ')), weight: 2 },
        { tokens: tokenize(optionLabels), weight: 1 },
      ],
      title: normalize(product.title),
      phrases: [product.type, ...product.keywords].map(normalize),
    };
    indexCache.set(product, entry);
  }
  return entry;
}

/** Relevance score for a query; 0 means "does not match". */
export function matchScore(product: Product, query: string): number {
  const tokens = queryTokens(query);
  if (!tokens.length) return 0;
  const entry = indexed(product);
  let score = 0;
  for (const q of tokens) {
    let best = 0;
    for (const field of entry.fields) {
      for (const t of field.tokens) {
        // Partial words only count in meaningful fields: "sun" shouldn't find "Sunset Orange" colourways.
        const s = t === q ? field.weight : q.length >= 2 && field.weight >= 2 && t.startsWith(q) ? field.weight * 0.6 : 0;
        if (s > best) best = s;
      }
    }
    if (best === 0) return 0;
    score += best;
  }
  // Whole-phrase bonuses: "water bottle" as a phrase beats the two words found far apart.
  const phrase = normalize(query);
  if (entry.phrases.includes(phrase)) score += 6;
  else if (tokens.length > 1 && entry.title.includes(phrase)) score += 4;
  return score;
}

/* ---------------------------------------------------------------------------------------------- */
/* Filters                                                                                         */

export interface PriceBucket {
  label: string;
  min?: number;
  max?: number;
}

/** Buckets fit this catalogue's real spread ($12–$179), so each one narrows the results. */
export const PRICE_BUCKETS: readonly PriceBucket[] = [
  { label: 'Under $20', max: 20 },
  { label: '$20 to $50', min: 20, max: 50 },
  { label: '$50 to $100', min: 50, max: 100 },
  { label: '$100 & above', min: 100 },
];

/** Every product is rated 4.2–4.9, so "3 stars & up" would match everything. These thresholds actually filter. */
export const RATING_OPTIONS: readonly number[] = [4.7, 4.5];

/** The price shoppers see on the card: the default variant's. */
export function displayPrice(product: Product): number {
  return getVariant(product).price;
}

export function isDeal(product: Product): boolean {
  const v = getVariant(product);
  return discountPercent(v.price, v.listPrice) > 0;
}

type Facet = 'category' | 'price' | 'rating' | 'deals';

function inPriceRange(product: Product, min: number | undefined, max: number | undefined): boolean {
  const price = displayPrice(product);
  return (min === undefined || price >= min * 100) && (max === undefined || price <= max * 100);
}

function passes(product: Product, q: SearchQuery, skip?: Facet): boolean {
  if (skip !== 'category' && q.category && product.category !== q.category) return false;
  if (skip !== 'price' && !inPriceRange(product, q.min, q.max)) return false;
  if (skip !== 'rating' && q.rating !== undefined && product.rating < q.rating) return false;
  if (skip !== 'deals' && q.deals && !isDeal(product)) return false;
  return true;
}

export function bucketMatches(bucket: PriceBucket, q: Pick<SearchQuery, 'min' | 'max'>): boolean {
  return bucket.min === q.min && bucket.max === q.max;
}

/* ---------------------------------------------------------------------------------------------- */
/* Sorting                                                                                         */

type Scored = { product: Product; score: number };

const comparators: Record<SortKey, (a: Scored, b: Scored) => number> = {
  relevance: (a, b) => b.score - a.score || popularity(b.product) - popularity(a.product),
  'price-asc': (a, b) => displayPrice(a.product) - displayPrice(b.product) || popularity(b.product) - popularity(a.product),
  'price-desc': (a, b) => displayPrice(b.product) - displayPrice(a.product) || popularity(b.product) - popularity(a.product),
  rating: (a, b) => b.product.rating - a.product.rating || b.product.reviewCount - a.product.reviewCount,
  bestsellers: (a, b) => (b.product.boughtLastMonth ?? 0) - (a.product.boughtLastMonth ?? 0) || popularity(b.product) - popularity(a.product),
};

/* ---------------------------------------------------------------------------------------------- */
/* Search                                                                                          */

export interface Facets {
  category: Record<CategoryId, number>;
  /** Results in any category (category filter ignored). */
  anyCategory: number;
  /** Count per PRICE_BUCKETS entry, same order. */
  price: number[];
  /** Count per RATING_OPTIONS entry, same order. */
  rating: number[];
  deals: number;
}

export interface SearchResult {
  products: Product[];
  /** Products matching the text query alone, before filters. */
  matchedCount: number;
  facets: Facets;
}

export function searchProducts(products: Product[], q: SearchQuery): SearchResult {
  const matched: Scored[] = q.k
    ? products.map((product) => ({ product, score: matchScore(product, q.k) })).filter((s) => s.score > 0)
    : products.map((product) => ({ product, score: 0 }));

  const results = matched.filter((s) => passes(s.product, q)).sort(comparators[q.sort]);

  // Each facet counts results with every *other* filter applied, so the numbers say what clicking would give.
  const without = (facet: Facet) => matched.filter((s) => passes(s.product, q, facet)).map((s) => s.product);
  const byCategory = without('category');
  const byPrice = without('price');
  const byRating = without('rating');
  const category = Object.fromEntries(categories.map((c) => [c.id, byCategory.filter((p) => p.category === c.id).length])) as Record<CategoryId, number>;

  return {
    products: results.map((s) => s.product),
    matchedCount: matched.length,
    facets: {
      category,
      anyCategory: byCategory.length,
      price: PRICE_BUCKETS.map((b) => byPrice.filter((p) => inPriceRange(p, b.min, b.max)).length),
      rating: RATING_OPTIONS.map((r) => byRating.filter((p) => p.rating >= r).length),
      deals: without('deals').filter(isDeal).length,
    },
  };
}

/**
 * For a query with no matches: the individual words that would find something on their own,
 * e.g. "headphones qzxv" -> [{ word: "headphones", count: 2 }].
 */
export function partialMatches(products: Product[], query: string): Array<{ word: string; count: number }> {
  const words = normalize(query).split(' ').filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  if (words.length < 2) return [];
  return [...new Set(words)]
    .map((word) => ({ word, count: products.filter((p) => matchScore(p, word) > 0).length }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
