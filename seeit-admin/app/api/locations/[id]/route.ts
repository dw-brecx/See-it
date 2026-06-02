import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin-side location delete. Verifies the caller is an admin then cascades
 * via DB FK constraints. No "last location" guard — admins can wipe out a
 * brand's last location intentionally.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (me?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { data: loc } = await supabase
    .from('locations')
    .select('id, name')
    .eq('id', params.id)
    .maybeSingle();
  if (!loc) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .eq('id', params.id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Audit log entry
  await supabase.from('admin_audit_log').insert({
    action: 'delete',
    target_type: 'location',
    target_id: params.id,
    target_label: loc.name,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
