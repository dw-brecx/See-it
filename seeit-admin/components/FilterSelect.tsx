'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Option = { value: string; label: string };

type Props = {
  paramName: string;
  options: Option[];
  placeholder?: string;
  allLabel?: string;
};

export function FilterSelect({
  paramName,
  options,
  placeholder = 'Filter',
  allLabel = 'All',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? '__all__';

  function update(value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === '__all__') params.delete(paramName);
    else params.set(paramName, value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={update}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
