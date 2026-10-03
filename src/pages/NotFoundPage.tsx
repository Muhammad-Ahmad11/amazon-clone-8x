import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <main className="min-h-dvh bg-canvas py-10">
      <Container className="max-w-2xl">
        <div className="rounded-card bg-surface">
          <EmptyState
            icon="search"
            title="We can’t find that page"
            description="The link may be broken or the page may have moved. Try searching, or head back to the homepage."
            actions={<ButtonLink to="/">Go to homepage</ButtonLink>}
          />
        </div>
      </Container>
    </main>
  );
}
