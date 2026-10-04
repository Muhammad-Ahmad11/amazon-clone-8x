import { Link } from 'react-router';
import { cn } from '../../lib/cn';

/** Plain text wordmark: it signals "Amazon-inspired" without copying Amazon's logo or smile arrow. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Amazon Clone home" className={cn('-mx-1 flex h-10 items-baseline gap-0.5 rounded px-1 pt-1.5 text-white', className)}>
      <span className="text-[22px] leading-none font-bold tracking-tight">amazon</span>
      <span className="text-[13px] leading-none font-semibold text-logo">.clone</span>
    </Link>
  );
}
