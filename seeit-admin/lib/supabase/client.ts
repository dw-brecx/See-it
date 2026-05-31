import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client — use in client components only.
 * Auth state and cookies are handled automatically by @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
