'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Brand = { id: string; name: string; logo_url: string | null };

export function CurrentBrandPicker({
  brands,
  currentId,
}: {
  brands: Brand[];
  currentId: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function pick(id: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set('brand', id);
    router.replace(`/dashboard/preview?${sp.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Previewing
      </span>
      <Select value={currentId} onValueChange={pick}>
        <SelectTrigger className="w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
