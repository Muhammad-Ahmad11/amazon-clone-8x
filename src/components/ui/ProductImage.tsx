import { useState } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from './Icon';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Eager-load images that are above the fold (e.g. the product page main image). */
  priority?: boolean;
}

/** Square product image on a neutral background, with a graceful fallback if the file fails to load. */
export function ProductImage({ src, alt, className, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative aspect-square overflow-hidden bg-image-bg', className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center text-ink-subtle" role="img" aria-label={`${alt} (image unavailable)`}>
          <Icon name="package" size={40} strokeWidth={1.4} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-contain mix-blend-multiply"
        />
      )}
    </div>
  );
}
