import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../data/types';
import { CatalogError, fetchProduct } from './catalog';

export type ProductState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; product: Product };

/** Loads one product. Mount it with key={productId} so switching products starts from a clean loading state. */
export function useProduct(productId: string): { state: ProductState; retry: () => void } {
  const [state, setState] = useState<ProductState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProduct(productId)
      .then((product) => !cancelled && setState(product ? { status: 'ready', product } : { status: 'not-found' }))
      .catch((e: unknown) => !cancelled && setState({ status: 'error', message: e instanceof CatalogError ? e.message : 'Something went wrong.' }));
    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
