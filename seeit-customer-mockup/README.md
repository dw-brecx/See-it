# SeeIt — Customer App Mockup (v2)

A click-through, static HTML/CSS/JS mockup of the **SeeIt** customer
mobile app — built for diners deciding what to eat by browsing real
customer photos and reviews of specific menu items at nearby restaurants.

This is the companion to the restaurant dashboard in
`../seeit-restaurant-dashboard`. Same brand, same target product,
opposite side of the marketplace.

> *See it before you order it.*

> **Mobile-first.** Designed for a **390px-wide viewport** (iPhone
> 14/15 Pro). Looks great on phone, fine on desktop (centered phone
> canvas).

---

## How to view it

These are static files — no backend, no build step.

### Option 1 — Open directly
Double-click `index.html` (it redirects to the splash screen) or open
`splash.html` in your browser.

### Option 2 — Local server (recommended)

```bash
# from inside seeit-customer-mockup/
python3 -m http.server 5173
# then open http://localhost:5173 in your browser
```

### Best viewed at phone size
Open Chrome DevTools (Cmd+Opt+I), toggle the device toolbar
(Cmd+Shift+M), and pick **iPhone 14 Pro** or set width to **390px**.
Or load the local-server URL on your actual phone over the same WiFi
for the most realistic feel.

---

## File structure

```
seeit-customer-mockup/
├── README.md
├── index.html                         → redirects to splash
│
├── splash.html                        1.  Logo + 3-slide onboarding
├── location.html                      2.  Location permission ask
├── signin.html                        3.  Email + Google/Apple sign in
├── signup.html                        4.  Email + Google/Apple sign up
├── allergy-setup.html                 5.  Allergies & dietary pref (skippable)
│
├── home.html                          6.  Discovery feed (4 horizontal scrollers)
├── search.html                        7.  Search bar, filter chips, recent + trending
├── search-results-dishes.html         8.  Dish list + loading/empty/error previews
├── search-results-restaurants.html    9.  Restaurant list with multi-location dedupe
├── brand-locations.html               10. Multi-location selector for a brand
│
├── restaurant-detail.html             11. Hero, action pills, "What's Good", menu, sheets
├── whats-good.html                    12. "What's Good Here?" standalone view
├── hashgacha.html                     13. Kosher cert deep-detail standalone view
├── dish-detail.html                   14. Carousel, allergy warning, verdict cards, reviews
├── write-review.html                  15. Stars, photo upload, portion size, worth-it, mood
├── qr-scan.html                       16. Animated viewfinder + manual fallback
├── order-list.html                    17. Order list with qty steppers, notes, person tags
├── order-show-server.html             18. Large-text show-server mode (dark)
│
├── saved.html                         19. Tabs: Restaurants / Dishes / Want to try
├── profile.html                       20. Avatar, stats, recent reviews, links
├── order-history.html                 21. Past saved order lists
├── settings.html                      22. Account, preferences, support, log out
├── settings-allergies.html            23. Edit allergies + dietary preferences
│
├── css/styles.css                     shared design system (~1,300 lines)
└── js/nav.js                          sidebar/sheet/tabs/chips/stepper helpers
```

**Total: 24 screens** (including the redirect), all sharing one
stylesheet and one tiny JS file.

---

## Standout features (clickable highlights)

### 🌟 "What's Good Here?" sheet
Open `restaurant-detail.html` and tap the prominent terracotta CTA
near the top. A bottom sheet slides up with the **top 5 dishes** at
that restaurant ranked by photo count + customer rating — each
tappable straight to the dish detail.

### ✡ Kosher hashgacha sheet
On `restaurant-detail.html`, tap the **"✡ Kosher · OU"** chip in the
header. A polished bottom sheet shows:
- Certifying agency (Orthodox Union) with seal
- Kosher type: 🥩 Meat
- Sub-certifications: Glatt, Pas Yisroel, Bishul Yisroel
- Certificate expiration date (Dec 31, 2026)
- Tappable cert image preview
- Kosher for Passover badge

This is shown only when applicable — sub-certs that don't apply
aren't rendered. Standalone full-page view also at `hashgacha.html`
with a glossary section explaining what each sub-cert means.

### 📋 Order List + Show-Server mode
On `restaurant-detail.html`, tap the floating **"Your order list · 3"**
button at the bottom. You land on `order-list.html` with:
- Qty steppers per dish (try them — they work)
- Editable per-item notes ("extra tahini, no pickles")
- Per-person tags ("for Me & Dad", "for Mom", "for the kids")
- A big **"Show server (5 items)"** button → `order-show-server.html`

The show-server view is a **dark, large-text, fullscreen** rendering
optimized for handing the phone to a waiter. Quantities are huge
terracotta numbers; dish names use 26px bold; notes and person-tags
are clearly secondary.

### 💔 Want to Try list with notes
On `saved.html`, expand the "Preview: Want to try tab" section. Each
saved-for-later item can have an **optional note** like *"heard about
this from Sarah"* or *"for Friday date night"* — shown as a
terracotta pill so context isn't lost.

### ⚠️ Allergy warnings
On `dish-detail.html`, a red allergy banner appears because the user
(set up on `allergy-setup.html`) has **Dairy** marked as an allergy
and the dish contains parmesan + brown butter. Verdict cards
("Generous portion", "87% say worth it") sit just below.

### 🏬 Multi-location brand handling
In `search-results-restaurants.html`, "Bella's Italian Kitchen" shows
once with a **"3 locations"** badge instead of three separate cards.
Tapping it routes to `brand-locations.html` which lists all 3
locations with distance and open/closed status — you pick one to
explore.

---

## Navigation map

```
splash → location → signup → allergy-setup → home
                          ↘
                            signin → home

home ─┬─→ search ─┬─→ search-results-dishes ───→ dish-detail ──→ write-review
      │           └─→ search-results-restaurants
      │                  ├─→ brand-locations ──→ restaurant-detail
      │                  └─→ restaurant-detail
      │
      ├─→ restaurant-detail ─┬─→ whats-good (sheet/page)
      │                       ├─→ hashgacha (sheet/page)
      │                       └─→ order-list ──→ order-show-server
      │
      ├─→ qr-scan
      ├─→ saved (Restaurants / Dishes / Want to Try)
      └─→ profile ─┬─→ order-history
                   └─→ settings ──→ settings-allergies
```

Bottom nav (Home · Search · Scan · Saved · Profile) persists across
every main screen. Auth/onboarding/sheet/scan/show-server pages
hide it.

---

## Design system

### Color palette (matches restaurant dashboard)
| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#E85D3A` | Brand coral / primary CTAs |
| `--color-primary-dark` | `#C94924` | Pressed primary |
| `--color-primary-soft` | `#FCE9E2` | Tinted backgrounds |
| `--color-bg` | `#FAFAF7` | App background |
| `--color-surface` | `#FFFFFF` | Cards, sheets |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-text-secondary` | `#6B6B6B` | Secondary text |
| `--color-star` | `#F5A623` | Star ratings |

### Color-coded dietary chips
| Tag | Background | Foreground |
|-----|-----------|------------|
| ✡ Kosher | light blue | navy blue |
| ☪ Halal | mint | dark green |
| 🌿 Vegan | light green | forest green |
| 🥗 Vegetarian | pale lime | olive |
| 🌾 Gluten-Free | pale amber | dark amber |
| 🥛 Dairy-Free | lavender | royal purple |
| 🥜 Nut-Free | soft coral | rust |
| 🌶 Spicy | warm pink | brick |

### Typography
- **Inter** (400 / 500 / 600 / 700 / 800), Google Fonts
- Tight tracking on headings, generous line-height on body

### Components in `css/styles.css`
- App canvas (centered 390px)
- Bottom nav with raised Scan button
- Discovery cards, dish cards, restaurant list rows
- Color-coded dietary chips + filter chips
- Buttons (primary, secondary, ghost, social) + sizes
- Search bar, segmented toggle, underline tabs
- Hero with overlay, dish photo carousel with bylines
- Restaurant detail head, action pills
- **What's Good** card (gradient terracotta with sparkle icon)
- **Hashgacha card** (light blue branded card)
- Allergy warning banner (red)
- Verdict cards (portion size, worth-it)
- Rating summary with horizontal bars
- Review cards with photos and tags
- **Bottom sheet modal** with handle (slides up)
- Sticky bottom CTA
- Order list: qty steppers, editable notes, person tags
- Show-server mode (large-text dark UI)
- Saved tiles (grid)
- Want-to-Try rows with note pills
- Profile, stats, settings list
- Skeleton loading, empty states, error states
- QR scanner viewfinder with animated scan line

---

## Realism notes

- All food/people imagery loaded from Unsplash via stable photo URLs
- Featured restaurant: **Tel Aviv Grill** (kosher, demonstrates
  hashgacha feature)
- Featured multi-location brand: **Bella's Italian Kitchen** with
  Mission, North Beach, and Noe Valley locations (matches the
  restaurant dashboard's example)
- Featured dish: **Truffle Tagliatelle** at Bella's — shown with a
  dairy allergy warning because the user (from `allergy-setup.html`)
  has Dairy marked as an allergy
- All names, addresses, prices, and reviews are illustrative

---

## What's intentionally not built

- No real backend, auth, or data fetching
- No accessibility audit beyond basic semantic HTML + `aria-label`
- No real chart library on dish detail (rating bars are hand-drawn)
- No real file uploads (drop zones are visual)
- No real geolocation
- Sheets slide up via CSS but their state isn't persisted across pages

The design tokens and components in `styles.css` should translate
cleanly when this becomes a real React Native / Flutter app.
