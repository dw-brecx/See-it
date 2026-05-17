# SeeIt for Restaurants — Dashboard Mockup (v2)

A click-through, static HTML/CSS/JS mockup of the **SeeIt for Restaurants**
web dashboard. Built for **multi-location restaurant chains** — owners can
manage several locations from one account, with per-location billing,
team permissions, menus, photos, and reviews.

This is the companion to the customer mobile-app mockup in
`../seeit-customer-mockup`. Same brand, different audience.

> **Desktop-first** (1280 px+) with **full responsive support** down to
> phone (≤ 600 px). On mobile, the sidebar collapses into a hamburger
> menu that slides in from the left, tables scroll horizontally, and
> modals dock to the bottom of the screen as sheets.

---

## How to view the mockup

These are static files — no backend, no build step.

### Quickest: open directly
Double-click `index.html` (it redirects to the sign-in screen) or open
`signin.html` in your browser.

### Recommended: local server

```bash
# from inside seeit-restaurant-dashboard/
python3 -m http.server 5174
# open http://localhost:5174 in any browser
```

### Try the responsive breakpoints
1. Open Chrome DevTools (Cmd+Opt+I / Ctrl+Shift+I)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Try these widths:
   - **1440 px** — full desktop layout
   - **1024 px** — tablet (sidebar still visible, narrower)
   - **768 px** — sidebar collapses, hamburger appears
   - **390 px** — phone (single-column, scrollable tables)

---

## File structure

```
seeit-restaurant-dashboard/
├── index.html                       # → redirects to signin.html
├── signin.html                      # 1. Centered card + brand pane
├── signup.html                      # 2. 3-step: owner → restaurant → plan
├── onboarding.html                  # 3. 4-step wizard (currently on Step 2)
│
├── dashboard.html                   # 4. Stats, per-location performance, reviews
├── locations.html                   # 5. Location cards grid + "Add new"
├── location-edit.html               # 6. Hours, special hours, temp closed, tags
├── menu.html                        # 7. Categorized table · master vs location toggle
├── menu-edit.html                   # 8. Item form + apply-to-locations toggle
├── menu-bulk-upload.html            # 9. CSV upload wizard with error preview
├── photos.html                      # 10. Gallery + customer/restaurant filter
├── reviews.html                     # 11. List + reply modal + ratings breakdown
├── insights.html                    # 12. Charts + location comparison
│
├── settings-profile.html            # 13. Brand info + KOSHER CERTIFICATION detail
├── settings-account.html            # 14. Owner profile, password, 2FA
├── settings-team.html               # 15. Team table + per-location permissions
├── settings-notifications.html      # 16. Per-channel × per-location toggles
│
├── billing.html                     # 17. Per-location billing breakdown, invoices
├── plans.html                       # 18. Tiered pricing (per location)
│
├── css/styles.css                   # One shared stylesheet (~1,200 lines)
├── js/nav.js                        # Sidebar toggle, dropdowns, modals, tabs
└── README.md
```

**Total: 19 screens.** All share one stylesheet and one minimal JS file.

---

## Multi-location architecture

This mockup is built around **Bella's Italian Kitchen**, a fictional
3-location chain in NYC:

| Location | Address | Cover photo |
|----------|---------|-------------|
| **Bella's — Williamsburg** (current) | 234 Bedford Ave, Brooklyn | Trattoria interior |
| **Bella's — West Village** | 87 Christopher St, Manhattan | Wine-bar dining |
| **Bella's — Park Slope** | 412 5th Ave, Brooklyn | Counter / kitchen |

Multi-location flow appears throughout:

- **Sidebar location switcher** — prominent dropdown with location photos,
  always available. Includes "Manage Locations" and "Add New Location".
- **Locations page** — grid of location cards with status, rating,
  photos, plan/billing info per location.
- **Location editor** — hours per day, holiday/special hours table,
  temporarily-closed toggle with reopening date, style/setting tags.
- **Menu master vs location** — toggle between the brand template and
  this location's menu. Menu items have an "Apply to all locations"
  checkbox so the same dish can be cloned across all three.
- **Per-location billing** — billing page shows a breakdown line per
  location with status and monthly cost. Total: $150/mo (3 × $50).
- **Team permissions** — each member can be scoped to specific
  locations (Manager X gets Williamsburg + Park Slope, Manager Y gets
  West Village only).
- **Notifications** — toggle which locations to notify about, then
  Email × SMS × Push for each notification type.
- **Insights** — location filter on the page header, plus a "Compare
  locations" section to see performance side-by-side.

---

## Kosher certification (deep detail)

On **Settings → Restaurant Profile**, tap the **Kosher** chip in the
dietary tags section. A full Kosher Certification card expands with:

- **Certifying agency dropdown** — OU, OK, Star-K, Kof-K, CRC, Chicago
  Rabbinical Council, Vaad HaRabbonim, Local Vaad, Other.
- **Kosher type checkboxes** — Meat (Fleishig) / Dairy (Milchig) / Pareve.
- **Sub-certifications** — Glatt, Cholov Yisroel, Pas Yisroel,
  Bishul Yisroel, Yoshon (real designations observant customers
  care about).
- **Certificate image upload** — JPEG/PNG/PDF.
- **Certificate expiration date**.
- **"Kosher for Passover" toggle** with separate Passover cert upload.

Designed so the customer app can display the certifying agency name +
cert image when a user taps the Kosher badge on a restaurant.

---

## Expanded tag taxonomy

### Cuisine types (35)
Primary cuisine is single-select; secondary cuisines are multi-select up
to 3. Full list on `settings-profile.html`:

American · Italian · Mexican · Chinese · Japanese · Sushi · Thai ·
Vietnamese · Korean · Indian · Mediterranean · Middle Eastern · Greek ·
French · Spanish · Latin American · Caribbean · African · Ethiopian ·
BBQ · Steakhouse · Seafood · Pizza · Burgers · Sandwiches/Deli ·
Bakery · Cafe/Coffee · Breakfast/Brunch · Dessert/Ice Cream · Bar/Pub ·
Fast Food · Fine Dining · Food Truck · Buffet · Fusion

### Style & setting (12)
Multi-select on each location. Set defaults at brand level:

Sit-down · Counter service · Takeout · Delivery · Drive-thru ·
Outdoor seating · Bar seating · Family-friendly · Romantic · Casual ·
Upscale · Late night

### Dietary tags (10)
Multi-select on restaurants and individual menu items:

Kosher · Halal · Vegan · Vegetarian · Gluten-Free options ·
Dairy-Free options · Nut-Free options · Organic · Farm-to-Table ·
Locally Sourced

---

## Responsive design

The layout responds at four breakpoints:

| Width | What changes |
|-------|--------------|
| **1280 px+** | Full desktop: 4-column stat grid, 2-col main/aside |
| **1024 px** | 2-column stat grid, plan cards stack |
| **860 px** | **Sidebar collapses** into off-canvas slide-in. Hamburger button appears in topbar. All 2-col grids stack. Field rows stack. |
| **600 px** | Single-column everything. Stat cards stack. **Modals dock to bottom as sheets.** Tables retain horizontal scroll. Hours rows reflow vertically. Form inputs use 15 px font to prevent iOS zoom. |
| **420 px** | Photo grid drops to 1 column, auth cards tighten further |

Special mobile touches:
- Sidebar slide-in has a backdrop overlay; tap to close
- Tables wrap in `.table-wrap` with horizontal scroll so columns don't squish
- Modals become bottom sheets with rounded top corners
- Touch targets are min 36–38 px (icon buttons, switches)
- `viewport-fit=cover` for notch-safe layouts
- Inputs use 15 px+ to suppress iOS zoom-on-focus

---

## Design system

### Colors (shared with customer app)
| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#E85D3A` | Brand coral · primary CTAs |
| `--color-primary-dark` | `#C94924` | Hover / pressed |
| `--color-primary-soft` | `#FCE9E2` | Active nav, tinted badges |
| `--color-bg` | `#FAFAF7` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, sidebar, tables |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-success` | `#2F8F5C` | "Active", "Paid", checks |
| `--color-warning` | `#B97E0E` | "Pending", "Hidden" |
| `--color-danger` | `#C73E2B` | Destructive, "Failed" |
| `--color-star` | `#F5A623` | Star ratings |

### Typography
- **Inter** (400 / 500 / 600 / 700 / 800) from Google Fonts.
- Headings use `clamp()` for fluid sizing across viewports.

### Components in `css/styles.css`
- App shell, sidebar, topbar (with mobile hamburger)
- Location switcher dropdown (with location photos)
- Location card grid + "Add new" empty card
- Stat cards with inline SVG sparklines
- Tables with media cells, badges, hover, mobile horizontal scroll
- Buttons: primary, secondary, ghost, dark, danger + sizes
- Form fields, switches, checkboxes, radios, input prefixes
- Tag chip toggles (selectable pill buttons)
- Kosher certification card (specialty component)
- Status badges (success/warning/danger/info/accent)
- Underline tabs (scroll-overflow on mobile)
- Segmented controls / toolbar groups
- Photo gallery tiles
- Charts: SVG line, CSS bar, donut
- Notes/info boxes (info, warning, success, danger variants)
- Modals (overlay + card · become bottom sheets ≤ 600 px)
- Wizard step indicator
- Plan cards with ribbon variant
- CSV preview table with error-row highlighting
- Hours table (reflows on mobile)
- Uploaders (drag-drop visual)
- Empty states

---

## Notable demo flows

| Click this | Then this |
|------------|-----------|
| `signin.html` → Sign in | Lands on dashboard |
| Sidebar location chip | Dropdown shows all 3 locations + "Manage" / "Add new" |
| Dashboard → "Bulk upload menu" | Walk the 4-step CSV import flow with error preview |
| Menu → "Add menu item" | Edit form with "Apply to all locations" toggle |
| Locations → "Add new location" | Full editor with hours, special hours, style tags |
| Reviews → any "Reply" button | Reply modal with original review + guidelines |
| Settings → Profile → tap "Kosher" chip | Kosher cert card expands inline |
| Settings → Team → "Invite member" | Modal with per-location access checkboxes |
| Billing → see line item per location | $50 × 3 = $150/mo |

---

## What's intentionally not built

- No real backend, auth, or data fetching
- No real CSV parsing (the upload preview is mocked)
- No real chart library (SVG/CSS hand-drawn)
- No drag-and-drop reordering (handles are visual)
- No real file uploads (drop zones are decorative)
- No accessibility audit beyond basic semantic HTML + aria-labels

When this gets built for real, the design tokens and components in
`styles.css` should translate cleanly to React, Vue, or whatever
framework wins the architecture decision.
