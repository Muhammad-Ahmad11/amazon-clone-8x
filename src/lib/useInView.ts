import { useEffect, useState } from 'react';

/**
 * Tracks whether an element is on screen. Returns a callback ref, so it follows the element even when it
 * mounts later (after data loads) or is swapped for another (e.g. a disabled button becoming a link).
 * Reports true until the first observation (and while nothing is attached) so nothing flashes on load.
 */
export function useInView<T extends Element>(): [(el: T | null) => void, boolean] {
  const [element, setElement] = useState<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)));
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(true);
    };
  }, [element]);

  return [setElement, inView];
}
