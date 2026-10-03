/*
  Curated local catalogue.
  Brands, book titles and authors are fictional. Product images are generated SVG
  art written to public/images/products by scripts/generate-images.ts, which imports this file.
  Keep this module free of runtime imports so Node can load it directly (type stripping).
*/
import type { Badge, Category, OptionName, Product, ProductOption, Review, Variant } from './types';

export const IMAGE_VIEWS = 4;

export const categories: Category[] = [
  { id: 'electronics', name: 'Electronics', tagline: 'Audio, wearables & desk gear', heroProductId: 'aurora-anc-headphones' },
  { id: 'home-kitchen', name: 'Home & Kitchen', tagline: 'Everyday essentials, done well', heroProductId: 'hearth-stainless-bottle' },
  { id: 'fashion', name: 'Fashion', tagline: 'Bags, shoes & accessories', heroProductId: 'trailform-daypack' },
  { id: 'sports', name: 'Sports & Fitness', tagline: 'Train at home or on the move', heroProductId: 'flowline-yoga-mat' },
  { id: 'books', name: 'Books', tagline: 'Page-turners & new releases', heroProductId: 'book-tidewater' },
];

/* ---------------------------------------------------------------------------------------------- */

type ColorDef = [id: string, label: string, hex: string];
type ValueDef = [id: string, label: string, priceDelta?: number];

interface ProductDef {
  id: string;
  title: string;
  brand: string;
  category: Product['category'];
  type: string;
  art: Product['art'];
  /** Dollars. */
  price: number;
  /** Dollars; omit when not discounted. */
  listPrice?: number;
  colors?: ColorDef[];
  /** Per-colour price difference in dollars. */
  colorPrice?: Record<string, number>;
  second?: { name: Exclude<OptionName, 'Color'>; values: ValueDef[] };
  /** Variant-id suffix (e.g. "black" or "black-m") -> stock. Default stock is 24. */
  stock?: Record<string, number>;
  callouts: [string, string, string];
  bullets: string[];
  specs: Array<[string, string]>;
  rating: number;
  reviewCount: number;
  boughtLastMonth?: number;
  badges?: Badge[];
  releasedAt: string;
  keywords: string[];
}

const toCents = (dollars: number) => Math.round(dollars * 100);

/** Small deterministic PRNG so generated reviews are stable between builds. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function breakdownFor(rating: number): Product['ratingBreakdown'] {
  // Skewed distribution whose weighted mean approximates `rating`.
  const five = Math.max(20, Math.min(90, Math.round((rating - 3.4) * 50 + 22)));
  const four = Math.round((100 - five) * 0.55);
  const three = Math.round((100 - five - four) * 0.5);
  const two = Math.round((100 - five - four - three) * 0.45);
  const one = 100 - five - four - three - two;
  return [five, four, three, two, one];
}

const REVIEWERS = ['Priya S.', 'Daniel K.', 'Amina R.', 'Marcus T.', 'Lena W.', 'Omar F.', 'Chloe B.', 'Hiro N.', 'Grace O.', 'Tomás P.', 'Sara M.', 'Ben L.'];
const REVIEW_TEMPLATES: Array<{ rating: Review['rating']; title: string; body: string }> = [
  { rating: 5, title: 'Exactly what I was looking for', body: 'Arrived quickly and feels better made than the price suggests. I have used it every day for a few weeks and would happily buy it again.' },
  { rating: 5, title: 'Great value', body: 'Compared a few options before choosing this one. It does what the listing says, the finish is clean and it was easy to get started.' },
  { rating: 4, title: 'Very good, one small gripe', body: 'Quality is solid and it works well. Knocked off one star because the packaging was more than it needed to be, but the product itself is great.' },
  { rating: 4, title: 'Does the job well', body: 'No surprises, which is what you want. Matches the photos and the description. Would recommend for everyday use.' },
  { rating: 3, title: 'Fine, but not perfect', body: 'It is okay for the price. Build quality is decent, though I expected it to feel a little more premium after reading other reviews.' },
  { rating: 5, title: 'Bought a second one', body: 'Liked it so much I bought another as a gift. Holding up well after regular use and still looks new.' },
  { rating: 2, title: 'Not for me', body: 'Nothing wrong with it exactly, it just did not suit how I planned to use it. Returning was straightforward.' },
];

function reviewsFor(def: ProductDef): Review[] {
  const rand = seeded(def.id);
  const picks = new Set<number>();
  // Bias towards the product's overall rating: always include one top review.
  picks.add(rand() < 0.5 ? 0 : 1);
  while (picks.size < 3) picks.add(Math.floor(rand() * REVIEW_TEMPLATES.length));
  return [...picks].map((t, i) => {
    const tpl = REVIEW_TEMPLATES[t]!;
    const day = 1 + Math.floor(rand() * 27);
    const month = 1 + Math.floor(rand() * 9);
    return {
      id: `${def.id}-r${i + 1}`,
      author: REVIEWERS[Math.floor(rand() * REVIEWERS.length)]!,
      rating: tpl.rating,
      title: tpl.title,
      body: tpl.body,
      date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      verified: rand() > 0.2,
    };
  });
}

export function imagePath(productId: string, colorId: string, view: number): string {
  return `/images/products/${productId}/${colorId}-${view}.svg`;
}

function build(def: ProductDef): Product {
  const colors: ColorDef[] = def.colors ?? [['default', 'Default', '#888888']];
  const hasColor = Boolean(def.colors);
  const seconds: ValueDef[] = def.second?.values ?? [['', '']];

  const options: ProductOption[] = [];
  if (hasColor) options.push({ name: 'Color', values: colors.map(([id, label, swatch]) => ({ id, label, swatch })) });
  if (def.second) options.push({ name: def.second.name, values: def.second.values.map(([id, label]) => ({ id, label })) });

  const variants: Variant[] = [];
  for (const [colorId] of colors) {
    for (const [secondId, , delta = 0] of seconds) {
      const suffix = [hasColor ? colorId : '', secondId].filter(Boolean).join('-') || 'default';
      const extra = delta + (def.colorPrice?.[colorId] ?? 0);
      const opts: Variant['options'] = {};
      if (hasColor) opts.Color = colorId;
      if (def.second) opts[def.second.name] = secondId;
      variants.push({
        id: `${def.id}--${suffix}`,
        options: opts,
        price: toCents(def.price + extra),
        listPrice: def.listPrice ? toCents(def.listPrice + extra) : undefined,
        stock: def.stock?.[suffix] ?? 24,
        images: Array.from({ length: IMAGE_VIEWS }, (_, v) => imagePath(def.id, colorId, v + 1)),
      });
    }
  }

  return {
    id: def.id,
    title: def.title,
    brand: def.brand,
    category: def.category,
    type: def.type,
    callouts: def.callouts,
    bullets: def.bullets,
    specs: def.specs,
    rating: def.rating,
    reviewCount: def.reviewCount,
    ratingBreakdown: breakdownFor(def.rating),
    reviews: reviewsFor(def),
    boughtLastMonth: def.boughtLastMonth,
    badges: def.badges ?? [],
    releasedAt: def.releasedAt,
    keywords: def.keywords,
    art: def.art,
    options,
    variants,
    defaultVariantId: variants.find((v) => v.stock > 0)?.id ?? variants[0]!.id,
  };
}

/* ---------------------------------------------------------------------------------------------- */

const BLACK: ColorDef = ['black', 'Midnight Black', '#2b2f36'];
const WHITE: ColorDef = ['white', 'Cloud White', '#eceff1'];
const NAVY: ColorDef = ['navy', 'Navy', '#24375a'];
const SAGE: ColorDef = ['sage', 'Sage', '#8faa8b'];
const SAND: ColorDef = ['sand', 'Sand', '#c9b79c'];
const ROSE: ColorDef = ['rose', 'Rose', '#d99aa5'];
const BLUE: ColorDef = ['blue', 'Ocean Blue', '#2f78b7'];
const RED: ColorDef = ['red', 'Ember Red', '#c4372f'];
const GRAPHITE: ColorDef = ['graphite', 'Graphite', '#55595f'];
const OLIVE: ColorDef = ['olive', 'Olive', '#6b7347'];
const TEAL: ColorDef = ['teal', 'Teal', '#1f8a8a'];
const LILAC: ColorDef = ['lilac', 'Lilac', '#a996c9'];
const ORANGE: ColorDef = ['orange', 'Sunset Orange', '#e8743b'];

const SIZES_SHOES: ValueDef[] = [['7', 'US 7'], ['8', 'US 8'], ['9', 'US 9'], ['10', 'US 10'], ['11', 'US 11'], ['12', 'US 12']];
const SIZES_APPAREL: ValueDef[] = [['xs', 'XS'], ['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL'], ['xxl', 'XXL', 2]];
const BOOK_FORMATS: ValueDef[] = [['paperback', 'Paperback'], ['hardcover', 'Hardcover', 9], ['ebook', 'eBook', -6]];

const defs: ProductDef[] = [
  /* ---------------------------------------- Electronics --------------------------------------- */
  {
    id: 'aurora-anc-headphones',
    title: 'Aurora ANC Wireless Over-Ear Headphones with Adaptive Noise Cancelling, 50-Hour Battery and Multipoint Bluetooth 5.4',
    brand: 'Northwind Audio',
    category: 'electronics',
    type: 'Headphones',
    art: { kind: 'headphones', trim: '#c9ccd1' },
    price: 129.99,
    listPrice: 179.99,
    colors: [BLACK, WHITE, NAVY, SAGE],
    colorPrice: { sage: 10 },
    stock: { navy: 3, sage: 0 },
    callouts: ['Adaptive noise cancelling', '50-hour battery life', 'Connect two devices at once'],
    bullets: [
      'ADAPTIVE NOISE CANCELLING: Six microphones tune cancellation to your surroundings, so commutes and open offices fade into the background.',
      'ALL-WEEK BATTERY: Up to 50 hours with ANC on. A 10-minute charge gives 5 hours of playback.',
      'MULTIPOINT: Stay connected to your laptop and phone at the same time and switch automatically when a call comes in.',
      'ALL-DAY COMFORT: Memory-foam cushions and a 250 g frame keep pressure low during long sessions.',
      'CLEAR CALLS: Beamforming mics isolate your voice from wind and background chatter.',
    ],
    specs: [['Connectivity', 'Bluetooth 5.4, USB-C, 3.5 mm'], ['Battery life', '50 hours (ANC on)'], ['Weight', '250 g'], ['Noise control', 'Adaptive ANC, Transparency'], ['In the box', 'Headphones, case, USB-C cable, audio cable']],
    rating: 4.6,
    reviewCount: 18342,
    boughtLastMonth: 10000,
    badges: ['best-seller', 'limited-deal'],
    releasedAt: '2026-03-14',
    keywords: ['wireless headphones', 'noise cancelling', 'bluetooth', 'over ear', 'anc'],
  },
  {
    id: 'pulse-on-ear-headphones',
    title: 'Pulse Lightweight On-Ear Bluetooth Headphones, Foldable, 35-Hour Playtime, Built-in Mic',
    brand: 'Voltix',
    category: 'electronics',
    type: 'Headphones',
    art: { kind: 'headphones', trim: '#9aa0a6' },
    price: 39.99,
    listPrice: 49.99,
    colors: [BLACK, BLUE, ROSE],
    callouts: ['Folds flat for travel', '35-hour playtime', 'Built-in microphone'],
    bullets: [
      'LIGHT AND FOLDABLE: At 165 g, it folds into a pocket-sized shape for bags and backpacks.',
      '35 HOURS OF MUSIC: Enough for a week of commuting on a single charge.',
      'HANDS-FREE CALLS: Built-in microphone and on-cup controls for calls and voice assistants.',
      'WIRED BACKUP: Use the included cable when the battery runs out.',
    ],
    specs: [['Connectivity', 'Bluetooth 5.3, 3.5 mm'], ['Battery life', '35 hours'], ['Weight', '165 g'], ['Noise control', 'Passive isolation']],
    rating: 4.3,
    reviewCount: 6521,
    boughtLastMonth: 3000,
    releasedAt: '2025-11-02',
    keywords: ['wireless headphones', 'on ear', 'bluetooth', 'foldable', 'cheap headphones'],
  },
  {
    id: 'echo-buds-pro',
    title: 'EchoBuds Pro True Wireless Earbuds with Active Noise Cancelling, Wireless Charging Case, IPX5',
    brand: 'Northwind Audio',
    category: 'electronics',
    type: 'Earbuds',
    art: { kind: 'earbuds' },
    price: 89.99,
    listPrice: 119.99,
    colors: [BLACK, WHITE, SAGE],
    callouts: ['Active noise cancelling', '32 hours with case', 'Sweat & splash resistant'],
    bullets: [
      'BIG SOUND, SMALL BUDS: 11 mm drivers tuned for clear vocals and deep, controlled bass.',
      'NOISE CANCELLING: Hybrid ANC blocks engine hum and chatter; Transparency mode lets the world back in.',
      '32 HOURS TOTAL: 8 hours per charge plus 3 extra charges in the wireless case.',
      'IPX5: Ready for workouts, rain and sweaty commutes.',
    ],
    specs: [['Connectivity', 'Bluetooth 5.4'], ['Battery life', '8 h (32 h with case)'], ['Water resistance', 'IPX5'], ['Charging', 'USB-C, Qi wireless']],
    rating: 4.4,
    reviewCount: 9210,
    boughtLastMonth: 5000,
    badges: ['top-rated'],
    releasedAt: '2026-05-20',
    keywords: ['earbuds', 'wireless earbuds', 'true wireless', 'noise cancelling', 'airpods alternative'],
  },
  {
    id: 'sprint-sport-earbuds',
    title: 'Sprint Sport Wireless Earbuds with Secure Ear Hooks, 40-Hour Battery, IPX7 Waterproof',
    brand: 'Voltix',
    category: 'electronics',
    type: 'Earbuds',
    art: { kind: 'earbuds' },
    price: 34.99,
    colors: [BLACK, BLUE, ORANGE],
    callouts: ['Ear hooks stay put', '40-hour total battery', 'IPX7 waterproof'],
    bullets: [
      'BUILT FOR MOVEMENT: Flexible ear hooks keep the buds in place through sprints and burpees.',
      'IPX7 WATERPROOF: Rinse them off after a sweaty session.',
      '40 HOURS: 10 hours per charge with 3 top-ups from the case.',
    ],
    specs: [['Connectivity', 'Bluetooth 5.3'], ['Battery life', '10 h (40 h with case)'], ['Water resistance', 'IPX7']],
    rating: 4.2,
    reviewCount: 3874,
    boughtLastMonth: 2000,
    releasedAt: '2025-08-18',
    keywords: ['earbuds', 'sport earbuds', 'running', 'workout', 'waterproof'],
  },
  {
    id: 'boom-mini-speaker',
    title: 'Boom Mini Portable Bluetooth Speaker, 360° Sound, Waterproof IP67, 20-Hour Battery',
    brand: 'Voltix',
    category: 'electronics',
    type: 'Speakers',
    art: { kind: 'speaker' },
    price: 49.99,
    listPrice: 59.99,
    colors: [BLACK, TEAL, RED, LILAC],
    stock: { lilac: 4 },
    callouts: ['360° room-filling sound', 'Waterproof & floats', '20-hour battery'],
    bullets: [
      '360° SOUND: Speakers on every side mean no bad seat at the party.',
      'IP67 WATERPROOF: Dust-proof, drop-tested and it floats.',
      '20 HOURS: Plays all day and into the night.',
      'PAIR TWO: Link two speakers for true stereo.',
    ],
    specs: [['Connectivity', 'Bluetooth 5.3'], ['Battery life', '20 hours'], ['Water resistance', 'IP67'], ['Weight', '540 g']],
    rating: 4.7,
    reviewCount: 22105,
    boughtLastMonth: 8000,
    badges: ['best-seller'],
    releasedAt: '2025-06-10',
    keywords: ['speaker', 'bluetooth speaker', 'portable speaker', 'waterproof speaker'],
  },
  {
    id: 'stride-smartwatch',
    title: 'Stride Fitness Smartwatch with AMOLED Display, Heart Rate, Sleep Tracking, GPS and 10-Day Battery',
    brand: 'Kitewell',
    category: 'electronics',
    type: 'Wearables',
    art: { kind: 'smartwatch' },
    price: 149.0,
    listPrice: 199.0,
    colors: [BLACK, SAND, NAVY],
    callouts: ['Built-in GPS', '10-day battery', 'Heart rate & sleep'],
    bullets: [
      'BRIGHT AMOLED: 1.4" always-on display stays readable in direct sun.',
      'BUILT-IN GPS: Track runs and rides without your phone.',
      'HEALTH INSIGHTS: 24/7 heart rate, SpO2, stress and sleep stages.',
      '10-DAY BATTERY: Charge once a week, or less.',
    ],
    specs: [['Display', '1.4" AMOLED'], ['Battery life', 'Up to 10 days'], ['Water resistance', '5 ATM'], ['Sensors', 'HR, SpO2, GPS, accelerometer']],
    rating: 4.3,
    reviewCount: 4102,
    boughtLastMonth: 1000,
    badges: ['new'],
    releasedAt: '2026-08-30',
    keywords: ['smartwatch', 'fitness tracker', 'watch', 'gps watch'],
  },
  {
    id: 'keyline-mechanical-keyboard',
    title: 'Keyline 75% Wireless Mechanical Keyboard, Hot-Swappable Tactile Switches, Bluetooth & USB-C',
    brand: 'Kitewell',
    category: 'electronics',
    type: 'Computer Accessories',
    art: { kind: 'keyboard', trim: '#e9e4da' },
    price: 89.0,
    colors: [GRAPHITE, WHITE],
    callouts: ['Hot-swappable switches', 'Wireless + wired', 'Compact 75% layout'],
    bullets: [
      'COMPACT 75%: Keeps arrow and function keys while freeing up mouse space.',
      'HOT-SWAPPABLE: Change switches without soldering.',
      'THREE WAYS TO CONNECT: Bluetooth (3 devices), 2.4 GHz or USB-C.',
    ],
    specs: [['Layout', '75%, 84 keys'], ['Switches', 'Tactile, hot-swappable'], ['Connectivity', 'Bluetooth, 2.4 GHz, USB-C'], ['Battery', '4000 mAh']],
    rating: 4.5,
    reviewCount: 2876,
    releasedAt: '2026-01-22',
    keywords: ['keyboard', 'mechanical keyboard', 'wireless keyboard', 'computer accessories'],
  },
  {
    id: 'glide-wireless-mouse',
    title: 'Glide Silent Wireless Mouse, Ergonomic, Rechargeable, Multi-Device',
    brand: 'Everyday Basics',
    category: 'electronics',
    type: 'Computer Accessories',
    art: { kind: 'mouse' },
    price: 19.99,
    listPrice: 24.99,
    colors: [GRAPHITE, WHITE, ROSE],
    callouts: ['Silent clicks', 'USB-C rechargeable', 'Switch between 3 devices'],
    bullets: [
      'SILENT CLICKS: 90% quieter than standard mice, ideal for shared spaces.',
      'RECHARGEABLE: Up to 3 months per charge over USB-C.',
      'MULTI-DEVICE: Pair three computers and switch with one button.',
    ],
    specs: [['Connectivity', 'Bluetooth, 2.4 GHz'], ['DPI', '800-2400'], ['Battery', 'Rechargeable, ~3 months']],
    rating: 4.4,
    reviewCount: 12930,
    boughtLastMonth: 6000,
    badges: ['best-seller'],
    releasedAt: '2025-04-04',
    keywords: ['mouse', 'wireless mouse', 'computer accessories', 'silent mouse'],
  },
  {
    id: 'volt-power-bank',
    title: 'Volt 20,000mAh Power Bank, 65W USB-C Fast Charging, Charges Laptops and Phones',
    brand: 'Voltix',
    category: 'electronics',
    type: 'Chargers',
    art: { kind: 'powerbank' },
    price: 45.99,
    colors: [BLACK, WHITE],
    stock: { white: 0 },
    callouts: ['65W laptop charging', '20,000mAh capacity', 'Charge 3 devices at once'],
    bullets: [
      'LAPTOP-READY: 65 W USB-C output charges most laptops, tablets and phones.',
      'HUGE CAPACITY: About 4 full phone charges.',
      'THREE PORTS: Two USB-C and one USB-A.',
      'FLIGHT FRIENDLY: Under the 100 Wh carry-on limit.',
    ],
    specs: [['Capacity', '20,000 mAh / 74 Wh'], ['Max output', '65 W'], ['Ports', '2x USB-C, 1x USB-A'], ['Weight', '380 g']],
    rating: 4.6,
    reviewCount: 7655,
    boughtLastMonth: 4000,
    releasedAt: '2025-10-12',
    keywords: ['power bank', 'portable charger', 'battery pack', 'usb c charger'],
  },

  /* --------------------------------------- Home & Kitchen -------------------------------------- */
  {
    id: 'hearth-stainless-bottle',
    title: 'Hearth Insulated Stainless Steel Water Bottle, Leak-Proof Lid, Keeps Drinks Cold 24h / Hot 12h',
    brand: 'Hearth & Co.',
    category: 'home-kitchen',
    type: 'Water Bottles',
    art: { kind: 'bottle' },
    price: 24.99,
    listPrice: 29.99,
    colors: [SAND, SAGE, NAVY, BLACK],
    second: { name: 'Capacity', values: [['20oz', '20 oz'], ['32oz', '32 oz', 6], ['40oz', '40 oz', 9]] },
    stock: { 'navy-40oz': 0, 'sage-20oz': 3 },
    callouts: ['Cold 24h, hot 12h', '100% leak-proof lid', 'Fits car cup holders'],
    bullets: [
      'DOUBLE-WALL INSULATION: Ice stays frozen through a summer day; coffee stays hot through the morning.',
      'LEAK-PROOF: Throw it in your bag. The lid seals completely.',
      'CUP-HOLDER FRIENDLY: The 20 oz and 32 oz sizes fit standard car cup holders.',
      'BPA-FREE: Food-grade 18/8 stainless steel. No metallic taste.',
    ],
    specs: [['Material', '18/8 stainless steel'], ['Insulation', 'Double-wall vacuum'], ['Dishwasher safe', 'Lid only'], ['BPA free', 'Yes']],
    rating: 4.7,
    reviewCount: 31250,
    boughtLastMonth: 9000,
    badges: ['best-seller'],
    releasedAt: '2025-03-01',
    keywords: ['water bottle', 'insulated bottle', 'stainless steel bottle', 'flask', 'thermos'],
  },
  {
    id: 'everyday-glass-bottle',
    title: 'Everyday Basics Glass Water Bottle with Silicone Sleeve and Bamboo Lid, 18 oz',
    brand: 'Everyday Basics',
    category: 'home-kitchen',
    type: 'Water Bottles',
    art: { kind: 'bottle', trim: '#b88b5a' },
    price: 14.99,
    colors: [SAGE, ROSE, TEAL],
    callouts: ['Pure glass, no aftertaste', 'Protective silicone sleeve', 'Dishwasher safe'],
    bullets: [
      'PURE TASTE: Borosilicate glass keeps water tasting like water.',
      'PROTECTED: A grippy silicone sleeve absorbs knocks.',
      'EASY CLEAN: Bottle and sleeve are dishwasher safe.',
    ],
    specs: [['Material', 'Borosilicate glass'], ['Capacity', '18 oz / 530 ml'], ['Dishwasher safe', 'Yes (not lid)']],
    rating: 4.4,
    reviewCount: 5410,
    releasedAt: '2025-07-15',
    keywords: ['water bottle', 'glass bottle', 'reusable bottle'],
  },
  {
    id: 'commuter-travel-mug',
    title: 'Commuter Insulated Travel Mug with One-Hand Flip Lid, 16 oz, Spill-Proof',
    brand: 'Hearth & Co.',
    category: 'home-kitchen',
    type: 'Mugs & Tumblers',
    art: { kind: 'mug' },
    price: 21.99,
    listPrice: 26.99,
    colors: [BLACK, WHITE, RED, SAGE],
    callouts: ['One-hand flip lid', 'Hot for 6 hours', 'Spill-proof seal'],
    bullets: [
      'ONE-HAND LID: Press to sip, click to seal. Built for the drive to work.',
      'HOT FOR HOURS: Keeps coffee hot for 6 hours and iced drinks cold for 18.',
      'SPILL-PROOF: Locks shut so it can ride in your bag.',
    ],
    specs: [['Capacity', '16 oz / 470 ml'], ['Material', 'Stainless steel'], ['Dishwasher safe', 'Lid only']],
    rating: 4.5,
    reviewCount: 8740,
    boughtLastMonth: 3000,
    releasedAt: '2025-09-09',
    keywords: ['travel mug', 'coffee mug', 'tumbler', 'insulated mug'],
  },
  {
    id: 'stoneware-mug-set',
    title: 'Stoneware Coffee Mug Set of 4, 14 oz, Reactive Glaze, Microwave & Dishwasher Safe',
    brand: 'Hearth & Co.',
    category: 'home-kitchen',
    type: 'Mugs & Tumblers',
    art: { kind: 'mug', trim: '#f2ede4' },
    price: 32.0,
    colors: [TEAL, SAND, NAVY],
    callouts: ['Set of 4 mugs', 'Microwave safe', 'Dishwasher safe'],
    bullets: [
      'SET OF FOUR: Generous 14 oz mugs for coffee, tea or soup.',
      'REACTIVE GLAZE: Each mug has its own subtle variation.',
      'EVERYDAY TOUGH: Microwave, oven and dishwasher safe.',
    ],
    specs: [['Pieces', '4 mugs'], ['Capacity', '14 oz each'], ['Material', 'Stoneware']],
    rating: 4.8,
    reviewCount: 2204,
    badges: ['top-rated'],
    releasedAt: '2026-02-11',
    keywords: ['mug', 'coffee mug', 'mug set', 'ceramic'],
  },
  {
    id: 'halo-desk-lamp',
    title: 'Halo LED Desk Lamp with Wireless Charger, 5 Colour Temperatures, Eye-Caring Dimmable Light',
    brand: 'Kitewell',
    category: 'home-kitchen',
    type: 'Lighting',
    art: { kind: 'lamp' },
    price: 42.99,
    listPrice: 54.99,
    colors: [WHITE, BLACK],
    callouts: ['Built-in wireless charger', '5 colour modes', 'Flicker-free LEDs'],
    bullets: [
      'EYE-CARING LIGHT: Flicker-free LEDs with 5 colour temperatures and 7 brightness levels.',
      'WIRELESS CHARGING: The base charges Qi phones while you work.',
      'ADJUSTABLE: The arm and head both rotate, so the light goes where you need it.',
    ],
    specs: [['Power', '12 W'], ['Colour modes', '5 (2700K-6500K)'], ['Charging', '10 W Qi']],
    rating: 4.5,
    reviewCount: 3310,
    releasedAt: '2025-12-01',
    keywords: ['desk lamp', 'led lamp', 'lamp', 'lighting', 'wireless charger'],
  },
  {
    id: 'forge-nonstick-skillet',
    title: 'Forge Ceramic Nonstick Frying Pan, PFAS-Free, Induction Compatible, Oven Safe to 550°F',
    brand: 'Hearth & Co.',
    category: 'home-kitchen',
    type: 'Cookware',
    art: { kind: 'pan', trim: '#d8c7a8' },
    price: 34.99,
    listPrice: 44.99,
    colors: [GRAPHITE, SAGE, NAVY],
    second: { name: 'Size', values: [['8in', '8 inch'], ['10in', '10 inch', 8], ['12in', '12 inch', 14]] },
    callouts: ['PFAS-free ceramic coating', 'Works on induction', 'Oven safe to 550°F'],
    bullets: [
      'HEALTHY NONSTICK: Ceramic coating made without PFAS, PTFE or lead.',
      'EVERY HOB: Stainless base works on gas, electric and induction.',
      'OVEN SAFE: Start on the stove, finish in the oven up to 550°F.',
    ],
    specs: [['Coating', 'Ceramic, PFAS-free'], ['Compatible hobs', 'Gas, electric, induction'], ['Oven safe', 'Up to 550°F']],
    rating: 4.4,
    reviewCount: 6120,
    boughtLastMonth: 2000,
    badges: ['limited-deal'],
    releasedAt: '2025-05-05',
    keywords: ['frying pan', 'skillet', 'nonstick pan', 'cookware', 'pan'],
  },
  {
    id: 'brew-electric-kettle',
    title: 'Brew Variable Temperature Electric Kettle, 1.7L, Keep Warm, Stainless Steel',
    brand: 'Everyday Basics',
    category: 'home-kitchen',
    type: 'Kitchen Appliances',
    art: { kind: 'kettle' },
    price: 49.99,
    colors: [GRAPHITE, WHITE, SAGE],
    callouts: ['5 temperature presets', 'Boils in 4 minutes', 'Keeps warm 1 hour'],
    bullets: [
      'THE RIGHT TEMPERATURE: Presets for green tea, oolong, coffee and boil.',
      'FAST: Boils a full 1.7 L in about 4 minutes.',
      'KEEP WARM: Holds temperature for up to an hour.',
    ],
    specs: [['Capacity', '1.7 L'], ['Power', '1500 W'], ['Material', 'Stainless steel']],
    rating: 4.6,
    reviewCount: 4590,
    releasedAt: '2026-04-18',
    keywords: ['kettle', 'electric kettle', 'tea kettle', 'kitchen appliances'],
  },

  /* ------------------------------------------ Fashion ----------------------------------------- */
  {
    id: 'trailform-daypack',
    title: 'Trailform 24L Everyday Backpack, Water-Resistant, Padded 16" Laptop Sleeve',
    brand: 'Trailform',
    category: 'fashion',
    type: 'Backpacks',
    art: { kind: 'backpack', trim: '#e0b84a' },
    price: 59.0,
    listPrice: 75.0,
    colors: [BLACK, OLIVE, NAVY, SAND],
    stock: { sand: 2 },
    callouts: ['Fits a 16" laptop', 'Water-resistant fabric', 'Lifetime warranty'],
    bullets: [
      'ORGANISED: Padded 16" laptop sleeve, quick-grab front pocket and two bottle pockets.',
      'WEATHER-READY: Recycled water-resistant fabric and a storm flap over the zip.',
      'COMFORT: Ventilated back panel and padded straps.',
      'LIFETIME WARRANTY: Built to last and backed for life.',
    ],
    specs: [['Capacity', '24 L'], ['Laptop sleeve', 'Up to 16"'], ['Material', 'Recycled polyester'], ['Weight', '0.9 kg']],
    rating: 4.7,
    reviewCount: 11420,
    boughtLastMonth: 4000,
    badges: ['best-seller'],
    releasedAt: '2025-08-01',
    keywords: ['backpack', 'laptop backpack', 'bag', 'daypack', 'school bag'],
  },
  {
    id: 'metro-sling-pack',
    title: 'Metro Compact Sling Bag, Crossbody Chest Pack for Travel and Everyday Carry',
    brand: 'Trailform',
    category: 'fashion',
    type: 'Backpacks',
    art: { kind: 'sling', trim: '#9aa0a6' },
    price: 32.0,
    colors: [BLACK, SAND, TEAL],
    callouts: ['Wear as sling or chest pack', 'Anti-theft back pocket', 'Fits a 10" tablet'],
    bullets: [
      'HANDS-FREE: Wear it across the chest or on the back.',
      'SECURE: A hidden back pocket keeps your passport and phone close.',
      'JUST ENOUGH ROOM: Fits a 10" tablet, wallet, keys and a light layer.',
    ],
    specs: [['Capacity', '6 L'], ['Material', 'Nylon'], ['Weight', '0.35 kg']],
    rating: 4.5,
    reviewCount: 2988,
    releasedAt: '2026-06-03',
    keywords: ['sling bag', 'crossbody bag', 'bag', 'travel bag'],
  },
  {
    id: 'cloudstep-running-shoes',
    title: 'Cloudstep Men\'s Running Shoes, Lightweight Breathable Mesh, Cushioned Road Trainers',
    brand: 'Trailform',
    category: 'fashion',
    type: 'Shoes',
    art: { kind: 'sneaker', trim: '#ffffff' },
    price: 74.99,
    listPrice: 94.99,
    colors: [GRAPHITE, BLUE, WHITE],
    second: { name: 'Size', values: SIZES_SHOES },
    stock: { 'graphite-12': 0, 'blue-7': 0, 'blue-8': 2 },
    callouts: ['Responsive foam cushioning', 'Breathable knit upper', 'Only 240 g per shoe'],
    bullets: [
      'CUSHIONED: Responsive foam midsole returns energy on every stride.',
      'BREATHABLE: Engineered knit upper keeps feet cool on long runs.',
      'LIGHTWEIGHT: Just 240 g in a US 9.',
      'GRIPPY: Rubber outsole for wet and dry roads.',
    ],
    specs: [['Weight', '240 g (US 9)'], ['Drop', '8 mm'], ['Upper', 'Engineered knit']],
    rating: 4.4,
    reviewCount: 5367,
    boughtLastMonth: 2000,
    releasedAt: '2026-02-20',
    keywords: ['running shoes', 'sneakers', 'trainers', 'shoes', 'mens shoes'],
  },
  {
    id: 'canvas-low-sneakers',
    title: 'Everyday Canvas Low-Top Sneakers, Unisex, Classic Vulcanised Sole',
    brand: 'Everyday Basics',
    category: 'fashion',
    type: 'Shoes',
    art: { kind: 'sneaker', trim: '#f4f1ea' },
    price: 39.0,
    colors: [WHITE, BLACK, NAVY, RED],
    second: { name: 'Size', values: SIZES_SHOES },
    callouts: ['Classic low-top style', 'Cushioned insole', 'Unisex sizing'],
    bullets: [
      'TIMELESS: A clean low-top that goes with everything.',
      'COMFORT: Cushioned insole and padded collar.',
      'DURABLE: Vulcanised rubber sole and sturdy cotton canvas.',
    ],
    specs: [['Upper', 'Cotton canvas'], ['Sole', 'Vulcanised rubber'], ['Fit', 'True to size, unisex']],
    rating: 4.3,
    reviewCount: 8120,
    releasedAt: '2025-03-28',
    keywords: ['sneakers', 'canvas shoes', 'shoes', 'trainers', 'casual shoes'],
  },
  {
    id: 'essential-cotton-tee',
    title: 'Essential Organic Cotton Crew Neck T-Shirt, Relaxed Fit, Pre-Shrunk',
    brand: 'Everyday Basics',
    category: 'fashion',
    type: 'Clothing',
    art: { kind: 'tshirt' },
    price: 18.0,
    colors: [WHITE, BLACK, SAGE, NAVY, SAND],
    second: { name: 'Size', values: SIZES_APPAREL },
    stock: { 'sage-xs': 0, 'navy-xxl': 0 },
    callouts: ['100% organic cotton', 'Pre-shrunk', 'Relaxed everyday fit'],
    bullets: [
      'SOFT AND STURDY: Mid-weight 180 gsm organic cotton.',
      'PRE-SHRUNK: Keeps its size and shape wash after wash.',
      'RELAXED FIT: Room to move without looking boxy.',
    ],
    specs: [['Material', '100% organic cotton'], ['Weight', '180 gsm'], ['Care', 'Machine wash cold']],
    rating: 4.5,
    reviewCount: 14010,
    boughtLastMonth: 7000,
    badges: ['best-seller'],
    releasedAt: '2025-01-15',
    keywords: ['t-shirt', 'tee', 'shirt', 'cotton t shirt', 'clothing'],
  },
  {
    id: 'shade-baseball-cap',
    title: 'Shade Washed Cotton Baseball Cap, Adjustable Strap, Low Profile',
    brand: 'Trailform',
    category: 'fashion',
    type: 'Accessories',
    art: { kind: 'cap' },
    price: 16.0,
    colors: [NAVY, SAND, OLIVE, BLACK],
    callouts: ['Soft washed cotton', 'Adjustable fit', 'Low-profile shape'],
    bullets: [
      'BROKEN-IN FEEL: Garment-washed cotton is soft from day one.',
      'ADJUSTABLE: A brass buckle strap fits most heads.',
    ],
    specs: [['Material', '100% cotton'], ['Fit', 'Adjustable, one size']],
    rating: 4.6,
    reviewCount: 3402,
    releasedAt: '2025-05-22',
    keywords: ['cap', 'hat', 'baseball cap', 'accessories'],
  },
  {
    id: 'horizon-polarized-sunglasses',
    title: 'Horizon Polarized Sunglasses, UV400 Protection, Lightweight Acetate Frame',
    brand: 'Kitewell',
    category: 'fashion',
    type: 'Accessories',
    art: { kind: 'sunglasses', trim: '#2b3d33' },
    price: 45.0,
    listPrice: 60.0,
    colors: [BLACK, ['tortoise', 'Tortoise', '#8a5a35'], ['clear', 'Crystal', '#cfd6dc']],
    callouts: ['Polarized lenses', 'UV400 protection', 'Case included'],
    bullets: [
      'POLARIZED: Cuts glare from water, roads and snow.',
      'UV400: Blocks 100% of UVA and UVB rays.',
      'LIGHTWEIGHT: Plant-based acetate frame weighs just 24 g.',
    ],
    specs: [['Lens', 'Polarized, UV400'], ['Frame', 'Acetate'], ['Weight', '24 g']],
    rating: 4.4,
    reviewCount: 1980,
    badges: ['new'],
    releasedAt: '2026-07-12',
    keywords: ['sunglasses', 'polarized sunglasses', 'glasses', 'accessories'],
  },
  {
    id: 'aviator-classic-sunglasses',
    title: 'Classic Metal Aviator Sunglasses for Men and Women, Polarized, UV Protection',
    brand: 'Everyday Basics',
    category: 'fashion',
    type: 'Accessories',
    art: { kind: 'sunglasses', trim: '#3c4a3e' },
    price: 22.99,
    colors: [['gold', 'Gold', '#c9a24a'], ['silver', 'Silver', '#b8bdc4'], BLACK],
    callouts: ['Timeless aviator shape', 'Polarized lenses', 'Spring hinges'],
    bullets: [
      'ICONIC SHAPE: The aviator silhouette that suits most faces.',
      'COMFORT: Spring hinges and adjustable nose pads.',
    ],
    specs: [['Lens', 'Polarized'], ['Frame', 'Metal alloy']],
    rating: 4.2,
    reviewCount: 6650,
    releasedAt: '2025-04-30',
    keywords: ['sunglasses', 'aviator', 'glasses', 'accessories'],
  },

  /* ------------------------------------------ Sports ------------------------------------------ */
  {
    id: 'flowline-yoga-mat',
    title: 'Flowline Non-Slip Yoga Mat, 6mm Extra Thick, Alignment Lines, Carry Strap Included',
    brand: 'Kitewell',
    category: 'sports',
    type: 'Yoga',
    art: { kind: 'yogamat' },
    price: 29.99,
    listPrice: 39.99,
    colors: [LILAC, TEAL, SAGE, GRAPHITE],
    callouts: ['Non-slip both sides', '6 mm joint cushioning', 'Alignment guide lines'],
    bullets: [
      'GRIP THAT HOLDS: Textured on both sides so it stays put, even in hot yoga.',
      'CUSHIONED: 6 mm thickness protects knees and wrists.',
      'ALIGNMENT LINES: Printed guides help with posture and spacing.',
      'CARRY STRAP: Roll it up and go.',
    ],
    specs: [['Dimensions', '183 x 61 cm'], ['Thickness', '6 mm'], ['Material', 'TPE, latex-free']],
    rating: 4.6,
    reviewCount: 15880,
    boughtLastMonth: 5000,
    badges: ['best-seller'],
    releasedAt: '2025-02-02',
    keywords: ['yoga mat', 'exercise mat', 'fitness mat', 'yoga'],
  },
  {
    id: 'cork-travel-yoga-mat',
    title: 'Natural Cork Travel Yoga Mat, 2mm, Foldable, Lightweight',
    brand: 'Trailform',
    category: 'sports',
    type: 'Yoga',
    art: { kind: 'yogamat', trim: '#c49a6c' },
    price: 44.0,
    colors: [SAND],
    callouts: ['Natural cork surface', 'Folds to fit a suitcase', 'Only 1.1 kg'],
    bullets: [
      'NATURAL CORK: Grippier when you sweat and naturally antimicrobial.',
      'TRAVEL-FRIENDLY: Folds small enough for a carry-on.',
    ],
    specs: [['Thickness', '2 mm'], ['Weight', '1.1 kg'], ['Material', 'Cork and natural rubber']],
    rating: 4.3,
    reviewCount: 812,
    badges: ['new'],
    releasedAt: '2026-09-01',
    keywords: ['yoga mat', 'travel yoga mat', 'cork', 'yoga'],
  },
  {
    id: 'ironcore-adjustable-dumbbells',
    title: 'IronCore Adjustable Dumbbell Pair, 5-25 lb Each, Quick-Turn Weight Selector',
    brand: 'IronCore',
    category: 'sports',
    type: 'Strength Training',
    art: { kind: 'dumbbell' },
    price: 179.0,
    listPrice: 229.0,
    colors: [BLACK],
    stock: { black: 5 },
    callouts: ['Replaces 10 pairs of weights', 'Change weight in 2 seconds', 'Compact storage tray'],
    bullets: [
      'TEN PAIRS IN ONE: Dial from 5 to 25 lb in 2.5 lb steps.',
      'FAST CHANGES: Turn the dial and lift. The plates you don’t need stay in the tray.',
      'SPACE-SAVING: The whole set fits under a bed.',
    ],
    specs: [['Weight range', '5-25 lb each'], ['Increments', '2.5 lb'], ['Includes', '2 dumbbells, 2 trays']],
    rating: 4.7,
    reviewCount: 4420,
    boughtLastMonth: 1000,
    badges: ['top-rated', 'limited-deal'],
    releasedAt: '2025-09-25',
    keywords: ['dumbbells', 'weights', 'adjustable dumbbells', 'home gym', 'strength training'],
  },
  {
    id: 'grip-hex-dumbbell',
    title: 'Grip Rubber Hex Dumbbell, Single, Knurled Chrome Handle',
    brand: 'IronCore',
    category: 'sports',
    type: 'Strength Training',
    art: { kind: 'dumbbell', trim: '#b8bdc4' },
    price: 24.0,
    colors: [GRAPHITE],
    second: { name: 'Size', values: [['10lb', '10 lb'], ['15lb', '15 lb', 8], ['20lb', '20 lb', 15], ['30lb', '30 lb', 28]] },
    stock: { 'graphite-30lb': 0 },
    callouts: ['Hex shape won’t roll', 'Floor-friendly rubber', 'Knurled grip'],
    bullets: [
      'STAYS PUT: Hexagonal heads won’t roll away.',
      'FLOOR FRIENDLY: Rubber coating protects floors and cuts noise.',
    ],
    specs: [['Material', 'Cast iron, rubber coated'], ['Handle', 'Knurled chrome']],
    rating: 4.8,
    reviewCount: 9300,
    releasedAt: '2025-01-05',
    keywords: ['dumbbell', 'weights', 'hex dumbbell', 'strength training'],
  },
  {
    id: 'speedline-jump-rope',
    title: 'Speedline Adjustable Jump Rope with Ball Bearings and Foam Handles',
    brand: 'IronCore',
    category: 'sports',
    type: 'Cardio',
    art: { kind: 'jumprope' },
    price: 12.99,
    colors: [BLACK, ORANGE, BLUE],
    callouts: ['Smooth ball-bearing spin', 'Adjustable length', 'Comfort foam grips'],
    bullets: [
      'FAST AND SMOOTH: Ball bearings for tangle-free double-unders.',
      'ADJUSTABLE: Trim the cable to your height in seconds.',
    ],
    specs: [['Length', 'Up to 3 m, adjustable'], ['Handles', 'Foam']],
    rating: 4.5,
    reviewCount: 7020,
    boughtLastMonth: 3000,
    releasedAt: '2025-06-30',
    keywords: ['jump rope', 'skipping rope', 'cardio', 'fitness'],
  },
  {
    id: 'trail-sport-bottle',
    title: 'Trail Squeeze Sport Bottle, 24 oz, BPA-Free, High-Flow Valve',
    brand: 'Trailform',
    category: 'sports',
    type: 'Water Bottles',
    art: { kind: 'bottle', trim: '#2b2f36' },
    price: 11.99,
    colors: [BLUE, ORANGE, WHITE],
    callouts: ['High-flow squeeze valve', 'Lightweight & BPA-free', 'Fits bike cages'],
    bullets: [
      'HIGH FLOW: Squeeze for a fast drink mid-ride, without stopping.',
      'LIGHT: 85 g and BPA-free.',
    ],
    specs: [['Capacity', '24 oz / 710 ml'], ['Material', 'BPA-free LDPE']],
    rating: 4.4,
    reviewCount: 2210,
    releasedAt: '2026-04-02',
    keywords: ['water bottle', 'sport bottle', 'cycling bottle', 'squeeze bottle'],
  },

  /* ------------------------------------------- Books ------------------------------------------ */
  ...(
    [
      ['book-tidewater', 'The Tidewater Accord', 'Mara Ellison', 'A coastal town, a missing ledger and a promise kept for forty years.', '#1f4e6b', '#f2c14e', 4.6, 12880, 'Literary Fiction', ['best-seller']],
      ['book-signal-fires', 'Signal Fires', 'J. R. Okafor', 'A gripping near-future thriller about the last open radio frequency on Earth.', '#2b2f36', '#e8743b', 4.4, 8410, 'Thriller', ['new']],
      ['book-small-habits', 'Small Habits, Big Weeks', 'Dr. Lena Hartmann', 'A practical, research-backed guide to planning weeks that actually work.', '#f4efe6', '#c4372f', 4.7, 20540, 'Self-Help', ['best-seller']],
      ['book-garden-of-glass', 'The Garden of Glass', 'Sofia Marchetti', 'A sweeping family saga set in a Venetian glassworks across three generations.', '#7a3b5e', '#f0d7c3', 4.5, 5320, 'Historical Fiction', []],
      ['book-orbit-kitchen', 'Orbit Kitchen', 'Ray & June Park', '120 weeknight recipes inspired by street food from around the world.', '#e8743b', '#ffffff', 4.8, 3110, 'Cookbooks', ['top-rated']],
      ['book-quiet-machines', 'Quiet Machines', 'Anika Rao', 'How everyday algorithms shape the choices we think are ours.', '#16302b', '#7fd1ae', 4.3, 2750, 'Science & Tech', []],
      ['book-northern-lights', 'Under Northern Lights', 'Erik Lindqvist', 'A slow-burn romance between two rival guides in Arctic Norway.', '#24375a', '#a7d8f0', 4.2, 6780, 'Romance', []],
      ['book-little-fox', 'Little Fox Finds Home', 'Hana Ito', 'A gentle picture book about moving house and making new friends.', '#f2c14e', '#c4372f', 4.9, 4120, "Children's Books", ['top-rated']],
    ] as Array<[string, string, string, string, string, string, number, number, string, Badge[]]>
  ).map(([id, title, author, blurb, cover, ink, rating, reviews, genre, badges], i): ProductDef => ({
    id,
    title: /Fiction|Thriller|Romance/.test(genre) ? `${title}: A Novel` : title,
    brand: author,
    category: 'books',
    type: genre,
    art: { kind: 'book', trim: ink },
    price: 16.99 + (i % 3) * 2,
    listPrice: i % 2 === 0 ? 24.99 + (i % 3) * 2 : undefined,
    colors: [['cover', 'Standard', cover]],
    second: { name: 'Format', values: BOOK_FORMATS },
    callouts: [genre, `${(4 + (i % 4)) * 80} pages`, 'Free returns'],
    bullets: [blurb, `From ${author}, ${i % 2 ? 'an award-winning voice' : 'the bestselling author'} readers can’t put down.`, 'Available in paperback, hardcover and eBook.'],
    specs: [['Author', author], ['Genre', genre], ['Pages', String((4 + (i % 4)) * 80)], ['Language', 'English']],
    rating,
    reviewCount: reviews,
    boughtLastMonth: reviews > 8000 ? 4000 : undefined,
    badges,
    releasedAt: `2026-0${1 + (i % 9)}-1${i % 9}`,
    keywords: ['book', 'books', genre.toLowerCase(), author.toLowerCase()],
  })),
];

export const products: Product[] = defs.map(build);

export const productsById: ReadonlyMap<string, Product> = new Map(products.map((p) => [p.id, p]));
