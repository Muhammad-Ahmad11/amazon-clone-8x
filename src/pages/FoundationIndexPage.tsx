import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';

/** Temporary index until the homepage is built (stage 5). */
export function FoundationIndexPage() {
  return (
    <main className="min-h-dvh bg-canvas py-16">
      <Container className="max-w-xl">
        <div className="rounded-card bg-surface p-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">Foundation</p>
          <h1 className="mt-2 text-2xl font-bold">Project foundation is ready</h1>
          <p className="mt-3 text-ink-muted">
            The design system and local catalogue are in place. The homepage and shopping journey are built in the next stages.
          </p>
          <ButtonLink to="/design-system" className="mt-6">
            Open the design system
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
