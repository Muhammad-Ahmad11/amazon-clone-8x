import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { categories } from '../../data/products';
import { searchUrl } from '../../lib/routes';
import { Container } from '../ui/Container';
import { Logo } from './Logo';

function backToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      {children}
    </div>
  );
}

const footerLink = 'inline-flex min-h-8 items-center text-white/80 hover:text-white hover:underline';

/**
 * Amazon's footer has four columns of corporate links (recon §2.1). Ours keeps "Back to top"
 * and only says things that are true and useful here: where to shop, how delivery works, what this site is.
 */
export function Footer() {
  return (
    <footer className="on-dark mt-auto text-white">
      <button type="button" onClick={backToTop} className="block h-12 w-full bg-nav-3 text-[13px] font-medium transition-colors hover:bg-nav-hover">
        Back to top
      </button>
      <div className="bg-nav-2">
        <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]">
          <Column title="Shop">
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={searchUrl({ category: c.id })} className={footerLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={searchUrl({ deals: true })} className={footerLink}>
                  Today’s deals
                </Link>
              </li>
            </ul>
          </Column>
          <Column title="Delivery & returns">
            <ul className="flex flex-col gap-2 text-white/80">
              <li>Free delivery on orders over $35</li>
              <li>Standard or express delivery, chosen at checkout</li>
              <li>30-day returns on every item</li>
            </ul>
          </Column>
          <Column title="About this store">
            <p className="max-w-md text-white/80">
              A demo store built as a product exercise. It is inspired by Amazon.com but not affiliated with it. There are no accounts, and no
              real orders or payments.
            </p>
            <Link to="/design-system" className={`${footerLink} mt-2`}>
              Design system
            </Link>
          </Column>
        </Container>
      </div>
      <div className="bg-nav">
        <Container className="flex flex-col items-center gap-1 py-5 sm:flex-row sm:justify-between">
          <Logo />
          <p className="text-xs text-white/70">© 2026 Amazon Clone · Demo store</p>
        </Container>
      </div>
    </footer>
  );
}
