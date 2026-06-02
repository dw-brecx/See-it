'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg';
};

/**
 * Wraps every form. Slides in from the right on desktop, full-screen on mobile.
 * Use SheetFooter inside `children` for the sticky save/cancel row.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={
          size === 'lg'
            ? 'p-0 sm:max-w-2xl'
            : 'p-0 sm:max-w-lg'
        }
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
