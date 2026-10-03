/*
  Generates local product images (SVG) for every product × colour × gallery view.

    npm run images

  Output: public/images/products/<productId>/<colorId>-<view>.svg
  Views:  1 = main (white background, like a marketplace main image)
          2 = angled (tinted background)
          3 = detail (close-up crop)
          4 = feature card (the product's three callouts)

  Art is drawn from simple shapes in an 800×800 box, centred around (400, 410),
  coloured from the variant's swatch so colour variants really differ.
*/
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_VIEWS, products } from '../src/data/products.ts';
import type { ArtKind, Product } from '../src/data/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'images', 'products');

/* ------------------------------------------ colour utils ----------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
/** Mix `hex` towards `target` by t (0..1). */
function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}
const shade = (hex: string, t: number) => (t < 0 ? mix(hex, '#000000', -t) : mix(hex, '#ffffff', t));
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Pal {
  main: string;
  light: string;
  lighter: string;
  dark: string;
  darker: string;
  trim: string;
  trimDark: string;
  /** Readable text colour on `main`. */
  onMain: string;
  isLight: boolean;
}

function palette(main: string, trim?: string): Pal {
  const isLight = luminance(main) > 0.6;
  const t = trim ?? (isLight ? '#3a3f47' : '#e6e8eb');
  return {
    main,
    light: shade(main, 0.22),
    lighter: shade(main, 0.45),
    dark: shade(main, isLight ? -0.18 : -0.28),
    darker: shade(main, isLight ? -0.35 : -0.5),
    trim: t,
    trimDark: shade(t, -0.25),
    onMain: luminance(main) > 0.45 ? '#0f1111' : '#ffffff',
    isLight,
  };
}

/** Horizontal cylinder shading gradient + common defs. Ids are unique per image. */
function defs(p: Pal): string {
  return `<defs>
  <linearGradient id="cyl" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="${p.dark}"/><stop offset="0.28" stop-color="${p.light}"/>
    <stop offset="0.55" stop-color="${p.main}"/><stop offset="1" stop-color="${p.darker}"/>
  </linearGradient>
  <linearGradient id="vert" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="1" stop-color="${p.dark}"/>
  </linearGradient>
  <linearGradient id="trimcyl" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="${p.trimDark}"/><stop offset="0.35" stop-color="${shade(p.trim, 0.25)}"/>
    <stop offset="1" stop-color="${p.trimDark}"/>
  </linearGradient>
  <linearGradient id="chrome" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#f4f5f6"/><stop offset="0.5" stop-color="#a9aeb5"/><stop offset="1" stop-color="#dfe2e5"/>
  </linearGradient>
  <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glow" cx="0.5" cy="0" r="1">
    <stop offset="0" stop-color="#fff6c8" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/>
  </radialGradient>
</defs>`;
}

const floor = (cx = 400, cy = 690, rx = 230, ry = 26) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#floor)"/>`;

/* --------------------------------------------- drawings ------------------------------------------ */

type Draw = (p: Pal, product: Product) => string;

const art: Record<ArtKind, Draw> = {
  headphones: (p) => `
    ${floor(400, 650, 220)}
    <path d="M215 430 C215 200 585 200 585 430" fill="none" stroke="${p.darker}" stroke-width="44" stroke-linecap="round"/>
    <path d="M215 430 C215 200 585 200 585 430" fill="none" stroke="url(#vert)" stroke-width="30" stroke-linecap="round"/>
    <path d="M262 300 C320 238 480 238 538 300" fill="none" stroke="${p.trim}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
    <rect x="196" y="380" width="40" height="70" rx="12" fill="${p.trimDark}"/>
    <rect x="564" y="380" width="40" height="70" rx="12" fill="${p.trimDark}"/>
    <rect x="160" y="420" width="120" height="210" rx="58" fill="url(#cyl)"/>
    <rect x="262" y="438" width="40" height="174" rx="20" fill="${p.darker}"/>
    <rect x="520" y="420" width="120" height="210" rx="58" fill="url(#cyl)"/>
    <rect x="498" y="438" width="40" height="174" rx="20" fill="${p.darker}"/>
    <circle cx="220" cy="525" r="22" fill="none" stroke="${p.lighter}" stroke-width="4" opacity="0.6"/>
    <circle cx="580" cy="525" r="22" fill="none" stroke="${p.lighter}" stroke-width="4" opacity="0.6"/>`,

  earbuds: (p) => `
    ${floor(400, 650, 200)}
    <rect x="270" y="420" width="260" height="220" rx="96" fill="url(#cyl)"/>
    <path d="M270 500 H530" stroke="${p.darker}" stroke-width="4" opacity="0.6"/>
    <rect x="270" y="420" width="260" height="80" rx="40" fill="${p.light}" opacity="0.35"/>
    <circle cx="400" cy="560" r="7" fill="#5ad17a"/>
    <g transform="rotate(-18 300 300)">
      <rect x="282" y="290" width="36" height="130" rx="18" fill="url(#cyl)"/>
      <circle cx="300" cy="280" r="58" fill="url(#cyl)"/>
      <circle cx="300" cy="280" r="26" fill="${p.darker}"/>
    </g>
    <g transform="rotate(18 500 300)">
      <rect x="482" y="290" width="36" height="130" rx="18" fill="url(#cyl)"/>
      <circle cx="500" cy="280" r="58" fill="url(#cyl)"/>
      <circle cx="500" cy="280" r="26" fill="${p.darker}"/>
    </g>`,

  speaker: (p) => {
    let dots = '';
    for (let y = 300; y <= 560; y += 22) for (let x = 312; x <= 488; x += 22) dots += `<circle cx="${x}" cy="${y}" r="5" fill="${p.darker}" opacity="0.55"/>`;
    return `
    ${floor(400, 660, 190)}
    <rect x="280" y="190" width="240" height="460" rx="110" fill="url(#cyl)"/>
    <ellipse cx="400" cy="232" rx="104" ry="34" fill="${p.dark}"/>
    <rect x="370" y="218" width="16" height="16" rx="4" fill="${p.lighter}"/><rect x="414" y="218" width="16" height="16" rx="4" fill="${p.lighter}"/>
    ${dots}
    <rect x="360" y="585" width="80" height="22" rx="11" fill="${p.trim}" opacity="0.85"/>
    <path d="M520 300 C585 320 585 520 520 540" fill="none" stroke="${p.trimDark}" stroke-width="14" stroke-linecap="round"/>`;
  },

  smartwatch: (p) => `
    ${floor(400, 690, 150)}
    <rect x="335" y="120" width="130" height="220" rx="26" fill="url(#cyl)"/>
    <rect x="335" y="480" width="130" height="200" rx="26" fill="url(#cyl)"/>
    <circle cx="400" cy="610" r="8" fill="${p.darker}"/><circle cx="400" cy="640" r="8" fill="${p.darker}"/>
    <rect x="292" y="270" width="216" height="270" rx="64" fill="#2b2f36"/>
    <rect x="304" y="282" width="192" height="246" rx="54" fill="#0c0d10"/>
    <rect x="508" y="350" width="16" height="50" rx="7" fill="#55595f"/>
    <circle cx="400" cy="390" r="66" fill="none" stroke="#2a2d33" stroke-width="12"/>
    <path d="M400 324 A66 66 0 1 1 340 420" fill="none" stroke="#6dd3a6" stroke-width="12" stroke-linecap="round"/>
    <path d="M400 345 A45 45 0 1 1 362 413" fill="none" stroke="${p.isLight ? '#f2a65a' : p.lighter}" stroke-width="10" stroke-linecap="round"/>
    <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#fff">10:08</text>
    <text x="400" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#9aa0a6">8,412 steps</text>`,

  keyboard: (p) => {
    let keys = '';
    const rows = [14, 14, 13, 12, 9];
    rows.forEach((count, r) => {
      const w = 466 / count;
      for (let i = 0; i < count; i++) {
        const accent = (r === 0 && i === 0) || (r === 2 && i === count - 1);
        keys += `<rect x="${172 + i * w}" y="${318 + r * 42}" width="${w - 6}" height="34" rx="6" fill="${accent ? '#e8743b' : p.trim}"/>`;
        keys += `<rect x="${172 + i * w}" y="${318 + r * 42}" width="${w - 6}" height="27" rx="6" fill="${accent ? '#f29a6b' : shade(p.trim, 0.35)}"/>`;
      }
    });
    return `
    ${floor(400, 560, 290, 22)}
    <rect x="150" y="296" width="500" height="240" rx="22" fill="${p.darker}"/>
    <rect x="150" y="290" width="500" height="236" rx="22" fill="url(#vert)"/>
    ${keys}`;
  },

  mouse: (p) => `
    ${floor(400, 660, 150)}
    <path d="M400 170 C520 170 540 300 540 420 C540 560 480 640 400 640 C320 640 260 560 260 420 C260 300 280 170 400 170 Z" fill="url(#cyl)"/>
    <path d="M400 170 V350" stroke="${p.darker}" stroke-width="4"/>
    <path d="M262 350 C330 370 470 370 538 350" fill="none" stroke="${p.darker}" stroke-width="3" opacity="0.5"/>
    <rect x="388" y="230" width="24" height="64" rx="12" fill="${p.darker}"/>
    <rect x="393" y="240" width="14" height="44" rx="7" fill="${p.trim}" opacity="0.8"/>
    <path d="M320 470 C340 560 460 560 480 470" fill="none" stroke="${p.lighter}" stroke-width="6" opacity="0.35" stroke-linecap="round"/>`,

  powerbank: (p) => `
    ${floor(400, 660, 180)}
    <rect x="280" y="200" width="240" height="440" rx="40" fill="${p.darker}"/>
    <rect x="270" y="190" width="240" height="440" rx="40" fill="url(#cyl)"/>
    <rect x="320" y="206" width="40" height="12" rx="6" fill="${p.darker}"/><rect x="380" y="206" width="40" height="12" rx="6" fill="${p.darker}"/><rect x="440" y="206" width="22" height="12" rx="4" fill="${p.darker}"/>
    <text x="390" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="44" fill="${p.onMain}" opacity="0.85">20K</text>
    <text x="390" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${p.onMain}" opacity="0.6">65W · USB-C</text>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${350 + i * 27}" cy="560" r="7" fill="${i < 3 ? '#4cc3ff' : p.darker}"/>`).join('')}`,

  bottle: (p) => `
    ${floor(400, 668, 130)}
    <rect x="318" y="250" width="164" height="420" rx="46" fill="url(#cyl)"/>
    <rect x="338" y="214" width="124" height="56" rx="16" fill="url(#cyl)"/>
    <rect x="344" y="150" width="112" height="80" rx="22" fill="url(#trimcyl)"/>
    <path d="M362 158 C362 92 438 92 438 158" fill="none" stroke="${p.trimDark}" stroke-width="16" stroke-linecap="round"/>
    <rect x="318" y="430" width="164" height="54" fill="${p.darker}" opacity="0.18"/>
    <rect x="344" y="300" width="18" height="300" rx="9" fill="#fff" opacity="0.18"/>`,

  // Ceramic mug when the product defines a glaze colour (trim); otherwise a travel mug.
  mug: (p, product) =>
    product.art.trim
      ? `
    ${floor(390, 640, 200)}
    <path d="M500 330 C620 330 620 520 500 520" fill="none" stroke="url(#cyl)" stroke-width="40"/>
    <rect x="240" y="270" width="280" height="360" rx="40" fill="url(#cyl)"/>
    <ellipse cx="380" cy="282" rx="140" ry="30" fill="${p.trim}"/>
    <ellipse cx="380" cy="286" rx="122" ry="21" fill="#5b3a29"/>
    <path d="M240 330 C280 360 300 320 330 352 C360 384 380 336 420 360 C460 384 480 340 520 362 V300 H240 Z" fill="${p.trim}" opacity="0.85"/>`
      : `
    ${floor(400, 668, 150)}
    <path d="M318 250 L482 250 L460 660 Q458 672 446 672 L354 672 Q342 672 340 660 Z" fill="url(#cyl)"/>
    <rect x="300" y="196" width="200" height="66" rx="20" fill="#2b2f36"/>
    <rect x="312" y="182" width="176" height="30" rx="14" fill="#3a3f47"/>
    <rect x="420" y="188" width="50" height="14" rx="7" fill="#55595f"/>
    <rect x="326" y="420" width="148" height="70" fill="${p.darker}" opacity="0.2"/>`,

  lamp: (p) => `
    ${floor(400, 670, 210)}
    <path d="M520 285 L640 650 L360 650 Z" fill="url(#glow)" opacity="0.8"/>
    <ellipse cx="330" cy="640" rx="120" ry="26" fill="${p.darker}"/>
    <rect x="210" y="612" width="240" height="30" rx="15" fill="url(#cyl)"/>
    <rect x="292" y="616" width="74" height="10" rx="5" fill="#4cc3ff" opacity="0.6"/>
    <path d="M330 620 L280 400 L480 250" fill="none" stroke="${p.dark}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="280" cy="400" r="20" fill="${p.darker}"/>
    <path d="M440 222 L600 268 L585 318 L425 272 Z" fill="url(#vert)"/>
    <path d="M432 270 L592 316" stroke="#fff6c8" stroke-width="8" stroke-linecap="round"/>`,

  pan: (p) => `
    ${floor(380, 600, 270, 30)}
    <path d="M560 430 L740 520" stroke="${p.darker}" stroke-width="40" stroke-linecap="round"/>
    <path d="M560 430 L740 520" stroke="${p.dark}" stroke-width="26" stroke-linecap="round"/>
    <circle cx="726" cy="512" r="8" fill="${p.lighter}"/>
    <ellipse cx="350" cy="440" rx="260" ry="150" fill="${p.darker}"/>
    <ellipse cx="350" cy="420" rx="260" ry="150" fill="url(#cyl)"/>
    <ellipse cx="350" cy="420" rx="226" ry="126" fill="${p.trim}"/>
    <ellipse cx="350" cy="420" rx="226" ry="126" fill="none" stroke="${shade(p.trim, -0.15)}" stroke-width="6"/>
    <ellipse cx="300" cy="380" rx="90" ry="40" fill="#fff" opacity="0.25"/>`,

  kettle: (p) => `
    ${floor(400, 660, 220)}
    <path d="M520 300 C640 300 640 560 540 600" fill="none" stroke="#2b2f36" stroke-width="34" stroke-linecap="round"/>
    <path d="M300 340 L230 260 L210 272 L272 400 Z" fill="url(#cyl)"/>
    <path d="M300 240 L500 240 L540 620 L260 620 Z" fill="url(#cyl)"/>
    <ellipse cx="400" cy="240" rx="100" ry="22" fill="${p.dark}"/>
    <rect x="380" y="206" width="40" height="30" rx="10" fill="#2b2f36"/>
    <rect x="236" y="616" width="328" height="44" rx="12" fill="#2b2f36"/>
    <rect x="378" y="300" width="20" height="200" rx="10" fill="#9fd8ff" opacity="0.55"/>
    <circle cx="400" cy="640" r="6" fill="#4cc3ff"/>`,

  backpack: (p) => `
    ${floor(400, 668, 210)}
    <path d="M340 180 C340 120 460 120 460 180" fill="none" stroke="${p.darker}" stroke-width="18" stroke-linecap="round"/>
    <rect x="232" y="410" width="54" height="200" rx="22" fill="${p.dark}"/>
    <rect x="514" y="410" width="54" height="200" rx="22" fill="${p.dark}"/>
    <rect x="260" y="170" width="280" height="490" rx="110" fill="url(#cyl)"/>
    <path d="M290 280 C330 230 470 230 510 280" fill="none" stroke="${p.trim}" stroke-width="6" stroke-dasharray="2 10" stroke-linecap="round"/>
    <rect x="300" y="430" width="200" height="190" rx="50" fill="${p.dark}"/>
    <path d="M318 470 H482" stroke="${p.trim}" stroke-width="7" stroke-linecap="round"/>
    <rect x="466" y="460" width="14" height="30" rx="5" fill="${p.trim}"/>
    <rect x="370" y="330" width="60" height="28" rx="8" fill="${p.darker}"/>`,

  sling: (p) => `
    ${floor(400, 640, 230, 24)}
    <path d="M190 170 C260 260 420 300 520 330" fill="none" stroke="${p.darker}" stroke-width="30" stroke-linecap="round"/>
    <rect x="356" y="254" width="70" height="40" rx="8" fill="${p.trim}" transform="rotate(20 391 274)"/>
    <g transform="rotate(-14 420 470)">
      <rect x="220" y="360" width="420" height="230" rx="110" fill="url(#vert)"/>
      <path d="M260 420 C360 392 500 392 600 420" fill="none" stroke="${p.trim}" stroke-width="7" stroke-linecap="round"/>
      <rect x="590" y="404" width="12" height="34" rx="5" fill="${p.trim}"/>
      <rect x="300" y="460" width="260" height="104" rx="52" fill="${p.dark}"/>
      <path d="M326 494 H534" stroke="${p.trim}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <path d="M610 470 C660 520 680 600 640 660" fill="none" stroke="${p.darker}" stroke-width="24" stroke-linecap="round"/>`,

  sneaker: (p) => `
    ${floor(400, 610, 300, 24)}
    <path d="M130 540 C130 600 160 600 200 600 L640 600 C690 600 700 560 680 540 Z" fill="${p.trim === '#ffffff' || p.trim === '#f4f1ea' ? '#f4f1ea' : p.trim}"/>
    <path d="M130 540 L690 540 L686 560 L134 560 Z" fill="${shade(p.trim === '#ffffff' ? '#f4f1ea' : p.trim, -0.12)}"/>
    <path d="M140 540 C130 450 170 360 250 330 L330 300 C380 300 420 360 470 400 C540 450 650 460 680 520 L690 540 Z" fill="url(#vert)"/>
    <path d="M140 540 C150 470 170 420 200 390 C200 450 210 500 240 540 Z" fill="${p.dark}"/>
    <path d="M560 455 C620 465 670 490 686 532" fill="none" stroke="${p.darker}" stroke-width="10" opacity="0.6"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${318 + i * 36} ${322 + i * 20} l26 22" stroke="${p.isLight ? '#3a3f47' : '#f4f1ea'}" stroke-width="8" stroke-linecap="round"/>`).join('')}
    <path d="M260 420 C330 380 420 410 520 470" fill="none" stroke="${p.lighter}" stroke-width="10" opacity="0.6" stroke-linecap="round"/>`,

  tshirt: (p) => `
    ${floor(400, 690, 220)}
    <path d="M300 150 L210 180 L100 300 L180 380 L240 330 L240 660 L560 660 L560 330 L620 380 L700 300 L590 180 L500 150 C480 200 320 200 300 150 Z" fill="url(#vert)"/>
    <path d="M300 150 C320 205 480 205 500 150" fill="none" stroke="${p.darker}" stroke-width="16"/>
    <path d="M240 330 L240 360 M560 330 L560 360" stroke="${p.darker}" stroke-width="4" opacity="0.4"/>
    <path d="M180 380 L240 330 M620 380 L560 330" stroke="${p.darker}" stroke-width="5" opacity="0.4"/>
    <rect x="240" y="640" width="320" height="20" fill="${p.dark}" opacity="0.5"/>`,

  cap: (p) => `
    ${floor(430, 590, 260, 24)}
    <path d="M540 478 C640 470 730 486 752 516 C700 536 610 528 540 506 Z" fill="${p.darker}"/>
    <path d="M540 478 C640 470 730 486 752 516 C716 510 640 500 548 494 Z" fill="${p.dark}"/>
    <path d="M190 492 C186 330 290 250 400 250 C520 250 600 330 604 492 Z" fill="url(#cyl)"/>
    <path d="M400 252 C350 320 330 410 334 490 M400 252 C470 320 500 410 504 490" fill="none" stroke="${p.darker}" stroke-width="4" opacity="0.55"/>
    <ellipse cx="400" cy="254" rx="20" ry="10" fill="${p.darker}"/>
    <path d="M190 492 H604" stroke="${p.darker}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="270" cy="380" r="5" fill="${p.darker}" opacity="0.6"/><circle cx="300" cy="330" r="5" fill="${p.darker}" opacity="0.6"/>`,

  sunglasses: (p) => `
    ${floor(400, 600, 260, 20)}
    <path d="M140 330 L60 300" stroke="${p.dark}" stroke-width="16" stroke-linecap="round"/>
    <path d="M660 330 L740 300" stroke="${p.dark}" stroke-width="16" stroke-linecap="round"/>
    <path d="M150 320 C150 300 360 296 365 330 C370 460 300 520 230 520 C170 520 140 440 150 320 Z" fill="${p.trim}" stroke="${p.main}" stroke-width="20"/>
    <path d="M650 320 C650 300 440 296 435 330 C430 460 500 520 570 520 C630 520 660 440 650 320 Z" fill="${p.trim}" stroke="${p.main}" stroke-width="20"/>
    <path d="M365 340 C385 315 415 315 435 340" fill="none" stroke="${p.main}" stroke-width="18"/>
    <path d="M190 350 L250 340 M210 380 L290 362" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.35"/>
    <path d="M480 350 L540 340 M500 380 L580 362" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.35"/>`,

  yogamat: (p) => `
    ${floor(420, 640, 300, 30)}
    <path d="M150 600 L330 400 L700 400 L640 600 Z" fill="${p.light}"/>
    <path d="M150 600 L640 600 L636 616 L146 616 Z" fill="${p.darker}"/>
    <path d="M250 560 L390 420 M450 560 L520 420" stroke="${p.lighter}" stroke-width="5" opacity="0.8"/>
    <path d="M220 520 L660 520" stroke="${p.lighter}" stroke-width="5" opacity="0.8"/>
    <rect x="330" y="300" width="370" height="104" rx="52" fill="url(#vert)"/>
    <ellipse cx="700" cy="352" rx="40" ry="52" fill="${p.dark}"/>
    <path d="M700 352 m-26 0 a26 34 0 1 0 52 0 a18 24 0 1 0 -36 0 a10 14 0 1 0 20 0" fill="none" stroke="${p.lighter}" stroke-width="5"/>
    <rect x="450" y="296" width="24" height="112" rx="6" fill="${p.trim}" opacity="0.9"/>`,

  // Hex dumbbell when the product defines a handle colour (trim); otherwise the adjustable set.
  dumbbell: (p, product) =>
    product.art.trim
      ? `
    ${floor(400, 600, 300, 24)}
    <rect x="270" y="410" width="260" height="44" rx="10" fill="url(#chrome)"/>
    <path d="M270 420 l0 24" stroke="#888" stroke-width="2"/>
    ${[0, 1].map((s) => {
      const cx = s ? 610 : 190;
      return `<polygon points="${cx - 90},432 ${cx - 45},330 ${cx + 45},330 ${cx + 90},432 ${cx + 45},534 ${cx - 45},534" fill="url(#vert)"/>
      <polygon points="${cx - 60},432 ${cx - 30},366 ${cx + 30},366 ${cx + 60},432 ${cx + 30},498 ${cx - 30},498" fill="none" stroke="${p.lighter}" stroke-width="4" opacity="0.4"/>`;
    }).join('')}`
      : `
    ${floor(400, 640, 320, 28)}
    <rect x="110" y="540" width="580" height="80" rx="20" fill="#2b2f36"/>
    <rect x="150" y="430" width="500" height="34" rx="12" fill="url(#chrome)"/>
    ${[0, 1].map((s) =>
      [0, 1, 2, 3, 4].map((i) => {
        const x = s ? 520 + i * 26 : 254 - i * 26;
        return `<rect x="${x}" y="${352 - i * 4}" width="22" height="${190 + i * 8}" rx="6" fill="${i % 2 ? p.dark : p.main}"/>`;
      }).join('')).join('')}
    <rect x="300" y="400" width="200" height="94" rx="20" fill="#e8743b"/>
    <text x="400" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#fff">5–25</text>`,

  jumprope: (p) => `
    ${floor(400, 650, 260, 24)}
    <path d="M250 300 C150 620 650 680 560 300" fill="none" stroke="${p.darker}" stroke-width="8"/>
    <g transform="rotate(-20 250 240)"><rect x="226" y="140" width="48" height="170" rx="24" fill="url(#cyl)"/><rect x="232" y="300" width="36" height="24" rx="6" fill="url(#chrome)"/></g>
    <g transform="rotate(20 560 240)"><rect x="536" y="140" width="48" height="170" rx="24" fill="url(#cyl)"/><rect x="542" y="300" width="36" height="24" rx="6" fill="url(#chrome)"/></g>`,

  book: (p, product) => {
    const ink = product.art.trim ?? p.onMain;
    const words = product.title.replace(/: A Novel$/, '').split(' ');
    const lines: string[] = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last && (last + ' ' + w).length <= 11) lines[lines.length - 1] = last + ' ' + w;
      else lines.push(w);
    }
    const title = lines
      .map((l, i) => `<text x="416" y="${250 + i * 48}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="36" fill="${ink}">${esc(l.toUpperCase())}</text>`)
      .join('');
    return `
    ${floor(410, 680, 210, 22)}
    <rect x="262" y="132" width="310" height="540" rx="6" fill="#d9d4cb"/>
    <rect x="250" y="120" width="310" height="540" rx="6" fill="${p.main}"/>
    <rect x="250" y="120" width="22" height="540" fill="${p.darker}" opacity="0.5"/>
    <circle cx="410" cy="${300 + lines.length * 48}" r="64" fill="${ink}" opacity="0.18"/>
    <path d="M300 ${380 + lines.length * 48} C350 ${350 + lines.length * 48} 470 ${410 + lines.length * 48} 520 ${370 + lines.length * 48}" fill="none" stroke="${ink}" stroke-width="5" opacity="0.6"/>
    ${title}
    <text x="410" y="615" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" letter-spacing="3" fill="${ink}">${esc(product.brand.toUpperCase())}</text>`;
  },
};

/* ---------------------------------------------- views -------------------------------------------- */

function svg(body: string, p: Pal, bg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${defs(p)}<rect width="800" height="800" fill="${bg}"/>${body}</svg>\n`;
}

function render(product: Product, colorHex: string, view: number): string {
  const p = palette(colorHex, product.art.trim);
  const drawing = art[product.art.kind](p, product);
  const tint = mix(colorHex, '#ffffff', p.isLight ? 0.55 : 0.88);

  switch (view) {
    case 1:
      return svg(drawing, p, '#ffffff');
    case 2:
      return svg(`<g transform="translate(400 410) rotate(-9) scale(0.9) translate(-400 -410)">${drawing}</g>`, p, tint);
    case 3:
      return svg(`<g transform="translate(400 400) scale(1.75) translate(-420 -380)">${drawing}</g>`, p, '#ffffff');
    default: {
      const callouts = product.callouts
        .map(
          (c, i) => `
        <circle cx="94" cy="${560 + i * 64}" r="18" fill="#0b7b3c"/>
        <path d="M85 ${560 + i * 64} l6 6 l12 -13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="128" y="${569 + i * 64}" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#0f1111">${esc(c)}</text>`,
        )
        .join('');
      return svg(
        `<rect x="0" y="0" width="800" height="800" fill="${tint}"/>
        <rect x="32" y="32" width="736" height="736" rx="28" fill="#ffffff" opacity="0.72"/>
        <text x="76" y="110" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="#565959">${esc(product.brand.toUpperCase())}</text>
        <text x="76" y="166" font-family="Arial, sans-serif" font-weight="800" font-size="46" fill="#0f1111">Why you’ll love it</text>
        <g transform="translate(400 350) scale(0.44) translate(-400 -410)">${drawing}</g>
        <rect x="64" y="510" width="672" height="2" fill="#d5d9d9"/>
        ${callouts}`,
        p,
        tint,
      );
    }
  }
}

/* ---------------------------------------------- main --------------------------------------------- */

// Write in place (only when content changed) and prune stale files afterwards, rather than wiping the
// folder: deleting and recreating public files confuses a running Vite dev server.
const written = new Set<string>();
let count = 0;
let changed = 0;
for (const product of products) {
  const colorOption = product.options.find((o) => o.name === 'Color');
  const colors = colorOption ? colorOption.values : [{ id: 'default', label: 'Default', swatch: '#888888' }];
  for (const color of colors) {
    for (let view = 1; view <= IMAGE_VIEWS; view++) {
      const file = join(OUT, product.id, `${color.id}-${view}.svg`);
      const content = render(product, color.swatch ?? '#888888', view);
      mkdirSync(dirname(file), { recursive: true });
      if (!existsSync(file) || readFileSync(file, 'utf8') !== content) {
        writeFileSync(file, content);
        changed++;
      }
      written.add(file);
      count++;
    }
  }
}

let pruned = 0;
for (const dir of existsSync(OUT) ? readdirSync(OUT) : []) {
  const productDir = join(OUT, dir);
  for (const name of readdirSync(productDir)) {
    const file = join(productDir, name);
    if (!written.has(file)) {
      rmSync(file);
      pruned++;
    }
  }
  if (readdirSync(productDir).length === 0) rmSync(productDir, { recursive: true });
}
console.log(`${count} images for ${products.length} products (${changed} written, ${pruned} pruned) in ${OUT}`);
