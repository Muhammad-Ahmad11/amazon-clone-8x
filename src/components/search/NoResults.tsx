import { POPULAR_SEARCHES } from '../../data/curation';
import { categories } from '../../data/products';
import { searchUrl } from '../../lib/routes';
import { Button, ButtonLink } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SearchChip } from './SearchChip';

interface NoResultsProps {
  query: string;
  /** Results the text query has before filters; > 0 means the filters are what emptied the page. */
  matchedCount: number;
  /** Words from a multi-word query that would find something on their own. */
  partial: Array<{ word: string; count: number }>;
  onClearFilters: () => void;
}

/**
 * Amazon fills a no-results page with sponsored products and never says nothing matched (recon §2.4, screenshot 21).
 * We say so plainly and offer real ways forward. No filler products.
 */
export function NoResults({ query, matchedCount, partial, onClearFilters }: NoResultsProps) {
  if (matchedCount > 0) {
    return (
      <EmptyState
        icon="filter"
        title="No results match these filters"
        description={
          query
            ? `There ${matchedCount === 1 ? 'is 1 result' : `are ${matchedCount} results`} for “${query}” without filters.`
            : 'Try removing a filter to see more products.'
        }
        actions={<Button onClick={onClearFilters}>Clear filters</Button>}
      />
    );
  }

  return (
    <EmptyState
      icon="search"
      title={`No results for “${query}”`}
      description="Check the spelling, try fewer or more general words, or start from one of the suggestions below."
      actions={<ButtonLink to={searchUrl()} variant="secondary">Browse all products</ButtonLink>}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-5 text-left">
        {partial.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Search for one word instead</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {partial.map((p) => (
                <li key={p.word}>
                  <SearchChip to={searchUrl({ k: p.word })}>
                    {p.word} <span className="text-ink-muted">({p.count})</span>
                  </SearchChip>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">Popular searches</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((q) => (
              <li key={q}>
                <SearchChip to={searchUrl({ k: q })}>{q}</SearchChip>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Browse a category</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <SearchChip to={searchUrl({ category: c.id })} icon="package">
                  {c.name}
                </SearchChip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </EmptyState>
  );
}
