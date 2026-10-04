import type { Product, Variant } from '../../data/types';
import { cn } from '../../lib/cn';
import { formatMoney } from '../../lib/money';
import { optionChoices, optionLabel, type ValueChoice } from '../../lib/variants';
import { ProductImage } from '../ui/ProductImage';

const PLURAL: Record<string, string> = { Color: 'colours', Size: 'sizes', Capacity: 'capacities', Format: 'formats' };

interface VariantPickerProps {
  product: Product;
  selected: Variant;
  onSelect: (choice: ValueChoice, optionName: Product['options'][number]['name']) => void;
}

/**
 * One native radio group per real option (Colour, Size, Capacity, Format). Native radios give arrow-key
 * movement, skip disabled values, and announce "selected" for free. Sold-out values are disabled;
 * values only in stock with a different other choice stay selectable and say so.
 */
export function VariantPicker({ product, selected, onSelect }: VariantPickerProps) {
  const groups = optionChoices(product, selected);
  if (!groups.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ option, choices }) => {
        const current = choices.find((c) => c.state === 'selected')?.value.label;
        const isColor = option.name === 'Color';
        // Prices are shown on the choices only when picking one actually changes the price.
        const prices = new Set(choices.map((c) => c.target?.price).filter((p) => p !== undefined));
        const showPrices = prices.size > 1;
        const name = `${product.id}-${option.name}`;
        // With two options, name the one that will change: picking "40 oz" may need "Other colours".
        const others = groups.filter((g) => g.option.name !== option.name);
        const otherNote = others.length === 1 ? `Other ${PLURAL[others[0]!.option.name]}` : 'Other options';
        return (
          <fieldset key={option.name}>
            <legend className="float-left mb-2 w-full text-sm">
              {optionLabel(option.name)}: <span className="font-bold">{current}</span>
            </legend>
            <div className="clear-left flex flex-wrap gap-2">
              {choices.map((c) => {
                const disabled = c.state === 'unavailable';
                const note = disabled ? 'Out of stock' : c.state === 'other-combination' ? otherNote : undefined;
                const image = isColor ? c.target?.images[0] ?? product.variants.find((v) => v.options.Color === c.value.id)?.images[0] : undefined;
                return (
                  <label
                    key={c.value.id}
                    title={disabled ? `${c.value.label} is out of stock` : c.state === 'other-combination' ? `${c.value.label} is available with a different choice` : c.value.label}
                    className={cn(
                      'relative flex cursor-pointer flex-col items-center rounded-lg border bg-surface text-center transition-colors',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                      isColor ? 'w-[84px] p-1.5' : 'min-h-11 min-w-16 justify-center px-3 py-1.5',
                      c.state === 'selected' ? 'border-2 border-link bg-info-bg/40' : 'border-line hover:border-ink-subtle',
                      c.state === 'other-combination' && 'border-dashed',
                      disabled && 'cursor-not-allowed opacity-50 hover:border-line',
                    )}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={c.value.id}
                      checked={c.state === 'selected'}
                      disabled={disabled}
                      onChange={() => onSelect(c, option.name)}
                      className="sr-only"
                      aria-describedby={note ? `${name}-${c.value.id}-note` : undefined}
                    />
                    {isColor && image && <ProductImage src={image} alt="" className={cn('w-full rounded', disabled && 'grayscale')} />}
                    <span className={cn('text-[13px] leading-4', isColor && 'mt-1 line-clamp-2 w-full', disabled && 'line-through')}>{c.value.label}</span>
                    {showPrices && c.target && <span className="text-xs text-ink-muted">{formatMoney(c.target.price)}</span>}
                    {note && (
                      <span id={`${name}-${c.value.id}-note`} className="text-[11px] leading-4 text-ink-muted">
                        {note}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
