import type { Cents } from '../lib/money';

export type CategoryId = 'electronics' | 'home-kitchen' | 'fashion' | 'sports' | 'books';

export interface Category {
  id: CategoryId;
  name: string;
  /** Short line used on category tiles. */
  tagline: string;
  /** Representative product whose main image is used on the category tile. */
  heroProductId: string;
}

/** Which drawing the image generator uses for this product (see scripts/generate-images.ts). */
export type ArtKind =
  | 'headphones' | 'earbuds' | 'speaker' | 'smartwatch' | 'keyboard' | 'mouse' | 'powerbank'
  | 'bottle' | 'mug' | 'lamp' | 'pan' | 'kettle'
  | 'backpack' | 'sling' | 'sneaker' | 'tshirt' | 'cap' | 'sunglasses'
  | 'yogamat' | 'dumbbell' | 'jumprope'
  | 'book';

export type OptionName = 'Color' | 'Size' | 'Capacity' | 'Format';

export interface OptionValue {
  id: string;
  label: string;
  /** Hex colour for Color options; also drives the generated product art. */
  swatch?: string;
}

export interface ProductOption {
  name: OptionName;
  values: OptionValue[];
}

export interface Variant {
  id: string;
  /** Option name -> option value id, e.g. { Color: 'black', Size: 'm' }. */
  options: Partial<Record<OptionName, string>>;
  price: Cents;
  /** Pre-discount "List" price. Omitted when the item is not discounted. */
  listPrice?: Cents;
  stock: number;
  /** Ordered gallery image URLs (first is the main image). */
  images: string[];
}

export interface Review {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string; // ISO date
  verified: boolean;
}

export type Badge = 'best-seller' | 'top-rated' | 'new' | 'limited-deal';

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: CategoryId;
  /** Narrower type used for filtering and search, e.g. "Headphones". */
  type: string;
  /** 3 short benefit phrases shown in the gallery feature image and on the product page. */
  callouts: [string, string, string];
  /** "About this item" bullets. */
  bullets: string[];
  /** Key/value spec table. */
  specs: Array<[string, string]>;
  rating: number; // 0-5, one decimal
  reviewCount: number;
  /** Percent of ratings per star, index 0 = 5 stars ... index 4 = 1 star. Sums to 100. */
  ratingBreakdown: [number, number, number, number, number];
  reviews: Review[];
  boughtLastMonth?: number;
  badges: Badge[];
  /** ISO date used for "Newest arrivals" sort. */
  releasedAt: string;
  /** Extra search terms. */
  keywords: string[];
  art: { kind: ArtKind; /** Secondary colour used in the art (straps, soles, labels). */ trim?: string };
  options: ProductOption[];
  variants: Variant[];
  defaultVariantId: string;
}
