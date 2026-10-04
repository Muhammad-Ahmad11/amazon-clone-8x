import type { Ref } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface RemovedLineNoticeProps {
  title: string;
  details: string;
  onUndo: () => void;
  onDismiss: () => void;
  undoRef?: Ref<HTMLButtonElement>;
}

/**
 * Shown in place of a removed line, like Amazon's "…was removed from Shopping Cart" (recon §2.8, screenshot 20),
 * but with Undo. It stays until dismissed or until you leave the cart, so there's no race against a timer.
 */
export function RemovedLineNotice({ title, details, onUndo, onDismiss, undoRef }: RemovedLineNoticeProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-canvas-soft p-3">
      <Icon name="trash" size={18} className="shrink-0 text-ink-muted" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">Removed:</span> <span className="line-clamp-1 inline">{title}</span>
        {details && <span className="block text-[13px] text-ink-muted">{details}</span>}
      </p>
      <Button ref={undoRef} variant="secondary" size="sm" onClick={onUndo} icon={<Icon name="undo" size={14} />} aria-label={`Undo: put ${title} back in your cart`}>
        Undo
      </Button>
      <button type="button" onClick={onDismiss} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-line-soft" aria-label={`Dismiss: ${title} removed`}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
