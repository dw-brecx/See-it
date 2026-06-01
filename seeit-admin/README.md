# SeeIt Admin Dashboard

The internal admin dashboard for the **SeeIt** platform — a real
Next.js 14 + TypeScript + Supabase application used by the platform
team to manage brands, locations, users, reviews, and subscriptions.

This is **not** a mockup. It talks to the real Supabase database, uses
real auth, and is intended to be deployed (Vercel recommended).

The two static mockups in this repo (`/seeit-customer-mockup` and
`/seeit-restaurant-dashboard`) are reference designs only and are not
used by this app.

---

## Stack

- **Next.js 14+** (App Router, Server Components)
- **TypeScript** (strict mode)
- **Tailwind CSS** with brand tokens (terracotta `#E85D3A`, off-white
  `#FAFAF7`, charcoal `#1A1A1A`)
- **shadcn/ui-style components** (pre-installed under
  `components/ui/`, configured via `components.json` so you can add
  more with the CLI later)
- **Supabase** via `@supabase/supabase-js` and `@supabase/ssr` (the
  modern, non-deprecated package)
- **react-hook-form + zod** for form validation
- **Lucide React** for icons
- **Sonner** for toast notifications
- Fully responsive — sidebar drawer on mobile, card-layout tables on
  small screens, full-screen sheet modals

---

## Setup

### 1. Install dependencies

```bash
cd seeit-admin
npm install
```

### 2. Fill in `.env.local`

Open `.env.local` (already created with empty values) and paste your
Supabase project keys. **Never commit real values.** The file is in
`.gitignore`.

```env
# Required — public, safe in browser
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...

# Required for the "Invite user" feature only — server-only, NEVER expose
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...
```

All three come from your Supabase dashboard:
**Project Settings → API → Project URL + Project API keys**.

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the
  public keys — used by browser-side and server-side queries.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only** by the
  `/api/admin/invite` route (admin-gated server route that calls
  `supabase.auth.admin.inviteUserByEmail`). Without it the Invite
  button returns a 500. Make sure to add this in Vercel env vars too.

The browser bundle never sees the service role key — it's only read in
the API route handler.

### 3. Make sure your admin user has `role = 'admin'`

The dashboard refuses to sign in users whose `public.users.role` is
anything other than `'admin'`. The role is set in the database (you
mentioned you've already done this for your own account). To check
or update:

```sql
-- Inspect
SELECT id, email, role FROM public.users WHERE email = 'you@example.com';

-- Promote
UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';
```

### 4. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/signin`. Use
the email and password of the admin user you set up in Supabase Auth.

---

## Deploying to Vercel

1. Push this repo to GitHub (`.env.local` is gitignored — your keys
   won't leak).
2. In Vercel, **New Project → Import** the repo.
3. **Root Directory:** `seeit-admin`
4. Framework preset auto-detects as **Next.js**.
5. Under **Environment Variables**, add the same two keys you put in
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Deploy.** First build takes ~60 seconds.

Optional: set a custom domain (e.g. `admin.seeit.com`) in
Vercel → Project → Domains.

---

## How auth works

1. User submits the sign-in form (`/signin`) — `signInWithPassword`
   sets a secure HTTP-only cookie via `@supabase/ssr`.
2. After sign-in, we read `public.users.role` for the authenticated
   user. If it's not `'admin'`, we sign them out and surface an
   error.
3. **`middleware.ts`** runs on every request:
   - Refreshes the Supabase session cookie.
   - For `/dashboard/*` routes: re-checks that the user exists **and**
     has `role = 'admin'`. Anything else → signed out + redirected.
4. The dashboard layout (`app/dashboard/layout.tsx`) does the role
   check **again** server-side — defence in depth. Don't rely on a
   single guard.

Sign-out is in the sidebar footer — it calls `supabase.auth.signOut()`
and pushes back to `/signin`.

---

## File map

```
seeit-admin/
├── app/
│   ├── layout.tsx              Root layout + Inter font + Toaster
│   ├── page.tsx                Redirects to /dashboard or /signin
│   ├── globals.css             Brand theme tokens + Tailwind base
│   ├── signin/
│   │   ├── page.tsx            Centered sign-in card
│   │   └── sign-in-form.tsx    Client form (auth + role check)
│   └── dashboard/
│       ├── layout.tsx          Sidebar + admin role guard
│       ├── page.tsx            Overview: stat cards + recent feeds
│       ├── brands/
│       │   ├── page.tsx        Brands list (search, filters, paging)
│       │   └── [id]/
│       │       ├── page.tsx          Brand detail (4 tabs)
│       │       └── brand-actions.tsx Suspend / unsuspend / delete
│       ├── locations/page.tsx  Locations across all brands
│       ├── users/
│       │   ├── page.tsx        Users list
│       │   └── [id]/
│       │       ├── page.tsx          User detail + brands + reviews
│       │       └── role-changer.tsx  Role change with confirm
│       ├── reviews/
│       │   ├── page.tsx        Review moderation table
│       │   └── review-actions.tsx    Detail modal: flag / delete
│       ├── subscriptions/page.tsx    Per-brand subscriptions (read-only)
│       ├── activity/page.tsx         Merged chronological feed
│       └── settings/
│           ├── page.tsx              Admin's own profile page
│           └── settings-form.tsx     Avatar / name / password (client)
│
├── components/
│   ├── ui/                 shadcn-style primitives (Button, Card,
│   │                       Table, Dialog, Avatar, Select, Tabs, …)
│   ├── Logo.tsx
│   ├── Sidebar.tsx         Persistent left nav (client component)
│   ├── TopBar.tsx          Sticky page header with Refresh button
│   ├── SignOutButton.tsx
│   ├── StatCard.tsx
│   ├── RoleBadge.tsx
│   ├── StatusBadge.tsx     Subscription / suspension / open status
│   ├── SearchInput.tsx     URL-synced debounced search
│   ├── FilterSelect.tsx    URL-synced filter dropdown
│   ├── Pagination.tsx      URL-synced pagination
│   ├── ConfirmDialog.tsx   Reusable confirm modal
│   └── EmptyState.tsx
│
├── lib/
│   ├── database.types.ts   Manual TypeScript types for all 18 tables
│   ├── utils.ts            cn(), formatDate, formatRelative, initials
│   └── supabase/
│       ├── client.ts       Browser client (use in client components)
│       ├── server.ts       Server client (use in RSCs + actions)
│       └── middleware.ts   Auth + admin role guard for middleware
│
├── middleware.ts           Wires lib/supabase/middleware to all routes
├── .env.local              (empty — you fill in your Supabase keys)
├── .gitignore
├── components.json         shadcn config for adding more components
├── next.config.js
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Adding more shadcn components

This project is configured for shadcn/ui (see `components.json`). To
add a component the CLI doesn't already include:

```bash
npx shadcn@latest add accordion
```

It will install into `components/ui/` next to the existing ones.

---

## Design system

The dashboard intentionally matches the brand palette of the customer
app and restaurant dashboard mockups in this repo:

| Token             | Value      | Usage                          |
|-------------------|------------|--------------------------------|
| primary           | `#E85D3A`  | CTAs, active nav, badges       |
| background        | `#FAFAF7`  | Page background                |
| foreground        | `#1A1A1A`  | Body text                      |
| muted-foreground  | `#6B7280`  | Secondary text                 |

Status badge mapping:

- **active / trialing** → green
- **past_due / unpaid / pending** → amber
- **canceled / suspended / expired** → red
- **admin** role → terracotta
- **restaurant_owner** role → blue
- **customer** role → gray

---

## What's intentionally NOT in scope here

- **Stripe integration.** The `/subscriptions` page is read-only —
  it displays `public.subscriptions` rows as they exist. Wiring real
  Stripe webhooks belongs to a future task.
- **User suspension.** The user detail page can change roles. A
  `is_suspended` column on `public.users` would let us add a full
  suspend toggle — add the column and we can plug it in.
- **Reporter UI for flagged reviews.** A "view reporter" link
  requires a `report.reporter_id` table. The flag/unflag and delete
  actions are wired and working.
- **Email change** is read-only on the settings page — Supabase Auth
  email-change flow requires user confirmation outside the dashboard.

Everything else from the original brief is fully wired to real
database queries.

---

## Troubleshooting

**"That account doesn't have admin access."** Your user exists but
`public.users.role` isn't `'admin'`. Run the UPDATE in the setup
section.

**Hot reload of middleware not picking up changes.** `Ctrl+C` and
`npm run dev` again. Next.js middleware caches harder than route code.

**RLS error on some queries.** This dashboard assumes your RLS
policies grant admins full read access (and write where the actions
need it: brands.update for suspend, users.update for role change,
reviews.update + reviews.delete for moderation). If you see permission
errors in toasts, audit your policies for those operations against
`auth.uid()` where `role = 'admin'`.

**No data showing up.** Open browser DevTools → Network → look for
`POST` requests to `*.supabase.co/rest/v1/...`. The response body
will show the underlying error from PostgREST.
