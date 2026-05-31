'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  page: number;
  pageSize: number;
  total: number;
};

export function Pagination({ page, pageSize, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function go(newPage: number) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (newPage <= 1) params.delete('page');
    else params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {total === 0 ? 'No results' : <>Showing <strong className="text-foreground">{from}–{to}</strong> of <strong className="text-foreground">{total}</strong></>}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
        </Button>
        <span className="text-xs">
          Page <strong className="text-foreground">{page}</strong> of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
