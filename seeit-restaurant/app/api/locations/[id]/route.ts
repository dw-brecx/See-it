import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Delete a location. Verifies the caller owns the brand (or is platform admin),
 * and refuses to delete the only location of a brand. Cascade behavior in the
 * DB handles menu items, photos, reviews.
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

  // Look up the location + its brand
  const { data: loc, error: locErr } = await supabase
    .from('locations')
    .select('id, name, brand_id')
    .eq('id', params.id)
    .maybeSingle();
  if (locErr) {
    return NextResponse.json({ error: locErr.message }, { status: 500 });
  }
  if (!loc) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  // Authorization: brand owner OR platform admin
  const [brandRes, meRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id, owner_id')
      .eq('id', loc.brand_id)
      .maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
  ]);
  const isAdmin = meRes.data?.role === 'admin';
  const isOwner = brandRes.data?.owner_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: 'You don\'t have permission to delete this location' },
      { status: 403 },
    );
  }

  // Cannot delete the last location of a brand
  const { count: siblingCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', loc.brand_id);
  if (!isAdmin && (siblingCount ?? 0) <= 1) {
    return NextResponse.json(
      {
        error:
          'You cannot delete your only location. Add another location first, or delete the entire store from Settings.',
      },
      { status: 400 },
    );
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .eq('id', params.id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
