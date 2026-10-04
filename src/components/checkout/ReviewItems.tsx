import { Link } from 'react-router';
import { formatMoney } from '../../lib/money';
import { productUrl } from '../../lib/routes';
import type { ResolvedLine } from '../../state/cart';
import { variantDescription } from '../cart/CartLineItem';
import { ProductImage } from '../ui/ProductImage';

/** Read-only list of what's being bought. Quantities are changed in the cart, so there is one place to edit them. */
export function ReviewItems({ items }: { items: ResolvedLine[] }) {
  return (
    <ul className="divide-y divide-line-soft">
      {items.map((item) => {
        const { line, product, variant } = item;
        if (!product || !variant) return null;
        const options = variantDescription(item);
        return (
          <li key={line.variantId} className="flex gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
            <ProductImage src={variant.images[0]!} alt="" className="size-16 shrink-0 rounded-lg sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium sm:text-[15px]">
                <Link to={`${productUrl(product.id)}?variant=${encodeURIComponent(variant.id)}`} className="hover:text-link-hover hover:underline">
                  {product.title}
                </Link>
              </p>
              {options && <p className="mt-0.5 text-[13px] text-ink-muted">{options}</p>}
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Qty {line.quantity}
                {line.quantity > 1 && <> · {formatMoney(variant.price)} each</>}
              </p>
            </div>
            <p className="shrink-0 text-[15px] font-semibold tabular-nums">{formatMoney(variant.price * line.quantity)}</p>
          </li>
        );
      })}
    </ul>
  );
}
