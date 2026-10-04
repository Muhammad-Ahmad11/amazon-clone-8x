import { Outlet, ScrollRestoration, type Location } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';

/** Shell for the shopping pages. Each page renders its own <main id="main-content">. */
export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-card bg-surface px-4 py-3 font-semibold text-ink shadow-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>
      <Header />
      <Outlet />
      <Footer />
      <ScrollRestoration getKey={scrollKey} />
    </div>
  );
}

// Every in-app navigation gets a unique history key, so a link to a page you've seen before still opens at
// the top and Back restores where you were. Fresh page loads all share the key "default", which carried one
// page's scroll position over to the next, so those are keyed by URL instead.
export function scrollKey(location: Location): string {
  return location.key === 'default' ? location.pathname + location.search : location.key;
}
