import type { Product } from '../../data/types';

/** "ADAPTIVE NOISE CANCELLING: Six microphones…" -> a bold lead-in and the sentence, easier to scan than shouting caps. */
function splitBullet(text: string): { lead?: string; body: string } {
  const at = text.indexOf(':');
  if (at > 0 && at < 40 && text.slice(0, at) === text.slice(0, at).toUpperCase()) {
    const lead = text.slice(0, at).toLowerCase();
    return { lead: lead.charAt(0).toUpperCase() + lead.slice(1), body: text.slice(at + 1).trim() };
  }
  return { body: text };
}

/** "About this item" bullets and the spec table: the two parts of Amazon's page that answer "is it right for me?". */
export function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-xl font-bold">
          About this item
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-6 marker:text-ink-subtle">
          {product.bullets.map((b) => {
            const { lead, body } = splitBullet(b);
            return (
              <li key={b}>
                {lead && <span className="font-semibold">{lead}: </span>}
                {body}
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="specs-heading">
        <h2 id="specs-heading" className="text-xl font-bold">
          Specifications
        </h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {[['Brand', product.brand], ...product.specs].map(([k, v]) => (
              <tr key={k} className="border-b border-line-soft last:border-0">
                <th scope="row" className="w-2/5 py-2.5 pr-4 text-left align-top font-semibold text-ink-muted">
                  {k}
                </th>
                <td className="py-2.5 align-top">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
