import { cn } from '../../lib/cn';

/** Shimmering placeholder block. Shape it with className (h-*, w-*, rounded-*). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,#eceeee_0%,#f6f7f7_50%,#eceeee_100%)] bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

/** Skeleton shaped like a grid product card, so the layout does not jump when data arrives. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="mt-1 h-9 w-full rounded-full" />
    </div>
  );
}
