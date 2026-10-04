import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useProducts } from '../api/useProducts';
import { ProductCard } from '../components/product/ProductCard';
import { ActiveFilters } from '../components/search/ActiveFilters';
import { FilterDrawer } from '../components/search/FilterDrawer';
import { NoResults } from '../components/search/NoResults';
import { SearchFilters, type FilterPatch } from '../components/search/SearchFilters';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { SelectField } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { getCategory } from '../data/selectors';
import { pluralize } from '../lib/format';
import { hasFilters, parseSearchParams, searchUrl, SORT_KEYS, type SearchQuery, type SortKey } from '../lib/routes';
import { partialMatches, searchProducts } from '../lib/search';

const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevance',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Customer rating',
  bestsellers: 'Best sellers',
};

function heading(q: SearchQuery): string {
  if (q.k) return `Results for “${q.k}”`;
  if (q.category) return getCategory(q.category).name;
  if (q.deals) return 'Today’s deals';
  return 'All products';
}

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5';

/**
 * /s — search results. The URL is the only source of truth for query, filters and sort:
 * every change navigates to a new URL, so refresh, back/forward and shared links reproduce the page.
 */
export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = useMemo(() => parseSearchParams(params), [params]);
  const { state, retry } = useProducts();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const result = useMemo(() => (state.status === 'ready' ? searchProducts(state.products, query) : null), [state, query]);
  const partial = useMemo(
    () => (state.status === 'ready' && result && result.matchedCount === 0 && query.k ? partialMatches(state.products, query.k) : []),
    [state, result, query.k],
  );

  const update = (patch: Partial<SearchQuery>) => navigate(searchUrl({ ...query, ...patch }));
  const applyFilter = (patch: FilterPatch) => update(patch);
  const clearFilters = () => navigate(searchUrl({ k: query.k, sort: query.sort }));
  const filtered = hasFilters(query);
  // When the words themselves match nothing, filters and sort can't help; hide them instead of showing a wall of zeros.
  const noMatches = result?.matchedCount === 0;
  const filterCount = [query.category, query.min ?? query.max, query.rating, query.deals || undefined].filter((v) => v !== undefined).length;

  const filters = <SearchFilters query={query} facets={result?.facets ?? null} onChange={applyFilter} />;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pb-12 focus:outline-none">
      <title>{`${query.k ? `“${query.k}”` : heading(query)} · Amazon Clone`}</title>
      <Container className="pt-4 sm:pt-6">
        <div className={noMatches ? undefined : 'lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8'}>
          {/* Desktop: a short sidebar. Below lg the same filters live in a drawer. */}
          {!noMatches && (
            <aside aria-label="Filters" className="sticky top-[76px] hidden max-h-[calc(100dvh-92px)] overflow-y-auto rounded-card bg-surface p-4 lg:block">
              {filters}
            </aside>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <h1 className="text-xl leading-7 font-bold break-words sm:text-2xl sm:leading-8">{heading(query)}</h1>
                <p className="mt-0.5 text-sm text-ink-muted" aria-live="polite">
                  {result ? pluralize(result.products.length, 'result') : state.status === 'loading' ? 'Loading results…' : ''}
                </p>
              </div>
              <div className={noMatches ? 'hidden' : 'flex w-full items-center gap-2 sm:w-auto'}>
                <Button variant="secondary" icon={<Icon name="filter" size={16} />} onClick={() => setDrawerOpen(true)} className="lg:hidden" aria-haspopup="dialog">
                  Filters{filterCount > 0 && <span className="rounded-full bg-nav-2 px-1.5 text-xs leading-5 text-white">{filterCount}</span>}
                </Button>
                <SelectField
                  label="Sort by"
                  layout="inline"
                  value={query.sort}
                  onChange={(e) => update({ sort: e.target.value as SortKey })}
                  containerClassName="ml-auto min-w-0"
                  className="h-10 text-sm"
                >
                  {SORT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key === 'relevance' && !query.k ? 'Featured' : SORT_LABELS[key]}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="mt-3 empty:hidden">
              <ActiveFilters query={query} onChange={applyFilter} onClearAll={clearFilters} />
            </div>

            <div className="mt-4">
              {state.status === 'error' ? (
                <div role="alert" className="rounded-card bg-surface">
                  <EmptyState
                    icon="alert"
                    title="Results didn’t load"
                    description={`${state.message} Check your connection and try again.`}
                    actions={
                      <Button icon={<Icon name="refresh" size={16} />} onClick={retry}>
                        Try again
                      </Button>
                    }
                  />
                </div>
              ) : !result ? (
                <div className={GRID} aria-busy="true" aria-label="Loading results">
                  {Array.from({ length: 8 }, (_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : result.products.length === 0 ? (
                <div className="rounded-card bg-surface">
                  <NoResults query={query.k} matchedCount={filtered ? result.matchedCount : 0} partial={partial} onClearFilters={clearFilters} />
                </div>
              ) : (
                <>
                  <h2 className="sr-only">Results</h2>
                  <ol className={GRID} aria-label="Search results">
                    {result.products.map((p) => (
                      <li key={p.id}>
                        <ProductCard product={p} />
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={result?.products.length ?? null}
        onClearAll={filtered ? clearFilters : undefined}
      >
        {filters}
      </FilterDrawer>
    </main>
  );
}
