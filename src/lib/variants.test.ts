import { describe, expect, it } from 'vitest';
import { productsById } from '../data/products';
import { getVariant } from '../data/selectors';
import { changedOptions, choosableOptions, optionChoices, type ValueChoice } from './variants';

const product = (id: string) => productsById.get(id)!;
const choice = (choices: ValueChoice[], valueId: string) => choices.find((c) => c.value.id === valueId)!;

describe('variant selection', () => {
  it('hides options that are not real choices', () => {
    expect(choosableOptions(product('book-tidewater')).map((o) => o.name)).toEqual(['Format']);
    expect(choosableOptions(product('ironcore-adjustable-dumbbells'))).toEqual([]);
  });

  it('marks a colour with no stock as unavailable, with no target', () => {
    const p = product('aurora-anc-headphones');
    const [colours] = optionChoices(p, getVariant(p));
    expect(choice(colours!.choices, 'sage')).toEqual({ value: expect.objectContaining({ id: 'sage' }), state: 'unavailable' });
    expect(choice(colours!.choices, 'black').state).toBe('selected');
    expect(choice(colours!.choices, 'navy').state).toBe('available');
  });

  it('keeps other choices when it can, and says when it cannot', () => {
    const p = product('hearth-stainless-bottle');
    const navy20 = p.variants.find((v) => v.id === 'hearth-stainless-bottle--navy-20oz')!;
    const [, capacity] = optionChoices(p, navy20);
    // navy-40oz is sold out, so 40 oz is only available in another colour.
    const forty = choice(capacity!.choices, '40oz');
    expect(forty.state).toBe('other-combination');
    expect(forty.target!.stock).toBeGreaterThan(0);
    expect(forty.target!.options.Capacity).toBe('40oz');
    expect(changedOptions(p, navy20, forty.target!, 'Capacity').map((o) => o.name)).toEqual(['Color']);
    expect(choice(capacity!.choices, '32oz').state).toBe('available');
  });

  it('only ever targets real, in-stock variants of the same product', () => {
    for (const p of productsById.values()) {
      for (const v of p.variants) {
        for (const { choices } of optionChoices(p, v)) {
          for (const c of choices) {
            if (c.state === 'unavailable') expect(c.target).toBeUndefined();
            else if (c.state !== 'selected') expect(p.variants.includes(c.target!) && c.target!.stock > 0).toBe(true);
          }
        }
      }
    }
  });
});
