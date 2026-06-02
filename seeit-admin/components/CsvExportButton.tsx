'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadCsv, rowsToCsv, type CsvColumn } from '@/lib/csv';

type Props<T> = {
  /** Returns the rows to export. Called when the button is clicked. */
  fetchRows: () => Promise<T[]>;
  columns: CsvColumn<T>[];
  filename: string;
  /** Optional label override — default "Export CSV". */
  label?: string;
};

export function CsvExportButton<T>({
  fetchRows,
  columns,
  filename,
  label = 'Export CSV',
}: Props<T>) {
  const [loading, setLoading] = React.useState(false);

  async function handle() {
    setLoading(true);
    try {
      const rows = await fetchRows();
      const csv = rowsToCsv(rows, columns);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`${filename}-${stamp}.csv`, csv);
      toast.success(`Exported ${rows.length.toLocaleString()} row${rows.length === 1 ? '' : 's'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={loading}
      className="h-9 gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
