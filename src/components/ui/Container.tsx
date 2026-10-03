import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Page-width wrapper: 16px gutters on mobile, capped at 1500px on large screens. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}
