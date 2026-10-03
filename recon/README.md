# Amazon.com Recon

Product reconnaissance for the 24-hour Amazon rebuild, done before writing any application code.

**How it was done:** live amazon.com in Chrome, driven by Claude Code (Opus 5.5) through the Claude in Chrome extension, on 2026-10-03. The account was signed in. Delivery location was **Pakistan**, so prices show in **PKR** with import charges. Desktop viewport was 1536 × 674 CSS px. Exact values (colours, sizes, radii) come from `getComputedStyle` on the live page, not from guessing at screenshots.

**Evidence labels used throughout:**

- **[Observed]** — seen directly on live Amazon in this session; a screenshot is linked where one was saved.
- **[Inferred]** — not seen directly. Based on Amazon's known patterns, or on what the page implied. Treat these as assumptions.

**Safety limits on this recon:**

- No order was placed and no payment details were entered.
- One item was added to the cart to test cart behaviour, then removed. The cart was empty before and after.
- Checkout was inspected only up to the address step. The account has no saved address, and going further would have meant saving personal data.
- The "Add an address" form opened pre-filled with the account holder's name and phone number, so that screenshot is **not** in this repo.

---

## 1. Core user journey

The target journey, and how much of it was observed live:

| Step | Amazon screen | Observed? | Screenshot |
|---|---|---|---|
| 1 | Homepage | [Observed] signed out and signed in | `01`, `02`, `03` |
| 2 | Search box with typeahead suggestions | [Observed] | `04` |
| 3 | Search results: list layout, grid layout, filters, sort | [Observed] | `05`–`09` |
| 4 | Product detail: gallery, variants, buy box | [Observed] | `10`–`13` |
| 5 | Add to cart, then the "Added to cart" confirmation | [Observed] | `15` |
| 6 | Cart: quantity stepper, delete, subtotal | [Observed] | `14`, `16`–`18`, `20` |
| 7 | Checkout, address step | [Observed] up to the address form only | `19` |
| 8 | Checkout: payment, review, "Place your order" | **[Inferred]** blocked: no saved address, and a real order wasn't allowed | — |
| 9 | Order confirmation ("Order placed, thanks!") | **[Inferred]** not reached | — |

---

## 2. Screens and interactions

### 2.1 Homepage — [Observed] `01`, `02`, `03`

- **Hero area:** a row of tall image tiles (~285 px wide × 460 px tall) with large heavy-weight headlines: "Start looking sharp", "Shop all things beauty", "Level up your PC here". A round **›** arrow sits on the right edge to scroll the row.
- **Category grid:** rows of white cards, 4 per row. Each has a 24 px bold heading ("Gear up to get fit", "Apparel under $25") and a 2×2 grid of square images, each with a caption. Card radius is 12 px, with no shadow.
- **Signed-in additions:** "Hello, Muhammad / Account & Lists", and a smaller row of themed tiles: "Deals Under $50", "Tech for less", "Gifts for gamers". After I viewed the water bottle, a "Keep shopping for" card showed it on the next homepage load. That's recently-viewed, and cheap to copy.
- **Browsing history strip:** an empty state reads "After viewing product detail pages, look here to find an easy way to navigate back to pages you are interested in."
- **Lazy loading:** content below the fold loads in as you scroll. A small grey ring spinner appears while the next section loads (`03`).
- **Footer:** a full-width "Back to top" bar, then a dark footer with 4 link columns: Get to Know Us, Make Money with Us, Amazon Payment Products, Let Us Help You.
- **First-visit popup:** a "We're showing you items that ship to Pakistan…" popover with **Dismiss** / **Change Address** buttons. When signed out, a "Sign in" popover also hangs under Account & Lists.

### 2.2 Header and navigation — [Observed] every page

- **Top bar** `#131921`, 60 px tall, left to right:
  - logo
  - "Deliver to / Pakistan" with a pin icon
  - search: an "All" category dropdown, a text field filling the remaining width, and an orange search button
  - language/flag "EN"
  - "Hello, {name} / Account & Lists ▾"
  - "Returns / & Orders"
  - cart icon with the item count in **orange** above the cart, and the word "Cart"
- **Second bar** `#232F3E`, 39 px tall: "☰ All", then text links (Today's Deals, Customer Service, Registry, Gift Cards, Sell…). Overflowing labels are truncated with "…".
- **Live cart count:** the badge updated straight after add to cart, quantity changes and delete.
- **Checkout header:** the logo, a centred "Secure checkout ▾" and a cart icon only (`19`). No search and no nav, so the user isn't distracted.

### 2.3 Search and suggestions — [Observed] `04`

- Typing opens a white dropdown directly below the search field, the same width as the field. It holds:
  - about 7 query completions. The part you typed is regular weight and the completion is **bold**, e.g. "wireless headphones **gaming**". Each row has a small product-thumbnail icon.
  - 3 "Rufus"/AI-assisted suggestions with a sparkle icon ("top-rated wireless headphones").
  - a "WIRELESS HEADPHONES BY TYPE" carousel of image tiles: Sport, With microphone, Laptop…
- **Enter** submits. The URL is `/s?k=<query>`, so search state lives in the URL.
- [Inferred, standard on Amazon] arrow keys move through suggestions, Esc closes the list, and the category dropdown scopes the search.

### 2.4 Search results — [Observed] `05`–`09`, `21`

- **Results bar:** "1-16 of over 30,000 results for **"wireless headphones"**", with the query in orange-brown and quotes. **Sort by: Featured ▾** sits on the right.
- **Left sidebar** (~240 px), always visible on desktop. Its sections are bold headings, each followed by checkbox lists:
  - Popular Shopping Ideas
  - Customer Reviews (a "★★★★☆ & Up" row)
  - Brands, which shows 7 then "∨ See more"
  - Deals & Discounts, Condition
  - Colour, as a grid of swatch squares
  - Features, Compatible Devices, and so on
- **Number of filter groups:** 39 for headphones. These depend on the category.
- **Sponsored content:** an "Amazon Basics" 3-up banner and a "Narrow your search" row of pill chips with icons (Over-ear, In-ear, Sport…) above "Results".
- **Two result layouts, chosen by category:**
  - **List** (headphones, `06`): one product per row, ~180 px image on the left, details on the right, 18 px titles.
  - **Grid** (water bottle, `09`): 5 columns of ~251 px cards at this width, 16 px titles clamped to 2–3 lines.
- **Applying a filter** (Brand → Sony, `07`):
  - It's a **full page reload** with the filter in the URL (`rh=p_123:…`).
  - The count dropped from "over 30,000" to "212".
  - The checkbox showed as ticked, and a "‹ Clear" link appeared above the brand list.
- **Sort** (`08`) is a native-style dropdown with 6 options:
  - Featured
  - Price: Low to High
  - Price: High to Low
  - Avg. Customer Review
  - Newest Arrivals
  - Best Sellers
- **No-results query** (`21`): Amazon never showed a "No results" message. It filled the page with a sponsored item and a "Recently bought and rated" carousel. **Our version should show a real empty state instead**; see section 6.

### 2.5 Product card (in results) — [Observed] `06`, `09`

Top to bottom:

1. "+29 other colors/patterns" link (grid only)
2. "Sponsored ⓘ"
3. title, 2–3 line clamp
4. short subtitle line (list layout)
5. optional badge: "Overall Pick", "Top Reviewed for Battery life"
6. rating number, star icons, and a review count link "(34.7K)"
7. "10K+ bought in past month"
8. price, in the superscript style described below
9. "List:"/"Typical price:" struck through, or a green "Save 5%" chip
10. "Delivery **Tue, Oct 13**"
11. "Ships to Pakistan"
12. a yellow pill **Add to cart** button, or a white outlined **See options** button when the product has variants

- **Price style:** the currency symbol and the cents are small and raised. The whole number is large: `PKR` and `00` at 13 px, the whole number at 28 px, e.g. `PKR 5,233` with a raised `00`.
- **Image area:** product photos sit on a very light grey background. A compare checkbox appears as a circle in the image's bottom-right corner.

### 2.6 Product detail page — [Observed] `10`–`13`

- **Breadcrumbs:** Home & Kitchen › Kitchen & Dining › … › Thermoses.
- **3 columns at 1536 px:** gallery 659 px | details 513 px | buy box 244 px.
- **Gallery (left):**
  - One big main image, with share and ♡ icons in its top-right corner and "Click to see full view" under it.
  - A row of **6 thumbnails below**. This layout differs from Amazon's older one, which had thumbnails stacked down the side.
  - **Hovering a thumbnail swaps the main image instantly, no click needed** (`12`). The active thumbnail gets a teal/blue outline.
- **Details (centre):**
  - title (24 px / 32 px, weight 400)
  - "Visit the Amazon Basics Store" link
  - rating row, then "Amazon's Choice" (a black badge) and "900+ bought in past month"
  - divider
  - **"-10%" in red-pink (`#CC0C39`, 24 px, weight 300)**, then the superscript price
  - "Typical price: ~~PKR 3,684.43~~ ⓘ" and the import charges line
  - **Colour: Linen Gray**, then variant **cards**: an image, the price and the struck-through price
  - green ✓ AI summary bullets
  - **About this item**, a 5-bullet list
- **Variants** (`13`): clicking a colour card **changes the URL's product ID (ASIN)**. The price, the selected label, the gallery images, the bullets and the buy box all update. The selected card has a 1 px `#2162A1` border with 8 px radius. A variant can carry its own deal badge: "Early Prime Big Deal".
- **Buy box (right):**
  - 1 px `#D5D9D9` border, 8 px radius
  - price, shipping and import charges, "Delivery **Tuesday, October 13**", "📍 Deliver to Pakistan"
  - **In Stock** in green (`#0B7B3C`, 18 px)
  - a **Quantity: 1 ▾** dropdown
  - **Add to cart** (`#FFD814`, pill) and **Buy Now** (`#FFA41C`, pill)
  - Shipper / Seller, Returns ("30-day refund / replacement"), Gift options
  - "Add to List" outlined button

### 2.7 Add to cart — [Observed] `15`

Clicking **Add to cart** went to an **"Added to cart" confirmation page** (`/cart/smart-wagon`). It showed:

- a green ✓ "Added to cart", the thumbnail and "Color: Linen Gray"
- a "Cart Subtotal: PKR 3,313.22" panel with **Proceed to checkout (1 item)** (yellow) and **Go to Cart** (outlined)
- a "Based on what you added" product carousel
- **a mini-cart down the right edge** with the subtotal in red, "Go to Cart", the thumbnail, the price and a bin / qty / + stepper with a yellow outline

The header cart badge went from 0 to 1.

### 2.8 Cart — [Observed] `14`, `16`–`18`, `20`

- **Page background** is `#EAEDED` grey, with white panels of 8 px radius. Left column: items. Right column: the subtotal box and recommendations.
- **Line item:**
  - selection checkbox, image (~130 px), title link
  - "In Stock" in green, "This is a gift" checkbox, "Color: Linen Gray"
  - a **pill-shaped quantity stepper**, then "Delete | Save for later | Compare with similar items | Share"
  - unit price on the right, with a green "Save 10%" chip
- **Quantity stepper:**
  - At quantity 1 the minus button is a **bin icon**; at 2 or more it's **−**.
  - Clicking **+** updated the number, the subtotal ("Subtotal (2 items): PKR 6,626.44") and the header badge **within 0.3 s**. That's an instant UI update with server confirmation behind it (`17`, `18`).
  - The price column keeps showing the **unit** price, not the line total.
- **Delete:** the line is replaced by an inline message, "[product link] was removed from Shopping Cart." (`20`). It has no undo button.
- **Empty cart** (`14`): "Your Amazon Cart is empty", a sentence of encouragement, and links to the homepage, today's deals and the Wish List. Below that is a "Your Items" panel with "No items saved for later / Buy it again" tabs, and recommendations on the right.
- **Subtotal box:** "Subtotal (N items): **PKR …**", a "This order contains a gift" checkbox, and **Proceed to checkout** in yellow.

### 2.9 Checkout — [Observed] the address step only, `19`

- A separate layout with the logo, a centred "Secure checkout" and the cart icon. The rest of the store navigation is removed.
- **Left column:** a stack of white section cards: **1. Add delivery or pickup address** (with "Add a new delivery address" yellow and "Find a pickup location nearby" outlined), **Payment method**, and **Review items and shipping**. Steps not yet reached are collapsed to just their heading.
- **Right column:** order summary card with a yellow primary button. Its label follows the current step: "Deliver to this address". It lists Items (2), Shipping & handling, and Estimated tax, all "--" until an address exists. Then "**Order total: PKR 6,626.44**" and "Your card will be charged in USD".
- **Address form:** opens in a modal titled "Add an address", with an "Autofill your current location" banner. Fields: Country/Region (select), Full name, Phone number ("May be used to assist delivery"), Street address, Unit/suite, City, State (select), ZIP Code, and a "Make this my default address" checkbox. The form was pre-filled from the account, so **no screenshot was kept**.
- **[Inferred] beyond this point:** payment method selection, review items with delivery date options, **Place your order**, and the "Order placed, thanks!" confirmation page. That page usually has a green check, the order number, the delivery estimate and a "Review or edit your orders" link. None of this was observed.

### 2.10 Loading and error states

- [Observed] Homepage sections lazy-load with a small grey ring spinner (`03`).
- [Observed] Cart quantity changes show the new value immediately.
- [Observed] The product page contains hidden "Sorry, there was a problem." headings: built-in error messages for widgets that fail.
- [Inferred] Results and product pages are server-rendered, so a reload replaces the page rather than showing skeletons. In a client-rendered rebuild, skeleton cards are the right equivalent.

### 2.11 Responsive and mobile behaviour

- [Observed] The desktop site has **no mobile `viewport` meta tag**, and its footer has `min-width: 1000px`. The desktop site is **not responsive**; phones get a separate mobile site (m-web / app). Within desktop widths, layouts adapt: results grid column count, the hero tile carousel, and nav labels truncated with "…".
- [Not observed] Phone-width layouts. The browser window couldn't be resized from the tooling because Chrome stayed at 1536 px. From Amazon's mobile site, as known rather than seen today:
  - a compact two-row header: logo/account/cart, then a full-width search bar
  - a "Deliver to" strip
  - filters behind a "Filters" button opening a drawer
  - one-column result rows
  - the product page stacked as gallery carousel, then title and price, then buy box
- **For us:** we must build one responsive app ourselves. That's a real requirement of the brief, and a place we can do better than Amazon's desktop site.

---

## 3. Visual design

### Typography — [Observed]

- **Font:** "Amazon Ember", falling back to Arial and sans-serif. Ember is proprietary, so **we'll use Arial/Helvetica, or a close open font like Inter**, and keep the sizes.
- **Body:** 14 px / 20 px, colour `#0F1111`.
- **Sizes:**

| Use | Size / weight |
|---|---|
| Homepage card heading | 24 px / 700 |
| Product page title | 24 px / 32 px, weight 400 |
| Results title, list layout | 18 px / 24 px, 400 |
| Results title, grid layout | 16 px |
| Price, whole number | 28 px / 400 |
| Price symbol and cents | 13 px, raised (`top: -0.75em`) |
| Discount | 24 px / 300, `#CC0C39` |
| Secondary and struck-through text | 13 px, `#565959` |
| "In Stock" | 18 px, `#0B7B3C` |

### Colours — [Observed] unless marked

| Token | Value | Used for |
|---|---|---|
| `nav-dark` | `#131921` | top header bar |
| `nav-secondary` | `#232F3E` | second nav bar, footer |
| `nav-footer-top` | `#37475A` [Inferred from screenshot] | "Back to top" bar |
| `search-btn` | `#FEBD69` | search button |
| `cart-count` | `#F08804` | cart badge number |
| `btn-primary` | `#FFD814` | Add to cart, Proceed to checkout |
| `btn-buy-now` | `#FFA41C` | Buy Now |
| `text` | `#0F1111` | body text |
| `text-secondary` | `#565959` | struck-through prices, secondary text |
| `link` | `#2162A1` | links, ratings count, selected-variant border |
| `success` | `#0B7B3C` | In Stock |
| `deal` | `#CC0C39` | discount % |
| `page-bg-grey` | `#EAEDED` | cart and checkout background |
| `border` | `#D5D9D9` | buy box, outlined buttons |
| `star` | orange [Inferred `#FFA41C`-ish from screenshots] | rating stars |

### Spacing, radii, shape — [Observed]

- **Buttons:** pill-shaped (`border-radius: 100px`), ~30–32 px tall.
- **Search:** the bar has 4 px outer radius, and the search button is rounded on the right only. The input is 38 px tall with 15 px text.
- **Corner radii:** homepage cards 12 px; cart panels and the buy box 8 px; variant cards 8 px.
- **Shadows:** almost none. Separation comes from 1 px `#D5D9D9` borders and the grey page background behind white panels.
- **Spacing:** tight, on roughly a 4/8 px rhythm; Amazon is dense. [Inferred: no fixed token scale was read.]

### Layout — [Observed]

- **Header:** full width.
- **Results:** a ~240 px filter sidebar plus a fluid results area (5 grid columns at ~1536 px).
- **Product page:** 3 columns (≈ 45% / 35% / 17%).
- **Cart:** fluid main column plus a ~250 px right column.
- **Checkout:** main column plus a ~330 px summary.

---

## 4. Components we need

| Area | Components |
|---|---|
| Layout | `Header` (logo, deliver-to, `SearchBar`, account, orders, `CartIcon` with badge), `SubNav`, `Footer` with "Back to top", `CheckoutHeader` |
| Search | `SearchBar` with category select, `SearchSuggestions` dropdown (bold completion, keyboard nav) |
| Discovery | `HeroCarousel`, `CategoryCard` (2×2 tiles), `ProductCarousel` |
| Results | `ResultsToolbar` (count + query + `SortSelect`), `FilterSidebar` (`FilterGroup`, `CheckboxFilter`, `RatingFilter`, `PriceRangeFilter`, "Clear"), `FilterDrawer` (mobile), `ProductCard` (grid + list variants), `ActiveFilterChips` |
| Shared | `Price` (superscript symbol and cents), `StarRating`, `Badge` ("Best Seller", "Amazon's Choice"), `Button` (primary yellow, buy-now orange, secondary outline; pill), `QuantityStepper` (bin at 1), `Breadcrumbs`, `Skeleton`, `EmptyState`, `Toast`/inline notice |
| Product page | `ImageGallery` (thumbnails, hover/click swap, full-view zoom/lightbox), `VariantSelector` (swatch cards), `BuyBox` (price, delivery, stock, qty select, Add to cart, Buy Now), `AboutThisItem` bullets |
| Cart | `AddedToCartPanel` / mini-cart, `CartLineItem`, `CartSubtotal`, `EmptyCart`, "Save for later" list |
| Checkout | `CheckoutStep` (collapsible section), `AddressForm` (validation), `DeliveryOptions`, `PaymentMethod` (mock), `OrderSummary`, `PlaceOrderButton` |
| Confirmation | `OrderConfirmation` (order number, items, delivery estimate, continue shopping) |

---

## 5. Features deliberately left out of the 24-hour build

Real accounts, auth or sign-in (we'll use a mock signed-in user or guest checkout) · real payments or any payment processor · sellers, marketplace or multiple offers per product · Prime, Prime Video, Music, Alexa, Rufus AI suggestions · reviews and Q&A pages (we keep a rating summary only) · wish lists and registries · returns and order history beyond the one confirmation page · real delivery dates, import charges, tax or currency (we fake them in USD) · sponsored ads and recommendations engine · gift options · "Compare with similar items" · language and country switcher · Subscribe & Save, Auto Buy · coupons and promo codes · admin or catalogue management · server-side rendering and SEO.

---

## 6. Proposal

### A. MVP feature set

1. **Homepage:** header, hero carousel, 4–8 category cards, one "Best sellers" product row, footer.
2. **Search:**
   - search bar with a category select
   - **typeahead suggestions** from the local catalogue, with the completion in bold and arrow-key/Enter/Esc support
   - search state in the URL (`/s?k=…&category=…&sort=…&brand=…`), so back, forward and refresh work
3. **Search results:**
   - grid layout with a results count bar
   - **filters:** category, brand, rating "& Up", price range, in-stock only
   - **sort:** Featured, Price low→high, Price high→low, Avg. rating, Newest
   - active filter chips and "Clear"
   - a **real no-results empty state**, which improves on Amazon
4. **Product detail:**
   - breadcrumbs
   - **image gallery** with thumbnails (hover or click swaps; a lightbox is nice-to-have)
   - title, rating, badge, price with discount and list price
   - **variants** (colour and/or size) that change the price, images and stock
   - About this item
   - buy box: delivery estimate, stock, quantity select, **Add to cart**, **Buy Now** (straight to checkout)
5. **Add to cart feedback:** a slide-in "Added to cart" panel with the subtotal and "Proceed to checkout" / "Go to cart". A live header badge.
6. **Cart:**
   - line items with the variant label
   - **quantity stepper (bin at 1)**
   - **Delete with an inline "removed" notice plus Undo**, which improves on Amazon
   - Save for later
   - subtotal and item count, Proceed to checkout
   - **Empty cart state**
   - cart **persisted in localStorage**
7. **Checkout** (mock, 3 collapsible steps like Amazon):
   - **address form with validation**
   - delivery speed choice, which changes the cost
   - **payment:** a mock "card" form that accepts only obvious test values, or "Pay on delivery". No real processing.
   - review items, order summary (items, shipping, tax estimate, total), **Place your order**
8. **Order confirmation:** a green check, a generated order number, items, address and delivery estimate. Then the cart is cleared, with "Continue shopping".
9. **States:** skeletons while the catalogue "loads" (a small artificial delay), an error state with a retry button, a 404 page, and empty states for search, cart and saved-for-later.
10. **Responsive, 360 px to 1536 px:**
    - mobile header puts search on its own row
    - filters move to a drawer
    - results go 2-col → 3 → 4/5
    - product page stacks as gallery, info, then buy box, with a **sticky Add to cart bar** on mobile
    - cart and checkout go to one column with a sticky subtotal/CTA

### B. Deliberately leave out

Everything in section 5. **Stretch goals only if time is left:** recently viewed ("Keep shopping for" on the homepage), the gallery lightbox and zoom, list-view toggle on results, keyboard shortcut "/" to focus search.

### C. Recommended React architecture

- **Vite + React 18 + TypeScript.** Fast to set up, and the types pay off for cart and checkout state.
- **React Router v6** routes:
  - `/` (home)
  - `/s` (results, all state in query params)
  - `/dp/:productId` (product page; the variant in `?variant=`)
  - `/cart`
  - `/checkout` (its own layout without the main nav, like Amazon)
  - `/order/:orderId` (confirmation)
  - `*` (404)
- **Data:**
  - A local typed catalogue in `src/data/products.ts`: ~40–60 products over 5–6 categories. Each has variants, images, rating, review count, list and sale price, stock and badges.
  - It's served through a tiny `api/` layer that returns Promises with a simulated delay and an optional error. That makes the loading and error states real and gives one place to swap in a backend later.
  - **Images:** a public product image set (e.g. DummyJSON / Fake Store CDN) or a few local optimised images. **This needs your choice.**
- **State:**
  - **Cart** and **saved-for-later:** React Context + `useReducer`. Pure reducer actions: add, setQty, remove, undoRemove, saveForLater, moveToCart, clear. Synced to `localStorage`.
  - **Checkout draft:** its own reducer, saved to `sessionStorage` so a refresh doesn't lose it.
  - **Search, filter and sort:** derived from the URL, with no global store. Filtering and sorting are pure functions in `lib/search.ts`.
  - No Redux; it isn't needed at this size.
- **Styling:**
  - **Tailwind CSS**, with the design tokens from section 3 put into `tailwind.config` (colours, radii, font sizes).
  - CSS Modules would also work. Tailwind is faster for responsive work under a deadline.
- **Folders:**
  - `src/components/{layout,ui,product,cart,checkout}`
  - `src/pages`
  - `src/state`
  - `src/lib` (search, money formatting, validation)
  - `src/data`
- **Quality:**
  - **Vitest + React Testing Library** for the cart reducer, search, filter and sort, price formatting, and address validation.
  - **One Playwright end-to-end test** for the whole journey: home → search → product → add → cart → checkout → confirmation.
  - Accessibility basics: real buttons and labels, focus states, `aria-live` for cart updates, keyboard-navigable suggestions.
- **Deploy:** Vercel or Netlify static hosting. Needs a SPA rewrite rule.

### D. Implementation order

1. Scaffold: Vite, TypeScript, Tailwind tokens, Router, layout shell (header, footer, checkout header), deploy pipeline early.
2. Catalogue data and the `api/` layer with delay and error; `Price`, `StarRating`, `Button`, `Badge`.
3. **Cart state** (reducer, tests, localStorage) and the header badge. Everything else depends on it.
4. Product page: gallery, variants, buy box, Add to cart, added-to-cart panel.
5. Results: grid, `ProductCard`, filters, sort, URL sync, empty state, skeletons.
6. Search bar with typeahead.
7. Cart page: stepper, delete with undo, save for later, empty state.
8. Checkout: 3 steps, validation, mock payment, order summary. Then order confirmation, which clears the cart.
9. Homepage: hero carousel, category cards, product row. Left until here because nothing depends on it.
10. Responsive pass at 360/768/1024/1440, plus the mobile filter drawer and sticky CTAs.
11. Polish: loading and error states, 404, focus, `aria-live`, Playwright end-to-end, README.

The **full journey works end to end by step 8**. Everything after that is layered on top, so if time runs out we lose polish, not the core flow.

### E. UX details that will make it feel polished

1. **Exact Amazon tokens:** the `#131921`/`#232F3E` header, yellow `#FFD814` pill buttons, `#FEBD69` search button, the `#EAEDED` grey behind white 8 px panels. These colours, more than anything else, make it look like Amazon.
2. **Superscript price style** (small symbol and cents, large whole number) everywhere, and the struck-through "List:" price with a red "-15%".
3. **Instant cart updates:** the badge, subtotal and stepper change immediately, and the stepper shows a bin icon at quantity 1.
4. **The "Added to cart" moment:** a slide-in panel with a green ✓, the thumbnail, the subtotal and two clear next steps, like Amazon's add-to-cart confirmation page.
5. **Variants that really change things:** image, price, stock and URL all update. A sold-out variant is greyed out.
6. **Gallery that swaps on hover or click,** with the active thumbnail outlined.
7. **Typeahead with bold completions** and full keyboard support.
8. **URL holds search state:** filter, sort, refresh and share all keep their state; the back button behaves.
9. **Proper empty states for search, cart and saved-for-later,** better than Amazon's ad-filled no-results page.
10. **Delete with Undo** in the cart, a small improvement on Amazon.
11. **Focused checkout:** a stripped header, collapsible steps, inline validation messages, a sticky order summary, and a "Place your order" button that disables with a spinner while "processing".
12. **Mobile done properly:** filter drawer, sticky Add to cart and checkout bars, and a header that stacks search below the logo.
13. **Skeleton loaders** shaped like the real cards, not spinners, and an error state with a retry button.

---

## Screenshot index

All taken live on 2026-10-03 at desktop size. The address form screenshot is excluded because it showed personal data.

| File | Shows |
|---|---|
| `01-homepage-signed-out.jpg` | Homepage signed out, country popover, sign-in popover |
| `02-homepage-signed-in.jpg` | Homepage signed in, hero tiles, themed tiles |
| `03-homepage-footer.jpg` | Lazy-load spinner, browsing history empty state, footer |
| `04-search-suggestions.jpg` | Typeahead dropdown with bold completions and type carousel |
| `05-search-results-list-top.jpg` | Results bar, sort, filter sidebar, sponsored strip, chips |
| `06-search-results-list-cards.jpg` | List-layout product cards, Add to cart vs See options |
| `07-filter-brand-applied.jpg` | Brand filter applied (Sony), count 212, "Clear" |
| `08-sort-dropdown.png` | Sort options |
| `09-search-results-grid.jpg` | Grid-layout cards (5 columns) |
| `10-product-detail.jpg` | Product page, top: breadcrumbs, title, price, buy box |
| `11-product-gallery-variants.jpg` | Gallery thumbnails, colour variant cards, About this item |
| `12-gallery-thumbnail-hover.jpg` | Thumbnail hover swaps the main image |
| `13-variant-switched.jpg` | After choosing "Olive": price, images and buy box changed |
| `14-cart-empty.jpg` | Empty cart state |
| `15-added-to-cart.jpg` | "Added to cart" page and right-side mini-cart |
| `16-cart-with-item.jpg` | Cart with 1 item, stepper with bin icon |
| `17-cart-quantity-optimistic.png` | 0.3 s after "+": qty 2, subtotal already updated |
| `18-cart-quantity-2.jpg` | Settled at quantity 2, header badge 2 |
| `19-checkout-address-step.jpg` | Secure checkout, address step, collapsed steps, summary |
| `20-cart-item-removed.jpg` | Inline "was removed from Shopping Cart" message |
| `21-search-no-results.jpg` | Nonsense query: sponsored filler, no empty state |
