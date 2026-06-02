import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Mail, Phone, Calendar, Building2, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { RoleBadge } from '@/components/RoleBadge';
import { RoleChanger } from './role-changer';
import { formatDate, initials } from '@/lib/utils';
import type { UserRole } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

async function fetchUser(id: string) {
  const supabase = createClient();

  const [userRes, prefsRes, reviewsRes, brandsRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, name, avatar_url, phone, role, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select('allergies, dietary_preferences')
      .eq('user_id', id)
      .maybeSingle(),
    supabase
      .from('reviews')
      .select(
        'id, rating, text, created_at, location:locations(id, name, brand:brands(id, name))',
      )
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('brands')
      .select('id, name, logo_url, primary_cuisine, is_suspended, subscription_status')
      .eq('owner_id', id),
  ]);

  if (!userRes.data) return null;

  return {
    user: userRes.data as { id: string; email: string; name: string | null; avatar_url: string | null; phone: string | null; role: UserRole; created_at: string },
    prefs: prefsRes.data as { allergies: string[] | null; dietary_preferences: string[] | null } | null,
    reviews: (reviewsRes.data ?? []) as any[],
    brands: (brandsRes.data ?? []) as any[],
  };
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await fetchUser(params.id);
  if (!data) notFound();

  const { user, prefs, reviews, brands } = data;

  return (
    <>
      <TopBar title={user.name ?? user.email} subtitle="User details" />
      <div className="flex-1 space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All users
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl">
                  {initials(user.name ?? user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {user.name ?? 'Unnamed user'}
                  </h2>
                  <RoleBadge role={user.role} />
                </div>
                <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="text-foreground">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-foreground">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                </dl>
              </div>
            </div>
            <RoleChanger
              userId={user.id}
              currentRole={user.role}
              currentName={user.name}
            />
          </CardContent>
        </Card>

        {(prefs?.allergies?.length || prefs?.dietary_preferences?.length) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dietary preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prefs?.allergies && prefs.allergies.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {prefs.allergies.map((a) => (
                      <Badge key={a} variant="destructive">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {prefs?.dietary_preferences &&
                prefs.dietary_preferences.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Diet
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.dietary_preferences.map((d) => (
                        <Badge key={d} variant="success">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        ) : null}

        {user.role === 'restaurant_owner' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stores owned</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {brands.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No stores"
                  description="This user is a restaurant owner but hasn't claimed any stores yet."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {brands.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-3 px-6 py-3"
                    >
                      <Avatar className="h-10 w-10 rounded-md">
                        {b.logo_url ? <AvatarImage src={b.logo_url} /> : null}
                        <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                          {initials(b.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/brands/${b.id}`}
                          className="font-medium hover:underline"
                        >
                          {b.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {b.primary_cuisine ?? 'No cuisine set'}
                        </p>
                      </div>
                      {b.is_suspended && (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent reviews</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reviews.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No reviews yet"
                description="This user hasn't posted any reviews."
              />
            ) : (
              <ul className="divide-y divide-border">
                {reviews.map((r) => (
                  <li key={r.id} className="px-6 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-0.5 text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-semibold tabular-nums">{r.rating}</span>
                      </span>
                      <span className="text-muted-foreground">at</span>
                      <span className="font-medium">
                        {r.location?.name ?? 'Unknown location'}
                      </span>
                      {r.location?.brand && (
                        <Link
                          href={`/dashboard/brands/${r.location.brand.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          ({r.location.brand.name})
                        </Link>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    {r.text && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        "{r.text}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
