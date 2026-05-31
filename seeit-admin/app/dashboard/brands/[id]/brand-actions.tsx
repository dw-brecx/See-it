'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';

type Props = {
  brandId: string;
  brandName: string;
  isSuspended: boolean;
};

export function BrandActions({ brandId, brandName, isSuspended }: Props) {
  const router = useRouter();
  const [showSuspend, setShowSuspend] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function toggleSuspend() {
    const supabase = createClient();
    const { error } = await supabase
      .from('brands')
      .update({ is_suspended: !isSuspended })
      .eq('id', brandId);
    if (error) {
      toast.error(`Could not update brand: ${error.message}`);
      return;
    }
    toast.success(isSuspended ? 'Brand unsuspended' : 'Brand suspended');
    router.refresh();
  }

  async function deleteBrand() {
    const supabase = createClient();
    const { error } = await supabase.from('brands').delete().eq('id', brandId);
    if (error) {
      toast.error(`Could not delete brand: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${brandName}`);
    router.push('/dashboard/brands');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setShowSuspend(true)}
        >
          {isSuspended ? (
            <>
              <Play className="h-4 w-4" /> Unsuspend
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" /> Suspend
            </>
          )}
        </Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <ConfirmDialog
        open={showSuspend}
        onOpenChange={setShowSuspend}
        title={isSuspended ? `Unsuspend ${brandName}?` : `Suspend ${brandName}?`}
        description={
          isSuspended
            ? 'The brand and all its locations will become visible again to customers and team members.'
            : 'The brand and all its locations will be hidden from customers. Team members keep access.'
        }
        confirmLabel={isSuspended ? 'Unsuspend' : 'Suspend'}
        destructive={!isSuspended}
        onConfirm={toggleSuspend}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${brandName}?`}
        description="This permanently deletes the brand and (depending on your DB cascade rules) all its locations, menu items, reviews, and team data. This cannot be undone."
        confirmLabel="Delete brand"
        destructive
        onConfirm={deleteBrand}
      />
    </>
  );
}
