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

## 5. Empty, loading and error states always explain the next step — Built (every page)

- **Amazon:** a no-results search showed sponsored products and a carousel, with no "no results" message (recon §2.4). The empty cart is clear but crowded with recommendations (recon §2.8).
- **What we changed:**
  - A shared `EmptyState` that always gives a title, an explanation and an action.
  - `Skeleton` loaders shaped like the real cards.
  - A retry action when loading fails.
  - The catalogue API supports `?simulate=slow` and `?simulate=error`, so these states can be shown and tested on demand.
- **Why:** these moments decide whether someone gives up. Saying exactly what happened is more honest and more useful.
- **User benefit:** no dead ends and no mystery spinners.
- **Tradeoff:** we give up the "recommendations everywhere" upsell Amazon uses at these moments.

## 6. Cart remove has Undo — Built (see decision 34)

- **Amazon:** Delete swaps the line for "…was removed from Shopping Cart" with no undo (recon §2.8). The quantity stepper shows a bin icon at quantity 1.
- **What we changed:** we keep the bin-at-1 stepper, which is familiar and saves space. Removing an item shows an inline notice with an **Undo** button.
- **Why:** the bin sits exactly where the minus button was, so an accidental tap is likely, especially on mobile.
- **User benefit:** a mis-tap costs one click to fix, not a trip back to the product page.
- **Tradeoff:** the cart state has to remember the last removed line and where it was.

## 7. One currency, simple delivery promises — Built (product page, cart, checkout; see decision 42)

- **Amazon:** prices in the shopper's currency (PKR in our recon), with import charges, "typical price" and different delivery windows per product (recon §2.6).
- **What we changed:** prices are in USD. Delivery is a simple rule shown as a date:
  - **Standard:** 3–5 business days, free from $35, otherwise $4.99.
  - **Express:** 1–2 business days, $9.99.
  - We always promise the **latest** date ("by Fri, Oct 9"), never one we might miss. The rule lives in `src/lib/delivery.ts` so checkout can reuse it.
- **Why:** import fees and currency maths add a lot of complexity and almost nothing to judging the journey.
- **User benefit:** the total is predictable from the product page to checkout.
- **Tradeoff:** not realistic for international shoppers.

## 8. A header with three jobs: logo, search, cart — Built

- **Amazon:** the top bar holds nine controls: logo, "Deliver to", an "All" scope dropdown, the search field, the search button, language, "Account & Lists", "Returns & Orders" and the cart (recon §2.2). A second bar adds "☰ All" and a row of service links that get cut off with "…".
- **What we changed:**
  - The top bar keeps only the **logo, search and cart**. Search takes all the free width.
  - Removed: Deliver-to (one currency and a simple delivery rule, see decision 7), language, Account & Lists and Returns & Orders (no accounts in this build), and the "All" dropdown (narrowing by category is a filter on the results page).
  - The bar is **sticky**, so search is never more than a glance away.
  - Kept: Amazon's dark `#131921` bar, the `#FEBD69` search button, and the orange cart count above the cart icon. These are what make it feel familiar.
  - The logo is a plain text wordmark ("amazon.clone"), not Amazon's logo or smile arrow.
- **Why:** search is the main action when shopping. Every control that doesn't work here is noise that competes with it.
- **User benefit:** one obvious place to start, and the header looks the same on every page.
- **Tradeoff:** no visible account or order-history entry points. If accounts are added later, they need a place in the bar.

## 9. Search comes first on phones too — Built

- **Amazon:** the desktop site isn't responsive. Its mobile site puts search on a second header row (recon §2.11, known, not observed today).
- **What we changed:**
  - Below 768 px, search drops to its **own full-width row** under the logo and cart, 44 px tall. It's the same search box in the DOM, just reordered, so there's no duplicate control.
  - The search box shows the current query and stays in step with back/forward.
  - The hero adds **"Popular searches"** chips (headphones, water bottle, backpack…). Each one is a real query that matches the catalogue, so a first visit shows what the store sells and how search works. On phones they're one swipe row, so they don't push products down.
- **Why:** on a phone, search is the fastest way to find something, so it gets the most room.
- **User benefit:** a full-width box that's easy to tap, plus one-tap starting points for people who don't know what to type yet.
- **Tradeoff:** the sticky header takes about 108 px of a phone screen. We accepted that so search is always reachable.
- **Typeahead:** see decision 16.

## 10. Six category links instead of a menu drawer — Built

- **Amazon:** "☰ All" opens a long side menu of departments, and the second bar lists service links (Customer Service, Registry, Gift Cards, Sell…).
- **What we changed:** one strip of **six plain links**: All products, our five categories, and Today's deals. There's no hamburger menu on any screen size. On phones the strip scrolls sideways; the cut-off last link shows there's more.
- **Why:** with five categories, a menu drawer hides things that fit on screen. A drawer costs a tap and a context switch to reach something that could be visible.
- **User benefit:** every category is one tap away and visible without opening anything.
- **Tradeoff:** this doesn't scale past roughly 8–10 categories. A bigger catalogue would need a menu again.

## 11. A homepage with four modules, not twenty — Built

- **Amazon:** an auto-scrolling row of tall image tiles, then 20+ cards and carousels, with more loading in as you scroll. That includes a pop-up about the delivery country and an empty "browsing history" strip (recon §2.1).
- **What we changed:** the homepage is **hero → shop by category → today's deals → best sellers → footer**.
  - **Hero:** one static panel, with no carousel and no auto-play. It has a headline, the delivery promise, two actions (Today's deals, All products) and the popular-search chips. Its buttons are dark and outlined, not yellow: **yellow stays reserved for cart actions** (decision 3). On phones the product art is hidden so products appear in the first screen.
  - **Shop by category:** keeps Amazon's best homepage pattern, the **2×2 category card**. Each tile is a real product type in that category (Speakers, Headphones…) and opens a search for it.
  - **Today's deals and best sellers:** chosen from real catalogue data, never hand-placed. Deals are the biggest real discounts; best sellers are the most bought last month. Each shelf allows **at most two products per category**, so one category can't fill it, and the two shelves **never repeat a product**. The logic is tested in `src/data/curation.ts`.
  - Removed: pop-ups, recently viewed and the browsing-history strip, sponsored tiles, and themed tiles like "Gifts for gamers".
- **Why:** each extra module dilutes the ones that matter. Rotating carousels hide content and are often skipped.
- **User benefit:** the whole page can be scanned in a few scrolls. Every product on it is there for a reason the shopper can see (on sale, popular).
- **Tradeoff:** less room for merchandising and personalisation. A real store would trade some of this simplicity for revenue.

## 12. Swipe rows on phones, full grids on desktop — Built

- **Amazon:** product rows are carousels with arrow buttons on desktop, and items beyond the row width are hidden until you click.
- **What we changed:** one `Rail` component.
  - **Below 1024 px:** a swipe row that snaps to cards and runs to the screen edge. The cut-off next card shows there's more. About 2.3 product cards fit across a 360 px screen.
  - **From 1024 px:** a plain grid that shows **every item**, with no arrows: 6 product cards or 5 category cards per row.
- **Why:** arrows are small, fiddly targets, and they hide products on screens that have room for them. Swiping is the natural gesture on a phone.
- **User benefit:** nothing hidden on desktop, and natural scrolling on touch.
- **Tradeoff:** shelves are capped at what fits on one desktop row (six). "See all" links lead to the full list on the results page.

## 13. Product cards show only what helps a decision — Built

- **Amazon:** a results card can stack up to 12 lines: other colours, Sponsored, title, subtitle, badge, rating, "bought in past month", price, typical price, delivery date, ships-to and a button (recon §2.5).
- **What we changed:** a shared `ProductCard` shows the **image, one badge, title (2 lines), rating and review count, price with discount and list price, and the number of colours**.
  - The **whole card is one link**, a single large tap target. Keyboard focus outlines the whole card.
  - There's no Add to cart on homepage cards: most products have variants, so the real choice happens on the product page.
- **Why:** fewer lines mean cards are quicker to compare, especially on a phone screen with two cards side by side.
- **User benefit:** faster scanning, and one tap anywhere on the card opens the product.
- **Tradeoff:** delivery date and sales counts aren't on the card. They're on the product page. The results page may add a few lines back where they help comparison.

## 14. Homepage states: content first, honest failure — Built

- **Amazon:** sections lazy-load with a small grey spinner (recon §2.10).
- **What we changed:**
  - **Hero:** the header and hero appear instantly; they need no data.
  - **While loading:** the category cards and shelves show **skeletons shaped like the real cards**, so nothing jumps when products arrive.
  - **On failure:** a single message replaces the catalogue sections, with **Try again**. It notes that search still works.
  - **Empty:** a shelf with nothing to show is hidden rather than shown empty.
  - **Testing:** `?simulate=slow` and `?simulate=error` show these states on demand.
- **Why:** a spinner says nothing about what's coming. Skeletons set expectations, and the page stays usable while it loads.
- **User benefit:** the page looks ready immediately, and a failure has a clear way forward.
- **Tradeoff:** skeleton components need to be kept in step with the real card layouts.

## 15. Footer that only says useful, true things — Built

- **Amazon:** "Back to top", then four columns of corporate links: Get to Know Us, Make Money with Us, Amazon Payment Products, Let Us Help You (recon §2.1).
- **What we changed:** kept **Back to top**, which is especially useful on long phone pages; it respects reduced motion. Then three short columns: **Shop** (the categories), **Delivery & returns** (the actual delivery promise), and **About this store**, which says plainly that it's a demo not affiliated with Amazon, with no accounts or real payments. On phones the columns stack.
- **Why:** links to pages that don't exist are dead ends. Being clear that it's a demo builds trust instead of borrowing it.
- **User benefit:** no dead links, and the delivery promise is easy to find.
- **Tradeoff:** a thinner footer than a real store would need (no help centre, careers, legal pages).

## 16. Typeahead: three short groups from our own catalogue — Built

- **Amazon:** the dropdown holds about 7 query completions with product thumbnails, 3 AI ("Rufus") suggestions, and a "by type" image carousel (recon §2.3, screenshot 04).
- **What we changed:**
  - **Searches:** up to 6 completions. Every one is a real phrase from our catalogue (product types, keywords, brands, category names) that returns at least one result, so a suggestion never leads to an empty page. Like Amazon, what you typed stays regular and the completion is **bold**.
  - **Categories:** if you type a category name ("elec"), a shortcut to browse it. If your words span several categories ("bottle"), up to two options to search within one, with result counts.
  - **Products:** the top 4 matches with thumbnail and price, straight to the product.
  - **Empty box:** focusing it shows "Popular searches".
  - Removed: AI suggestions and the type carousel.
- **Accessibility:** it uses the standard ARIA combobox pattern. Focus stays in the text box; ↑/↓ move through options; Enter picks one, or searches what's typed if none is highlighted; Escape closes the list and keeps your text; Tab moves on. Mouse hover highlights options but is never required.
- **Why:** suggestions should save typing and prevent dead ends. More groups make the list slower to scan.
- **User benefit:** fast, predictable suggestions that always lead somewhere real.
- **Tradeoff:** suggestions are computed in the browser from the local catalogue. That's instant at 38 products; a real store would need a search service. Suggested products open their product pages.

## 17. The URL is the only source of truth for search — Built

- **Amazon:** query, filters and sort all live in the URL (`/s?k=…&rh=…`). Every filter is a full page reload (recon §2.4).
- **What we changed:** we kept the idea and made the URL readable: `/s?k=bottle&category=home-kitchen&max=20&sort=price-asc`.
  - The page keeps no search state of its own. Every filter and sort change goes to a new URL, so **refresh, Back/Forward and shared links reproduce exactly the same results**.
  - Changes happen without a page reload.
  - Malformed or unknown values in a URL are ignored rather than trusted. A reversed price range is swapped.
  - A new search from the header starts fresh; filters from the last search don't carry over silently.
- **Why:** a results page you can't link to or refresh is broken.
- **User benefit:** Back undoes the last filter, and a link sent to a friend shows the same page.
- **Tradeoff:** every filter click adds a history entry, so Back steps through filters one at a time. We think that's the expected behaviour.

## 18. Three filters instead of 39 — Built

- **Amazon:** a permanent left sidebar with 39 filter groups for one query (Popular Shopping Ideas, Brands, Colour, Features, Compatible Devices…) (recon §2.4, screenshot 05).
- **What we changed:** **Category, Price and Customer rating**, plus a **Today's deals** switch.
  - The deals switch is there because the homepage "Today's deals" links need it.
  - **Price:** buckets fitted to this catalogue (Under $20, $20–$50, $50–$100, $100 & above) plus a custom min–max.
  - **Rating:** "4.7 & up" and "4.5 & up". Every product is rated 4.2–4.9, so Amazon's "4 stars & up" would match everything and filter nothing.
  - **Counts:** every option shows how many results it would give with your other filters kept. An option with 0 is disabled, so a click can't lead to an empty page.
  - **Chips:** active filters appear above the results as removable chips, with "Clear all".
  - **Sort:** Relevance ("Featured" when there's no query), Price low→high and high→low, Customer rating, Best sellers.
- **Why:** with 38 products, more filters would mostly offer empty choices. Each filter we kept narrows real results.
- **User benefit:** you can see the whole filter panel at once, and every option is honest about what it gives.
- **Tradeoff:** no brand, colour or feature filters. Search covers those words: "lilac yoga" works. A bigger catalogue would justify a brand filter first.

## 19. Mobile filters in a drawer, not a sidebar — Built

- **Amazon:** the desktop sidebar is always visible. The mobile site puts filters behind a button (recon §2.11, known, not observed today).
- **What we changed:**
  - **Below 1024 px:** a **Filters** button, showing how many filters are active, opens a slide-in drawer. It uses the browser's native modal dialog, so focus stays inside it, Escape closes it and the page behind can't be clicked.
  - **Inside the drawer:** filters apply as you tap, and the bottom button shows the live count ("Show 2 results").
  - **On desktop:** the same component is a short sticky sidebar.
- **Why:** a permanent sidebar on a phone would push results off screen.
- **User benefit:** results come first on phones, and filters are one tap away with clear feedback.
- **Tradeoff:** two presentations of one component. Filters apply instantly rather than on "Apply", which is faster but re-runs the search on every tap. That's trivial at this catalogue size.

## 20. No results means an honest page with ways forward — Built

- **Amazon:** a nonsense query showed a sponsored product and a "Recently bought and rated" ad carousel, and never said nothing matched (recon §2.4, screenshot 21).
- **What we changed:** two different empty states, and **never any filler products**.
  - **The words match nothing:** "No results for '…'", spelling advice, Browse all products, **popular searches** and **category** shortcuts. If one word of a longer query works on its own, it's offered: "headphones qzxv" suggests "headphones (2)". Filters and sort are hidden here, because they can't help and would only show a wall of zeros.
  - **The filters emptied the page:** "No results match these filters". It says how many results the words have without filters, with one **Clear filters** button that keeps the query.
- **Why:** a no-results page is where shoppers give up. Showing unrelated products pretends the search worked.
- **User benefit:** you always know what happened and have a one-tap way forward.
- **Tradeoff:** no "did you mean" spelling correction. A small catalogue doesn't justify fuzzy matching yet.

## 21. Search that understands how people type — Built

- **Amazon:** large-scale ranked search with spelling correction (not observable in detail).
- **What we changed:** a small, tested local search in `src/lib/search.ts`.
  - **Every meaningful word must match.** Filler words like "for" and "the" are ignored, so "bag for travel" finds the sling bag.
  - **Partial words and plurals:** "head" finds headphones, and "bottles" finds bottle.
  - **Fields are weighted:** product type beats title, which beats keywords, which beats colour names. A product that *is* headphones ranks above one that mentions them.
  - **Whole words for colours:** colour names only match whole words, so "sun" finds sunglasses, not "Sunset Orange" items.
  - **Ties** go to the more popular product.
  - It also searches brands, book authors and colours: "mara ellison" finds her novel.
- **Why:** shoppers type fragments and plurals. Strict matching would make good queries look like failures.
- **User benefit:** fewer empty results and sensible ordering.
- **Tradeoff:** no typo tolerance or synonyms ("sofa" won't find "couch"). It's fine at this size; a real store would use a search engine.

## 22. Results page states — Built

- **What we changed:** the results page uses decision 5's states.
  - **Loading:** card-shaped skeletons while products load.
  - **Error:** a message with **Try again**.
  - **Count updates:** the result count is announced to screen readers when it changes.
  - **Layout:** results use the shared `ProductCard`: 2 columns at 360 px, then 3, 4, and 3–5 beside the desktop sidebar. There's no pagination: the largest result set is the whole catalogue (38).
- **Tradeoff:** a bigger catalogue would need pagination or "Show more".

## 23. A product page that answers five questions — Built

- **Amazon:** a three-column page (gallery 659 px | details 513 px | buy box 244 px) with deep breadcrumbs, a store link, AI-summary bullets, import charges, a variant card grid and a long buy box. Sponsored strips, "compare with similar items", Q&A and several recommendation carousels sit below (recon §2.6, screenshots 10–13).
- **What we changed:** the page is built around five questions: *What is it? Is it right for me? What options are there? What will it cost? Can I add it to my cart?*
  - **Desktop:** two columns. A sticky gallery on the left. On the right: title, rating, price, options, purchase box and "Why you'll love it".
  - **Below the fold:** About this item and Specifications side by side, then ratings and reviews, then related products.
  - **Breadcrumbs:** two levels (Category › Type), both real searches. Amazon shows six.
  - **Price** appears **once**, above the options it depends on. Amazon repeats it in the buy box.
- **What we deliberately left out, and why:**
  - **Buy Now:** it would need a second checkout entry point and duplicate logic. Add to cart plus a short cart → checkout path covers it.
  - **Import charges, currency and "Deliver to":** see decision 7. One currency and one delivery rule.
  - **Seller/shipper, gift options, Add to List, Auto Buy:** no marketplace, accounts or lists in this build.
  - **"Click to see full view", zoom, share and ♡ buttons:** the image already fills the column, and sharing works with the page URL.
  - **Sponsored strips, "compare with similar items", Q&A, AI summaries:** noise, or features needing data we don't have.
  - **Delivery "order within 3 hrs" countdowns and urgency messages:** we show real stock ("Only 3 left") but no invented time pressure.
- **Why:** each extra block makes the essential five harder to find, especially on a phone.
- **User benefit:** a calmer page where the purchase decision is obvious.
- **Tradeoff:** shoppers who rely on Buy Now or Q&A don't get them here.

## 24. Gallery: swipe on touch, hover or click on desktop — Built

- **Amazon:** a main image with 6 thumbnails below it. **Hovering** a thumbnail swaps the image instantly (recon §2.6, screenshot 12).
- **What we changed:**
  - **Kept:** hover-to-swap, but only for a real mouse; a tap on a touch screen doesn't count as hover.
  - **Touch:** the main image is a **swipeable strip that snaps** image by image, with a "2 / 4" counter and thumbnails that follow the swipe.
  - **Keyboard:** thumbnails are buttons with clear names ("Show image 2 of 4: … angled view"). ← → Home End move between them.
  - **Alt text:** every image describes what it shows, including the colour, and the features card reads out its three selling points.
  - **Colour changes:** the gallery restarts on that colour's main image. Size or format changes keep your place, since the images are the same.
- **Why:** hover is great with a mouse and doesn't exist on a phone. Swiping is the natural gesture there.
- **User benefit:** the gallery works with mouse, touch, keyboard and screen readers.
- **Tradeoff:** no zoom or full-screen view. Our generated art is clear at column size; real photos would justify a zoom.

## 25. Options that can't lead to a dead end — Built

- **Amazon:** colour cards with image, price and struck price. Choosing one changes the URL, price, images and stock (recon §2.6, screenshot 13).
- **What we changed:** options come only from real catalogue variants. Nothing is invented.
  - **Colours** are image tiles. Other options (size, capacity, book format) are buttons. Each is a native radio group, so arrow keys work and sold-out values are skipped automatically.
  - **Sold out everywhere:** a value with no stock at all (e.g. sage headphones) is **disabled** and struck through, with "Out of stock".
  - **In stock only with another choice:** a value like "40 oz" when Navy 40 oz is sold out stays selectable, with a **dashed border** and "Other colours". Picking it moves you to the nearest in-stock variant and **says what changed**: "40 oz isn't available in Navy, so we switched to Sand." Nothing switches silently.
  - **Prices on choices** appear only when the choice changes the price (capacity, format), not on colours that all cost the same.
  - **One-value options are hidden:** a book's single cover, a one-colour dumbbell. A choice with one option isn't a choice.
  - **The selected variant is in the URL** (`?variant=`), so a shared link opens the same option. Changing options replaces the history entry instead of adding one, so Back leaves the product in one step. A sold-out variant opened from a link shows "Currently unavailable" and can't be added.
- **Why:** greying out every combination that doesn't fit the current selection traps people. Switching silently confuses them.
- **User benefit:** every visible choice either works or says why not.
- **Tradeoff:** the nearest-variant rule chooses for the shopper when there's a conflict. We explain the switch, but someone may still prefer another colour.

## 26. Purchase box: stock, a dated promise, quantity, one button — Built

- **Amazon:** price, import charges, delivery, location, "In Stock", a quantity dropdown, Add to cart (yellow), Buy Now (orange), seller, returns, gift options, Add to List, Auto Buy (recon §2.6).
- **What we changed:**
  - **Stock:** "In stock", "Only N left in stock", or "Currently unavailable" with a pointer to the other options. The Add button becomes disabled and says why.
  - **Delivery:** "FREE delivery by Fri, Oct 9", or "$4.99 delivery…" plus "Free on orders over $35", and the Express date and price.
  - **Quantity:** the existing pill stepper, capped at the stock left or 10, whichever is lower. Amazon uses a dropdown; a stepper takes one tap per change and is easier to use on a phone.
  - **Add to cart:** one yellow button, the only yellow on the page (decision 3). Its accessible name says what will be added ("Add 2 to cart: … Sand").
  - **Trust:** 30-day returns and secure checkout, in one quiet line each.
- **Why:** these are the things that decide a purchase. Everything else in Amazon's box serves features we don't have.
- **User benefit:** you can see what you'll pay, when it arrives and how many are left, without reading a column of options.
- **Tradeoff:** no Buy Now (decision 23).

## 27. Add to cart confirms in place — Built

- **Amazon:** Add to cart goes to a separate "Added to cart" page, with a mini cart and a "Based on what you added" carousel. The header count goes up (recon §2.7, screenshot 15).
- **What we changed:** you **stay on the product**. Adding gives three signals at once:
  - **The button** reads "✓ Added to cart" for two seconds.
  - **The header count** pops to the new total.
  - **A toast** shows the item, variant and quantity in the cart, the cart's item count and subtotal, and **Go to cart**. It stays while hovered or focused, closes after 8 seconds, and is announced to screen readers.
  - **Limits:** adding more than the stock allows says so ("That's all we have in stock" or "Already at the limit") instead of silently capping.
  - **Persistence:** the cart is saved in the browser and survives refreshes. It's a minimal store whose only action is "add", built to be extended by the cart stage (`src/state/cart.ts`).
- **Why:** a full-page detour after every add breaks browsing, especially when comparing several items.
- **User benefit:** immediate, unmistakable confirmation, and you keep your place.
- **Tradeoff:** no upsell moment after adding, which Amazon uses for revenue.

## 28. On phones, the purchase stays one tap away — Built

- **Amazon:** the desktop site has no phone layout (recon §2.11).
- **What we changed:** at 360 px the page is laid out for a phone.
  - **Order:** title first (18 px, readable), then a full-width image, then price, options, purchase box.
  - **Sticky bar:** whenever the main Add to cart button is off screen, a bar with the price, the chosen option and **Add to cart** sits at the bottom. On a first visit the image and title alone fill the screen, so the purchase action is never out of reach.
  - **Touch targets:** variant controls are at least 44 px tall. Colour names wrap rather than truncate.
- **Why:** on a phone, title, image and options take more than a screen. Without the bar, the main action would start below the fold.
- **User benefit:** the purchase action is always visible, without squeezing the page.
- **Tradeoff:** the bar covers a little of the page bottom. The page reserves space for it so nothing is hidden behind it.

## 29. Reviews are read-only and short — Built

- **Amazon:** a ratings histogram, AI review summary, filters by star or keyword, photo reviews, "helpful" votes, review sorting and many pages of reviews.
- **What we changed:** the average, the star breakdown (as a real table for screen readers), and the product's three reviews with author, date and a "Verified purchase" mark. The rating at the top of the page jumps to this section. There's no review writing (out of scope) and no filters.
- **Why:** at the decision moment a shopper needs "do people like it, and why?". Three representative reviews answer that.
- **User benefit:** social proof without a second page to dig through.
- **Tradeoff:** no way to see more reviews or filter to critical ones.

## 30. Related products without a recommendation engine — Built

- **Amazon:** several carousels ("Customers also viewed", "Products related to this item", sponsored) driven by behaviour data.
- **What we changed:** one shelf of up to 6 **Related products**. First, the same kind of product (other headphones for headphones). Then the most popular in-stock items from the same category. It uses the shared shelf (swipe row on phones, grid on desktop) with "See all" to the category.
- **Why:** an honest rule we can explain beats pretend personalisation.
- **User benefit:** obvious alternatives right where you're comparing.
- **Tradeoff:** no "frequently bought together", cross-category suggestions or personal history.

## 31. Product page states — Built

- **Loading:** a skeleton shaped like the page (gallery, title, options, purchase box) while the product loads.
- **Not found:** an unknown or garbled product ID, e.g. an old link, gets "We can't find that product", with **Browse all products** and **Go to homepage**. It's not a blank page or a generic error.
- **Data failure:** "This product didn't load", with **Try again** and **Keep shopping**.
- **Related products** load on their own: if they fail, the shelf is simply hidden and the product still works.
- **Tradeoff:** none significant. These states use the same shared components as the other pages.

## 32. A cart that answers four questions — Built

- **Amazon:** a grey page with a white panel per section. Each line has a selection checkbox, image, title, "In Stock", "This is a gift", colour, a pill stepper, and "Delete | Save for later | Compare with similar items | Share", with the unit price on the right. Below it sits a "Your Items" panel with "saved for later" and "Buy it again" tabs. On the right: subtotal, "This order contains a gift", Proceed to checkout, a Prime upsell, and a recommendations column, **even on an empty cart** (recon §2.8, screenshots 14, 16, 20).
- **What we changed:** the cart answers *What am I buying? How many? What will it cost? Am I ready to continue?*
  - **Each line:** image, title (links back to that exact variant), the chosen options ("Colour: Navy · Capacity: 32 oz"), stock, quantity, Remove, and price.
  - **Price:** we show the **line total**, plus "$89.99 each" when the quantity is above 1, so the number you scan matches what you'll pay. Amazon shows only the unit price.
  - **Layout:** kept the grey task-page background with white panels (decision 3), and the summary in a sticky right column on desktop.
- **What we deliberately left out, and why:**
  - **Selection checkboxes ("Deselect all items"):** a second way to say "not this one" that's easy to miss. Remove plus Undo is clearer.
  - **"This is a gift" and gift options:** no gift flow in this build.
  - **Save for later and "Buy it again":** we have no accounts or order history. Save for later would duplicate Undo for a single visit. It's the first thing to add with accounts.
  - **Compare with similar items, Share:** low value at the decision moment. Sharing a cart isn't a real need here.
  - **Prime upsell and the recommendations column:** the cart is for finishing a purchase, not starting new ones.
- **Why:** each extra control competes with "check what you're buying and continue".
- **User benefit:** a cart you can check at a glance.
- **Tradeoff:** shoppers who park items with Save for later can't do that yet.

## 33. Quantity: the familiar stepper, with limits that explain themselves — Built

- **Amazon:** a pill stepper with a bin icon at quantity 1. "+" updated the count, subtotal and header badge within 0.3 s (recon §2.8, screenshots 17, 18).
- **What we changed:**
  - **Kept:** the stepper, bin at 1, and instant updates to the line, summary and header count.
  - **Limits:** you can't go below 1 (the bin removes instead) or above the stock or 10 per item.
  - **At the limit, the line says so in words** ("That's all we have: only 2 in stock."). Pressing **+** again announces the reason to screen readers.
  - **Focus stays put at the limit:** **+** stays focusable rather than becoming disabled, because a button that disables under keyboard focus throws focus to the top of the page and says nothing.
  - This is an option on the shared `QuantityStepper` (`onLimit`); the product page keeps its simpler behaviour.
- **Why:** a greyed-out + with no explanation looks broken.
- **User benefit:** you always know why you can't add more.
- **Tradeoff:** one more line of text at the limit.

## 34. Remove is instant, Undo is exact and in place — Built

- **Amazon:** Delete replaces the line with "[product] was removed from Shopping Cart." There's no undo (recon §2.8, screenshot 20).
- **What we changed:**
  - **Remove takes effect at once.** The header count and totals update, and a notice appears **exactly where the line was**: "Removed: [title] · Colour: Sand · Qty 1", with **Undo**.
  - **Undo restores the same product, variant and quantity in the same position.** If you added that variant again meanwhile, the quantities merge.
  - **No timer:** the notice stays until you dismiss it or leave the cart, so there's no race. Removing several items leaves several Undo notices.
  - **Focus follows:** keyboard focus moves to Undo after removing, and back to the line after undoing. Both actions are announced.
  - **Emptying the cart:** removing the last item keeps the Undo notices on screen, with "Your cart is now empty", rather than switching straight to the empty page.
- **Why:** the bin sits where minus was, so mis-taps happen, especially on phones. Recovering shouldn't mean finding the product again.
- **User benefit:** a mistake costs one tap.
- **Tradeoff:** undo lasts only while you're on the cart page. Leaving makes the removal permanent.

## 35. Pricing summary: only the store's real rules — Built

- **Amazon:** "Subtotal (N items)" and Proceed to checkout. Shipping and tax appear only at checkout, as "--" until an address exists (recon §2.8, §2.9).
- **What we changed:** the summary shows **Items (N)**, **Delivery** (FREE, or $4.99 under $35, with the "by" date), and **Total**.
  - **Free delivery gap:** below $35 it says how much more you'd need ("Add $15.01 more for FREE standard delivery").
  - **Express:** it says Express ($9.99) can be chosen at checkout.
  - **Nothing invented:** no tax, import charges, seller fees or coupons, since none are part of our store model (decision 7).
- **Why:** showing the delivery cost before checkout removes the classic surprise at the last step.
- **User benefit:** the total in the cart is the total you'll pay with standard delivery.
- **Tradeoff:** a real store would need tax. It would appear here as one clearly labelled line.

## 36. Impossible purchases are blocked, and the cart says why — Built

- **Amazon:** not observed. A cart line can go out of stock or disappear between visits.
- **What we changed:** every saved line is checked against the current catalogue each time the cart is shown (`resolveLine` in `src/state/cart.ts`). Nothing is dropped or changed silently.
  - **Too many** (e.g. 5 in the cart, 2 in stock): "Only 2 are available. You have 5 in your cart." with a one-click **Change to 2**.
  - **Sold out:** "Currently unavailable", with a link to **choose another option**.
  - **Option gone, product still sold:** "No longer available. The option you chose isn't sold any more", with a link to choose another option, and the product's image so the line is recognisable.
  - **Product gone:** "No longer available. This item is no longer sold here."
  - **Unavailable lines** are marked "Not included in total" and left out of the price.
  - **Checkout is blocked:** while any line has a problem, **Proceed to checkout** is disabled, and the reason ("2 items need your attention…") is linked to the button for screen readers.
  - **Text, not colour:** every message is spelled out, with an icon as well as a colour.
  - **Corrupted saved data** (malformed JSON, duplicates) falls back safely. Well-formed lines for products that no longer exist are kept, so the shopper is told rather than left wondering.
- **Why:** quietly shrinking a cart erodes trust. Letting it through to checkout fails later and worse.
- **User benefit:** you find out about a problem in the cart, with the fix one tap away.
- **Tradeoff:** a shopper must act before checking out. We chose that over silent auto-correction.

## 37. Empty cart: say so, offer a way back, show nothing else — Built

- **Amazon:** "Your Amazon Cart is empty", links to the homepage, deals and Wish List, then the "Your Items" tabs and a recommendations column (recon §2.8, screenshot 14).
- **What we changed:** "Your cart is empty", a line explaining that the cart is saved on this device, **Continue shopping** and **See today's deals**. **No products and no recommendations.**
- **Why:** filler products on an empty page are an ad, not help.
- **User benefit:** a clear, calm state with one obvious next step.
- **Tradeoff:** no merchandising on an empty cart.

## 38. Mobile cart: lines built for thumbs, checkout always in reach — Built

- **Amazon:** the desktop cart has no phone layout (recon §2.11).
- **What we changed:** at 360 px each line is laid out for a phone:
  - **Image:** 88 px, large enough to recognise the item.
  - **Text:** the title (two lines), options and stock beside the image, then the price.
  - **Controls:** a full-width row with the stepper (40 px buttons) and a 40 px Remove.
  - **Sticky bar:** whenever the summary's checkout button is off screen, a bar shows the **total and Proceed to checkout**, or "Fix N items" while problems remain. It hides once the real summary is in view, so there aren't two buttons on screen.
  - **No overflow:** nothing scrolls sideways.
- **Why:** with several items, the summary sits far below the first screen on a phone.
- **User benefit:** you can always see the total and continue, without scrolling to the bottom.
- **Tradeoff:** the bar covers a strip of the screen. The page reserves space for it so nothing hides behind it.

## 39. Cart state is one small store every stage shares — Built

- **What we built:** `src/state/cart.ts` extends the product page's store rather than replacing it.
  - **Actions:** a pure, tested reducer with `add`, `setQuantity`, `remove`, `restore` (for Undo) and `clear` (for checkout).
  - **Storage:** lines store only product, variant and quantity. Prices and stock are always read from the catalogue, so a saved cart can never show a stale price.
  - **Syncing:** it's saved in the browser, stays in step across tabs, and the header count, cart page and checkout all read the same store.
- **Why:** checkout must charge exactly what the cart shows. One store with one set of rules guarantees that.
- **User benefit:** consistent numbers everywhere.
- **Tradeoff:** the cart lives on one device and browser. Accounts would be needed to sync it across devices.

## 40. Checkout is one focused page, not a wizard — Built

- **Amazon:** checkout has its own header (logo, "Secure checkout", cart icon) and drops search and navigation. The page is a stack of panels: address, payment, then "Review items and shipping". Later panels stay collapsed to a heading until the earlier ones are done, and the summary's yellow button changes its label with each step (recon §2.2, §2.9, screenshot 19). Everything after the address step was inferred, not observed.
- **What we changed:**
  - **Kept:** the separate layout without search or the category bar, and the numbered white panels on the grey task background with a summary on the right (decision 3).
  - **One page, four sections, all open:** 1 Delivery address, 2 Delivery speed, 3 Payment method, 4 Review items. Only the address needs typing. Delivery and payment are short choices with sensible defaults (Standard, Demo card), so collapsing them would add clicks and hide prices.
  - **"Back to cart"** sits in the header instead of a cart icon, so leaving checkout is obvious.
  - **Editing stays in one place:** review items is read-only, with "Edit in cart". Quantities and removals have exactly one home (decisions 33, 34).
  - **Real numbers from the start:** the summary shows items, delivery and total straight away, where Amazon shows "--" until an address exists.
- **What we deliberately left out, and why:**
  - **Pickup locations, gift options, multiple shipments, delivery instructions:** no data behind them, and no evidence they matter for this journey.
  - **Sign-in and saved addresses:** no accounts in this build. Checkout works as a guest.
  - **Tax, promo codes, gift cards:** no tax model and no coupons (decisions 7, 35).
- **Why:** the shopper decided in the cart. Checkout only needs to collect a destination, confirm two choices and show the total. Steps that open one by one make sense when each step depends on the last; ours don't.
- **User benefit:** you can see everything you're agreeing to, and the price, on one screen.
- **Tradeoff:** the page is longer on a phone. Decision 46 covers that.

## 41. Address form: US-only, few fields, autofill, kept for this tab only — Built

- **Amazon:** "Add an address" opens in a modal, pre-filled from the account. Its fields are Country/Region, Full name, Phone number ("May be used to assist delivery"), Street address, Unit/suite, City, State, ZIP, and "Make this my default address" (recon §2.9).
- **What we changed:**
  - **Inline, not a modal:** the form sits in step 1. Once saved it collapses to the address with **Change**, and **Cancel** puts the saved address back.
  - **Country is fixed to the United States** and stated in text, since the store has one currency and one delivery rule (decision 7). State is a list, so it can't be mistyped.
  - **Phone is optional** and says what it's for. There's no "default address" box, because there's no account to keep a default.
  - **Autofill:** every field has its `shipping …` autocomplete token, so a browser or password manager can fill the form in one tap. ZIP opens a number keypad.
  - **Validation:**
    - errors appear only after you try to continue, then update live as you fix them;
    - messages say what to do ("Enter a 5-digit ZIP code, like 98101");
    - each error is linked to its field, focus moves to the first problem, and the number of problems is announced.
  - **Storage:** the draft is kept in `sessionStorage`. A refresh doesn't lose it; closing the tab deletes it. It's cleared as soon as the order is placed.
- **Why:** an address is personal data. With no account to keep it in, the least surprising choice is to forget it when the tab closes. A modal on a phone hides the page behind it for no gain.
- **User benefit:** fewer fields, faster with autofill, and personal details don't linger on a shared computer.
- **Tradeoff:** returning shoppers type their address again. Saved addresses are the first thing to add with accounts.

## 42. Delivery speed is chosen at checkout, with real dates and fees — Built

- **Amazon:** delivery options and dates appear in "Review items and shipping", after the address (recon §2.9, inferred).
- **What we changed:** step 2 offers **Standard** (FREE from $35, otherwise $4.99) and **Express** ($9.99). Each shows its "Arrives by" date. The rules come from `src/lib/delivery.ts`, the same ones the product page and cart use (decisions 7, 35).
  - **Standard is preselected**, matching the total the cart showed, so arriving at checkout never changes the price.
  - **Changing speed** updates the summary, the "Arriving by" line on the review items, and the confirmation.
  - **Express is never free:** it costs the same at any order size, as the cart said it would.
- **Why:** speed is a price decision, so it belongs next to the total, not behind an address.
- **User benefit:** you see exactly what faster delivery costs and when it arrives before you commit.
- **Tradeoff:** dates don't depend on the address. That's fine for a single-country store with one delivery rule.

## 43. Payment: no card fields in a store that can't take payments — Built

- **Amazon:** a payment-method step with saved cards, card entry and other methods (inferred; not reached in recon).
- **What we changed:** two choices and **no card-number, expiry or CVC fields**:
  - **Demo card ending 4242:** a built-in test card. The option says you won't be asked for card details.
  - **Pay on delivery:** pay by cash or card when the order arrives.
  - A note under the choices, the summary, the checkout footer and the confirmation all say that **no payment is taken**.
- **Why:** a card form on a site that can't process or protect payments invites people to type real card numbers into something that isn't a shop. The recon proposal suggested a fake card form that accepts only test numbers. We dropped it: the risk is real, and the gain (showing card validation) is already covered by the address form.
- **User benefit:** you can't leak real payment details here by mistake, and the page is honest about what happens.
- **Tradeoff:** the payment step doesn't look like a real card checkout. A real store would add a hosted payment field from a payment provider here, never one of its own.

## 44. "Place your order" is never a dead button, re-checks everything, and fails honestly — Built

- **Amazon:** the summary's yellow button does the next step ("Deliver to this address"), then becomes **Place your order** (recon §2.9). What happens on failure wasn't observed.
- **What we changed:**
  - **Always pressable:** "Place your order" is never disabled.
    - If the address has been filled in but not saved, it saves it and places the order in one go.
    - If anything is missing, it takes you straight to the first field that needs attention.
    - A short line under the button says what's still needed ("Add a delivery address to place your order"), and it's linked to the button for screen readers.
  - **Checked again on the "server":** placing the order goes through a simulated API call (`src/api/orders.ts`). It re-reads the catalogue, re-runs the cart checks (`resolveLine`, `cartTotals`) and the address checks, and prices the order with the same rules. An order with an impossible line can't be created, even if the page was out of date.
  - **The cart is watched live:** if the cart changes in another tab and a line becomes impossible, checkout switches to the blocked view straight away (decision 36). Fixing it brings the filled-in checkout back.
  - **One press only:** while placing, the button shows "Placing your order…" and can't be pressed again.
  - **Honest failure:** if placing fails, the page says "We couldn't place your order. You haven't been charged, and your cart is unchanged." Focus returns to the button so you can try again. `?simulate=order-error` shows this on demand.
- **Why:** a disabled button says "no" without saying why. A failed order that leaves people unsure whether they paid is the worst moment in a shop.
- **User benefit:** every press either places the order or shows exactly what to do next, and a failure never leaves you guessing.
- **Tradeoff:** stock isn't reduced after an order (the catalogue is static data), so the same stock can be "bought" again.

## 45. Confirmation: say it worked, show what was ordered, and be honest that it's a demo — Built

- **Amazon:** "Order placed, thanks!" with a green check, the order number, the delivery estimate and a link to "Review or edit your orders" (inferred; not reached in recon).
- **What we changed:** `/order/:orderId` back in the normal store layout, since shopping resumes from here.
  - **Shows:** a green check and **"Order placed, thank you!"** (focus moves to it, so screen readers announce it), the order number, "Arriving by" with the speed, the address, the payment choice, every item with its options and price, and the totals.
  - **Says plainly:** "This is a demo order. No payment was taken and nothing will be shipped. Your cart has been emptied."
  - **A snapshot:** titles, options and prices are saved when the order is placed, so the page never changes afterwards, even if the catalogue does.
  - **Placing replaces checkout in the browser history,** so Back goes to the (now empty) cart, never to a checkout for an order you've already placed.
  - **Storage:** orders are kept in this tab only (`sessionStorage`, last five), so a refresh works. An unknown or expired order number gets an honest "We can't find that order" page explaining why.
- **What we deliberately left out, and why:** order history, "Review or edit your orders", cancellation, tracking and emailed receipts. There are no accounts or backend.
- **Why:** confirmation is about reassurance: it worked, here's what and when. In a demo, being clear that nothing real happened is part of being trustworthy.
- **User benefit:** a clear ending to the journey with everything you need to check, and no false impression that money changed hands.
- **Tradeoff:** the order disappears when the tab closes. A real store would keep it in the account's order history.

## 46. Mobile checkout: one column, big targets, the order button always in reach — Built

- **Amazon:** the desktop checkout has no phone layout (recon §2.11).
- **What we changed:** at 360 px:
  - **One column:** address, delivery, payment, review, then the summary. The header shortens to "Checkout" and "Back".
  - **Touch targets:** form fields are 44 px tall, and the delivery and payment choices are whole-card radio buttons (68 px or more).
  - **Sticky bar:** while the summary's button is off screen, a bar shows the **order total and Place your order**. It hides once the real summary is visible (the same pattern as the cart, decision 38). Pressing it with no address scrolls to and focuses the first field that needs attention.
  - **No overflow:** nothing scrolls sideways on checkout or confirmation.
- **Why:** on a phone the address form alone fills more than a screen, so the total and the final action would otherwise be far below.
- **User benefit:** the total and the way to finish are always visible, and the form is comfortable to fill with a thumb and autofill.
- **Tradeoff:** the bar covers a strip of the screen. The page reserves space for it so nothing hides behind it.

---

_Every decision above is built. The final QA pass (routes, the full journey, 360–1440 px, keyboard and screen-reader basics, all states) found no reason to change any of them._
