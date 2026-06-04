'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Loader2,
  Pause,
  Pencil,
  Play,
  ShieldCheck,
  ShieldOff,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConfirmDeleteByName } from '@/components/ConfirmDeleteByName';
import { BrandForm } from '@/components/forms/BrandForm';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';

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
  is_verified?: boolean | null;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
  verification_requested_at?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
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
  const [showReject, setShowReject] = useState(false);
  const [showUnverify, setShowUnverify] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const isVerified = !!brand.is_verified;
  const status = brand.verification_status ?? null;
  const hasPendingRequest = status === 'pending';

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

  async function approveVerification() {
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('brands')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: user?.id ?? null,
          verification_notes: null,
        })
        .eq('id', brand.id);
      if (error) {
        toast.error(`Could not verify store: ${error.message}`);
        return;
      }
      await logAudit(supabase, {
        action: 'brand.verify',
        targetType: 'brand',
        targetId: brand.id,
        targetLabel: brand.name,
      });
      toast.success(`${brand.name} is now verified`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function rejectVerification() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('brands')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_notes: rejectNotes.trim() || null,
        })
        .eq('id', brand.id);
      if (error) {
        toast.error(`Could not update store: ${error.message}`);
        return;
      }
      await logAudit(supabase, {
        action: 'brand.verification_reject',
        targetType: 'brand',
        targetId: brand.id,
        targetLabel: brand.name,
        metadata: { notes: rejectNotes.trim() || null },
      });
      toast.success('Verification request rejected');
      setShowReject(false);
      setRejectNotes('');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function unverify() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('brands')
        .update({
          is_verified: false,
          verification_status: null,
          verified_at: null,
          verified_by: null,
        })
        .eq('id', brand.id);
      if (error) {
        toast.error(`Could not unverify store: ${error.message}`);
        return;
      }
      await logAudit(supabase, {
        action: 'brand.unverify',
        targetType: 'brand',
        targetId: brand.id,
        targetLabel: brand.name,
      });
      toast.success(`${brand.name} is no longer verified`);
      setShowUnverify(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        {/* Verification status pill (always visible so admins see state at a glance) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isVerified ? (
            <Badge className="gap-1 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90">
              <BadgeCheck className="h-3 w-3" /> Verified
            </Badge>
          ) : hasPendingRequest ? (
            <Badge variant="warning" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Verification requested
            </Badge>
          ) : status === 'rejected' ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> Verification rejected
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {/* Verification controls */}
          {isVerified ? (
            <Button
              variant="outline"
              onClick={() => setShowUnverify(true)}
              className="gap-1.5"
            >
              <ShieldOff className="h-4 w-4" /> Unverify
            </Button>
          ) : hasPendingRequest ? (
            <>
              <Button
                onClick={approveVerification}
                disabled={busy}
                className="gap-1.5 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReject(true)}
                disabled={busy}
                className="gap-1.5"
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={approveVerification}
              disabled={busy}
              className="gap-1.5"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              Verify
            </Button>
          )}

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

      <ConfirmDialog
        open={showUnverify}
        onOpenChange={setShowUnverify}
        title={`Remove verification from ${brand.name}?`}
        description="The blue checkmark will be removed from this store across SeeIt. They can request verification again later."
        confirmLabel="Remove verification"
        destructive
        onConfirm={unverify}
      />

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject verification request</DialogTitle>
            <DialogDescription>
              Add an optional note so {brand.name} understands what to address. The
              store can re-request verification after making changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-notes">Notes (optional)</Label>
            <Textarea
              id="reject-notes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Could not confirm the storefront address. Please update your locations."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={rejectVerification} disabled={busy} variant="destructive">
              {busy ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Rejecting…
                </>
              ) : (
                'Reject request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
