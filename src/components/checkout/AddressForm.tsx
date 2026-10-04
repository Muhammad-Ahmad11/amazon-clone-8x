import type { FormEvent } from 'react';
import { cityLine, US_STATES, type Address, type AddressErrors, type AddressField } from '../../state/checkout';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/Field';

interface AddressFormProps {
  value: Address;
  errors: AddressErrors;
  onChange: (field: AddressField, value: string) => void;
  onSubmit: () => void;
  /** Shown when editing a previously saved address. */
  onCancel?: () => void;
  /** Registers each control so the page can focus the first field with an error. */
  fieldRef: (field: AddressField) => (el: HTMLInputElement | HTMLSelectElement | null) => void;
}

/**
 * Amazon's address form opens in a modal with country, name, phone, street, unit, city, state, ZIP and a
 * "default address" box (recon §2.9). Ours is inline, US-only (one currency, decision 7), and asks only for
 * what delivery needs. Autocomplete tokens let the browser fill it in one tap.
 */
export function AddressForm({ value, errors, onChange, onSubmit, onCancel, fieldRef }: AddressFormProps) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  const field = (name: AddressField) => ({
    value: value[name],
    error: errors[name],
    ref: fieldRef(name),
    onChange: (e: { target: { value: string } }) => onChange(name, e.target.value),
  });

  return (
    <form noValidate onSubmit={submit} aria-label="Delivery address" className="flex max-w-2xl flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Country/Region: <span className="font-semibold text-ink">United States</span>. We deliver within the US only.
      </p>
      <TextField label="Full name" autoComplete="shipping name" required {...field('fullName')} />
      <TextField label="Street address" autoComplete="shipping address-line1" required {...field('line1')} />
      <TextField label="Apartment, suite or unit" optional autoComplete="shipping address-line2" {...field('line2')} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
        <TextField label="City" autoComplete="shipping address-level2" required {...field('city')} />
        <SelectField label="State" autoComplete="shipping address-level1" required {...field('state')}>
          <option value="">Select</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </SelectField>
        <TextField label="ZIP code" autoComplete="shipping postal-code" inputMode="numeric" maxLength={10} required {...field('zip')} />
      </div>
      <TextField
        label="Phone number"
        optional
        type="tel"
        autoComplete="shipping tel"
        hint="Only used if the courier needs to reach you."
        containerClassName="sm:max-w-xs"
        {...field('phone')}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Use this address</Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/** The saved address, compact. */
export function AddressSummary({ address }: { address: Address }) {
  return (
    <address className="text-[15px] leading-6 not-italic">
      <span className="font-semibold">{address.fullName}</span>
      <br />
      {address.line1}
      {address.line2 && (
        <>
          , {address.line2}
        </>
      )}
      <br />
      {cityLine(address)}
      {address.phone && (
        <>
          <br />
          <span className="text-ink-muted">Phone: {address.phone}</span>
        </>
      )}
    </address>
  );
}
