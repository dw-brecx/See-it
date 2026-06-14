# SeeIt Customer App — Bug & Polish Audit

Every issue across the customer app, prioritized. Verified against the actual code (not just trusted from the audit agent — several agent findings were wrong and have been removed; my notes are inline).

Counts: **63 real findings** — 11 critical, 19 high, 22 medium, 11 low.

---

## TIER 1 — CRITICAL (block ship)

### Auth + session

**1. Sign-out doesn't clear React Query cache** — `lib/hooks/useAuth.tsx:67-71`
After sign-out, every cached query stays in memory. Sign in as a different account → briefly see the previous user's saved items, prefs, reviews before the refetch.
**Fix:** inside `signOut`, also call `queryClient.clear()` (import the singleton from `lib/queryClient.ts`).

**2. `saveLocation` / `saveMenuItem` don't pass `user_id`** — `lib/api/savedItems.ts:13-22`
Insert relies on a Postgres default or RLS trigger to set `user_id`. If neither is wired correctly, the row inserts with `user_id = null` and the user never sees it again. Silent failure mode.
**Fix:** `const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sign in to save'); ... .insert({ user_id: user.id, ... })`.

**3. "Save" inserts a duplicate every tap** — `app/(public)/restaurant/[brandSlug].tsx:312-319`
The Save ActionButton always calls `toggleSaved.mutate({ locationId, currentId: null })`. Tapping it twice creates two rows. No "is already saved?" check.
**Fix:** Query `useSavedItems()` once at the top of the screen, derive `savedId` for the active location, pass that as `currentId`. Toggle becomes a true toggle (saves first time, unsaves second).

**4. "Want to try" button is fake** — `app/(public)/restaurant/[brandSlug].tsx:322-331`
Tap → toast "Added to Want to try" → no DB write. The Saved tab's "Want to try" sub-tab will always be empty.
**Fix (short term):** Hide the button until the schema supports it (`saved_items.is_want_to_try` or a separate enum on `item_type`). **Or** reuse `saved_items.notes = 'want_to_try'` as a flag — small migration-free path.

### Data correctness

**5. `is_flagged` filter excludes NULL rows** — `lib/api/reviews.ts:33, 60, 84`
`.neq('is_flagged', true)` evaluates `NULL <> TRUE` → NULL (not TRUE), so flagged-but-not-explicitly-true rows leak through. Worse: reviews with `is_flagged = NULL` (most rows, since the default is NULL on a lot of schemas) silently drop OUT.
**Fix:** `.or('is_flagged.is.null,is_flagged.eq.false')` (matches the same pattern we used for `is_suspended` last week).

**6. Photo upload errors silently swallowed** — `lib/api/reviews.ts:181-199` + `app/(auth)/write-review.tsx:108-117`
`uploadReviewPhoto` returns `null` on failure. The submit loop builds `uploaded[]` from non-null results, then posts the review with whatever photos *did* succeed. If 0 of 3 photos uploaded, the user sees "Review posted!" but their photo is gone. No retry, no diagnosis.
**Fix:** Track failure count separately. If any uploads failed, show a confirm modal: "2 of 3 photos failed to upload — post review with the 1 that worked, or try again?"

**7. `searchBrands` ILIKE doesn't escape user input** — `lib/api/search.ts:18-22`
A search for `100%` becomes `name.ilike.%100%%` — `%` is a wildcard, so every brand matches. Same for `_` (single-char wildcard). Low risk because it's not SQLi (PostgREST escapes the SQL), but the results are wrong.
**Fix:** Pre-escape: `const safe = term.replace(/[%_\\]/g, (c) => '\\' + c);` before interpolating.

**8. `storefront_published === true` check assumes booleans never null** — `lib/api/brands.ts:isVisible()`
Defensive logic is right for `is_suspended` (`b.is_suspended === true` only blocks explicit true). But for `storefront_published`, the rule is "must be explicitly true" — which means a row with `storefront_published = NULL` is hidden even though the DB default might be NULL on freshly seeded data. That's by design but causes the "raw" fallback to be the only thing that ever renders if the user's data is unconfigured.
**Fix (pragmatic):** Document this in `lib/utils/colors.ts` or wherever the rule lives. **Or** loosen for v1: treat NULL as published-yes until restaurants explicitly hide.

### Schema gaps

**9. "Want to try" tab in Saved is structurally broken** — `app/(public)/(tabs)/saved.tsx:6, 81-104`
Three tabs render (Spots / Dishes / Want to try) but `saved_items` has no column distinguishing want-to-try from saved. Tab always empty.
**Fix:** Drop the tab from v1 OR add the column (`is_want_to_try boolean default false`) and update the bookmark action to pass it.

**10. Saved tab card renders no real content** — `app/(public)/(tabs)/saved.tsx:132-150`
Each card shows "📍 Location" / "🍽️ Dish" emoji + `notes` text. The actual location name, photo, brand, address — none of it. User can't tell which spot they saved.
**Fix:** Hydrate the list via `useQuery` per `item_type`: fetch `locations` for location_ids, `menu_items` for menu_item_ids. Render `<RestaurantCard>` / `<DishCard>` instead.

### Type safety

**11. `width={undefined as any}` in search results** — `app/(public)/(tabs)/search.tsx:129`
The `as any` hides that `RestaurantCard` expects a `number`. With `undefined` the card flexes to `auto` width, which in a FlatList means it collapses or overflows depending on the parent. Visually broken.
**Fix:** Pass an explicit width (`Dimensions.get('window').width - 40`) or change `RestaurantCard.width` to optional with a sensible default.

---

## TIER 2 — HIGH (fix next sprint)

### UI / UX

**12. Star color is amber, should be terracotta** — `components/ui/StarRating.tsx:33,34,42,43`
Hardcoded `#F59E0B` (gold) everywhere. The brand brief (and `colors.starFilled`) says stars should be terracotta `#E85D3A`. Inconsistent across the app.
**Fix:** Replace both literals with `colors.starFilled` / `colors.starEmpty` from `lib/utils/colors.ts`.

**13. `0.0 ⭐` for unrated stores** — `components/restaurant/StorefrontHeader.tsx:96-115`
Header shows "0.0 ★★★★★" when `reviewCount === 0`. Reads as a one-star review. Better to say "No reviews yet."
**Fix:** Already partially done in header — verify dish detail (`app/(public)/restaurant/dish/[menuItemId].tsx`) and `RestaurantCard` follow the same rule.

**14. Empty-state copy is developer-facing** — `app/(public)/(tabs)/home.tsx:274-280`
The "no brands" EmptyState says "Check that your Supabase env vars are set and that the brands table has at least one row with `storefront_published=true`. The terminal logs (search for '[SeeIt') tell you exactly what each query returned." End users have no terminal.
**Fix:** Two strings — show this one only in `__DEV__`, ship "Check back soon — new spots arrive weekly" to users.

**15. Menu tab never shows a real empty state** — `app/(public)/restaurant/[brandSlug].tsx:418-435`
The conditional is `menuQ.isLoading ? Skeleton : !menuQ.data || items.length === 0 ? EmptyState : MenuList`. If the query is still pending after a failed network call (no data, no error toast), the skeleton stays forever.
**Fix:** Add `menuQ.isError` branch with retry CTA.

**16. Storefront has no error state for failed brand fetch** — `app/(public)/restaurant/[brandSlug].tsx:225-235`
If `brandQ.isError` (network, RLS, 500), the screen stays on the skeleton. No retry, no message.
**Fix:** Add `if (brandQ.isError) return <ErrorState />`.

**17. Tab indicator on storefront doesn't show count on Photos when 0** — `app/(public)/restaurant/[brandSlug].tsx:392-403`
`(${photos.length})` only renders when `length > 0`, so the user can't tell whether the Photos tab loaded vs. is empty.
**Fix:** Show "Photos (0)" while loading skeleton, OR always include count if not loading.

**18. Profile tab's "Saved" stat count is hardcoded** — `app/(public)/(tabs)/profile.tsx:104`
Header reads "Reviews · Photos · Saved" but these are static labels, no real counts. Profile doesn't reflect activity.
**Fix:** Fetch counts (`saved_items.count`, `reviews.count`, etc.) for the signed-in user and render them above the labels.

**19. Pre-saved location's heart icon stays unfilled** — `app/(public)/restaurant/[brandSlug].tsx:312-319`
Even after the user saves, the heart never flips to filled-state. They have no idea it worked beyond the toast.
**Fix:** Derive `isSaved` from `useSavedItems()`, pass `active={isSaved}` to `<ActionButton Icon={Heart}>`.

### Navigation / deep links

**20. `[brandSlug]` is actually `brandId`** — `app/(public)/restaurant/[brandSlug].tsx:75`
The route param is named "brandSlug" but treated as a UUID. Confusing for anyone reading the code, and a real slug system (e.g. `/restaurant/elis-food`) would silently fail.
**Fix:** Rename the file to `[brandId].tsx`; update all callers (`router.push('/restaurant/...')` sites).

**21. Location deep link adds a redirect hop** — `app/(public)/restaurant/location/[locationId].tsx`
Hitting `seeit://location/<id>` triggers a fetch to resolve `brand_id`, then a `<Redirect>` to `/restaurant/<brand_id>`. Two navigation states, brief blank screen.
**Fix:** Replace the redirect with passing the location through as a query param: `/restaurant/<brand_id>?location=<id>`, and have the storefront accept that as the default `activeLocationId`.

**22. Storefront `Stack.Screen` config is at the wrong level** — `app/(public)/restaurant/[brandSlug].tsx:259, 233`
`<Stack.Screen options={{ headerShown: false }} />` rendered as a child of the screen doesn't always win — proper place is the parent layout (`app/(public)/_layout.tsx`).
**Fix:** Move `headerShown: false` to `_layout.tsx` `screenOptions`.

### Data layer

**23. Brand reviews fetched eagerly even when Reviews tab is never opened** — `app/(public)/restaurant/[brandSlug].tsx:146-150`
`brandReviewsQ` runs on every storefront mount. Fine for 2 brands, expensive for "Eli's Food" with 1,000 reviews.
**Fix:** `enabled: !!brandId && (tab === 'reviews' || reviewCount > 0)` — fetch once for the header average, refetch when user opens the tab.

**24. Photos query fetches *all* photos for the brand on every storefront mount** — `app/(public)/restaurant/[brandSlug].tsx:155-159`
Same pattern. A brand with 50 menu items × 5 photos each = 250 rows pulled before the Photos tab is ever tapped.
**Fix:** `enabled: tab === 'photos'`.

**25. Nullable lat/lng can produce NaN distances** — `lib/api/locations.ts:120-126`
`distanceMiles(undefined, ...)` returns NaN, which then fails `> radiusMiles` (NaN comparisons are false), causing the row to be kept. Tracked in code by the `dropped_no_coords` counter but not actually applied before the distance call.
**Fix:** I already have `if (location.latitude == null || location.longitude == null) { droppedNoCoords++; continue; }` — verify the linked line numbers match; if not, add the guard.

**26. `fetchLocationDetail` uses brittle FK alias** — `lib/api/locations.ts:20-23`
`.select('*, brand:brands(*)')` relies on PostgREST inferring the `locations.brand_id → brands.id` foreign key by name. If the FK has a non-default name, the join silently returns null brands.
**Fix:** Use explicit alias: `.select('*, brand:brands!locations_brand_id_fkey(*)')`. **Or** split into two queries.

**27. `searchDishes` doesn't apply brand visibility** — `lib/api/search.ts:54-62`
Dishes from suspended or unpublished brands still appear in search results. The visibility rule is enforced only on `brands` queries; dish queries inherit nothing.
**Fix:** Drop rows where `m.location?.brand?.storefront_published !== true` or `m.location?.brand?.is_suspended === true` in the map step. Bonus: also drop `m.location?.brand` not loaded (FK join nullout).

### Accessibility

**28. No `accessibilityLabel` on TabBar floating Scan button** — `components/navigation/TabBar.tsx:102-120`
VoiceOver/TalkBack reads "button". With no label and no accessible state, users with screen readers can't navigate.
**Fix:** Add `accessibilityLabel="Scan QR code"` and `accessibilityRole="button"` to the Pressable.

**29. Star rating selector has no `accessibilityRole="radio"`** — `components/ui/StarRating.tsx:22-48`
Interactive star picker on write-review can't be operated by screen-reader users.
**Fix:** Wrap in a View with `accessibilityRole="radiogroup"`, each star with `accessibilityRole="radio"`, `accessibilityState={{ checked: i <= value }}`, `accessibilityLabel={`${i} stars`}`.

**30. Menu items have no label** — `components/restaurant/MenuList.tsx:108-120`
Whole row is a `Pressable` with no `accessibilityLabel`. Screen reader speaks nothing.
**Fix:** `accessibilityLabel={`${item.name}, ${formatPrice(item.price)}`}` + `accessibilityRole="button"`.

### Code health

**31. `isVisible()` copied in three places** — `lib/api/brands.ts:10-15`, `lib/api/locations.ts:6-11`, `lib/api/search.ts:6-11`
Drift risk. If visibility rules change, three places need updating.
**Fix:** New `lib/api/visibility.ts` exporting `isVisible(b: any): boolean`, import everywhere.

---

## TIER 3 — MEDIUM (backlog)

### Data

**32. `fetchNewlyVerifiedBrands` `nullsFirst: false` may not apply** — `lib/api/brands.ts:60-65`
Supabase JS `.order()` accepts `nullsFirst` but the option key is sometimes `nullsLast` depending on version. Verify in your installed `@supabase/supabase-js` typings (v2.45).
**Fix:** If wrong, swap to `.order('verified_at', { ascending: false, nullsFirst: false })` form that the v2.45 client accepts (this is what I used).

**33. `fetchReviewsForBrand` two-step fetch can blow URL length** — `lib/api/reviews.ts:48-74`
For 500+ locations, `.in('location_id', locIds)` puts every UUID in the URL. PostgREST has a 16KB URL limit.
**Fix:** Page the second query by location chunks of 50.

**34. Search "dishes" mode shows result icons even when 0 results** — `app/(public)/(tabs)/search.tsx:114-152`
The 2-column grid renders nothing if results are 0, but the surrounding container stays in dishes-tab mode. A search that returns "no restaurants" + switching to dishes shows the same empty without explanation.
**Fix:** Show `<EmptyState>` per tab when results are 0.

**35. `searchDishes.average_rating` / `review_count` are stored fields** — `lib/api/search.ts:62-83`
Same staleness issue as the storefront — these are computed-but-never-updated columns.
**Fix (longer term):** Switch to live aggregates via a server-side view OR ignore them in the result card.

**36. `submitReview` doesn't surface "review_photos" failure** — `lib/api/reviews.ts:147-167`
Insert error logged but not thrown. The review is created without photos and the user is told it worked.
**Fix:** Throw on `pErr`; the screen catches and toasts "Posted, but photos failed to attach — try again from My Reviews".

**37. Storefront sets `activeLocationId` once and never resets** — `app/(public)/restaurant/[brandSlug].tsx:111-135`
If `locationsQ.data` refetches and the location set changes (deleted location), the stored `activeLocationId` becomes a stale dangling reference.
**Fix:** When `activeLocationId` is set but not present in the latest `locationsQ.data`, reset to nearest.

**38. `addOrderItem` no-ops the assigned_to / notes from prior taps** — `lib/store/index.ts:84-103`
If a user adds Falafel with notes "no onions", then adds Falafel again (intending +1), the second tap increments quantity but the notes/assigned_to from the first tap are silently kept (intended) or lost (no — looks fine on review). Verify by reading the spec — `addOrderItem` is supposed to be quantity-only on repeat tap.
**Fix:** Probably OK as-is. Document the behavior.

### UI / UX

**39. "Want to try" stub toast is misleading** — `app/(public)/restaurant/[brandSlug].tsx:325-329`
Toast says "Added to Want to try" but nothing was added. See #4.

**40. Photo carousel on dish detail has no pinch-to-zoom** — `app/(public)/restaurant/dish/[menuItemId].tsx:55-58`
For a food app, this is table stakes. Long-press on a photo should open a full-screen viewer with zoom.
**Fix:** Add a Pressable wrapper that opens a `<Modal>` with `react-native-image-zoom-viewer` or a simple `<Image>` inside a pan/pinch GestureHandler.

**41. ReviewCard photo strip overflows on narrow phones** — `components/review/ReviewCard.tsx:54-69`
Horizontal ScrollView with `paddingRight: 16` but no `contentContainerStyle`. On notched iPhone SE the last photo gets cropped.
**Fix:** Move `paddingRight: 16` to `contentContainerStyle`.

**42. Saved tab "Sign in to save your favorites" CTA returns to Saved after sign-in** — `app/(public)/(tabs)/saved.tsx:25-66`
After sign-in, user is replaced to `/(public)/(tabs)/profile`. Saved tab is what they wanted.
**Fix:** Pass `?next=/(public)/(tabs)/saved` through signin and respect it on success.

**43. Pull-to-refresh tint color is hardcoded `#E85D3A`** — `app/(public)/(tabs)/home.tsx:113` and storefront
Should use `colors.primary` for consistency.

**44. Onboarding slides on first launch are unconditional** — `app/(public)/onboarding.tsx`
There's no "seen" flag — the slides render only via direct nav, never on first launch. New users land on home with no intro.
**Fix:** Add `onboardingSeen` to the zustand store, persist via the existing `seeit-app-state` partialize, redirect first-time users to onboarding.

**45. Toast position doesn't account for the camera viewfinder on Scan tab** — `components/ui/Toast.tsx:71-85`
Toast slides in from top with `insets.top + 8` offset. On the Scan tab the camera fills the screen edge-to-edge under the status bar, so the toast overlays the live preview oddly.
**Fix:** Add an opaque background to the toast pill (already cream + shadow — fine), OR teach the toast to render below the controls strip on Scan.

**46. ThemeProvider double-renders the storefront** — `app/(public)/restaurant/[brandSlug].tsx:679-684`
Default export reads brand once just to set theme color, then `<InnerScreen>` reads brand again. Two fetches for the same brand (cached but still a render hit).
**Fix:** Pass `themeColor` down as a prop from inside `<InnerScreen>` to a separately-mounted `<BrandThemeProvider>`, or accept the small duplication for cleanliness.

### Type safety

**47. `as any` in `searchDishes` map** — `lib/api/search.ts:65-83`
Whole row is cast through `any[]`. If the embed query changes shape, no type error.
**Fix:** Define an interface for the raw shape, narrow each property explicitly.

**48. `(verified.data as any[] | undefined) ?? []` in home** — `app/(public)/(tabs)/home.tsx:76`
React Query v5 generic inference fights complex queryFn return types. Acceptable hack but lose type checking on `b.id`, `b.name`, etc.
**Fix:** Explicit `useQuery<Brand[]>(...)` in fetchPublishedBrands typing.

### Performance

**49. `pickWhatsGood` recomputes on every render** — `app/(public)/restaurant/[brandSlug].tsx:243-249`
Even when the sheet is closed, the conditional `menuQ.data && whatsGoodOpen` runs but the computation is cheap. When open, it runs every state change.
**Fix:** `useMemo([menuQ.data, brand.featured_menu_item_ids])`.

**50. Home renders 4 query results into a single subtitle decision** — `app/(public)/(tabs)/home.tsx:108-135`
Every change to any of `nearbyData`, `publishedData`, `rawData`, `verifiedData` triggers re-evaluation.
**Fix:** Acceptable. The 4 arrays are stable references when React Query cache is hot.

**51. Bottom tab bar `tapLight` haptic fires on every render of TabBar's button** — `components/navigation/TabBar.tsx:55`
`goTo` is recreated each render. Pressables capture the latest reference, but `tapLight()` itself is a side effect tied to the press, fine. False alarm.

### Code health

**52. `[SeeIt]` debug logs in production** — `lib/utils/debugLog.ts`
Useful now, noisy at scale. Wrap calls in `__DEV__` checks before shipping.
**Fix:** `if (!__DEV__) return;` at the top of `debugLog`.

**53. `setManualLocation(null, coords)` in city picker is semantically odd** — `app/(public)/(tabs)/home.tsx:308-316`
Passing the *current* coords just to "keep them" while clearing the label is confusing. A `clearManualLabel()` action would read better.
**Fix:** Split into `setCoords` + `clearManualLabel` in the store.

**54. `useFocusEffect` in scan.tsx triggers per-render** — `app/(public)/(tabs)/scan.tsx:51-58`
The inline callback isn't memoized; React calls it on every render of ScanScreen, not just focus.
**Fix:** Wrap the inner callback in `React.useCallback`.

**55. Multiple inline-arrow `Pressable` style functions on hot paths** — most tab screens
Each press recreates style closures. RN handles it but allocates objects. For lists with 100+ rows it adds up.
**Fix:** Memoize via `StyleSheet.create` or `useMemo` if profiling shows JS frame drops.

---

## TIER 4 — LOW (cosmetic / nice-to-have)

**56. Inconsistent capitalization on "kosher" agency labels** — `lib/utils/constants.ts:KOSHER_AGENCIES`
"Star-K" vs "Kof-K" hyphen styles, "OK Kosher" with the word vs "OU (Orthodox Union)". Not a bug, just inconsistent.

**57. `formatPrice` always renders "$0.00" for zero prices** — `lib/utils/formatPrice.ts`
Some items (combos, samplers) might have a price of 0. "$0.00" is uglier than "Free" or hiding the price.
**Fix:** Render nothing for `price === 0`.

**58. Storefront "Just joined" subtitle never personalizes** — `app/(public)/(tabs)/home.tsx:319-336`
Same string for every user.

**59. `notes` field on order list items is single-line** — `app/(auth)/order-list/[locationId].tsx`
For long requests ("extra pickles, no onions, half rare half medium") the single-line TextInput truncates.
**Fix:** `multiline numberOfLines={2}`.

**60. KosherCertChipRow can wrap awkwardly with 3+ subs** — `components/restaurant/KosherCertChipRow.tsx`
The pill is `flexWrap: 'wrap'` but each chip has its own padding so wrap looks jagged. With 4+ active subs, a vertical list would read better.
**Fix:** Switch to two-line layout when subs.length > 2.

**61. Onboarding emoji placeholders should be illustrations** — `app/(public)/onboarding.tsx`
For a v1 ship a simple SVG illustration set ("plate of food", "stack of photos", "magnifying glass over menu") would feel more designed than emoji.

**62. Custom TabBar doesn't animate active state** — `components/navigation/TabBar.tsx`
The dot/underline indicator from the previous version was removed. Active tab is just color + bold weight. A subtle scale or slide of the underline is the v1 polish move.

**63. `StorefrontHeader` cover photo + logo don't share the same horizontal padding** — `components/restaurant/StorefrontHeader.tsx`
Cover bleeds edge to edge, logo overlaps -36px into the cover but is offset 20px from the left — fine on most phones, but on iPad it looks unanchored.
**Fix:** Defer until iPad layout sweep.

---

## Already-deferred (not relisted, but visible)

- Real Apple / Google sign-in (placeholders removed per Bug 2 of the prior round)
- Half-star ratings
- Inter font bundle
- Admin QR generator mirror
- PDF library QR download (we have print-to-PDF table tent)
- Cuisine chips / verified pill pass on Saved tab + dish detail
- Map view tab
- `react-native-image-zoom-viewer` for lightboxed photos
- Push notification registration

## Audit-agent findings I disputed (so you don't double-investigate)

- **"signin role check doesn't revoke session"** — false; `signin.tsx:54` does `await supabase.auth.signOut()` before showing the error.
- **`if (!user || skip)` in allergy-setup** — agent flagged this as wrong but it's correct (skip when no user OR skip pressed).
- **`PhotoPlaceholder` "never referenced"** — used by `RestaurantCard` and `DishCard`.
- **"VerifiedBadge is the only file with `accessibilityLabel`"** — partly false; `KosherBadge`, `HalalBadge`, `BottomSheet` and others also have labels. The broader point (most interactive elements lack labels) is still valid, but the specific claim is wrong.
- **regex one-liner suggestion for `uri.split('.')`** — had malformed brackets, ignored.

---

## How I'd order the work

If you have ~1 day: knock out #1 (cache clear), #2 (user_id), #3 (duplicate saves), #4 (Want-to-try removal or wire-up), #5 (is_flagged null), #10 (Saved tab cards), #11 (`width={undefined}`), #12 (star color), #16 (storefront error state), #28-30 (a11y labels). That's ~30% of the impact for ~15% of the lines.

If you have ~1 week: add #6 (photo upload errors), #14 (empty-state copy), #19 (heart fill state), #20-22 (deep link cleanup), #23-24 (lazy queries), #26-27 (FK alias + dish visibility), #31 (DRY isVisible), then walk through Tier 3.

The Tier 4 list I'd save for a "polish week" right before App Store submission.
