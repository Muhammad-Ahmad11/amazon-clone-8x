import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  resultCount: number | null;
  onClearAll?: () => void;
  children: ReactNode;
}

/**
 * Mobile/tablet filters in a native modal <dialog>: the browser handles the focus trap, Escape and inert background.
 * Filters apply as you choose them, so the footer button just shows the live count and closes.
 */
export function FilterDrawer({ open, onClose, resultCount, onClearAll, children }: FilterDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="filter-drawer-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> element itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(100%,380px)] max-w-none bg-surface p-0 text-ink shadow-overlay backdrop:bg-nav/50 open:animate-slide-in-right"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-2">
          <h2 id="filter-drawer-title" className="text-lg font-bold">
            Filters
          </h2>
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-canvas-soft" aria-label="Close filters">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <div className="flex gap-3 border-t border-line-soft px-4 py-3">
          {onClearAll && (
            <Button variant="secondary" onClick={onClearAll} className="flex-1">
              Clear all
            </Button>
          )}
          <Button variant="dark" onClick={onClose} className="flex-[2]">
            {resultCount === null ? 'Show results' : resultCount === 1 ? 'Show 1 result' : `Show ${resultCount} results`}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
