'use client';

import * as React from 'react';
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

/** Description of one DB column the importer can target. */
export type ImportField = {
  /** DB column name (sent to the insert handler). */
  key: string;
  /** Human-readable label shown in the mapping UI. */
  label: string;
  /** Whether the column must be mapped before import can proceed. */
  required?: boolean;
  /** Optional transformer: takes the raw CSV string, returns the DB value. */
  transform?: (raw: string) => unknown;
  /** Common variants of the header name in CSVs (used for auto-mapping). */
  aliases?: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What kind of thing we're importing — used in copy. */
  entity: string; // e.g. "brand", "location"
  fields: ImportField[];
  /** Called with the resolved rows. Should perform inserts and return any errors. */
  onImport: (rows: Record<string, unknown>[]) => Promise<{ inserted: number; failed: number; firstError?: string }>;
};

const SKIP = '__skip__';

export function CsvImportDialog({
  open,
  onOpenChange,
  entity,
  fields,
  onImport,
}: Props) {
  const [step, setStep] = React.useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  // For each header (csv column index), which DB field is it mapped to?
  const [mapping, setMapping] = React.useState<Record<number, string>>({});
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ inserted: number; failed: number; firstError?: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset when dialog reopens
  React.useEffect(() => {
    if (open) {
      setStep('upload');
      setHeaders([]);
      setRows([]);
      setMapping({});
      setResult(null);
    }
  }, [open]);

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const { headers: h, rows: r } = parseCsv(text);
      if (h.length === 0 || r.length === 0) {
        toast.error('That file looks empty.');
        return;
      }
      setHeaders(h);
      setRows(r);
      // Auto-map by name/alias match
      const auto: Record<number, string> = {};
      h.forEach((hdr, i) => {
        const norm = hdr.trim().toLowerCase().replace(/[\s_-]+/g, '');
        const match = fields.find((f) => {
          const candidates = [f.key, f.label, ...(f.aliases ?? [])];
          return candidates.some(
            (c) => c.trim().toLowerCase().replace(/[\s_-]+/g, '') === norm,
          );
        });
        auto[i] = match ? match.key : SKIP;
      });
      setMapping(auto);
      setStep('map');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read file');
    }
  }

  const missingRequired = React.useMemo(() => {
    const mapped = new Set(Object.values(mapping));
    return fields.filter((f) => f.required && !mapped.has(f.key)).map((f) => f.label);
  }, [mapping, fields]);

  function resolvedRows(): Record<string, unknown>[] {
    return rows.map((cells) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((_, i) => {
        const key = mapping[i];
        if (!key || key === SKIP) return;
        const raw = (cells[i] ?? '').trim();
        if (raw === '') {
          obj[key] = null;
          return;
        }
        const field = fields.find((f) => f.key === key);
        obj[key] = field?.transform ? field.transform(raw) : raw;
      });
      return obj;
    });
  }

  async function runImport() {
    setImporting(true);
    try {
      const res = await onImport(resolvedRows());
      setResult(res);
      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const previewRows = resolvedRows().slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {entity}s from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV, map the columns, then create the records in bulk.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-warm-50/60 px-6 py-12 text-center transition-colors hover:border-terracotta-300 hover:bg-terracotta-50/40"
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-semibold">Click to choose a CSV file</p>
              <p className="text-xs text-muted-foreground">
                First row should contain column headers.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            <div className="rounded-lg border border-border bg-warm-50/40 p-3">
              <p className="text-[12px] font-semibold text-foreground">Supported columns</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {fields
                  .map((f) => `${f.label}${f.required ? ' *' : ''}`)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">
              {rows.length.toLocaleString()} row{rows.length === 1 ? '' : 's'} detected.
              Match each CSV column to a database field.
            </p>

            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {headers.map((header, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{header}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      e.g. {rows[0]?.[i] ?? '—'}
                    </p>
                  </div>
                  <span className="text-muted-foreground/60">→</span>
                  <Select
                    value={mapping[i] ?? SKIP}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [i]: v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>— skip column —</SelectItem>
                      {fields.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                          {f.required ? ' *' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {missingRequired.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Required fields not yet mapped:{' '}
                  <span className="font-semibold">{missingRequired.join(', ')}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              Preview — first {previewRows.length} of {rows.length.toLocaleString()} rows.
            </p>
            <div className="max-h-[300px] overflow-auto rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-warm-50/60">
                  <tr>
                    {fields
                      .filter((f) =>
                        Object.values(mapping).includes(f.key),
                      )
                      .map((f) => (
                        <th
                          key={f.key}
                          className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      {fields
                        .filter((f) =>
                          Object.values(mapping).includes(f.key),
                        )
                        .map((f) => (
                          <td key={f.key} className="px-2 py-1.5">
                            {String(r[f.key] ?? '')}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3',
              result.failed === 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {result.failed === 0 ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold">
                Imported {result.inserted.toLocaleString()} of{' '}
                {(result.inserted + result.failed).toLocaleString()} rows
              </p>
              {result.failed > 0 && (
                <p className="text-[12.5px]">
                  {result.failed} failed.{' '}
                  {result.firstError && (
                    <span className="opacity-90">First error: {result.firstError}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            {step === 'done' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'map' && (
            <Button
              onClick={() => setStep('preview')}
              disabled={missingRequired.length > 0}
            >
              Continue
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>
                Back
              </Button>
              <Button onClick={runImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Importing…
                  </>
                ) : (
                  `Import ${rows.length.toLocaleString()} rows`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
