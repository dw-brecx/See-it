'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewForm } from '@/components/forms/ReviewForm';

export function AddReviewButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add review</span>
      </Button>
      <ReviewForm open={open} onOpenChange={setOpen} />
    </>
  );
}
