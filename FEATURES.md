# SeeIt — Full Feature Inventory

Snapshot of every feature currently shipped in **`/seeit-admin`** (platform admin) and **`/seeit-restaurant`** (restaurant-owner dashboard), with the database columns and conditional logic that drive each one. Use this as the checklist when planning the customer-facing app.

---

## 1. Data model (shared by both apps)

| Table | What it stores | Key columns + meaning |
|---|---|---|
| `users` | Every account | `id`, `email`, `name`, `avatar_url`, `phone`, `role` ('customer' \| 'restaurant_owner' \| 'admin'), `is_suspended` — if true, account can't sign in |
| `user_preferences` | Customer prefs | `user_id`, `allergies[]`, `dietary_preferences[]` — drives customer-app filtering |
| `brands` | One per restaurant | `id`, `name`, `logo_url`, `description`, `primary_cuisine`, `secondary_cuisines[]`, `owner_id` (FK→users; UNIQUE), `subscription_status`, `plan_id`, `plan`, `is_suspended`; **storefront**: `tagline`, `cover_photo_url`, `story`, `website_url`, `instagram_url`, `tiktok_url`, `facebook_url`, `x_url`, `theme_color`, `featured_menu_item_ids[]`, `storefront_published`; **verification**: `is_verified`, `verification_status`, `verification_requested_at`, `verified_at`, `verified_by`, `verification_notes` |
| `locations` | Physical address per brand | `id`, `brand_id`, `name`, `address`, `city`, `state`, `zip`, `country`, `latitude`, `longitude`, `phone`, `hours` (jsonb WeekHours), `special_hours[]`, `is_temporarily_closed`, `reopening_date`, `cover_photo_url`, `description`, `dietary_tags[]`, `style_tags[]` (mixed establishment + style), `average_rating`, `review_count` |
| `kosher_certifications` | One per location (PK=location_id) | `agency`, `agency_other`, `kosher_type` (meat/dairy/pareve/mixed), `is_glatt`, `is_cholov_yisroel`, `is_pas_yisroel`, `is_bishul_yisroel`, `is_yoshon`, `is_kosher_for_passover`, `certificate_image_url`, `expiration_date` |
| `halal_certifications` | One per location (PK=location_id) | `agency`, `agency_other`, `certificate_image_url`, `expiration_date` |
| `menu_categories` | Sections (e.g. Appetizers) | `id`, `location_id`, `name`, `display_order` |
| `menu_items` | Dishes | `id`, `location_id`, `category_id`, `name`, `description`, `price`, `dietary_tags[]`, `is_visible` (if false → hidden from customer), `average_rating`, `review_count` |
| `menu_item_photos` | Per-item photos | `id`, `menu_item_id`, `user_id`, `photo_url`, `is_restaurant_uploaded`, `is_featured` (one featured per item, enforced in UI) |
| `reviews` | Customer feedback | `id`, `user_id`, `menu_item_id` (optional), `location_id`, `rating` (1-5), `text`, `portion_size` (small/right/huge), `worth_the_price` (bool), `mood_tags[]`, `is_flagged` |
| `review_photos` | Customer-attached photos | `id`, `review_id`, `photo_url`, `display_order` |
| `review_replies` | Owner response (one per review) | `id`, `review_id`, `brand_id`, `replier_user_id`, `text` |
| `team_members` | Brand staff | `id`, `brand_id`, `user_id`, `role` ('owner'\|'manager'\|'staff'), `location_ids[]` (empty = all locations) |
| `subscriptions` | Stripe sync target | `id`, `brand_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`, `locations_count` |
| `plans` | Tier definitions | `id`, `name`, `slug`, `price_cents`, `billing_interval`, `location_limit`, `features[]`, `is_active`, `display_order` |
| `discount_codes` | Promo codes | `code`, `percent_off` XOR `amount_off_cents`, `valid_from`/`valid_until`, `max_uses`, `used_count`, `applies_to_plan_id`, `is_active` |
| `notifications` | In-app alerts | `user_id`, `type`, `title`, `body`, `related_id`, `is_read` |
| `admin_audit_log` | Admin action history | `actor_id`, `action`, `target_type`, `target_id`, `target_label`, `metadata` (jsonb) |
| `integrations` | 3rd-party config | `provider`, `is_enabled`, `config` (jsonb), `last_tested_at`, `last_test_ok`, `last_test_message` |
| `qr_codes` | Per-location QR | `location_id`, `code` |
| `saved_items` | Customer wishlists | `user_id`, `item_type` ('location'\|'menu_item'), `location_id`, `menu_item_id`, `notes` |
| `order_lists` + `order_list_items` | Shared/collab orders | per-list items with `quantity`, `notes`, `assigned_to` |

### Shared enums / constants (`lib/constants.ts`)

- **Cuisines**: 10 groups A-Z (African, American, Asian, European, Halal, Jewish/Kosher, Latin American, Middle Eastern/Mediterranean, South Asian, Specialty/Style) → ~100 cuisines
- **Dietary tags**: Kosher, Halal, Vegan, Vegetarian, Gluten-Free options, Dairy-Free options, Nut-Free options, Organic, Farm-to-Table, Locally Sourced
- **Establishment types**: Restaurant, Take-out only, Catering, Food truck, Grocery/Market with prepared food, Butcher, Bakery, Pizza shop, Cafe/Coffee, Bar/Lounge, Ice cream/Dessert, Juice bar, Food court vendor, Pop-up, Ghost kitchen
- **Style tags**: Sit-down, Counter service, Takeout, Delivery, Drive-thru, Outdoor seating, Bar seating, Family-friendly, Romantic, Casual, Upscale, Late night
- **Allergies**: Peanuts, Tree Nuts, Shellfish, Fish, Dairy, Eggs, Wheat/Gluten, Soy, Sesame
- **Mood tags** (reviews): Spicy, Instagrammable, Comfort food, Date night, Generous portion, Worth it, Great value, Authentic, Quick bite, Fresh, Crispy, Rich
- **Kosher agencies**: OU, OK, Star-K, Kof-K, CRC, Chicago Rabbinical Council, Vaad HaRabbonim, Local Vaad, Other
- **Halal agencies**: AHF, HFA, HFSAA, HMA, IFANCA, ISWA, JAKIM, Local Imam/Masjid, MUI, Other

---

## 2. Admin dashboard (`/seeit-admin`)

### Dashboard home — KPIs (`/dashboard`)
- 4 primary KPI cards: total stores, active subscriptions (`status IN ('active','trialing')`), total locations, total reviews
- 4 secondary KPI cards: total users (split by role), photos uploaded last 7d, newest signups count
- Recent reviews feed (last 8) + Newest users sidebar (last 5)
- Quick-action cards: Add store / Add location / Invite user / Manage plans
- Time-aware greeting (morning/afternoon/evening)

### Stores list (`/dashboard/brands`)
- Paginated 20/page; sort by `created_at DESC`
- Search: `?q=` → ILIKE on name + primary_cuisine
- Filter: `?status=` (subscription) → `brands.subscription_status`
- Filter: `?suspended=true|false` → `brands.is_suspended`
- Each row: logo, name, **VerificationBadge if `is_verified=true`**, **"Pending" badge if `verification_status='pending'`**, cuisine, owner email, location count, subscription badge, suspension badge, joined date
- "Add store" button → BrandForm modal

### Store detail (`/dashboard/brands/[id]`)
- Header: logo, name + **VerificationBadge if `is_verified=true`**, suspension badge, subscription badge, cuisine, location count, joined date, owner link
- Snapshot strip: reviews last 30d vs prior 30d, photos last 7d, avg rating, location count, team count
- Tabs: Overview / Storefront / Locations / Menu / Team / Activity
- **Brand actions** (top-right):
  - **Verify** (no current status) → sets `is_verified=true`, `verification_status='approved'`, `verified_at=now()`, `verified_by=auth.uid()` → audit
  - **Approve** + **Reject** (when `verification_status='pending'`) → reject opens dialog for notes, writes to `verification_notes`
  - **Unverify** (when `is_verified=true`) → resets all verification fields
  - Edit / Suspend / Unsuspend / Delete
- Status pill above buttons: "Verified" (blue) | "Verification requested" (amber) | "Verification rejected" (red)

### Storefront editor (Brand detail → Storefront tab)
- Edits `brands.tagline`, `cover_photo_url`, `story`, `website_url`, `instagram_url`, `tiktok_url`, `facebook_url`, `x_url`, `theme_color` (hex), `featured_menu_item_ids[]` (multi-select from all brand's menu items), `storefront_published` toggle
- Single UPSERT to `brands` on save

### Locations (admin) — list (`/dashboard/locations`) + per-brand panel
- List: cover photo, name, address, brand link, city, rating, review count, open/closed badge
- Filters: `?q=`, `?brand=`, `?city=`, `?status=active|closed`
- Per-brand panel (Brand detail → Locations tab): cards with edit / duplicate / delete
- Add location flow: `/dashboard/locations/new` → brand picker → LocationForm

### LocationForm (admin) — same UI as restaurant
- Basic: name, address, city, state, zip, country, phone, lat/lng, cover photo, description
- HoursEditor per day: time mode OR note mode (e.g. "After sunset", "1 hour before Shabbos")
- `is_temporarily_closed` toggle + `reopening_date` field
- Tags: dietary tags multi-select, establishment types multi-select, style tags multi-select (last two merged into `style_tags[]` via `mergeStyleTags()`)
- Kosher cert block (renders if `dietary_tags` includes "Kosher"): agency, agency_other (if Other), kosher_type, 6 checkboxes, cert image, expiration → upsert `kosher_certifications`
- Halal cert block (renders if `dietary_tags` includes "Halal"): agency, agency_other (if Other), cert image, expiration → upsert `halal_certifications`
- Delete location danger zone

### Menu (admin) — Brand detail → Menu tab
- Location picker dropdown (per-location menus)
- Categories: add / edit / delete (`menu_categories`)
- Items: add / edit / delete / visibility toggle (`menu_items.is_visible`)
- **Copy item to other locations**: clones name/description/price/tags/photos into selected target locations (auto-creates category by name)
- CSV bulk import (name, description, price, category_name, dietary_tags, is_visible) + CSV export
- Per-item photo upload + featured toggle (`menu_item_photos.is_featured`)

### Reviews (admin) — moderation (`/dashboard/reviews`)
- Paginated 25/page
- Filters: `?filter=flagged|low|unreplied`
- Click row → ReviewModal with: header (avatar, rating, item, location, date), text, metadata (portion_size, worth_the_price, mood_tags), photos carousel
- Actions: flag/unflag (`reviews.is_flagged`), edit (rating/text/tags/photos), delete
- Reply: insert/update `review_replies`; replier_user_id = current admin
- "Add review" button → ReviewForm (for manual entry / testing)

### Users (admin) — `/dashboard/users` + `/dashboard/users/[id]`
- List: avatar, name/email, role badge, review count, suspension status, joined
- Filters: `?q=`, `?role=customer|restaurant_owner|admin`
- **Invite user** → POST `/api/admin/invite` with service-role key; sets `data.intended_role`
- Detail: header + Preferences card (allergies/dietary_preferences) + RoleChanger + Suspension toggle + Reviews tab + Owned brands tab (if restaurant_owner)
- RoleChanger writes `users.role`; suspension writes `users.is_suspended`

### Team (admin) — Brand detail → Team tab
- List: avatar, name, email, role badge, suspension, assigned locations (or "all")
- Add member: email (must exist in `users`), role dropdown, location_ids checkboxes
- Edit / Remove (`team_members` only — doesn't delete the user)

### Settings (admin) — `/dashboard/settings`
- **Profile**: edit own `users` row (name, avatar, phone)
- **Plans tab**: list/edit `plans` (name, slug, price_dollars→price_cents, billing_interval, location_limit, features text, is_active, display_order)
- **Discount codes tab**: list/edit `discount_codes` (code, percent_off XOR amount_off_cents, valid_from/until, max_uses, applies_to_plan_id, is_active)
- **Integrations tab**: 11-integration catalog (Stripe, Resend, Twilio, Google Maps, Mapbox, OpenAI, Anthropic, Sentry, PostHog, Slack, Cloudflare R2, Vonage). Per integration: enable/disable toggle, config form (secret/multiline fields), Test button → updates `last_tested_at`, `last_test_ok`, `last_test_message`

### Activity (admin) — `/dashboard/activity`
- **Platform tab**: merged timeline of last 60 events (reviews, signups, brand created, location created) — sorted DESC by `created_at`
- **Audit tab**: last 100 rows from `admin_audit_log` — actor avatar, action badge (color by type: delete=red, suspend/flag=yellow, unsuspend/create=green), target type, target_label, timestamp. Shows migration notice if table missing (42P01)

### Notifications (admin) — `/dashboard/notifications`
- List up to 200 notifications, filter by read/unread
- Click → navigate via `related_id` + mark `is_read=true`
- NotificationsBell in TopBar shows unread count

### API routes (admin)
- `POST /api/admin/invite` — service-role inviteUserByEmail, admin-only check, sets `intended_role`
- `DELETE /api/locations/[id]` — admin-only, cascades + audit log entry

### Global admin UX
- TopBar + Sidebar + DashboardShell layout
- **CommandPalette** (Cmd+K fuzzy search for pages/actions)
- BulkActionBar (multi-select rows → delete/suspend/etc.)
- ConfirmDialog + ConfirmDeleteByName (type the name to delete)
- CsvImportDialog + CsvExportButton
- Sonner toasts

---

## 3. Restaurant dashboard (`/seeit-restaurant`)

### Auth + Onboarding (`/signin`, `/signup`, `/onboarding`)
- Sign-in → if no brand & not on a team → `/onboarding`, else `/dashboard`
- **Single brand per owner** enforced via UNIQUE index on `brands.owner_id`
- Onboarding wizard:
  - Step 0: welcome
  - Step 1: Google Places search (uses `/api/google/search`) — auto-fills name/address/phone/hours/lat-lng
  - Step 2: brand info (name, primary cuisine, secondary cuisines, description, logo)
  - Step 3: first location (address, phone, cover, hours, dietary tags, kosher block if Kosher, halal block if Halal)
  - Step 4: 0-5 starter menu items
  - Step 5: confirmation
- BrandContext is pre-seeded so dashboard never shows "no brand selected"

### Dashboard home (`/dashboard`)
- KPI cards: avg rating, reviews (30d), photos this week, items-to-fix (missing photo OR description <12 chars OR `is_visible=false`)
- Recent reviews list (5 most recent) with "Replied" or "Needs reply" tag
- Quick actions: Add menu item / Upload photos / Reply to reviews / AI assistant
- PlanUsageBanner (location count vs `plans.location_limit`)

### Locations (`/dashboard/locations`)
- List + LocationFormSheet for create/edit
- Same form as admin (kosher + halal blocks, hours editor with mixed neutral note suggestions, dietary/style tags)
- Plan-gated: if at `plans.location_limit`, "Add location" → UpgradeRequired modal
- DELETE via `/api/locations/[id]`; blocks deleting the only location unless admin

### Menu (`/dashboard/menu`)
- Location picker required (auto-selected if only 1)
- Categories + items per location
- MenuItemForm with name, description, price, category, dietary tags, visibility toggle, photos
- Plan-gated: if at `plans.maxMenuItemsPerLocation` → UpgradeRequired
- **Copy item to other locations** dialog (clones row + photos, auto-creates category by name in target)
- Bulk upload (`/dashboard/menu/bulk-upload`): CSV → menu_items + photo rows

### Photos (`/dashboard/photos`)
- Grid of all menu_item_photos + review_photos for the brand
- Filter by source / date / location
- Mark featured, delete

### Reviews (`/dashboard/reviews`)
- List of reviews across brand's locations + filters (rating, replied/unreplied, location, date)
- ReviewReplyModal:
  - Shows original review (read-only)
  - **Tone selector**: Warm / Professional / Apologetic / Grateful
  - **AI suggest** → POST `/api/ai/review-reply` (Anthropic). 503 if Anthropic key missing.
  - Manual edit + save → upsert `review_replies` (replier_user_id = auth.uid())

### Insights (`/dashboard/insights`)
- Charts component (reviews over time, rating trend, photos trend, sentiment, per-location breakdown — implementation TBD/partial)

### AI Assistant (`/dashboard/ai-assistant`)
- **Listing health score**: POST `/api/ai/listing-health` — Claude analyzes brand + locations + menu + reviews → returns recommendation list. HealthScoreCard shows %.
- **Menu item description generator**: POST `/api/ai/menu-description`
- **Review themes**: POST `/api/ai/review-themes` — Claude clusters last 30 reviews
- **AI reply suggestions** (also in Review Reply modal)
- Graceful 503 + "AI not configured" if Anthropic missing

### Storefront preview (`/dashboard/preview`)
- In-dashboard render of the public storefront (same data, same component)
- **Blue check renders here too** — same `<VerificationBadge>` driven by `brands.is_verified`
- "Edit storefront" → settings/profile
- "Open public page" → `/storefront/[brandId]` in new tab

### Public storefront (`/storefront/[brandId]`)
- **404 if `storefront_published !== true` OR `is_suspended === true`**
- Hero: name, **VerificationBadge if `is_verified=true`** (next to name), tagline, cover photo, theme color accent
- Story (markdown-safe text)
- Location cards: name, address, phone, cover, hours (renders `open_note`/`close_note` if set, else clock time), `dietary_tags`, rating, review count, "Temporarily closed" + reopening_date if closed
- **Featured menu items section**: items from `featured_menu_item_ids`; cards show name, description, price, dietary tags, featured photo (or first photo)
- Recent reviews (last 5)
- Social links: only renders fields that are non-null (`website_url`, `instagram_url`, `tiktok_url`, `facebook_url`, `x_url`)
- Meta tags: derived from brand name/tagline/description

### Settings — Store profile (`/dashboard/settings/profile`)
- **VerificationStatusCard** at top with 4 states:
  - Pending (amber): "We'll review your store…" + requested date
  - Approved (blue): "You're verified" + verified date + VerificationBadge
  - Rejected (red): notes + "Request again" button
  - Default: invite + "Request verification" button → sets `verification_status='pending'`, `verification_requested_at=now()`
- Visibility toggle: `storefront_published` (Live / Hidden badge)
- Identity: name, tagline (60 char), description, story (1500 char), primary cuisine, secondary cuisines
- Visuals: logo, cover photo, theme color (hex)
- Social: 5 URL fields
- Featured menu items multi-picker

### Settings — Account (`/dashboard/settings/account`)
- Update own users row (name, avatar)
- Email read-only
- Password change (Supabase auth)
- Delete account (confirm)

### Settings — Team (`/dashboard/settings/team`)
- Same as admin team panel, scoped to the owner's brand
- Add member by email + role + location_ids
- Edit / Remove

### Settings — Integrations (`/dashboard/settings/integrations`)
- Anthropic + Google Places key inputs, test buttons, enable toggles
- Writes to `integrations` table

### Settings — Notifications (`/dashboard/settings/notifications`)
- Toggles per notification type (new review, new reply, new photo, team joins, subscription expiring) — email + in-app

### Billing (`/dashboard/billing` + `/dashboard/billing/plans`)
- BillingSummary: current plan, subscription status, brand name, period end, usage bars (locations used / limit, menu items per location)
- Plans grid: cards per active plan (sorted by `display_order`), price, location limit, features
- Stripe checkout integration is the next-step hook

### API routes (restaurant)
| Route | Method | Purpose |
|---|---|---|
| `/api/google/search` | POST | Place autocomplete via Google Places (auth-required) |
| `/api/google/place/[id]` | GET | Full place details (hours periods, components, lat/lng) |
| `/api/ai/listing-health` | POST | Returns AI-generated improvement list for brand |
| `/api/ai/menu-description` | POST | Returns AI-generated description for a menu item |
| `/api/ai/review-reply` | POST | Returns AI-generated reply text given tone + rating + review text |
| `/api/ai/review-themes` | POST | Returns clustered themes from last ~30 reviews |
| `/api/locations/[id]` | DELETE | Ownership-checked location delete |

---

## 4. What the customer app needs to consume (and the visibility logic)

| Customer-app surface | Source data | Visibility / business rule |
|---|---|---|
| **Brand profile page** | `brands` (all storefront fields) | Visible iff `storefront_published === true` AND `is_suspended !== true` |
| **Blue checkmark next to brand name** | `brands.is_verified` | Render `<VerificationBadge>` iff `is_verified === true`. Already implemented as a reusable component in both apps |
| **Cover image + theme color + story + tagline + featured items + social links** | `brands.cover_photo_url`, `theme_color`, `story`, `tagline`, `featured_menu_item_ids[]`, social URLs | Render whatever is non-null; theme color seeds button/accent CSS vars |
| **Location list per brand** | `locations` | Render all (excluding the "temporarily closed → reopening soon" affordance separately) |
| **Location detail** | `locations` + `kosher_certifications` (if dietary_tags includes Kosher) + `halal_certifications` (if dietary_tags includes Halal) | If `is_temporarily_closed`, show closure card with `reopening_date` |
| **Hours rendering** | `locations.hours` (WeekHours jsonb) | Per day: `is_closed` → "Closed". Else if `open_note`/`close_note` set → render text. Else render `HH:MM` |
| **Kosher details** | `kosher_certifications` row | Show agency (or agency_other), kosher_type, true sub-cert flags (Glatt, Cholov Yisroel, etc.), cert image link, expiration |
| **Halal details** | `halal_certifications` row | Show agency (or agency_other), cert image, expiration |
| **Menu (per location)** | `menu_categories` + `menu_items` + `menu_item_photos` | Hide items where `is_visible=false`. Featured photo = `menu_item_photos.is_featured=true`, fallback to first photo |
| **Menu item detail** | `menu_items` + all `menu_item_photos` for that item + recent `reviews` filtered by `menu_item_id` | Description, price, dietary_tags, average_rating, review_count |
| **Reviews on item / location** | `reviews` + `users` (author) + `review_photos` + `review_replies` | Show reply inline under review; respect `is_flagged` if you want to hide flagged content from customers |
| **Write a review** | INSERT into `reviews` (+ `review_photos`) | Customer must be authenticated; `users.role` is typically 'customer' |
| **Save / wishlist a location or item** | INSERT into `saved_items` | `item_type='location'` with `location_id`, OR `item_type='menu_item'` with `menu_item_id` |
| **Shared order list** | `order_lists` + `order_list_items` | Per-list items have `quantity`, `notes`, `assigned_to` |
| **Customer preferences (allergies, dietary)** | `user_preferences` | Drives default filters, item warnings |
| **Search / browse / filters** | All of the above | Filter by cuisine, dietary tag, style tag, kosher flags, halal agency, rating ≥, distance from lat/lng |
| **Notifications** | `notifications` table | Type-routed; mark `is_read=true` on tap |
| **Verification request flow** | N/A — admin-side only | Customer app just consumes the boolean `is_verified` |

---

## 5. Key business rules to mirror

1. **Brand visibility gate**: `storefront_published === true AND is_suspended === false` — applies to public storefront route AND the customer app. Anything else = treat as 404 / "not available".
2. **Blue check rule**: `brands.is_verified === true` → render the verified badge. Source of truth, no other input.
3. **Single brand per owner**: UNIQUE(`brands.owner_id`). Customer app never sees this — purely a restaurant-side constraint.
4. **Location closure**: if `is_temporarily_closed === true`, the storefront still shows the location but with a clear "Temporarily closed — reopens YYYY-MM-DD" affordance.
5. **Kosher / Halal cert tags require an agency**: UI in restaurant + admin enforces this; if you build a filter "show only certified kosher", trust `kosher_certifications.agency IS NOT NULL`.
6. **Hours mode is per side, per day**: open and close can independently be a clock time OR a note. Customer app must handle both.
7. **Menu item hiding**: `is_visible === false` → never show to customer. Restaurant owner uses this for seasonal items.
8. **Reviews are public + owner-replyable**: owner reply lives in `review_replies` (max one per review in UI). `is_flagged` is moderation signal only.
9. **Auth role tells the app where you are**: `users.role === 'customer'` → customer app. `'restaurant_owner'` → restaurant dashboard. `'admin'` → admin dashboard. The customer app shouldn't allow sign-in by non-customer roles (or should route them to the right dashboard).
10. **Plan tiers** are server-side gates for the restaurant dashboard; the customer app does NOT need to know about plans.

---

## 6. Things to decide before building the customer app

1. **Platform**: native iOS/Android (React Native / Expo / Swift+Kotlin) vs. mobile web PWA?
2. **Auth**: Supabase Auth email-OTP / magic link / social login (Apple, Google)?
3. **Discovery model**: map-first (location pins around the user) vs. feed/search-first?
4. **Booking / ordering**: read-only directory now, with `order_lists` shared-cart later — or jump straight to ordering?
5. **Reviews**: required-photo, photo-only, text-only, or all three?
6. **Notifications**: push (FCM/APNs) — what events trigger them?
7. **Offline behavior**: cache last-viewed restaurants?
8. **Roles in the customer app**: only `customer`? Or allow owners/admins to sign in and switch?
