import type { ResolvedLine } from '../../state/cart';
import { variantDescription } from '../cart/CartLineItem';
import { ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';

/** One line per problem, in the cart's own terms (decision 36). The fix always happens in the cart. */
function problem({ line, product, status, limit }: ResolvedLine): string {
  switch (status) {
    case 'exceeds-stock':
      return `Only ${limit} available. You have ${line.quantity} in your cart.`;
    case 'unavailable':
      return 'Sold out in this option.';
    case 'missing':
      return product ? 'This option is no longer sold.' : 'This item is no longer sold here.';
    default:
      return '';
  }
}

/** Shown instead of checkout when any cart line can't be bought as it is. Nothing is fixed silently. */
export function CheckoutBlocked({ issues }: { issues: ResolvedLine[] }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-card bg-surface p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-bg text-[#b46b00]">
          <Icon name="alert" size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold">Your cart needs attention first</h2>
          <p className="mt-1 text-[15px] text-ink-muted">
            {issues.length === 1 ? 'One item' : `${issues.length} items`} can’t be ordered as {issues.length === 1 ? 'it is' : 'they are'}. Fix{' '}
            {issues.length === 1 ? 'it' : 'them'} in your cart, then come back to check out. Nothing has been changed for you.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-line-soft rounded-card border border-line">
        {issues.map((item) => {
          const options = variantDescription(item);
          return (
            <li key={item.line.variantId} className="px-4 py-3">
              <p className="text-[15px] font-medium">{item.product?.title ?? 'Item no longer available'}</p>
              {options && <p className="text-[13px] text-ink-muted">{options}</p>}
              <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-warning">
                <Icon name="alert" size={14} />
                {problem(item)}
              </p>
            </li>
          );
        })}
      </ul>
      <div>
        <ButtonLink to="/cart" size="lg">
          Return to cart
        </ButtonLink>
      </div>
    </div>
  );
}
