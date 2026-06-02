import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { FilterSelect } from '@/components/FilterSelect';
import { EmptyState } from '@/components/EmptyState';
import { NotificationsList } from './notifications-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = { filter?: string };

async function fetchNotifications(params: SearchParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], error: null, signedOut: true };

  let q = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (params.filter === 'unread') q = q.eq('is_read', false);
  if (params.filter === 'read') q = q.eq('is_read', true);

  const { data, error } = await q;
  return {
    items: (data ?? []) as any[],
    error: error?.message ?? null,
    signedOut: false,
  };
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { items, error, signedOut } = await fetchNotifications(searchParams);
  if (signedOut) redirect('/signin');

  return (
    <>
      <TopBar
        title="Notifications"
        subtitle={`${items.length.toLocaleString()} notification${items.length === 1 ? '' : 's'}`}
      />
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            paramName="filter"
            allLabel="All notifications"
            placeholder="Filter"
            options={[
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load: {error}
          </div>
        )}

        {items.length === 0 ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={Bell}
              title="Nothing here yet"
              description="When something needs your attention — a flagged review, a new signup, a billing event — it'll land here."
            />
          </Card>
        ) : (
          <NotificationsList items={items} />
        )}
      </div>
    </>
  );
}
