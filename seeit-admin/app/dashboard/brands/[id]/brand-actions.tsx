'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConfirmDeleteByName } from '@/components/ConfirmDeleteByName';
import { BrandForm } from '@/components/forms/BrandForm';
import { createClient } from '@/lib/supabase/client';

type Brand = {
  id: string;
  name: string;
  description: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
  logo_url: string | null;
  owner_id: string | null;
  subscription_status: string | null;
  is_suspended: boolean;
};

type Props = {
  brand: Brand;
  ownerEmail: string | null;
};

export function BrandActions({ brand, ownerEmail }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function toggleSuspend() {
    const supabase = createClient();
    const { error } = await supabase
      .from('brands')
      .update({ is_suspended: !brand.is_suspended })
      .eq('id', brand.id);
    if (error) {
      toast.error(`Could not update store: ${error.message}`);
      return;
    }
    toast.success(brand.is_suspended ? 'Store unsuspended' : 'Store suspended');
    router.refresh();
  }

  async function deleteBrand() {
    const supabase = createClient();
    const { error } = await supabase.from('brands').delete().eq('id', brand.id);
    if (error) {
      toast.error(`Could not delete store: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${brand.name}`);
    router.push('/dashboard/brands');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setShowEdit(true)} className="gap-1.5">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" onClick={() => setShowSuspend(true)} className="gap-1.5">
          {brand.is_suspended ? (
            <>
              <Play className="h-4 w-4" /> Unsuspend
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" /> Suspend
            </>
          )}
        </Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)} className="gap-1.5">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <BrandForm
        open={showEdit}
        onOpenChange={setShowEdit}
        brand={brand}
        ownerEmail={ownerEmail}
      />

      <ConfirmDialog
        open={showSuspend}
        onOpenChange={setShowSuspend}
        title={brand.is_suspended ? `Unsuspend ${brand.name}?` : `Suspend ${brand.name}?`}
        description={
          brand.is_suspended
            ? 'The store and all its locations will become visible again to customers and team members.'
            : 'The store and all its locations will be hidden from customers. Team members keep access.'
        }
        confirmLabel={brand.is_suspended ? 'Unsuspend' : 'Suspend'}
        destructive={!brand.is_suspended}
        onConfirm={toggleSuspend}
      />

      <ConfirmDeleteByName
        open={showDelete}
        onOpenChange={setShowDelete}
        expected={brand.name}
        title={`Delete ${brand.name}?`}
        description="This permanently deletes the store and (depending on your DB cascade rules) all its locations, menu items, reviews, and team data. This cannot be undone."
        confirmLabel="Delete store"
        onConfirm={deleteBrand}
      />
    </>
  );
}
