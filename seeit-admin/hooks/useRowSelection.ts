'use client';

import * as React from 'react';

/**
 * Track which rows in a list are selected by id. Resets whenever the input
 * id-set changes (page change, filter change), which is the right default
 * for paginated list pages.
 */
export function useRowSelection(ids: string[]) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Reset selection when the underlying id list changes meaningfully
  const idKey = ids.join(',');
  React.useEffect(() => {
    setSelected(new Set());
  }, [idKey]);

  const toggle = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = React.useCallback(() => {
    setSelected((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }, [ids]);

  const clear = React.useCallback(() => setSelected(new Set()), []);

  const isSelected = React.useCallback(
    (id: string) => selected.has(id),
    [selected],
  );

  const allSelected = ids.length > 0 && selected.size === ids.length;
  const someSelected = selected.size > 0 && selected.size < ids.length;

  return {
    selected,
    selectedIds: Array.from(selected),
    count: selected.size,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  };
}
