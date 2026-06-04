'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Clock, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { VerificationBadge } from '@/components/VerificationBadge';

type Status = 'pending' | 'approved' | 'rejected' | null | undefined;

type Props = {
  brandId: string;
  isVerified: boolean;
  status: Status;
  requestedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
};

/**
 * Shown on the Store profile page. Lets the owner request verification,
 * shows the current request status, and renders the blue check once
 * an admin approves.
 */
export function VerificationStatusCard({
  brandId,
  isVerified,
  status,
  requestedAt,
  verifiedAt,
  notes,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function request() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('brands')
        .update({
          verification_status: 'pending',
          verification_requested_at: new Date().toISOString(),
        })
        .eq('id', brandId);
      if (error) {
        toast.error(`Could not submit request: ${error.message}`);
        return;
      }
      toast.success('Verification request submitted');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // Already verified — celebrate
  if (isVerified) {
    return (
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1DA1F2]/10">
            <BadgeCheck className="h-5 w-5 fill-[#1DA1F2] text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              You're verified
              <VerificationBadge verified size="sm" />
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Your store has the blue checkmark across SeeIt.
              {verifiedAt && ` Approved ${new Date(verifiedAt).toLocaleDateString()}.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending request
  if (status === 'pending') {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
              Verification pending
              <Badge variant="warning">Under review</Badge>
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              We'll review your store and get back to you. Most requests are
              reviewed within a few business days.
              {requestedAt && ` Requested ${new Date(requestedAt).toLocaleDateString()}.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected
  if (status === 'rejected') {
    return (
      <Card className="border-red-200 bg-red-50/40">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                Verification not approved
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {notes ??
                  'Reach out to support for details. You can request again once any issues are addressed.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={request}
              disabled={busy}
              className="gap-1.5"
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Requesting…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Request again
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No request yet — invite them to apply
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2]">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">Get verified</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            A blue checkmark next to your store name builds trust with
            customers. Apply and we'll review your listing.
          </p>
        </div>
        <Button onClick={request} disabled={busy} className="gap-1.5">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Requesting…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" /> Request verification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
