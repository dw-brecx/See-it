import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/SearchInput';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { InviteUserButton } from '@/components/InviteUserButton';
import { UsersList } from './users-list';
import type { UserRole } from '@/lib/database.types';

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
      'id, email, name, avatar_url, role, is_suspended, created_at, reviews(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.or(`email.ilike.%${params.q}%,name.ilike.%${params.q}%`);
  }
  if (params.role) query = query.eq('role', params.role as UserRole);

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
      >
        <InviteUserButton />
      </TopBar>
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

        {users.length === 0 ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try adjusting your filters."
            />
          </Card>
        ) : (
          <>
            <UsersList rows={users} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </div>
    </>
  );
}
