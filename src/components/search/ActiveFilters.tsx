import { getCategory } from '../../data/selectors';
import { hasFilters, type SearchQuery } from '../../lib/routes';
import { PRICE_BUCKETS, bucketMatches } from '../../lib/search';
import { Icon } from '../ui/Icon';
import type { FilterPatch } from './SearchFilters';

export function priceLabel(q: Pick<SearchQuery, 'min' | 'max'>): string {
  const bucket = PRICE_BUCKETS.find((b) => bucketMatches(b, q));
  if (bucket) return bucket.label;
  if (q.min !== undefined && q.max !== undefined) return `$${q.min} to $${q.max}`;
  return q.min !== undefined ? `$${q.min} & above` : `Up to $${q.max}`;
}

/** Applied filters as removable chips, so it's always visible what is narrowing the results. */
export function ActiveFilters({ query, onChange, onClearAll }: { query: SearchQuery; onChange: (patch: FilterPatch) => void; onClearAll: () => void }) {
  if (!hasFilters(query)) return null;

  const chips: Array<{ label: string; patch: FilterPatch }> = [];
  if (query.category) chips.push({ label: getCategory(query.category).name, patch: { category: undefined } });
  if (query.min !== undefined || query.max !== undefined) chips.push({ label: priceLabel(query), patch: { min: undefined, max: undefined } });
  if (query.rating !== undefined) chips.push({ label: `${query.rating}★ & up`, patch: { rating: undefined } });
  if (query.deals) chips.push({ label: 'Today’s deals', patch: { deals: false } });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">Active filters:</span>
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => onChange(c.patch)}
          aria-label={`Remove filter: ${c.label}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-focus/40 bg-info-bg pr-2 pl-3 text-[13px] font-medium text-ink transition-colors hover:border-focus"
        >
          {c.label}
          <Icon name="close" size={14} />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="link inline-flex h-9 items-center px-1 text-[13px] font-medium">
        Clear all
      </button>
    </div>
  );
}
