import { Link, Outlet, ScrollRestoration } from 'react-router';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';
import { scrollKey } from './SiteLayout';

/**
 * Checkout's own shell. Like Amazon's (recon §2.2, §2.9) it drops search and the category bar so nothing
 * pulls the shopper away mid-purchase, but keeps an obvious way back to the cart.
 */
export function CheckoutLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only rounded-card bg-surface px-4 py-3 font-semibold text-ink shadow-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>
      <header className="on-dark bg-nav text-white">
        <Container className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 md:h-[60px]">
          <Logo className="justify-self-start" />
          <p className="flex items-center gap-1.5 text-base font-medium sm:text-xl">
            <Icon name="lock" size={18} className="text-white/80" />
            <span className="hidden sm:inline">Secure checkout</span>
            <span className="sm:hidden">Checkout</span>
          </p>
          <Link to="/cart" className="flex h-10 items-center gap-1 justify-self-end rounded px-2 text-sm hover:ring-1 hover:ring-white/80">
            <Icon name="chevron-left" size={16} />
            <span>
              Back<span className="sr-only sm:not-sr-only"> to cart</span>
            </span>
          </Link>
        </Container>
      </header>
      <Outlet />
      <footer className="border-t border-line bg-surface py-5 text-[13px] text-ink-muted">
        <Container className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <p>This is a demo store: no payment is taken and nothing is shipped.</p>
          <p>30-day returns on every item.</p>
        </Container>
      </footer>
      <ScrollRestoration getKey={scrollKey} />
    </div>
  );
}
