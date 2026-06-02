import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isAuthRoute = pathname === '/signin' || pathname === '/signup';

  if (!user && (isDashboardRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isDashboardRoute || isOnboardingRoute)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const allowed =
      profile?.role === 'restaurant_owner' || profile?.role === 'admin';
    if (!allowed) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('error', 'not_authorized');
      return NextResponse.redirect(url);
    }

    // Restaurant owners without a brand must finish onboarding before they
    // can access any /dashboard/* route. Admins are exempt — they can manage
    // any brand from the platform admin app.
    if (profile?.role === 'restaurant_owner' && isDashboardRoute) {
      const [ownedRes, teamRes] = await Promise.all([
        supabase
          .from('brands')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id),
        supabase
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      const hasBrand =
        (ownedRes.count ?? 0) > 0 || (teamRes.count ?? 0) > 0;
      if (!hasBrand) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    }

    // Conversely, once onboarding is done, /onboarding should bounce them home.
    if (profile?.role === 'restaurant_owner' && isOnboardingRoute) {
      const { count } = await supabase
        .from('brands')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      if ((count ?? 0) > 0) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
