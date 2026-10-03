# Product decisions

Amazon.com is our **reference**, not our blueprint. This file records what we kept, simplified, removed and improved, and why. Evidence for each Amazon behaviour is in [`recon/README.md`](../recon/README.md); section numbers like "recon §2.8" point there.

The test for every feature: **does it improve the core journey — home → search → results → product → cart → checkout → confirmation — enough to justify the build time?**

Status labels: **Built** = in the codebase now. **Planned** = decided, built in a later stage.

---

## 1. Curated catalogue, five focused categories — Built

- **Amazon:** a near-endless catalogue. Results pages show 39 filter groups for one query (recon §2.4) and many sponsored placements.
- **What we changed:** 38 hand-written products across 5 categories: Electronics, Home & Kitchen, Fashion, Sports & Fitness, Books. Each has real variants, stock levels, ratings, reviews, specs and bullets. All brands, books and authors are fictional.
- **Why:** the brief judges the journey, not the catalogue size. A small, believable catalogue lets every filter, sort and variant actually work and be tested.
- **User benefit:** less noise. Every product page is complete, with no half-filled listings.
- **Tradeoff:** search and filters can't be tested at real scale. The data sits behind an async API layer (`src/api/catalog.ts`), so a real backend could be swapped in without touching pages.

## 2. Generated product art instead of product photos — Built

- **Amazon:** real product photography, often with infographic images in the gallery (recon §2.6).
- **What we changed:** `scripts/generate-images.ts` draws clean flat SVG art for each product. It makes 4 gallery views per colour: main on white, angled, close-up, and a "Why you'll love it" feature card with the product's three selling points. That's 396 images, all local.
- **Why:** the brief asks for local images. Downloading photos raises licensing questions and adds weight. Drawing the art from each variant's colour means **choosing a colour really changes the gallery**, which Amazon does (recon §2.6) and which stock photos couldn't easily give us.
- **User benefit:** consistent, fast-loading images (≈2–4 kB each). Variants show what you get. The feature card keeps Amazon's useful infographic idea without the clutter.
- **Tradeoff:** less realistic than photography. `ProductImage` takes any URL, so photos could replace the art per product without code changes.

## 3. A design system built on Amazon's tokens, not a copy of its components — Built

- **Amazon:** a distinctive palette, measured live (recon §3): `#131921`/`#232F3E` header, `#FFD814` yellow pill buttons, `#FFA41C` Buy Now, `#2162A1` links, `#EAEDED` grey canvas. Amazon Ember font, dense 14 px text.
- **What we changed:**
  - We kept those colours and the action **meanings**: yellow = add to cart / continue, orange = skip the cart (Buy Now).
  - We kept the pill buttons and the superscript price style, since they're what make it read as Amazon at a glance.
  - We replaced Amazon Ember, which is proprietary, with **Inter**, self-hosted.
  - We use a softer `#F5F6F6` page background by default and keep `#EAEDED` for task screens (cart, checkout).
  - The tokens live in one place: `src/index.css` `@theme`.
- **Why:** familiarity drives trust in a shopping UI. Copying every Amazon component would also copy its clutter.
- **User benefit:** it feels familiar straight away, with calmer pages and clearer hierarchy.
- **Tradeoff:** a few px-level differences from Amazon are deliberate, not oversights.

## 4. Accessibility and touch as defaults, not extras — Built

- **Amazon:** the desktop site has no mobile viewport and a 1000 px minimum footer width (recon §2.11). Focus styling varies from page to page.
- **What we changed:**
  - **One visible focus ring** everywhere (`:focus-visible`).
  - Main buttons and steppers are **at least 40–48 px tall**.
  - Prices are read out as a single amount, not "$ / 129 / 99".
  - Star ratings have text labels.
  - Form errors are linked to their fields.
  - Reduced-motion is respected.
- **Why:** the brief requires a genuinely responsive, accessible build down to 360 px. These choices cost little when they're in the base components.
- **User benefit:** usable by keyboard, screen reader and thumb.
- **Tradeoff:** slightly larger controls than Amazon's dense desktop rows. We accept a little density loss.

## 5. Empty, loading and error states always explain the next step — Built (components); Planned (on pages)

- **Amazon:** a no-results search showed sponsored products and a carousel, with no "no results" message (recon §2.4). The empty cart is clear but crowded with recommendations (recon §2.8).
- **What we changed:**
  - A shared `EmptyState` that always gives a title, an explanation and an action.
  - `Skeleton` loaders shaped like the real cards.
  - A retry action when loading fails.
  - The catalogue API supports `?simulate=slow` and `?simulate=error`, so these states can be shown and tested on demand.
- **Why:** these moments decide whether someone gives up. Saying exactly what happened is more honest and more useful.
- **User benefit:** no dead ends and no mystery spinners.
- **Tradeoff:** we give up the "recommendations everywhere" upsell Amazon uses at these moments.

## 6. Cart remove has Undo — Built (component); Planned (cart page)

- **Amazon:** Delete swaps the line for "…was removed from Shopping Cart" with no undo (recon §2.8). The quantity stepper shows a bin icon at quantity 1.
- **What we changed:** we keep the bin-at-1 stepper, which is familiar and saves space. Removing an item shows an inline notice with an **Undo** button.
- **Why:** the bin sits exactly where the minus button was, so an accidental tap is likely, especially on mobile.
- **User benefit:** a mis-tap costs one click to fix, not a trip back to the product page.
- **Tradeoff:** the cart state has to remember the last removed line and where it was.

## 7. One currency, simple delivery promises — Planned

- **Amazon:** prices in the shopper's currency (PKR in our recon), with import charges, "typical price" and different delivery windows per product (recon §2.6).
- **What we changed:** prices are in USD. Delivery is a simple rule (free over $35, standard or express) shown as a date.
- **Why:** import fees and currency maths add a lot of complexity and almost nothing to judging the journey.
- **User benefit:** the total is predictable from the product page to checkout.
- **Tradeoff:** not realistic for international shoppers.

---

_Decisions for navigation, search, results, the product page, add-to-cart feedback, checkout and mobile are added as each stage is built._
