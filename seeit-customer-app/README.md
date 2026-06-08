# SeeIt — Customer Mobile App

Real photos, real reviews, real food. SeeIt is the customer-facing companion to the SeeIt platform — built with Expo + React Native + Supabase, sharing the same Postgres backend as `/seeit-admin` and `/seeit-restaurant`.

## What's in here

- **Expo SDK 51, React Native 0.74, Expo Router** for file-based navigation
- **TypeScript strict**, **NativeWind v4** (Tailwind for RN), **Supabase JS** for data, **React Query** for fetch/cache, **Zustand** for local UI state, **React Hook Form + Zod** for forms
- **Lucide React Native** icons (single consistent set), **Reanimated 3** for animations, **expo-haptics** on every meaningful tap

## Run it locally

```bash
cd seeit-customer-app
npm install
cp .env.example .env   # fill in your Supabase keys
npx expo start
```

Then scan the QR with the Expo Go app on your phone (or press `i` for iOS sim, `a` for Android emulator). `npx expo start --tunnel` also works if your phone is on a different network.

### About the `react-native-worklets` dep

You'll see `react-native-worklets@^0.5.1` pinned in `package.json`. This is **not** for Reanimated 4 — Reanimated 3.10.x (the Expo SDK 51 compat version) doesn't need it. The package is here purely to satisfy a hardcoded `require('react-native-worklets/plugin')` in `react-native-css-interop`'s babel preset (a transitive dep of NativeWind v4). Pre-0.9 worklets versions have `"react-native": "*"` peer deps, so they install cleanly on RN 0.74 without conflict. When this repo upgrades to Expo SDK 52+/Reanimated 4+, this dep becomes the real worklets runtime; for now it's just a babel-resolution stub.

### Required env vars (in `.env`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
```

The Supabase URL + anon key are the same as the restaurant app's. **Never put the service role key in this app** — customer code is shipped to phones.

### Production builds (later, via EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p ios
eas build -p android
```

## Folder structure

```
app/                          Expo Router file-system routes
  _layout.tsx                 root: providers + nav
  index.tsx                   → redirect to /(public)/(tabs)/home
  (public)/                   anonymous-friendly screens
    onboarding.tsx
    location-permission.tsx
    (tabs)/                   bottom tab navigator
      home.tsx                discovery feed
      search.tsx              search + filters
      scan.tsx                QR scanner (placeholder UI)
      saved.tsx
      profile.tsx
    restaurant/
      [brandSlug].tsx         storefront — the wow page
      location/[locationId].tsx
      dish/[menuItemId].tsx
    kosher-sheet/[locationId].tsx
    halal-sheet/[locationId].tsx
  (auth)/                     screens that need a signed-in customer
    signin.tsx
    signup.tsx
    allergy-setup.tsx
    write-review.tsx
    order-list/
      [locationId].tsx
      show-server.tsx         dim/bright big-text mode
    profile/
      edit.tsx
      my-reviews.tsx
      allergies.tsx
      notifications-settings.tsx
      about.tsx
components/
  ui/                         design system primitives (Button, Card, Badge…)
  brand/                      VerifiedBadge + ThemeProvider (dynamic theming)
  restaurant/                 StorefrontHeader, MenuList, KosherBadge, etc.
  review/                     ReviewCard, RatingBreakdown
  search/                     SearchBar
  shared/                     PhotoCarousel, DietaryTagChips, OpenClosedBadge
  home/                       HorizontalCardScroll
lib/
  supabase/client.ts          Supabase JS, AsyncStorage-backed session
  queryClient.ts              React Query defaults
  store/index.ts              zustand: location, filters, active order list
  types.ts                    customer-facing slice of the DB schema
  utils/                      constants (cuisines, allergies, agencies…),
                              distance, hours, formatPrice/Distance, haptics
  hooks/                      useAuth, useLocation, useNearby, useBrand,
                              useMenu, useReviews, useSavedItems,
                              useAllergyWarnings
  api/                        brands, locations, menuItems, reviews,
                              savedItems, search, userPreferences, orderLists
```

## How it talks to Supabase

Same project as `/seeit-admin` and `/seeit-restaurant`. The customer app reads from public tables (`brands`, `locations`, `menu_items`, `menu_categories`, `menu_item_photos`, `reviews`, `review_photos`, `review_replies`, `kosher_certifications`, `halal_certifications`) and writes to `reviews`, `review_photos`, `saved_items`, `order_lists`, `user_preferences`. RLS handles the rest.

Visibility rules baked into the queries:
- `brands.storefront_published === true` AND `brands.is_suspended !== true` — applied in `lib/api/brands.ts` & `lib/api/locations.ts`
- `menu_items.is_visible === true` — applied in `lib/api/menuItems.ts`
- `reviews.is_flagged !== true` — applied in `lib/api/reviews.ts`

Verified blue check is driven by `brands.is_verified === true` — rendered by `<VerifiedBadge>` next to the store name on the storefront, restaurant cards, search results, etc.

## Theming

`<BrandThemeProvider themeColor={...}>` wraps the storefront screen. When set, primary buttons and the "What's good here?" CTA shift to the brand's `theme_color`. Falls back to terracotta (`#E85D3A`) everywhere else.

## What's NOT in this v0.1

To be honest about scope:

- **QR scanner camera flow** is stubbed — the Scan tab shows the framing UI but doesn't run live decoding yet. Wire up `CameraView.onBarcodeScanned` from `expo-camera` to land it.
- **Map view** is stubbed — `react-native-maps` is in `package.json` but the map screen isn't built (the home top-right map button is a navigational placeholder).
- **Photo upload from camera roll** to Supabase Storage during write-review is stubbed — the form posts text/rating/portion/mood but doesn't upload images yet. Add `expo-image-picker` flow + `supabase.storage.from('review-photos').upload(...)`.
- **Push notifications**: `expo-notifications` is installed but `registerForPushNotificationsAsync()` isn't wired. Run it on first session and store the token on `users.push_token` (new column) when you're ready.
- **Sign in with Apple / Google**: Supabase Auth is configured for email + password. Add `expo-apple-authentication` and Supabase OAuth providers for the others.
- **Offline cache persistence**: React Query is in memory only. Add `@tanstack/query-async-storage-persister` to persist across launches.
- **Animated tab transitions / shimmer skeletons / pop-on of the blue check**: skeleton shimmer is wired (Skeleton.tsx); VerifiedBadge has a mount spring. Larger choreographed transitions (tab swap, "added to order list" floating cart) are deferred.
- **Inter font loading**: Tailwind config references Inter; bundle `expo-font` + the actual TTFs (e.g. via `@expo-google-fonts/inter`) to apply. Without that, RN falls back to system sans — which still looks clean.
- **Custom illustrations** for empty states: currently emoji + tinted circles. Drop SVGs in `assets/illustrations/` and replace the `icon` prop on `<EmptyState>`.
- **`react-native-maps` setup**: deps included, but iOS needs `ios.config.googleMapsApiKey` in `app.json` (Apple Maps works without it) and Android needs `android.config.googleMaps.apiKey`. Add when you ship to TestFlight.
- **App icon / splash assets**: removed from `app.json` so Expo Go loads cleanly with defaults. Add icons under `assets/icons/` and re-reference them when you're ready to brand the launcher tile.

## What works today (end-to-end)

- Onboarding intro → location permission → home discovery feed (Near You, Newly Verified ✓, New on SeeIt)
- Search by restaurant or dish (debounced, with trending shortcuts)
- Restaurant storefront: hero, multi-location picker, kosher/halal badges → bottom sheets, menu, reviews tab with rating breakdown, info tab with hours/phone/social
- Dish detail with photo carousel, allergy warnings, sticky add-to-order bar
- Kosher hashgacha sheet (agency, type, sub-certs, cert image, expiration) and halal cert sheet
- Sign in / sign up flow (Supabase email+password) with role gate — non-customer accounts get a friendly redirect
- Allergy setup post-signup → cross-references on every dish via `useAllergyWarnings`
- Write a review (rating, text, portion, worth-it, mood tags) — photos pending
- Order list (in-memory) with quantity stepper + per-item notes + assigned-to + "Show Server" full-screen mode
- Saved tab (gated to sign-in)
- Profile tab with edit, my-reviews, allergies, notifications settings, about

## Suggested next iterations (v0.2)

1. Wire **photo upload** on write-review (high impact — photos are the product)
2. Wire **QR scanner** camera with `CameraView.onBarcodeScanned`
3. Ship **map view** with `react-native-maps`
4. **Sign in with Apple** (required by Apple Store guidelines for any social-auth app)
5. **Push token registration** + a few transactional notifications (your saved spot just got verified ✓, an owner replied to your review)
6. **Offline persistence** for React Query
7. **Real Inter font** bundled with `expo-google-fonts/inter`
8. **EAS Build** profile + first TestFlight submission

## Schema gaps that surfaced building this

- **"Want to Try" vs "Saved"** — both currently flow through `saved_items`. If you want them distinct, add a `subtype` (or repurpose `notes` with a magic string) — small migration.
- **Push tokens** — no column on `users` yet. Add `users.push_token text` (or a separate `user_push_tokens` table if you want multiple devices per user) before shipping notifications.
- **Photo reviewer badge** — design references a "Photo Reviewer 🏆" achievement. No achievements table exists yet — likely a calculated UI badge from review/photo counts.
