import { Link } from 'react-router';
import type { CategoryHighlight } from '../../data/curation';
import { getVariant } from '../../data/selectors';
import type { Category } from '../../data/types';
import { searchUrl } from '../../lib/routes';
import { Icon } from '../ui/Icon';
import { ProductImage } from '../ui/ProductImage';
import { Skeleton } from '../ui/Skeleton';

/**
 * Amazon's 2×2 category card (recon §2.1), kept because it previews what's inside a category at a glance.
 * Each tile is a real product type in our catalogue and opens a search for it.
 */
export function CategoryCard({ category, highlights }: { category: Category; highlights: CategoryHighlight[] }) {
  return (
    <article className="flex h-full flex-col rounded-tile bg-surface p-4">
      <h3 className="text-lg leading-6 font-bold">{category.name}</h3>
      <p className="text-[13px] text-ink-muted">{category.tagline}</p>
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {highlights.map(({ type, product }) => (
          <li key={type}>
            <Link to={searchUrl({ k: type, category: category.id })} className="group block rounded-lg">
              <ProductImage src={getVariant(product).images[0]!} alt="" className="rounded-lg" />
              <span className="mt-1 block truncate text-xs text-ink group-hover:text-link-hover group-hover:underline">{type}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to={searchUrl({ category: category.id })} className="link mt-auto inline-flex min-h-10 w-fit items-center gap-0.5 pt-2 text-[13px] font-medium">
        Shop all {category.name}
        <Icon name="chevron-right" size={14} />
      </Link>
    </article>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-tile bg-surface p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3.5 w-5/6" />
      <div className="mt-2 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}
