import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { products } from '../../data/products';
import { getVariant } from '../../data/selectors';
import { cn } from '../../lib/cn';
import { searchUrl } from '../../lib/routes';
import { normalize } from '../../lib/search';
import { flattenSuggestions, suggest, type Suggestion } from '../../lib/suggest';
import { Icon } from '../ui/Icon';
import { Price } from '../ui/Price';
import { ProductImage } from '../ui/ProductImage';

/** Amazon-style emphasis: what you typed stays regular, the rest of the suggestion is bold (recon §2.3). */
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = normalize(query);
  const at = q ? text.indexOf(q) : -1;
  if (at < 0) return <span className="font-semibold">{text}</span>;
  return (
    <>
      <span className="font-semibold">{text.slice(0, at)}</span>
      {text.slice(at, at + q.length)}
      <span className="font-semibold">{text.slice(at + q.length)}</span>
    </>
  );
}

/** A labelled group of options inside the listbox. Groups without a visible label get an accessible one. */
function Group({ id, label, visibleLabel = true, children }: { id: string; label: string; visibleLabel?: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={visibleLabel ? id : undefined} aria-label={visibleLabel ? undefined : label}>
      {visibleLabel && (
        <div id={id} className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * The header's main control: a combobox (WAI-ARIA 1.2 pattern) with typeahead from the local catalogue.
 * Focus stays in the input; arrow keys move through suggestions, Enter picks one (or searches what's typed),
 * Escape closes the list. No "All" category dropdown like Amazon's: narrowing is a filter on the results page.
 */
export function SearchBar({ className }: { className?: string }) {
  const id = useId();
  const listId = `${id}-list`;
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [params] = useSearchParams();
  const urlQuery = params.get('k') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Show the current search in the box, and keep it in step with back/forward navigation.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  const suggestions = useMemo(() => suggest(products, query), [query]);
  const options = useMemo(() => flattenSuggestions(suggestions), [suggestions]);
  const expanded = open && options.length > 0;
  const optionId = (i: number) => `${id}-opt-${i}`;

  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(url: string, text: string) {
    setQuery(text);
    close();
    inputRef.current?.blur(); // closes the on-screen keyboard on phones
    navigate(url);
  }

  function choose(s: Suggestion) {
    if (s.kind === 'search') go(s.url, s.text);
    else if (s.kind === 'category') go(s.url, s.query);
    else go(s.url, query);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (expanded && active >= 0) {
      choose(options[active]!);
      return;
    }
    if (!query.trim()) {
      inputRef.current?.focus();
      setOpen(true);
      return;
    }
    // A new search starts fresh: filters from the previous search don't carry over.
    go(searchUrl({ k: query }), query.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const n = options.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // -1 is "back in the text box"; the cycle is input -> options -> input.
      setActive((a) => {
        const next = a + step;
        return next >= n ? -1 : next < -1 ? n - 1 : next;
      });
    } else if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault(); // otherwise the browser also clears the search box
        close();
      }
    } else if (e.key === 'Tab') {
      close();
    }
  }

  let index = -1;
  const option = (s: Suggestion, content: ReactNode) => {
    index += 1;
    const i = index;
    return (
      <div
        key={s.id}
        id={optionId(i)}
        role="option"
        aria-selected={i === active}
        onClick={() => choose(s)}
        onMouseMove={() => active !== i && setActive(i)}
        className={cn('flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 text-[15px] text-ink', i === active && 'bg-canvas')}
      >
        {content}
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="relative z-50 flex h-11 overflow-hidden rounded-lg bg-surface focus-within:ring-[3px] focus-within:ring-search md:h-10"
      >
        <label htmlFor={id} className="sr-only">
          Search the store
        </label>
        <input
          id={id}
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={expanded}
          // Only point at the list while it exists: a dangling aria-controls is an ARIA error.
          aria-controls={expanded ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={close}
          onKeyDown={handleKeyDown}
          placeholder="Search products and brands"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink placeholder:text-ink-subtle focus-visible:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="grid w-12 shrink-0 place-items-center bg-search text-ink transition-colors hover:bg-search-hover focus-visible:bg-search-hover focus-visible:outline-none"
        >
          <Icon name="search" size={22} />
        </button>
      </form>

      {expanded && (
        <>
          {/* Dims the page like Amazon does, so the list reads as the focus. Clicking it blurs the input, which closes the list. */}
          <div aria-hidden="true" className="fixed inset-0 z-30 animate-fade-in bg-nav/40" />
          <div
            id={listId}
            role="listbox"
            aria-label="Search suggestions"
            // Keep focus in the input while clicking an option (otherwise blur closes the list first).
            onMouseDown={(e) => e.preventDefault()}
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-[min(70dvh,560px)] overflow-y-auto rounded-lg bg-surface py-1 text-ink shadow-overlay"
          >
            {suggestions.searches.length > 0 && (
              <Group id={`${id}-searches`} label={suggestions.popular ? 'Popular searches' : 'Suggested searches'} visibleLabel={suggestions.popular}>
                {suggestions.searches.map((s) =>
                  option(
                    s,
                    <>
                      <Icon name="search" size={16} className="shrink-0 text-ink-muted" />
                      <span className="min-w-0 truncate">{s.kind === 'search' && (suggestions.popular ? s.text : <Highlighted text={s.text} query={query} />)}</span>
                    </>,
                  ),
                )}
              </Group>
            )}
            {suggestions.categories.length > 0 && (
              <Group id={`${id}-cats`} label="Categories">
                {suggestions.categories.map((s) =>
                  s.kind === 'category'
                    ? option(
                        s,
                        <>
                          <Icon name="filter" size={16} className="shrink-0 text-ink-muted" />
                          <span className="min-w-0 flex-1 truncate">
                            {s.query ? (
                              <>
                                {s.query} <span className="text-ink-muted">in</span> <span className="font-semibold">{s.category.name}</span>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold">{s.category.name}</span> <span className="text-ink-muted">· browse all</span>
                              </>
                            )}
                          </span>
                          {s.query && <span className="shrink-0 text-[13px] text-ink-muted">{s.count}</span>}
                        </>,
                      )
                    : null,
                )}
              </Group>
            )}
            {suggestions.products.length > 0 && (
              <Group id={`${id}-products`} label="Products">
                {suggestions.products.map((s) => {
                  if (s.kind !== 'product') return null;
                  const v = getVariant(s.product);
                  return option(
                    s,
                    <>
                      <ProductImage src={v.images[0]!} alt="" className="size-10 shrink-0 rounded" />
                      <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-[18px]">{s.product.title}</span>
                      <Price cents={v.price} size="sm" className="shrink-0" />
                    </>,
                  );
                })}
              </Group>
            )}
          </div>
        </>
      )}
    </div>
  );
}
