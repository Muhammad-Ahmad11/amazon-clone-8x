import { categories } from './products';
import type { Category, CategoryId, OptionName, Product, Variant } from './types';

export function getCategory(id: CategoryId): Category {
  return categories.find((c) => c.id === id)!;
}

export function getVariant(product: Product, variantId?: string | null): Variant {
  return product.variants.find((v) => v.id === variantId) ?? product.variants.find((v) => v.id === product.defaultVariantId)!;
}

/** Finds the variant matching a full option selection, e.g. { Color: 'black', Size: '9' }. */
export function findVariant(product: Product, selection: Partial<Record<OptionName, string>>): Variant | undefined {
  return product.variants.find((v) => product.options.every((o) => v.options[o.name] === selection[o.name]));
}

export function isInStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

/** Lowest and highest current price across variants (for "from $X" on cards). */
export function priceRange(product: Product): { min: number; max: number } {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function optionValueLabel(product: Product, name: OptionName, valueId: string | undefined): string | undefined {
  return product.options.find((o) => o.name === name)?.values.find((v) => v.id === valueId)?.label;
}

/** "Midnight Black · US 9" — used in the cart and order summary. */
export function variantLabel(product: Product, variant: Variant): string {
  return product.options
    .map((o) => optionValueLabel(product, o.name, variant.options[o.name]))
    .filter(Boolean)
    .join(' · ');
}
