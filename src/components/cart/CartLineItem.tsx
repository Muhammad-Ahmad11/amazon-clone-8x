import { Link } from 'react-router';
import { getVariant } from '../../data/selectors';
import { formatMoney } from '../../lib/money';
import { productUrl } from '../../lib/routes';
import { describeVariant } from '../../lib/variants';
import { MAX_PER_LINE, type ResolvedLine } from '../../state/cart';
import { LOW_STOCK } from '../product/BuyBox';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { Price } from '../ui/Price';
import { ProductImage } from '../ui/ProductImage';
import { QuantityStepper } from '../ui/QuantityStepper';

/** "Colour: Navy · Capacity: 32 oz" — only the options that were real choices. */
export function variantDescription({ product, variant }: Pick<ResolvedLine, 'product' | 'variant'>): string {
  return product && variant ? describeVariant(product, variant) : '';
}

interface CartLineItemProps {
  item: ResolvedLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  /** Called when + is pressed at the limit, so the page can announce it. */
  onLimit: () => void;
}

/**
 * One cart line: image, title, the chosen options, stock, price, quantity and Remove.
 * Lines that can't be bought as they are (too many, sold out, gone) explain the problem and offer the fix.
 */
export function CartLineItem({ item, onQuantity, onRemove, onLimit }: CartLineItemProps) {
  const { line, product, variant, status, limit } = item;
  const options = variantDescription(item);
  const title = product?.title ?? 'Item no longer available';
  const href = product && variant ? `${productUrl(product.id)}?variant=${encodeURIComponent(variant.id)}` : undefined;
  const buyable = status === 'ok' || status === 'exceeds-stock';
  const atLimit = status === 'ok' && line.quantity >= limit;
  // If only the variant is gone, the product's own image still helps the shopper recognise the line.
  const image = variant?.images[0] ?? (product ? getVariant(product).images[0] : undefined);

  return (
    <article className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-x-5">
      <div className="row-span-2 sm:row-span-3">
        {image ? (
          <ProductImage src={image} alt={`${title}${options ? `, ${options}` : ''}`} className={buyable ? 'rounded-lg' : 'rounded-lg opacity-50 grayscale'} />
        ) : (
          <div className="grid aspect-square place-items-center rounded-lg bg-canvas text-ink-subtle" role="img" aria-label="No image: item no longer available">
            <Icon name="package" size={32} strokeWidth={1.4} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] leading-5 font-medium sm:text-base sm:leading-6">
          {href ? (
            <Link to={href} className="hover:text-link-hover hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {options && <p className="mt-0.5 text-[13px] text-ink-muted">{options}</p>}
        {status === 'ok' && (
          <p className={`mt-1 flex items-center gap-1 text-[13px] font-medium ${variant!.stock <= LOW_STOCK ? 'text-warning' : 'text-success'}`}>
            <Icon name={variant!.stock <= LOW_STOCK ? 'alert' : 'check'} size={14} />
            {variant!.stock <= LOW_STOCK ? `Only ${variant!.stock} left in stock` : 'In stock'}
          </p>
        )}
      </div>

      {/* Price: under the title on phones, its own column from sm up. */}
      <div className="col-start-2 sm:col-start-3 sm:row-start-1 sm:text-right">
        {variant && buyable ? (
          <>
            <Price cents={variant.price * line.quantity} size="md" />
            {line.quantity > 1 && <p className="text-[13px] text-ink-muted">{formatMoney(variant.price)} each</p>}
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">Not included in total</p>
        )}
      </div>

      <div className="col-span-2 flex flex-col gap-2 sm:col-span-2 sm:col-start-2">
        {status === 'exceeds-stock' && (
          <Notice
            tone="warning"
            action={
              <Button size="sm" variant="secondary" onClick={() => onQuantity(limit)}>
                Change to {limit}
              </Button>
            }
          >
            Only {limit} {limit === 1 ? 'is' : 'are'} available. You have {line.quantity} in your cart.
          </Notice>
        )}
        {status === 'unavailable' && (
          <Notice tone="error">
            <span className="font-semibold">Currently unavailable.</span> This option has sold out.{' '}
            {product && (
              <Link to={productUrl(product.id)} className="link">
                Choose another option
              </Link>
            )}
          </Notice>
        )}
        {status === 'missing' && (
          <Notice tone="error">
            <span className="font-semibold">No longer available.</span>{' '}
            {product ? (
              <>
                The option you chose isn’t sold any more.{' '}
                <Link to={productUrl(product.id)} className="link">
                  Choose another option
                </Link>
              </>
            ) : (
              'This item is no longer sold here, so it can’t be bought.'
            )}
          </Notice>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {buyable && (
            <QuantityStepper
              value={line.quantity}
              onChange={onQuantity}
              onRemove={onRemove}
              onLimit={onLimit}
              min={1}
              max={Math.max(limit, status === 'exceeds-stock' ? line.quantity : 1)}
              itemLabel={`${title}${options ? `, ${options}` : ''}`}
            />
          )}
          <Button variant="ghost" size="sm" className="h-10 sm:h-8" onClick={onRemove} icon={<Icon name="trash" size={16} />} aria-label={`Remove ${title}${options ? `, ${options}` : ''} from cart`} data-remove-for={line.variantId}>
            Remove
          </Button>
        </div>
        {atLimit && (
          <p className="flex items-center gap-1 text-[13px] text-ink-muted">
            <Icon name="info" size={14} />
            {limit < MAX_PER_LINE ? `That’s all we have: only ${limit} in stock.` : `Limit of ${MAX_PER_LINE} per item.`}
          </p>
        )}
      </div>
    </article>
  );
}
