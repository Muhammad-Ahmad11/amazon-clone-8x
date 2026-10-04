import type { Product } from '../../data/types';
import { formatCount } from '../../lib/format';
import { Icon } from '../ui/Icon';
import { Stars } from '../ui/StarRating';

const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/**
 * Read-only ratings: the average, the star breakdown and a few reviews. Amazon adds review filters, images,
 * "helpful" votes, Q&A and AI summaries; at this stage a shopper mostly needs "do people like it, and why?".
 */
export function ReviewsSummary({ product }: { product: Product }) {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28 grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-10">
      <div>
        <h2 id="reviews-heading" className="text-xl font-bold">
          Customer reviews
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <Stars rating={product.rating} size={20} />
          <p className="text-lg font-semibold">{product.rating.toFixed(1)} out of 5</p>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{formatCount(product.reviewCount)} ratings</p>
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Share of ratings by star level</caption>
          <tbody>
            {product.ratingBreakdown.map((pct, i) => (
              <tr key={i}>
                <th scope="row" className="w-14 py-1 pr-2 text-left font-normal whitespace-nowrap">
                  {5 - i} star
                </th>
                <td className="py-1">
                  <div className="h-4 overflow-hidden rounded-sm border border-line bg-canvas-soft" aria-hidden="true">
                    <div className="h-full bg-star" style={{ width: `${pct}%` }} />
                  </div>
                </td>
                <td className="w-12 py-1 pl-2 text-right text-ink-muted tabular-nums">{pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-base font-bold">Top reviews</h3>
        <ul className="mt-3 flex flex-col gap-5">
          {product.reviews.map((r) => (
            <li key={r.id} className="border-b border-line-soft pb-5 last:border-0 last:pb-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="grid size-7 place-items-center rounded-full bg-canvas text-ink-muted" aria-hidden="true">
                  <Icon name="user" size={16} />
                </span>
                {r.author}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2">
                <span role="img" aria-label={`${r.rating} out of 5 stars`}>
                  <Stars rating={r.rating} size={15} />
                </span>
                <span className="font-semibold">{r.title}</span>
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Reviewed on {formatDate(r.date)}
                {r.verified && <span className="font-semibold text-[#c45500]"> · Verified purchase</span>}
              </p>
              <p className="mt-1.5 text-sm leading-6">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
