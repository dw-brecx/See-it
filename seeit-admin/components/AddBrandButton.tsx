'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandForm } from '@/components/forms/BrandForm';

export function AddBrandButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" /> Add brand
      </Button>
      <BrandForm open={open} onOpenChange={setOpen} />
    </>
  );
}
