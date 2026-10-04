import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../data/types';
import { CatalogError, fetchProducts } from './catalog';

export type ProductsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: Product[] };

/** Loads the whole catalogue, with a retry for the error state. */
export function useProducts(): { state: ProductsState; retry: () => void } {
  const [state, setState] = useState<ProductsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((products) => !cancelled && setState({ status: 'ready', products }))
      .catch((e: unknown) => !cancelled && setState({ status: 'error', message: e instanceof CatalogError ? e.message : 'Something went wrong.' }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
