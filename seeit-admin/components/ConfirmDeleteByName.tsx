'use client';

import * as React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expected: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
};

/**
 * Type-the-name-to-confirm destructive action dialog.
 * Used for deleting brands and any other "this is irreversible" flow.
 */
export function ConfirmDeleteByName({
  open,
  onOpenChange,
  expected,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
}: Props) {
  const [typed, setTyped] = React.useState('');
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const matches = typed.trim() === expected.trim();

  async function handleConfirm() {
    if (!matches) return;
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type <span className="font-semibold">{expected}</span> to confirm
          </Label>
          <Input
            id="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expected}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!matches || pending}
            className="w-full sm:w-auto"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
