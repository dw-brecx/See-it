'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type Props = {
  options: readonly string[] | string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable = true,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(option: string) {
    if (value.includes(option)) onChange(value.filter((v) => v !== option));
    else onChange([...value, option]);
  }

  function remove(option: string) {
    onChange(value.filter((v) => v !== option));
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-left text-sm shadow-sm hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            className,
          )}
        >
          {value.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {value.map((v) => (
            <Badge key={v} variant="primary" className="gap-0.5 pr-1">
              {v}
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                className="ml-0.5 rounded-full px-0.5 hover:bg-terracotta-200/50"
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          ))}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[--radix-popover-trigger-width] min-w-[240px] rounded-md border bg-popover p-1.5 text-popover-foreground shadow-md"
        >
          {searchable && (
            <Input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-1 h-8"
            />
          )}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No matches</p>
            ) : (
              filtered.map((opt) => {
                const checked = value.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="flex-1">{opt}</span>
                    {checked && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent"
            >
              Clear all ({value.length})
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
