# SeeIt for Restaurants

The web dashboard restaurant owners use to manage their listing on SeeIt — menu, photos, reviews, team, AI assistant, billing, and integrations.

This is the **restaurant-facing** app. It lives next to:

- `/seeit-admin` — platform admin dashboard (the SeeIt team uses this)
- `/seeit-customer-mockup` — customer mobile mockup (static)
- `/seeit-restaurant-dashboard` — older static mockup (kept for reference)

## Tech stack

Same as the admin app — Next.js 14 App Router, TypeScript strict, Tailwind + shadcn-style primitives, Supabase via `@supabase/ssr`, react-hook-form + zod, Lucide React, Sonner toasts, recharts.

## Environment variables

Copy `.env.local` into Vercel (or your own machine) and fill in:

```
# Required — same Supabase project as the admin app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional — features degrade gracefully when missing
GOOGLE_PLACES_API_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

The Supabase keys are the only ones strictly required. Features that depend on Google / Anthropic / Stripe display a "Connect this in Settings → Integrations" placeholder when those keys are unset — they never crash.

## Run locally

```sh
cd seeit-restaurant
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in or create an account.

## Deploy on Vercel

1. **Project → Settings → General → Root Directory:** `seeit-restaurant`
2. **Build Command** + **Install Command:** leave default (Vercel auto-detects Next.js)
3. **Environment Variables:** paste the same Supabase keys you use for `/seeit-admin`, plus any optional ones
4. Push to `main` — Vercel auto-deploys

## Database

This app shares its Supabase project with `/seeit-admin`. All migrations live under `seeit-admin/migrations/` — run those first, in order:

```
000_setup_all.sql          plans + discount_codes + admin RLS + helpers
003_storefront_fields.sql  brand storefront fields
004_audit_log.sql          admin audit log
005_integrations.sql       integrations registry
```

No new migrations needed for this app — it uses tables that already exist.

## Auth + roles

Signup creates a user with `intended_role: 'restaurant_owner'` in the auth `raw_user_meta_data`. The existing Supabase DB trigger picks that up and writes the row into `public.users` with `role = 'restaurant_owner'`.

Middleware (`middleware.ts`) gates `/dashboard/*` and `/onboarding/*` behind authentication, and requires the user's `role` to be `restaurant_owner` or `admin`. Admins are let in for support purposes.

## Brand + location context

Restaurant owners can own multiple brands; each brand can have multiple locations. The dashboard tracks a "current brand" + "current location" selection in localStorage (key `seeit.brand-context.v1`). Use the `useBrand()` hook in any client component to read or change the selection.

`currentLocationId === '__all__'` (exported as `ALL_LOCATIONS`) means "show me aggregate data across every location of the current brand."

## File map

```
/seeit-restaurant
  /app
    /signin                 — sign in
    /signup                 — sign up (creates auth user w/ intended_role)
    /onboarding             — first-time brand creation wizard
    /dashboard              — protected app shell
      /menu                 — menu manager
      /photos               — photo gallery
      /reviews              — reviews + replies (with AI reply suggestions)
      /locations            — locations CRUD
      /insights             — charts (recharts)
      /ai-assistant         — health score + AI recommendations
      /settings/*           — profile / account / team / notifications / integrations
      /billing              — pricing + plan picker
    /api
      /google/*             — Places search + details
      /ai/*                 — menu description, review reply, listing health, themes
  /components               — Sidebar, TopBar, BrandSwitcher, LocationSwitcher, forms, etc.
  /lib                      — supabase, database.types, constants, ai, google-places, utils
  middleware.ts             — auth + role gate
```

## Feature parity with the admin app

This app uses the same `lib/database.types.ts`, the same `lib/constants.ts` (cuisines, dietary tags, kosher agencies, etc.), the same UI primitives, the same `HoursEditor` (with Heimish-friendly text notes like "Until sunset" and "After Shabbos"), and the same `LocationForm` pattern (kosher cert sub-form, dietary tags, etc.). When the admin app changes its schema or design system, sync those files here too.

## Coming soon

- Stripe billing flow (currently a stub — billing UI shows the model but no real charges)
- Customer mobile app reads the storefront profile fields (currently the data is captured but the customer side hasn't been built)
- Forgot password flow (placeholder link)
- Notifications email/SMS write path (admin can read notifications, no producer yet)
