'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LocationForm } from '@/components/forms/LocationForm';
import { initials } from '@/lib/utils';

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  primary_cuisine: string | null;
};

export function BrandPicker({ brands }: { brands: Brand[] }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Brand | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query) return brands;
    const q = query.toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.primary_cuisine ?? '').toLowerCase().includes(q),
    );
  }, [brands, query]);

  function pickAndOpen(brand: Brand) {
    setSelected(brand);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search brands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No brands match "{query}".
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {filtered.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <Avatar className="h-9 w-9 rounded-md">
                {b.logo_url ? <AvatarImage src={b.logo_url} /> : null}
                <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                  {initials(b.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{b.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {b.primary_cuisine ?? '—'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => pickAndOpen(b)}
                className="shrink-0"
              >
                Pick &amp; continue
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <LocationForm
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setSelected(null);
          }}
          brandId={selected.id}
        />
      )}
    </div>
  );
}
