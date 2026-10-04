import { Link } from 'react-router';
import { categories } from '../../data/products';
import { cn } from '../../lib/cn';
import { pluralize } from '../../lib/format';
import { searchUrl } from '../../lib/routes';
import { useCartSummary } from '../../state/cart';
import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';

const navItem = 'flex h-10 items-center rounded px-2 whitespace-nowrap hover:ring-1 hover:ring-white/80';

function CartLink({ className }: { className?: string }) {
  const { count } = useCartSummary();
  return (
    <Link to="/cart" aria-label={`Cart, ${pluralize(count, 'item')}`} className={cn(navItem, 'gap-1 font-bold', className)}>
      <span className="relative">
        <Icon name="cart" size={30} strokeWidth={1.8} />
        {/* Keyed by count so the number pops each time it changes (Amazon's badge updates instantly, recon §2.2). */}
        <span key={count} aria-hidden="true" className="absolute -top-1.5 left-[55%] -translate-x-1/2 animate-pop text-[15px] leading-none text-cart-count">
          {count > 99 ? '99+' : count}
        </span>
      </span>
      <span aria-hidden="true" className="hidden pt-2 text-sm md:inline">
        Cart
      </span>
    </Link>
  );
}

/** Six links instead of Amazon's "☰ All" drawer plus a row of service links (recon §2.2). */
function CategoryNav() {
  const links = [
    { to: searchUrl(), label: 'All products' },
    ...categories.map((c) => ({ to: searchUrl({ category: c.id }), label: c.name })),
    { to: searchUrl({ deals: true }), label: 'Today’s deals' },
  ];
  return (
    <nav aria-label="Categories" className="on-dark bg-nav-2 text-sm text-white">
      <Container>
        <ul className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-2 sm:-mx-6 sm:px-4 lg:mx-0 lg:px-0">
          {links.map((l) => (
            <li key={l.label} className="shrink-0 lg:first:-ml-2">
              <Link to={l.to} className={navItem}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

/**
 * Amazon's top bar holds nine controls (recon §2.2). Ours holds three: logo, search and cart.
 * The bar is sticky so search is always within reach. On phones search drops to its own full-width row
 * (flex-wrap + order), so there is still only one search box in the DOM.
 */
export function Header() {
  return (
    <>
      <header className="on-dark sticky top-0 z-40 bg-nav text-white">
        <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 md:h-[60px] md:flex-nowrap md:py-0">
          <Logo className="order-1" />
          <SearchBar className="order-3 w-full md:order-2 md:w-auto md:flex-1" />
          <CartLink className="order-2 ml-auto md:order-3 md:ml-0" />
        </Container>
      </header>
      <CategoryNav />
    </>
  );
}
