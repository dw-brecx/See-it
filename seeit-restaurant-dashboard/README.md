# SeeIt for Restaurants — Dashboard Mockup

A click-through, static HTML/CSS/JS mockup of the **SeeIt for Restaurants**
dashboard — the web app restaurant owners and managers use to manage their
SeeIt listing, menu, photos, reviews, team, and billing.

This is the companion to the customer mobile-app mockup in
`../seeit-customer-mockup`. Same brand, different audience.

> Designed for desktops and iPads (≥ 1280px, responsive down to 768px).
> Not a phone interface — owners use this at the host stand or in the office.

---

## How to view the mockup

These are static files — no backend, no build step.

### Option 1 — Open directly
Double-click `index.html` (it redirects to the sign-in screen) or open
`signin.html` in your browser.

### Option 2 — Local server (recommended)

```bash
# from inside seeit-restaurant-dashboard/
python3 -m http.server 5174
# then open http://localhost:5174 in your browser
```

### Best viewed at
A normal desktop browser window (1280–1440 px wide). It also works on an
iPad in landscape (1180 px). Below 900 px the brand pane on auth pages
collapses; below 768 px the layout reflows to a single column.

---

## File structure

```
seeit-restaurant-dashboard/
├── index.html                    # Redirects to signin.html
├── signin.html                   # Centered sign-in card + testimonial pane
├── signup.html                   # Restaurant + owner info form
├── onboarding.html               # 4-step wizard (basics → branding → menu → done)
│
├── dashboard.html                # Home: stat cards, recent reviews, quick actions
├── menu.html                     # Menu manager: categorized table of dishes
├── menu-edit.html                # Add/edit menu item — full-page form + live preview
├── photos.html                   # Photo gallery (restaurant & customer-uploaded)
├── reviews.html                  # Reviews list + reply modal + rating breakdown
├── insights.html                 # Charts: views, top dishes, ratings, peak times
│
├── settings-profile.html         # Restaurant details, branding, hours, contact
├── settings-account.html         # Owner profile, password, 2FA, sessions
├── settings-team.html            # Team members, roles & permissions, invites
├── settings-notifications.html   # Email / SMS / push toggles per notification type
│
├── billing.html                  # Current plan, payment, invoices, cancel
├── plans.html                    # Pricing tiers, feature comparison, FAQ
│
├── css/styles.css                # One shared stylesheet
├── js/nav.js                     # Sidebar active state, tabs, modal toggles
└── README.md                     # This file
```

**Total: 16 screens** sharing one stylesheet and one tiny JS file.

---

## Navigation map

```
signin  →  dashboard
signup  →  onboarding  →  dashboard

dashboard  (persistent sidebar from here on)
   ├─→ menu  →  menu-edit
   ├─→ photos
   ├─→ reviews  (with reply modal)
   ├─→ insights
   ├─→ settings-profile
   │     ├─→ settings-account
   │     ├─→ settings-team  (with invite modal)
   │     └─→ settings-notifications
   └─→ billing  →  plans
```

The left sidebar is identical on every post-login page. It contains:
- SeeIt logo + "BIZ" pill
- Restaurant chip (logo, name, address)
- Main nav: Dashboard, Menu, Photos, Reviews, Insights
- Account section: Settings, Billing
- User footer with sign-out icon

---

## Design system

### Colors (shared with the customer app for brand consistency)

| Token                   | Value     | Use                                 |
|-------------------------|-----------|-------------------------------------|
| `--color-primary`       | `#E85D3A` | Brand coral · primary CTAs          |
| `--color-primary-dark`  | `#C94924` | Hover / pressed                     |
| `--color-primary-soft`  | `#FCE9E2` | Active nav item, tinted badges      |
| `--color-bg`            | `#FAFAF7` | Page background                     |
| `--color-surface`       | `#FFFFFF` | Cards, sidebar, tables              |
| `--color-text`          | `#1A1A1A` | Primary text                        |
| `--color-text-secondary`| `#5C5C5C` | Secondary text                      |
| `--color-success`       | `#2F8F5C` | "Visible", "Paid", check icons      |
| `--color-warning`       | `#B97E0E` | "Pending", "Hidden" badges          |
| `--color-danger`        | `#C73E2B` | Destructive actions, "Failed"       |
| `--color-star`          | `#F5A623` | Star ratings                        |

### Typography
- **Inter** (400 / 500 / 600 / 700 / 800), loaded from Google Fonts.
- Tight letter-spacing on headings, ~1.5 line-height on body.

### Shape
- 6px (small) → 12px (cards) → 18px (auth cards) corner radii.
- Borders, not shadows, are the default card outline — soft shadows are
  reserved for floating elements (modals, sticky footers, dropdowns).

### Components (all in `css/styles.css`)
- Sidebar with logo, restaurant chip, nav items (active + badge), user footer
- Topbar with breadcrumb, search, notification bell, avatar
- Stat cards with sparklines (inline SVG)
- Tables with media cells (photo + title + sub), badges, hover state, action icons
- Buttons: `--primary`, `--secondary`, `--ghost`, `--dark`, `--danger` + sizes
- Form fields, switches, checkboxes, radio buttons, input prefixes
- Badges with status variants (success / warning / danger / info / accent)
- Underline tabs with optional count chips
- Toolbar segmented groups (filter pills)
- Photo gallery tiles with chip overlays (customer vs restaurant)
- Review items with avatars, ratings, threaded replies, photo strips
- Charts: SVG line charts, CSS bar charts, donut chart, horizontal bar lists
- Empty states with iconed circles
- Plan cards (featured variant with ribbon)
- Modals (overlay + card with head/body/foot)
- Wizard step indicator with done/active/pending states
- Notes / inline tooltips (info / warning / success)

---

## Realism notes

The mockup uses one fictional restaurant throughout — **Bella's Italian
Kitchen**, run by Bella Romano at 432 Valencia St, San Francisco. The menu,
reviews, photos, numbers, team members, and billing history are all
illustrative.

- All food and people imagery is loaded from Unsplash via
  `https://images.unsplash.com/photo-…` URLs.
- All names, addresses, phone numbers, and emails are fictional.
- Numbers (review counts, ratings, revenue) are tuned to feel plausible
  for an established mid-size SF restaurant.

---

## What's intentionally not included

- No real backend, auth, or data fetching — every form just navigates.
- No accessibility audit (basic semantic HTML, `aria-label`s on icon
  buttons, but no full keyboard-trap or focus management).
- No real charting library — all charts are hand-built SVG/CSS that look
  realistic but aren't data-driven.
- No drag-and-drop reordering (handles are visual only).
- No real file uploads (drop zones are decorative).
- Mobile breakpoint below 768px is partially supported but not the
  primary target — this is a desktop product.

When we're ready to build this for real, the components and design
tokens in `styles.css` translate cleanly to React/Vue/whatever-framework.
