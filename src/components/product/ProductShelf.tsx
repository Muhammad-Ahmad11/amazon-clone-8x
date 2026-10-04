import { useId } from 'react';
import type { Product } from '../../data/types';
import { Rail } from '../ui/Rail';
import { SectionHeader } from '../ui/SectionHeader';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { ProductCard } from './ProductCard';

interface ProductShelfProps {
  title: string;
  description?: string;
  action?: { to: string; label: string };
  /** null while loading: the shelf shows card-shaped skeletons so the page doesn't jump. */
  products: Product[] | null;
  /** Number of skeleton cards; matches the expected shelf size. */
  placeholderCount?: number;
}

const ITEM = 'w-[44%] sm:w-[30%] md:w-[23%]';
const COLUMNS = 'lg:grid-cols-6';

/** A titled row of product cards. Renders nothing if there is nothing to show (no empty shelves). */
export function ProductShelf({ title, description, action, products, placeholderCount = 6 }: ProductShelfProps) {
  const headingId = useId();
  if (products && products.length === 0) return null;

  return (
    <section aria-labelledby={headingId} aria-busy={products ? undefined : true}>
      <SectionHeader id={headingId} title={title} description={description} action={action} />
      <Rail itemClassName={ITEM} columnsClassName={COLUMNS} label={title}>
        {products
          ? products.map((p) => <ProductCard key={p.id} product={p} />)
          : Array.from({ length: placeholderCount }, (_, i) => <ProductCardSkeleton key={i} />)}
      </Rail>
    </section>
  );
}
