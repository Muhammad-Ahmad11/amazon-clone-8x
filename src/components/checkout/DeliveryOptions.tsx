import { deliveryDate, deliveryFee, DELIVERY_OPTIONS, formatDeliveryDate, FREE_DELIVERY_MIN, type DeliverySpeed } from '../../lib/delivery';
import { formatMoney, type Cents } from '../../lib/money';
import { ChoiceCard } from './CheckoutSection';

const SPEEDS: DeliverySpeed[] = ['standard', 'express'];

/** The store's two delivery speeds (decision 7), each with its real date and fee for this order. */
export function DeliveryOptions({ value, subtotal, onChange, labelledBy }: { value: DeliverySpeed; subtotal: Cents; onChange: (speed: DeliverySpeed) => void; labelledBy: string }) {
  return (
    <fieldset aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {SPEEDS.map((speed) => {
        const fee = deliveryFee(speed, subtotal);
        return (
          <ChoiceCard
            key={speed}
            name="delivery-speed"
            value={speed}
            checked={value === speed}
            onChange={() => onChange(speed)}
            title={`${DELIVERY_OPTIONS[speed].label} delivery`}
            description={
              <>
                Arrives by <span className="font-semibold text-ink">{formatDeliveryDate(deliveryDate(speed))}</span>
                {speed === 'standard' && fee > 0 && <> · FREE on orders of {formatMoney(FREE_DELIVERY_MIN)} or more</>}
              </>
            }
            aside={fee === 0 ? <span className="font-semibold text-success">FREE</span> : formatMoney(fee)}
          />
        );
      })}
    </fieldset>
  );
}
