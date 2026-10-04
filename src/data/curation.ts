/*
  Picks products for the homepage shelves from real catalogue fields (discounts, sales, ratings),
  so nothing on the homepage is hand-placed or invented.
*/
import { discountPercent } from '../lib/money';
import { getVariant, isInStock } from './selectors';
import type { CategoryId, Product } from './types';

/** Queries that match the catalogue; shown in the hero, the empty search box and the no-results page. */
export const POPULAR_SEARCHES: readonly string[] = ['headphones', 'water bottle', 'backpack', 'yoga mat', 'thriller'];

/** Percent off for the variant a shopper sees first. */
export function defaultDiscount(product: Product): number {
  const v = getVariant(product);
  return discountPercent(v.price, v.listPrice);
}

/** Rating weighted by how many people rated it, so 4.9 from 50 reviews doesn't outrank 4.7 from 20,000. */
export function popularity(product: Product): number {
  return product.rating * Math.log10(product.reviewCount + 1);
}

/** Keeps sorted order but allows at most `perCategory` products from any one category. */
function mixCategories(sorted: Product[], limit: number, perCategory: number): Product[] {
  const counts = new Map<CategoryId, number>();
  const picked: Product[] = [];
  for (const p of sorted) {
    const n = counts.get(p.category) ?? 0;
    if (n >= perCategory) continue;
    counts.set(p.category, n + 1);
    picked.push(p);
    if (picked.length === limit) break;
  }
  return picked;
}

interface ShelfOptions {
  limit?: number;
  perCategory?: number;
  exclude?: ReadonlySet<string>;
}

/** Biggest real discounts on in-stock products. */
export function todaysDeals(products: Product[], { limit = 6, perCategory = 2, exclude }: ShelfOptions = {}): Product[] {
  const sorted = products
    .filter((p) => isInStock(p) && defaultDiscount(p) > 0 && !exclude?.has(p.id))
    .sort((a, b) => defaultDiscount(b) - defaultDiscount(a) || popularity(b) - popularity(a));
  return mixCategories(sorted, limit, perCategory);
}

/** Most bought last month, then most popular. */
export function bestSellers(products: Product[], { limit = 6, perCategory = 2, exclude }: ShelfOptions = {}): Product[] {
  const sorted = products
    .filter((p) => isInStock(p) && !exclude?.has(p.id))
    .sort((a, b) => (b.boughtLastMonth ?? 0) - (a.boughtLastMonth ?? 0) || popularity(b) - popularity(a));
  return mixCategories(sorted, limit, perCategory);
}

/**
 * "Related" without a recommendation engine: the same kind of product first (other headphones for headphones),
 * then the most popular items from the same category.
 */
export function relatedProducts(products: Product[], product: Product, limit = 6): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category && isInStock(p))
    .sort((a, b) => Number(b.type === product.type) - Number(a.type === product.type) || popularity(b) - popularity(a))
    .slice(0, limit);
}

export interface CategoryHighlight {
  /** Product type, e.g. "Headphones"; used as the tile caption and search query. */
  type: string;
  product: Product;
}

/** The most popular product of each distinct type in a category, for the 2×2 tiles on category cards. */
export function categoryHighlights(products: Product[], category: CategoryId, limit = 4): CategoryHighlight[] {
  const best = new Map<string, Product>();
  for (const p of products) {
    if (p.category !== category) continue;
    const current = best.get(p.type);
    if (!current || popularity(p) > popularity(current)) best.set(p.type, p);
  }
  return [...best]
    .map(([type, product]) => ({ type, product }))
    .sort((a, b) => popularity(b.product) - popularity(a.product))
    .slice(0, limit);
}
