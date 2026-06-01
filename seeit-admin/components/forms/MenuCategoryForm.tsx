'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SheetBody, SheetFooter } from '@/components/ui/sheet';
import { FormSheet } from '@/components/FormSheet';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  display_order: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

type ExistingCategory = {
  id: string;
  name: string;
  display_order: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  category?: ExistingCategory | null;
  onSaved?: () => void;
};

export function MenuCategoryForm({
  open,
  onOpenChange,
  locationId,
  category,
  onSaved,
}: Props) {
  const router = useRouter();
  const isEdit = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      display_order: category?.display_order ?? 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        display_order: category?.display_order ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category?.id]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const payload = {
      location_id: locationId,
      name: values.name.trim(),
      display_order: values.display_order,
    };

    if (isEdit && category) {
      const { error } = await supabase
        .from('menu_categories')
        .update(payload)
        .eq('id', category.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      toast.success(`Updated "${payload.name}"`);
    } else {
      const { error } = await supabase.from('menu_categories').insert(payload);
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      toast.success(`Created "${payload.name}"`);
      form.reset();
    }
    onOpenChange(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit category' : 'Add category'}
      description="Menu categories group dishes (Appetizers, Pasta, Pizza, etc.)."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Antipasti / Pasta / Pizza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SheetBody>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : isEdit ? (
                'Save'
              ) : (
                'Create category'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
