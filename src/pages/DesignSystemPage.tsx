import { useEffect, useState, type ReactNode } from 'react';
import { CatalogError, fetchProducts } from '../api/catalog';
import { Badge, ProductBadge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Checkbox, SelectField, TextField } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Notice } from '../components/ui/Notice';
import { DiscountTag, ListPrice, Price, PriceBlock } from '../components/ui/Price';
import { ProductImage } from '../components/ui/ProductImage';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { StarRating } from '../components/ui/StarRating';
import { categories } from '../data/products';
import { getVariant } from '../data/selectors';
import type { Product } from '../data/types';

/*
  Living reference for the design system and the local catalogue.
  Not part of the shopping journey; kept as a QA aid (try ?simulate=slow or ?simulate=error).
*/

const swatches: Array<[string, string]> = [
  ['nav', '#131921'], ['nav-2', '#232f3e'], ['nav-3', '#37475a'], ['ink', '#0f1111'], ['ink-muted', '#565959'],
  ['canvas', '#eaeded'], ['line', '#d5d9d9'], ['brand', '#ffd814'], ['accent', '#ffa41c'], ['search', '#febd69'],
  ['cart-count', '#f08804'], ['link', '#2162a1'], ['focus', '#007185'], ['success', '#0b7b3c'], ['deal', '#cc0c39'], ['star', '#de7921'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function CatalogPreview() {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; products: Product[] }>({
    status: 'loading',
  });

  const load = () => {
    setState({ status: 'loading' });
    fetchProducts()
      .then((products) => setState({ status: 'ready', products }))
      .catch((e: unknown) => setState({ status: 'error', message: e instanceof CatalogError ? e.message : 'Something went wrong.' }));
  };
  useEffect(load, []);

  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 10 }, (_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <EmptyState
        icon="alert"
        title="Products didn’t load"
        description={`${state.message} Check your connection and try again.`}
        actions={<Button icon={<Icon name="refresh" size={16} />} onClick={load}>Try again</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {categories.map((c) => {
        const items = state.products.filter((p) => p.category === c.id);
        return (
          <div key={c.id}>
            <h3 className="mb-3 font-bold">
              {c.name} <span className="font-normal text-ink-muted">· {items.length} products</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((p) => {
                const v = getVariant(p);
                const colors = p.options.find((o) => o.name === 'Color')?.values ?? [];
                return (
                  <article key={p.id} className="flex flex-col gap-2 rounded-card border border-line-soft p-3">
                    <ProductImage src={v.images[0]!} alt={p.title} className="rounded-lg" />
                    <div className="grid grid-cols-3 gap-1">
                      {v.images.slice(1).map((src) => <ProductImage key={src} src={src} alt="" className="rounded" />)}
                    </div>
                    <p className="line-clamp-2 text-[13px] leading-[18px]">{p.title}</p>
                    <StarRating rating={p.rating} reviewCount={p.reviewCount} size={13} className="text-xs" />
                    <PriceBlock price={v.price} listPrice={v.listPrice} size="sm" />
                    {colors.length > 1 && (
                      <div className="flex gap-1" aria-label="Colours">
                        {colors.map((cv) => (
                          <span key={cv.id} title={cv.label} className="size-4 rounded-full border border-line" style={{ background: cv.swatch }} />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DesignSystemPage() {
  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState(false);

  return (
    <main className="min-h-dvh bg-canvas pb-16">
      <header className="bg-nav text-white">
        <Container className="flex h-14 items-center justify-between">
          <span className="font-bold">Design system</span>
          <ButtonLink to="/" variant="secondary" size="sm">Back</ButtonLink>
        </Container>
      </header>

      <Container className="mt-6 flex flex-col gap-4">
        <Section title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {swatches.map(([name, hex]) => (
              <div key={name} className="text-xs">
                <div className="h-12 rounded-lg border border-line" style={{ background: hex }} />
                <p className="mt-1 font-semibold">{name}</p>
                <p className="text-ink-muted">{hex}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">Section heading · 24/700</p>
            <p className="text-2xl leading-8">Product title on the detail page · 24/32</p>
            <p className="text-lg leading-6">Result title, list layout · 18/24</p>
            <p className="text-base">Card title · 16</p>
            <p>Body text · 14/20 — the default size across the product.</p>
            <p className="text-[13px] text-ink-muted">Secondary text · 13 muted</p>
            <a href="#typography" className="link w-fit">Text link</a>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Add to cart</Button>
            <Button variant="buy">Buy Now</Button>
            <Button variant="secondary">See options</Button>
            <Button variant="dark">Continue</Button>
            <Button variant="ghost">Save for later</Button>
            <Button loading>Placing order</Button>
            <Button disabled>Out of stock</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Proceed to checkout</Button>
          </div>
        </Section>

        <Section title="Price, rating and badges">
          <div className="flex flex-wrap items-end gap-8">
            <Price cents={12999} size="sm" />
            <Price cents={12999} />
            <Price cents={12999} size="lg" />
            <Price cents={129999} size="xl" />
            <PriceBlock price={12999} listPrice={17999} size="lg" />
            <div className="flex flex-col gap-1">
              <DiscountTag price={8999} listPrice={11999} className="text-2xl" />
              <ListPrice cents={11999} label="Typical price:" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <StarRating rating={4.6} reviewCount={18342} />
            <StarRating rating={3.2} reviewCount={41} compact={false} />
            <StarRating rating={4.9} size={20} showValue={false} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ProductBadge kind="best-seller" />
            <ProductBadge kind="top-rated" />
            <ProductBadge kind="new" />
            <ProductBadge kind="limited-deal" />
            <Badge tone="success">In stock</Badge>
            <Badge>Neutral</Badge>
          </div>
        </Section>

        <Section title="Quantity stepper">
          <div className="flex flex-wrap items-center gap-6">
            {removed ? (
              <Notice tone="success" action={<Button variant="secondary" size="sm" icon={<Icon name="undo" size={14} />} onClick={() => { setRemoved(false); setQty(1); }}>Undo</Button>}>
                Item removed from cart.
              </Notice>
            ) : (
              <QuantityStepper value={qty} onChange={setQty} onRemove={() => setRemoved(true)} itemLabel="Demo item" />
            )}
            <QuantityStepper value={3} onChange={() => undefined} size="sm" itemLabel="Small demo" />
            <QuantityStepper value={10} onChange={() => undefined} max={10} itemLabel="At max" />
          </div>
          <p className="mt-3 text-[13px] text-ink-muted">At quantity 1 the minus becomes a bin, like Amazon’s cart. Removing shows an Undo (our improvement).</p>
        </Section>

        <Section title="Form fields">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Full name" placeholder="Jane Doe" autoComplete="name" />
            <TextField label="ZIP code" defaultValue="9021" error="Enter a 5-digit ZIP code" inputMode="numeric" />
            <TextField label="Apartment, suite" optional hint="Helps the driver find you" />
            <SelectField label="State" defaultValue="">
              <option value="" disabled>Select a state</option>
              <option>California</option>
              <option>New York</option>
            </SelectField>
            <div className="flex items-end"><Checkbox label="Make this my default address" /></div>
          </div>
        </Section>

        <Section title="Notices">
          <div className="flex flex-col gap-3">
            <Notice tone="success" title="Added to cart">Aurora ANC Headphones · Midnight Black</Notice>
            <Notice tone="info">Free delivery on orders over $35.</Notice>
            <Notice tone="warning">Only 3 left in stock — order soon.</Notice>
            <Notice tone="error" title="Payment details incomplete">Enter a card number to continue.</Notice>
          </div>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon="search"
            title="No results for “qzxv”"
            description="Check the spelling, use fewer words, or browse a category."
            actions={<><Button variant="secondary">Clear filters</Button><Button>Browse all products</Button></>}
          />
        </Section>

        <Section title={`Local catalogue (${categories.length} categories)`}>
          <CatalogPreview />
        </Section>
      </Container>
    </main>
  );
}
