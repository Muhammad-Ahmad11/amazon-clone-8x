/*
  Variant selection from real catalogue data. Nothing here invents a combination:
  every choice resolves to an existing Variant, and sold-out variants are never selectable.

  For each option value we find the in-stock variant a shopper would land on if they picked it,
  preferring the one that keeps their other choices (e.g. picking "40 oz" keeps the colour if it can).
*/
import { optionValueLabel } from '../data/selectors';
import type { OptionName, OptionValue, Product, ProductOption, Variant } from '../data/types';

export type ValueState =
  /** The value in the current selection. */
  | 'selected'
  /** Selectable without changing any other choice. */
  | 'available'
  /** In stock, but only with a different choice for another option (picking it changes that option too). */
  | 'other-combination'
  /** No in-stock variant has this value. */
  | 'unavailable';

export interface ValueChoice {
  value: OptionValue;
  state: ValueState;
  /** The variant picking this value leads to; undefined when unavailable. */
  target?: Variant;
}

export interface OptionChoices {
  option: ProductOption;
  choices: ValueChoice[];
}

/** Options that are real choices: a single-value option (e.g. one cover for a book) isn't one. */
export function choosableOptions(product: Product): ProductOption[] {
  return product.options.filter((o) => o.values.length > 1);
}

function sharedOptions(a: Variant, b: Variant, except: OptionName): number {
  return Object.entries(a.options).filter(([name, id]) => name !== except && b.options[name as OptionName] === id).length;
}

export function optionChoices(product: Product, selected: Variant): OptionChoices[] {
  const otherCount = (name: OptionName) => choosableOptions(product).filter((o) => o.name !== name).length;
  return choosableOptions(product).map((option) => ({
    option,
    choices: option.values.map((value): ValueChoice => {
      if (selected.options[option.name] === value.id) return { value, state: 'selected', target: selected };
      const candidates = product.variants.filter((v) => v.options[option.name] === value.id && v.stock > 0);
      if (!candidates.length) return { value, state: 'unavailable' };
      // Keep as many of the shopper's other choices as possible; ties go to catalogue order.
      const target = candidates.reduce((best, v) => (sharedOptions(v, selected, option.name) > sharedOptions(best, selected, option.name) ? v : best));
      const keepsOthers = sharedOptions(target, selected, option.name) === otherCount(option.name);
      return { value, state: keepsOthers ? 'available' : 'other-combination', target };
    }),
  }));
}

/**
 * Options other than the one the shopper picked that had to change, e.g. picking "40 oz" moved Color off Navy.
 * Used to explain the automatic switch instead of doing it silently.
 */
export function changedOptions(product: Product, from: Variant, to: Variant, picked: OptionName): ProductOption[] {
  return choosableOptions(product).filter((o) => o.name !== picked && from.options[o.name] !== to.options[o.name]);
}

/** Display name for an option ("Color" -> "Colour"; others unchanged). */
export function optionLabel(name: OptionName): string {
  return name === 'Color' ? 'Colour' : name;
}

/** "Colour: Navy · Capacity: 32 oz" — only the options that were real choices. Used by the cart and orders. */
export function describeVariant(product: Product, variant: Variant): string {
  return choosableOptions(product)
    .map((o) => `${optionLabel(o.name)}: ${optionValueLabel(product, o.name, variant.options[o.name])}`)
    .join(' · ');
}
