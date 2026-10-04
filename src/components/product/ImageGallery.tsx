import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';
import { ProductImage } from '../ui/ProductImage';

export interface GalleryImage {
  src: string;
  /** Describes what this view shows, e.g. "Aurora headphones in Navy, angled view". */
  alt: string;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Main image + thumbnail strip.
 * - Touch: the main image is a swipeable, snapping strip; the thumbnails and the "2 / 4" counter follow the swipe.
 * - Mouse: hovering a thumbnail swaps the image instantly, like Amazon (recon §2.6); clicking does too.
 * - Keyboard: thumbnails are buttons; ←/→ move between them and show that image.
 * Mount with key={first image} so a variant change starts again from its main image.
 */
export function ImageGallery({ images, label }: { images: GalleryImage[]; label: string }) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLUListElement>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  const settle = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  function show(i: number, smooth = true) {
    setIndex(i);
    const el = strip.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
  }

  // After a swipe settles, sync the active thumbnail with the image in view.
  function handleScroll() {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = strip.current;
      if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    }, 90);
  }

  function handleThumbKeys(e: KeyboardEvent, i: number) {
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? images.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = (next + images.length) % images.length;
    thumbs.current[target]?.focus();
    show(target);
  }

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-tile bg-image-bg">
        <ul ref={strip} onScroll={handleScroll} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.src} className="w-full shrink-0 snap-center" aria-hidden={i !== index}>
              <ProductImage src={img.src} alt={img.alt} priority={i === 0} className="p-[6%]" />
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <p className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-ink tabular-nums" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
        )}
      </div>

      {images.length > 1 && (
        <div role="group" aria-label="Choose an image" className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((img, i) => (
            <button
              key={img.src}
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && show(i, false)}
              onKeyDown={(e) => handleThumbKeys(e, i)}
              aria-label={`Show image ${i + 1} of ${images.length}: ${img.alt}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'overflow-hidden rounded-lg border-2 bg-image-bg transition-colors',
                i === index ? 'border-focus' : 'border-transparent hover:border-line',
              )}
            >
              <ProductImage src={img.src} alt="" className="p-1" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
