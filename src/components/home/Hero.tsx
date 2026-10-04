import { POPULAR_SEARCHES } from '../../data/curation';
import { imagePath } from '../../data/products';
import { searchUrl } from '../../lib/routes';
import { ButtonLink } from '../ui/Button';
import { SearchChip } from '../search/SearchChip';
import { ProductImage } from '../ui/ProductImage';

const art = [
  { src: imagePath('aurora-anc-headphones', 'black', 1), place: 'top-[6%] left-0 -rotate-6' },
  { src: imagePath('hearth-stainless-bottle', 'sage', 1), place: 'top-0 right-0 rotate-[5deg]' },
  { src: imagePath('trailform-daypack', 'sand', 1), place: 'bottom-0 left-[27%] rotate-2' },
];

// Taller buttons from sm up; the shared Button sizes aren't responsive.
const cta = 'sm:h-12 sm:px-6 sm:text-[15px]';

/**
 * One static hero instead of Amazon's auto-scrolling row of tall tiles (recon §2.1).
 * Its actions are dark/outlined, not yellow: yellow stays reserved for cart actions.
 * The product art is hidden on phones so the first products show up sooner.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden rounded-tile bg-linear-to-br from-hero-from to-hero-to">
      <div className="grid items-center gap-6 p-5 sm:p-8 md:grid-cols-[1.25fr_1fr] lg:px-12 lg:py-10">
        <div className="min-w-0">
          <h1 id="hero-title" className="text-[26px] leading-tight font-bold tracking-tight sm:text-4xl">
            Everyday essentials, picked with care
          </h1>
          <p className="mt-2 max-w-lg text-[15px] text-ink-muted sm:mt-3 sm:text-base">
            Five focused categories, honest ratings and clear prices. Free delivery on orders over $35.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink to={searchUrl({ deals: true })} variant="dark" className={cta}>
              Today’s deals
            </ButtonLink>
            <ButtonLink to={searchUrl()} variant="secondary" className={cta}>
              All products
            </ButtonLink>
          </div>
          <div className="mt-5 sm:mt-6">
            <h2 className="text-[13px] font-semibold text-ink-muted">Popular searches</h2>
            {/* One swipe row on phones (three wrapped rows would push products down); wraps from sm up. */}
            <ul className="scrollbar-none -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
              {POPULAR_SEARCHES.map((q) => (
                <li key={q} className="shrink-0">
                  <SearchChip to={searchUrl({ k: q })}>{q}</SearchChip>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div aria-hidden="true" className="relative mx-auto hidden aspect-[4/3] w-full max-w-md md:block">
          {art.map((a) => (
            <div key={a.src} className={`absolute w-[46%] rounded-tile bg-surface p-2 shadow-card-hover ${a.place}`}>
              <ProductImage src={a.src} alt="" priority className="rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
