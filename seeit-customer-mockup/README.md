# SeeIt — Customer App Mockup

A click-through, static HTML/CSS/JS mockup of the **SeeIt** customer mobile app.
SeeIt helps people decide what to eat by showing real customer photos and
reviews of specific menu items at nearby restaurants.

> *See it before you order it.*

This folder contains a visual shell of every screen in the app — no backend,
no real data, no real functionality. It's meant to look and feel like a
shipping product so you can show it to friends, restaurant owners, and
investors and have them believe it.

---

## How to view the mockup

The mockup is plain static files. Two ways to open it:

### Option 1 — Open the file directly
Just double-click `index.html` in this folder (or open `splash.html` in your
browser). `index.html` redirects to the splash screen.

### Option 2 — Run a tiny local server (recommended)
Some browsers cache things weirdly when opening files via `file://`. A local
server avoids that.

```bash
# from inside seeit-customer-mockup/
python3 -m http.server 5173
# then open http://localhost:5173 in your browser
```

### Viewing on a phone
The pages are designed for a 390px-wide viewport (iPhone 14 / 15 Pro). The
best way to experience them:

1. Open Chrome DevTools (Cmd+Opt+I on Mac, Ctrl+Shift+I on Windows).
2. Toggle the device toolbar (Cmd+Shift+M / Ctrl+Shift+M).
3. Pick "iPhone 14 Pro" or set width to 390px.

Or — load the local server URL on your actual phone (same WiFi network) for
the most realistic feel.

---

## File structure

```
seeit-customer-mockup/
├── index.html                       # Redirects to splash.html
├── splash.html                      # Logo + 3-slide onboarding
├── location.html                    # Location-permission ask
├── signin.html                      # Email / social sign-in
├── signup.html                      # Email / social sign-up
│
├── home.html                        # Discovery feed (Near You, Trending, etc.)
├── search.html                      # Search bar, filters, recent + trending
├── search-results-dishes.html       # Dish results list (+ loading/empty/error states)
├── search-results-restaurants.html  # Restaurant results list
│
├── restaurant-detail.html           # Hero, info, action pills, menu
├── dish-detail.html                 # Photo carousel, ratings, reviews
├── write-review.html                # Stars, photos, mood tags, text
├── qr-scan.html                     # Camera viewfinder + manual fallback
│
├── saved.html                       # Saved restaurants & dishes (tabs)
├── profile.html                     # Avatar, stats, recent reviews
├── settings.html                    # Account, preferences, support, log out
│
├── css/
│   └── styles.css                   # The single shared stylesheet
├── js/
│   └── nav.js                       # Bottom-nav active state + small UI helpers
└── README.md                        # You are here
```

### Total: 15 screens

All pages share one stylesheet (`css/styles.css`) and one tiny JavaScript
file (`js/nav.js`). No frameworks, no build step, no dependencies beyond a
Google Font and Unsplash images.

---

## Navigation map

```
splash → location → signup → home
                          ↘
                            signin → home

home ─┬─→ search ─┬─→ search-results-dishes ───→ dish-detail ──→ write-review
      │           └─→ search-results-restaurants ─→ restaurant-detail
      │
      ├─→ qr-scan ──→ restaurant-detail
      ├─→ saved ──→ restaurant-detail
      └─→ profile ──→ settings ──→ signin (log out)
```

The bottom navigation bar (Home · Search · Scan · Saved · Profile) is
persistent across every main screen. Detail and modal-style pages
(`splash`, `location`, `signin/up`, `qr-scan`, `write-review`) hide it.

---

## Design system

### Color palette
| Token                   | Value     | Use                           |
|-------------------------|-----------|-------------------------------|
| `--color-primary`       | `#E85D3A` | Brand coral / primary CTAs    |
| `--color-primary-dark`  | `#C94924` | Hover / pressed primary       |
| `--color-primary-soft`  | `#FCE9E2` | Tinted accent surfaces        |
| `--color-bg`            | `#FAFAF7` | App background (warm off-white) |
| `--color-surface`       | `#FFFFFF` | Cards, sheets, headers        |
| `--color-text`          | `#1A1A1A` | Primary text                  |
| `--color-text-secondary`| `#6B6B6B` | Secondary text                |
| `--color-star`          | `#F5A623` | Star ratings                  |

### Typography
- **Inter** (400 / 500 / 600 / 700 / 800) loaded from Google Fonts.
- Tight tracking on headings, generous line-height on body copy.

### Shape & motion
- 12–16 px rounded corners on cards, full pills on chips/buttons.
- Two soft shadow tokens (`--shadow-sm`, `--shadow-md`) — never harsh.
- Subtle `scale(.98)` press feedback on buttons.

### Components
All defined in `css/styles.css`:
- Discovery cards, dish cards, restaurant list rows, dish list rows
- Star ratings (visual SVG), tag chips, filter chips, mood tags
- Buttons (primary, secondary, ghost, social)
- Search bar, segmented toggle, underline tabs
- Bottom nav with raised center "Scan" button
- Hero with overlay, sticky bottom CTA
- Skeleton loading rows, empty states, error states (all shown on the
  search-results-dishes page under collapsible `<details>` previews)

---

## Notes on the imagery

All food and restaurant photography is loaded directly from Unsplash via
`https://images.unsplash.com/photo-…` URLs. They're sized down with query
parameters (`?w=600&q=80&auto=format&fit=crop`) for fast loading on a phone.

Avatars are also Unsplash portraits. Fake user names, restaurant names, and
review text are illustrative only — none of it is real.

---

## What's intentionally not included

- No real backend or data fetching
- No real auth — sign-in and sign-up just navigate to the home screen
- No animations beyond simple CSS transitions and the QR-scan line shimmer
- No accessibility audit (basic semantic HTML and aria-labels only)
- No form validation
- No real geolocation

This is a visual shell. When we're ready to build for real, the design
language and component vocabulary in `styles.css` should translate
directly to whatever framework we land on (React Native, Flutter, etc.).
