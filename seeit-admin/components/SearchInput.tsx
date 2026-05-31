'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Props = { placeholder?: string; paramName?: string };

export function SearchInput({ placeholder = 'Search…', paramName = 'q' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? '');

  // Debounced URL update
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const currentVal = params.get(paramName) ?? '';
    if (currentVal === value) return;

    const t = setTimeout(() => {
      if (value) params.set(paramName, value);
      else params.delete(paramName);
      params.delete('page'); // reset pagination on new search
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
