'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  locationId: string;
  locationName: string;
  /** Refuse to delete if true (also enforced server-side). */
  isOnlyLocation: boolean;
  /** Called after a successful delete. */
  onDeleted?: () => void;
};

export function DeleteLocationDangerZone({
  locationId,
  locationName,
  isOnlyLocation,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const matches = confirmText.trim() === locationName.trim();

  async function doDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? `Delete failed (${res.status})`);
        return;
      }
      toast.success(`Deleted "${locationName}"`);
      setOpen(false);
      setConfirmText('');
      onDeleted?.();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-red-900">Danger zone</p>
          <p className="mt-0.5 text-[12.5px] text-red-900/80">
            Deleting this location permanently removes its menu items, photos,
            and reviews. This cannot be undone.
          </p>
          {isOnlyLocation && (
            <p className="mt-2 text-[12px] font-medium text-red-700">
              You cannot delete your only location. Add another location first,
              or delete the entire store from Settings.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={isOnlyLocation}
            className="mt-3 gap-1.5 border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete this location
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (busy) return;
          setOpen(o);
          if (!o) setConfirmText('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Delete "{locationName}"
            </DialogTitle>
            <DialogDescription>
              This permanently removes the location plus all menu items, photos,
              and reviews tied to it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type{' '}
              <span className="font-mono font-semibold text-foreground">
                {locationName}
              </span>{' '}
              to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={locationName}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doDelete}
              disabled={!matches || busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                'Delete forever'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
