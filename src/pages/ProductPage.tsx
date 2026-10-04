import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useProduct } from '../api/useProduct';
import { useProducts } from '../api/useProducts';
import { AddedToCartToast, type AddedNotice } from '../components/product/AddedToCartToast';
import { BuyBox } from '../components/product/BuyBox';
import { ImageGallery, type GalleryImage } from '../components/product/ImageGallery';
import { ProductDetails } from '../components/product/ProductDetails';
import { ProductShelf } from '../components/product/ProductShelf';
import { ReviewsSummary } from '../components/product/ReviewsSummary';
import { VariantPicker } from '../components/product/VariantPicker';
import { ProductBadge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Price, PriceBlock } from '../components/ui/Price';
import { Skeleton } from '../components/ui/Skeleton';
import { StarRating } from '../components/ui/StarRating';
import { relatedProducts } from '../data/curation';
import { getCategory, getVariant, optionValueLabel } from '../data/selectors';
import type { OptionName, Product, Variant } from '../data/types';
import { compactNumber } from '../lib/format';
import { searchUrl } from '../lib/routes';
import { useInView } from '../lib/useInView';
import { changedOptions, choosableOptions, type ValueChoice } from '../lib/variants';
import { addToCart, MAX_PER_LINE } from '../state/cart';

/** /dp/:productId — keyed by id so moving to a related product starts from a clean loading state. */
export function ProductPage() {
  const { productId = '' } = useParams();
  return <ProductLoader key={productId} productId={productId} />;
}

function ProductLoader({ productId }: { productId: string }) {
  const { state, retry } = useProduct(productId);

  if (state.status === 'loading') return <ProductSkeleton />;
  if (state.status === 'ready') return <ProductView product={state.product} />;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-canvas py-10 focus:outline-none">
      <title>{state.status === 'not-found' ? 'Product not found · Amazon Clone' : 'Product didn’t load · Amazon Clone'}</title>
      <Container className="max-w-2xl">
        <div className="rounded-card bg-surface" role={state.status === 'error' ? 'alert' : undefined}>
          {state.status === 'not-found' ? (
            <EmptyState
              icon="package"
              headingLevel={1}
              title="We can’t find that product"
              description="The link may be out of date, or the product isn’t sold here any more. Try a search, or browse everything we have."
              actions={
                <>
                  <ButtonLink to={searchUrl()}>Browse all products</ButtonLink>
                  <ButtonLink to="/" variant="secondary">
                    Go to homepage
                  </ButtonLink>
                </>
              }
            />
          ) : (
            <EmptyState
              icon="alert"
              headingLevel={1}
              title="This product didn’t load"
              description={`${state.message} Check your connection and try again.`}
              actions={
                <>
                  <Button icon={<Icon name="refresh" size={16} />} onClick={retry}>
                    Try again
                  </Button>
                  <ButtonLink to={searchUrl()} variant="secondary">
                    Keep shopping
                  </ButtonLink>
                </>
              }
            />
          )}
        </div>
      </Container>
    </main>
  );
}

const VIEW_NAMES = ['', 'angled view', 'close-up', ''];

function galleryImages(product: Product, variant: Variant): GalleryImage[] {
  const colour = product.options.find((o) => o.name === 'Color' && o.values.length > 1) ? optionValueLabel(product, 'Color', variant.options.Color) : undefined;
  const name = colour ? `${product.title}, ${colour}` : product.title;
  return variant.images.map((src, i) => ({
    src,
    alt: i === 3 ? `Key features: ${product.callouts.join('; ')}` : i === 0 ? name : `${name}, ${VIEW_NAMES[i]}`,
  }));
}

function ProductView({ product }: { product: Product }) {
  const [params, setParams] = useSearchParams();
  const variant = getVariant(product, params.get('variant'));
  const category = getCategory(product.category);
  const choiceName = choosableOptions(product)
    .map((o) => optionValueLabel(product, o.name, variant.options[o.name]))
    .filter(Boolean)
    .join(' · ');

  const [requestedQty, setRequestedQty] = useState(1);
  const quantity = Math.max(1, Math.min(requestedQty, MAX_PER_LINE, variant.stock || 1));
  const [switchNote, setSwitchNote] = useState('');
  const [notice, setNotice] = useState<AddedNotice | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [addButton, addButtonInView] = useInView<HTMLButtonElement>();

  useEffect(() => {
    if (!justAdded) return;
    const t = window.setTimeout(() => setJustAdded(false), 2000);
    return () => window.clearTimeout(t);
  }, [justAdded, notice]);

  const all = useProducts();
  const related = useMemo(
    () => (all.state.status === 'ready' ? relatedProducts(all.state.products, product) : all.state.status === 'error' ? [] : null),
    [all.state, product],
  );

  function selectChoice(choice: ValueChoice, optionName: OptionName) {
    const target = choice.target;
    if (!target || target === variant) return;
    // If the pick forced another option to change, say so instead of switching silently.
    const changed = changedOptions(product, variant, target, optionName);
    setSwitchNote(
      changed.length
        ? `${choice.value.label} isn’t available in ${changed.map((o) => optionValueLabel(product, o.name, variant.options[o.name])).join(' / ')}, so we switched to ${changed
            .map((o) => optionValueLabel(product, o.name, target.options[o.name]))
            .join(' / ')}.`
        : '',
    );
    // The variant lives in the URL, so a shared link opens the same option. Replace, not push: Back leaves the product.
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('variant', target.id);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  function handleAdd() {
    if (variant.stock === 0) return;
    const result = addToCart(product, variant, quantity);
    setNotice({ id: Date.now(), title: product.title, variant, variantName: choiceName, requested: quantity, ...result });
    if (result.added > 0) setJustAdded(true);
  }

  const available = variant.stock > 0;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pb-28 focus:outline-none lg:pb-12">
      <title>{`${product.title} · Amazon Clone`}</title>
      <Container className="pt-3 sm:pt-5">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-muted">
            <li>
              <Link to="/" className="link inline-flex min-h-6 items-center">Home</Link>
            </li>
            <li aria-hidden="true"><Icon name="chevron-right" size={14} /></li>
            <li>
              <Link to={searchUrl({ category: product.category })} className="link inline-flex min-h-6 items-center">{category.name}</Link>
            </li>
            <li aria-hidden="true"><Icon name="chevron-right" size={14} /></li>
            <li>
              <Link to={searchUrl({ k: product.type, category: product.category })} className="link inline-flex min-h-6 items-center">{product.type}</Link>
            </li>
          </ol>
        </nav>

        <div className="mt-3 grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
          {/* Title first in the DOM (and on phones); beside the gallery from lg up. */}
          <div className="lg:col-start-2 lg:row-start-1">
            <Link to={searchUrl({ k: product.brand })} className="link inline-flex min-h-6 items-center text-sm">
              More from {product.brand}
            </Link>
            <h1 className="mt-1 text-lg leading-6 font-semibold tracking-tight sm:text-2xl sm:leading-8">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <a href="#reviews" className="inline-flex min-h-6 items-center rounded hover:underline">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} compact={false} />
              </a>
              {product.badges.map((b) => (
                <ProductBadge key={b} kind={b} />
              ))}
            </div>
            {product.boughtLastMonth && (
              <p className="mt-1.5 text-[13px] text-ink-muted">
                <span className="font-semibold text-ink">{compactNumber(product.boughtLastMonth)}+ bought</span> in the past month
              </p>
            )}
          </div>

          {/* Tablets: cap the gallery so a square image doesn't push price and Add to cart a screen down. */}
          <div className="w-full md:mx-auto md:max-w-[520px] lg:sticky lg:top-[76px] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-start">
            <ImageGallery key={variant.images[0]} images={galleryImages(product, variant)} label="Product images" />
          </div>

          <div className="flex flex-col gap-5 lg:col-start-2 lg:row-start-2">
            <div className="border-t border-line-soft pt-4">
              <PriceBlock price={variant.price} listPrice={variant.listPrice} size="lg" />
            </div>

            <VariantPicker product={product} selected={variant} onSelect={selectChoice} />
            <p role="status" className="-mt-2 text-[13px] text-ink-muted empty:hidden">
              {switchNote}
            </p>

            <BuyBox
              variant={variant}
              variantName={choiceName}
              productTitle={product.title}
              quantity={quantity}
              onQuantityChange={setRequestedQty}
              onAdd={handleAdd}
              justAdded={justAdded}
              addButtonRef={addButton}
            />

            <section aria-labelledby="highlights-heading">
              <h2 id="highlights-heading" className="text-base font-bold">
                Why you’ll love it
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {product.callouts.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-[15px]">
                    <Icon name="check" size={18} className="mt-0.5 shrink-0 text-success" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-10 border-t border-line-soft pt-8">
          <ProductDetails product={product} />
          <ReviewsSummary product={product} />
          <ProductShelf
            title="Related products"
            description={`More ${product.type.toLowerCase()} and popular picks in ${category.name}`}
            action={{ to: searchUrl({ category: product.category }), label: 'See all' }}
            products={related}
            placeholderCount={6}
          />
        </div>
      </Container>

      {/* Phones: when the main button is off screen, keep Add to cart one tap away. */}
      {available && !addButtonInView && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-overlay backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <Price cents={variant.price} size="md" />
              {choiceName && <p className="truncate text-xs text-ink-muted">{choiceName}</p>}
            </div>
            <Button onClick={handleAdd} className="shrink-0" aria-label={`Add ${quantity} to cart: ${product.title}${choiceName ? `, ${choiceName}` : ''}`}>
              {justAdded ? 'Added' : 'Add to cart'}
            </Button>
          </div>
        </div>
      )}

      <AddedToCartToast notice={notice} onClose={() => setNotice(null)} />
    </main>
  );
}

function ProductSkeleton() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pb-12 focus:outline-none" aria-busy="true" aria-label="Loading product">
      <Container className="pt-3 sm:pt-5">
        <Skeleton className="h-4 w-56" />
        <div className="mt-4 grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-tile" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-9 w-40" />
            <div className="mt-2 flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 w-[84px] rounded-lg" />
              ))}
            </div>
            <Skeleton className="mt-2 h-56 w-full rounded-card" />
          </div>
        </div>
      </Container>
    </main>
  );
}
