import { useId, useMemo } from 'react';
import { useProducts } from '../api/useProducts';
import { CategoryCard, CategoryCardSkeleton } from '../components/home/CategoryCard';
import { Hero } from '../components/home/Hero';
import { ProductShelf } from '../components/product/ProductShelf';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Rail } from '../components/ui/Rail';
import { SectionHeader } from '../components/ui/SectionHeader';
import { bestSellers, categoryHighlights, todaysDeals } from '../data/curation';
import { categories } from '../data/products';
import type { Product } from '../data/types';
import { searchUrl } from '../lib/routes';

function CategorySection({ products }: { products: Product[] | null }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} aria-busy={products ? undefined : true}>
      <SectionHeader id={headingId} title="Shop by category" />
      <Rail itemClassName="w-[78%] sm:w-[44%] md:w-[34%]" columnsClassName="lg:grid-cols-5" label="Categories">
        {categories.map((c) =>
          products ? <CategoryCard key={c.id} category={c} highlights={categoryHighlights(products, c.id)} /> : <CategoryCardSkeleton key={c.id} />,
        )}
      </Rail>
    </section>
  );
}

/**
 * Four modules: hero, categories, deals, best sellers. Amazon's homepage stacks 20+ cards and carousels
 * and lazy-loads more as you scroll (recon §2.1); this one is short enough to see in a few scrolls.
 * The hero renders at once; the catalogue sections show skeletons while products load.
 */
export function HomePage() {
  const { state, retry } = useProducts();
  const products = state.status === 'ready' ? state.products : null;

  const shelves = useMemo(() => {
    if (!products) return null;
    const deals = todaysDeals(products);
    // Best sellers skip anything already shown as a deal, so the two shelves never repeat a product.
    return { deals, bestSellers: bestSellers(products, { exclude: new Set(deals.map((p) => p.id)) }) };
  }, [products]);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pb-12 focus:outline-none">
      <title>Amazon Clone · Shop everyday essentials</title>
      <Container className="flex flex-col gap-8 pt-4 sm:gap-10 sm:pt-6">
        <Hero />
        {state.status === 'error' ? (
          <div role="alert" className="rounded-card bg-surface">
            <EmptyState
              icon="alert"
              title="Products didn’t load"
              description={`${state.message} Check your connection and try again. Search still works.`}
              actions={
                <Button icon={<Icon name="refresh" size={16} />} onClick={retry}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <CategorySection products={products} />
            <ProductShelf
              title="Today’s deals"
              description="The biggest discounts right now"
              action={{ to: searchUrl({ deals: true }), label: 'See all deals' }}
              products={shelves?.deals ?? null}
            />
            <ProductShelf
              title="Best sellers"
              description="What shoppers bought most last month"
              action={{ to: searchUrl({ sort: 'bestsellers' }), label: 'See all' }}
              products={shelves?.bestSellers ?? null}
            />
          </>
        )}
      </Container>
    </main>
  );
}
