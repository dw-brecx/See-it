import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceSupabase } from '@supabase/supabase-js';

/**
 * POST /api/admin/invite
 *
 * Sends a Supabase auth invite email. Body: { email, role? }
 *
 * Requires:
 *   - SUPABASE_SERVICE_ROLE_KEY (server-only env var; NEVER expose to browser)
 *   - calling user must be signed in AND have role = 'admin'
 */
export async function POST(request: Request) {
  // 1. Verify the caller is an authenticated admin
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    return NextResponse.json(
      { error: 'Could not verify admin role' },
      { status: 500 },
    );
  }
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 2. Parse the request
  let body: { email?: string; role?: string };
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const email = (body.email ?? '').trim();
  const role = body.role ?? 'customer';
  if (!email || !/^.+@.+\..+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (!['customer', 'restaurant_owner', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // 3. Use the service role key to send the invite
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      {
        error:
          'Server is missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL',
      },
      { status: 500 },
    );
  }

  const admin = createServiceSupabase(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { intended_role: role },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Invite failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    note:
      'If the role should be set immediately, an admin can change it from the user detail page after signup.',
  });
}
