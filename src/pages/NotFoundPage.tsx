import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-canvas py-10 focus:outline-none">
      <title>Page not found · Amazon Clone</title>
      <Container className="max-w-2xl">
        <div className="rounded-card bg-surface">
          <EmptyState
            icon="search"
            headingLevel={1}
            title="We can’t find that page"
            description="The link may be broken or the page may have moved. Try searching, or head back to the homepage."
            actions={<ButtonLink to="/">Go to homepage</ButtonLink>}
          />
        </div>
      </Container>
    </main>
  );
}
