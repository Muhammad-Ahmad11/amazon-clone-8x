import { Link } from 'react-router';
import { getVariant } from '../../data/selectors';
import type { Product } from '../../data/types';
import { cn } from '../../lib/cn';
import { pluralize } from '../../lib/format';
import { productUrl } from '../../lib/routes';
import { ProductBadge } from '../ui/Badge';
import { PriceBlock } from '../ui/Price';
import { ProductImage } from '../ui/ProductImage';
import { StarRating } from '../ui/StarRating';

/**
 * Grid product card. Amazon's card stacks up to 12 lines (recon §2.5); we keep the ones that drive a decision:
 * image, one badge, title, rating, price with discount, and how many colours exist.
 * The whole card is one link (the title link is stretched over it), so there is one big tap target.
 */
export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const variant = getVariant(product);
  const colorCount = product.options.find((o) => o.name === 'Color')?.values.length ?? 0;
  const badge = product.badges[0];

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col gap-1.5 rounded-card bg-surface p-3 transition-shadow hover:shadow-card-hover',
        'has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus',
        className,
      )}
    >
      <div className="relative">
        <ProductImage src={variant.images[0]!} alt="" className="rounded-lg" />
        {badge && <ProductBadge kind={badge} className="absolute top-2 left-2" />}
      </div>
      <h3 className="mt-1 line-clamp-2 text-[13px] leading-[18px] sm:text-sm sm:leading-5">
        <Link to={productUrl(product.id)} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none group-hover:text-link-hover">
          {product.title}
        </Link>
      </h3>
      <StarRating rating={product.rating} reviewCount={product.reviewCount} size={14} className="text-[13px]" />
      <PriceBlock price={variant.price} listPrice={variant.listPrice} size="sm" className="mt-auto pt-1" />
      {colorCount > 1 && <p className="text-xs text-ink-muted">{pluralize(colorCount, 'colour')}</p>}
    </article>
  );
}
