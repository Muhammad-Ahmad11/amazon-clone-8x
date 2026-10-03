/*
  Catalogue access layer.

  The data is local, but pages talk to it through async functions with a small, realistic delay.
  That keeps loading/error states honest and gives one seam to swap in a real API later.

  Dev/QA switches (URL query on any page):
    ?simulate=slow   -> 2.5s latency
    ?simulate=error  -> every catalogue request fails
*/
import { products, productsById } from '../data/products';
import type { Product } from '../data/types';

export class CatalogError extends Error {
  constructor(message = 'We couldn’t load products right now.') {
    super(message);
    this.name = 'CatalogError';
  }
}

function simulateMode(): 'slow' | 'error' | null {
  if (typeof window === 'undefined') return null;
  const mode = new URLSearchParams(window.location.search).get('simulate');
  return mode === 'slow' || mode === 'error' ? mode : null;
}

async function respond<T>(value: T): Promise<T> {
  const mode = simulateMode();
  const delay = mode === 'slow' ? 2500 : import.meta.env.MODE === 'test' ? 0 : 180 + Math.random() * 220;
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (mode === 'error') throw new CatalogError();
  return value;
}

export function fetchProducts(): Promise<Product[]> {
  return respond(products);
}

/** Resolves to null (not an error) when the product does not exist, so pages can show a 404 state. */
export function fetchProduct(id: string): Promise<Product | null> {
  return respond(productsById.get(id) ?? null);
}
