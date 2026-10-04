import { PAYMENT_METHODS, type PaymentMethod } from '../../state/checkout';
import { Icon } from '../ui/Icon';
import { ChoiceCard } from './CheckoutSection';

const METHODS: PaymentMethod[] = ['demo-card', 'pay-on-delivery'];

/**
 * Payment for a store that can't take payments. There are deliberately no card-number fields (decision 43):
 * a demo should never invite someone to type real card details.
 */
export function PaymentOptions({ value, onChange, labelledBy }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void; labelledBy: string }) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset aria-labelledby={labelledBy} aria-describedby="payment-demo-note" className="flex flex-col gap-2">
        {METHODS.map((method) => (
          <ChoiceCard
            key={method}
            name="payment-method"
            value={method}
            checked={value === method}
            onChange={() => onChange(method)}
            title={PAYMENT_METHODS[method].label}
            description={PAYMENT_METHODS[method].description}
          />
        ))}
      </fieldset>
      <p id="payment-demo-note" className="flex gap-2 text-[13px] text-ink-muted">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        This is a demo store. No payment is taken, whichever option you choose.
      </p>
    </div>
  );
}
