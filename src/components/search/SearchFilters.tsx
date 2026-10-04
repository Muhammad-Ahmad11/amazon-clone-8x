import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { categories } from '../../data/products';
import { cn } from '../../lib/cn';
import type { SearchQuery } from '../../lib/routes';
import { bucketMatches, PRICE_BUCKETS, RATING_OPTIONS, type Facets } from '../../lib/search';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Field';
import { Stars } from '../ui/StarRating';

export type FilterPatch = Partial<Pick<SearchQuery, 'category' | 'min' | 'max' | 'rating' | 'deals'>>;

interface SearchFiltersProps {
  query: SearchQuery;
  /** null while results load: options render without counts. */
  facets: Facets | null;
  onChange: (patch: FilterPatch) => void;
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="py-4 first:pt-0 last:pb-0">
      {/* Floated so the legend sits inside the padding like a heading (a native legend straddles the border and adds a gap). */}
      <legend className="float-left mb-1 w-full text-[15px] font-bold">{legend}</legend>
      <div className="clear-left flex flex-col">{children}</div>
    </fieldset>
  );
}

interface RadioProps {
  name: string;
  checked: boolean;
  onSelect: () => void;
  count?: number;
  children: ReactNode;
}

/** A native radio row: arrow keys move within the group. 40px rows for touch; tighter in the desktop sidebar. */
function Radio({ name, checked, onSelect, count, children }: RadioProps) {
  // An option with nothing in it is disabled (unless it's the current one), so filters never lead to a dead end.
  const empty = count === 0 && !checked;
  return (
    <label className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 text-sm lg:min-h-8', empty && 'cursor-not-allowed text-ink-subtle')}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} disabled={empty} className="size-4 shrink-0 cursor-pointer accent-focus" />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">{children}</span>
      {count !== undefined && <span className="text-[13px] text-ink-muted tabular-nums">{count}</span>}
    </label>
  );
}

/** Custom range, e.g. "$30 to $60". Bound to the URL values; resets when they change. */
function PriceRangeForm({ query, onChange }: Pick<SearchFiltersProps, 'query' | 'onChange'>) {
  const id = useId();
  const [min, setMin] = useState(query.min?.toString() ?? '');
  const [max, setMax] = useState(query.max?.toString() ?? '');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const parse = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(/[$,\s]/g, '')));
    const lo = parse(min);
    const hi = parse(max);
    if ([lo, hi].some((n) => n !== undefined && (!Number.isFinite(n) || n < 0))) {
      setError('Enter amounts in dollars, like 25.');
      return;
    }
    setError('');
    onChange(lo !== undefined && hi !== undefined && lo > hi ? { min: hi, max: lo } : { min: lo, max: hi });
  }

  const input = 'h-10 w-full min-w-0 rounded-lg border border-[#888c8c] bg-surface pr-2 pl-6 text-sm focus:border-focus focus:ring-3 focus:ring-focus/20 focus:outline-none';
  return (
    <form onSubmit={submit} className="mt-2" aria-label="Custom price range" noValidate>
      <div className="flex items-end gap-2">
        <label className="relative min-w-0 flex-1 text-xs text-ink-muted">
          Min
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 text-sm text-ink-muted">$</span>
          <input id={`${id}-min`} inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className={input} aria-describedby={error ? `${id}-err` : undefined} />
        </label>
        <label className="relative min-w-0 flex-1 text-xs text-ink-muted">
          Max
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 text-sm text-ink-muted">$</span>
          <input id={`${id}-max`} inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} className={input} aria-describedby={error ? `${id}-err` : undefined} />
        </label>
        <Button type="submit" variant="secondary" className="shrink-0">
          Go
        </Button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-[13px] text-warning">
          {error}
        </p>
      )}
    </form>
  );
}

/**
 * Three filters plus a deals switch, instead of Amazon's 39 filter groups (recon §2.4).
 * Counts show what each choice would give with the other filters kept.
 */
export function SearchFilters({ query, facets, onChange }: SearchFiltersProps) {
  const name = useId();
  const customPrice = (query.min !== undefined || query.max !== undefined) && !PRICE_BUCKETS.some((b) => bucketMatches(b, query));

  return (
    <div className="flex flex-col divide-y divide-line-soft">
      <Group legend="Category">
        <Radio name={`${name}-cat`} checked={!query.category} onSelect={() => onChange({ category: undefined })} count={facets?.anyCategory}>
          All categories
        </Radio>
        {categories.map((c) => (
          <Radio key={c.id} name={`${name}-cat`} checked={query.category === c.id} onSelect={() => onChange({ category: c.id })} count={facets?.category[c.id]}>
            {c.name}
          </Radio>
        ))}
      </Group>

      <Group legend="Price">
        <Radio name={`${name}-price`} checked={query.min === undefined && query.max === undefined} onSelect={() => onChange({ min: undefined, max: undefined })}>
          Any price
        </Radio>
        {PRICE_BUCKETS.map((b, i) => (
          <Radio key={b.label} name={`${name}-price`} checked={bucketMatches(b, query)} onSelect={() => onChange({ min: b.min, max: b.max })} count={facets?.price[i]}>
            {b.label}
          </Radio>
        ))}
        {customPrice && (
          <Radio name={`${name}-price`} checked onSelect={() => undefined}>
            Custom range
          </Radio>
        )}
        <PriceRangeForm key={`${query.min}-${query.max}`} query={query} onChange={onChange} />
      </Group>

      <Group legend="Customer rating">
        <Radio name={`${name}-rating`} checked={query.rating === undefined} onSelect={() => onChange({ rating: undefined })}>
          Any rating
        </Radio>
        {RATING_OPTIONS.map((r, i) => (
          <Radio key={r} name={`${name}-rating`} checked={query.rating === r} onSelect={() => onChange({ rating: r })} count={facets?.rating[i]}>
            <Stars rating={r} size={15} />
            <span>
              {r} <span className="sr-only">stars</span> &amp; up
            </span>
          </Radio>
        ))}
      </Group>

      <Group legend="Deals">
        <div className="flex items-center justify-between gap-2">
          <Checkbox label="Today’s deals only" checked={query.deals} onChange={(e) => onChange({ deals: e.target.checked })} className="min-h-10" />
          {facets && <span className="text-[13px] text-ink-muted tabular-nums">{facets.deals}</span>}
        </div>
      </Group>
    </div>
  );
}
