import Link from 'next/link';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchInput } from '@/components/SearchInput';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { RoleBadge } from '@/components/RoleBadge';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

type SearchParams = { q?: string; role?: string; page?: string };

async function fetchUsers(params: SearchParams) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('users')
    .select(
      'id, email, name, avatar_url, role, created_at, reviews(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.or(`email.ilike.%${params.q}%,name.ilike.%${params.q}%`);
  }
  if (params.role) query = query.eq('role', params.role);

  const { data, count, error } = await query;
  return {
    users: (data ?? []) as any[],
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { users, total, page, error } = await fetchUsers(searchParams);

  return (
    <>
      <TopBar
        title="Users"
        subtitle={`${total.toLocaleString()} user${total === 1 ? '' : 's'} on the platform`}
      />
      <div className="flex-1 space-y-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search email or name…" />
          <FilterSelect
            paramName="role"
            allLabel="All roles"
            placeholder="Role"
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'restaurant_owner', label: 'Restaurant owner' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load users: {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try adjusting your filters."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const revCount =
                      Array.isArray(u.reviews) && u.reviews[0]
                        ? u.reviews[0].count
                        : 0;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/users/${u.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.avatar_url ?? undefined} />
                              <AvatarFallback>
                                {initials(u.name ?? u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium">{u.name ?? '—'}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="tabular-nums">{revCount}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
