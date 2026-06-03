'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { UpgradeRequired } from '@/components/UpgradeRequired';
import { getPlan, type PlanSlug } from '@/lib/plans';
import { downloadCsv, parseCsv, rowsToCsv } from '@/lib/csv';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ParsedRow = {
  raw: string[];
  data: {
    name: string;
    description: string | null;
    price: number | null;
    category: string;
    dietary_tags: string[];
    is_visible: boolean;
  };
  errors: string[];
};

const HEADERS = ['Name', 'Description', 'Price', 'Category', 'Dietary tags', 'Visible'];

export function BulkUploadFlow() {
  const router = useRouter();
  const { currentLocationId, currentLocation, currentBrandId, currentBrand } = useBrand();
  const isAll = currentLocationId === ALL_LOCATIONS;
  const locationId = isAll ? null : currentLocationId;
  const plan = getPlan(currentBrand?.plan);

  // Hooks must all come before any conditional return.
  const [step, setStep] = React.useState<'upload' | 'preview' | 'done'>('upload');
  const [parsed, setParsed] = React.useState<ParsedRow[]>([]);
  const [filename, setFilename] = React.useState<string>('');
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{
    inserted: number;
    failed: number;
    firstError?: string;
  } | null>(null);
  const submittingRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  // Plan gate: bulk upload only on Pro / Premium
  if (currentBrandId && !plan.bulkUpload) {
    return (
      <UpgradeBlockedCard
        currentPlan={(currentBrand?.plan ?? 'free') as PlanSlug}
      />
    );
  }

  if (!currentBrandId) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={FileSpreadsheet}
          title="Loading store…"
          description="One moment while we load your store data."
        />
      </div>
    );
  }

  if (isAll || !locationId || !currentLocation) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={MapPin}
          title="Pick a specific location"
          description="Bulk uploads target one location at a time. Use the location switcher in the sidebar."
        />
      </div>
    );
  }

  function downloadTemplate() {
    const sample = [
      {
        Name: 'Truffle Tagliatelle',
        Description: 'House pasta, black truffle, parmigiano',
        Price: '26.00',
        Category: 'Pasta',
        'Dietary tags': 'Vegetarian',
        Visible: 'yes',
      },
      {
        Name: 'Caesar Salad',
        Description: 'Romaine, parmesan, croutons',
        Price: '14.00',
        Category: 'Salads',
        'Dietary tags': 'Vegetarian; Gluten-Free options',
        Visible: 'yes',
      },
    ];
    const csv = rowsToCsv(sample, [
      { header: 'Name', accessor: (r) => r.Name },
      { header: 'Description', accessor: (r) => r.Description },
      { header: 'Price', accessor: (r) => r.Price },
      { header: 'Category', accessor: (r) => r.Category },
      { header: 'Dietary tags', accessor: (r) => r['Dietary tags'] },
      { header: 'Visible', accessor: (r) => r.Visible },
    ]);
    downloadCsv('seeit-menu-template.csv', csv);
  }

  function parseFile(file: File) {
    setFilename(file.name);
    file
      .text()
      .then((text) => {
        const { headers, rows } = parseCsv(text);
        if (headers.length === 0 || rows.length === 0) {
          toast.error('That file looks empty');
          return;
        }
        // Build column index by header (case-insensitive). Support both the
        // canonical labels we emit and a couple of common aliases.
        const idx = (...names: string[]) => {
          const lower = names.map((n) => n.toLowerCase());
          return headers.findIndex((h) =>
            lower.includes(h.trim().toLowerCase()),
          );
        };
        const cName = idx('Name');
        const cDesc = idx('Description');
        const cPrice = idx('Price');
        const cCat = idx('Category');
        const cTags = idx('Dietary tags', 'Dietary');
        const cVis = idx('Visible');

        if (cName === -1) {
          toast.error('CSV must include a "Name" column');
          return;
        }

        const out: ParsedRow[] = rows.map((cells) => {
          const errors: string[] = [];
          const name = (cells[cName] ?? '').trim();
          if (!name) errors.push('Missing name');

          let price: number | null = null;
          if (cPrice !== -1) {
            const raw = (cells[cPrice] ?? '').trim();
            if (raw) {
              const cleaned = raw.replace(/[^0-9.]/g, '');
              const n = Number(cleaned);
              if (Number.isNaN(n)) errors.push('Invalid price');
              else price = n;
            }
          }

          const description =
            cDesc !== -1 ? (cells[cDesc] ?? '').trim() || null : null;
          const category =
            cCat !== -1 ? (cells[cCat] ?? '').trim() : '';
          const dietary_tags =
            cTags !== -1
              ? (cells[cTags] ?? '')
                  .split(/[;,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];
          const visRaw =
            cVis !== -1 ? (cells[cVis] ?? '').trim().toLowerCase() : 'yes';
          const is_visible = !/^(n|no|false|0|hidden)$/.test(visRaw);

          return {
            raw: cells,
            data: { name, description, price, category, dietary_tags, is_visible },
            errors,
          };
        });

        setParsed(out);
        setStep('preview');
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : 'Failed to read file'),
      );
  }

  async function runImport() {
    if (submittingRef.current) return;
    // Pin the location id so the closure has a non-null string type.
    const locId = locationId;
    if (!locId) return;
    submittingRef.current = true;
    setImporting(true);
    const supabase = createClient();
    try {
      // Pull existing categories to dedupe
      const { data: existingCats } = await supabase
        .from('menu_categories')
        .select('id, name, display_order')
        .eq('location_id', locId);
      const catByName = new Map<string, string>();
      let nextOrder = 0;
      for (const c of existingCats ?? []) {
        catByName.set(c.name.toLowerCase().trim(), c.id);
        nextOrder = Math.max(nextOrder, c.display_order ?? 0);
      }

      const valid = parsed.filter((p) => p.errors.length === 0);
      let inserted = 0;
      let failed = 0;
      let firstError: string | undefined;

      for (const row of valid) {
        let categoryId: string | null = null;
        const catName = row.data.category.toLowerCase().trim();
        if (catName) {
          categoryId = catByName.get(catName) ?? null;
          if (!categoryId) {
            nextOrder++;
            const { data: newCat, error: catErr } = await supabase
              .from('menu_categories')
              .insert({
                location_id: locId,
                name: row.data.category,
                display_order: nextOrder,
              })
              .select('id')
              .single();
            if (catErr || !newCat) {
              failed++;
              if (!firstError)
                firstError = catErr?.message ?? 'category create failed';
              continue;
            }
            categoryId = newCat.id;
            catByName.set(catName, categoryId);
          }
        }

        const { error } = await supabase.from('menu_items').insert({
          location_id: locId,
          category_id: categoryId,
          name: row.data.name,
          description: row.data.description,
          price: row.data.price,
          dietary_tags:
            row.data.dietary_tags.length > 0 ? row.data.dietary_tags : null,
          is_visible: row.data.is_visible,
        });
        if (error) {
          failed++;
          if (!firstError) firstError = error.message;
        } else {
          inserted++;
        }
      }

      setResult({ inserted, failed, firstError });
      setStep('done');
      router.refresh();
    } finally {
      submittingRef.current = false;
      setImporting(false);
    }
  }

  const validCount = parsed.filter((p) => p.errors.length === 0).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
        <Button variant="ghost" asChild size="sm" className="-ml-2">
          <Link href="/dashboard/menu">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
          </Link>
        </Button>
        <span aria-hidden>·</span>
        <span>
          Importing into{' '}
          <span className="font-semibold text-foreground">
            {currentLocation.name}
          </span>
          {currentLocation.city ? ` · ${currentLocation.city}` : ''}
        </span>
      </div>

      <Stepper step={step} />

      {step === 'upload' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Step 1 — Download the template</p>
                <p className="text-[12.5px] text-muted-foreground">
                  Headers: {HEADERS.join(', ')}. Dietary tags can be
                  semicolon-separated.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" /> Download CSV template
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 font-semibold">Step 2 — Upload your CSV</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) parseFile(file);
              }}
              className={cn(
                'flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-warm-50/60 px-6 py-8 text-center transition-colors',
                'hover:border-terracotta-300 hover:bg-terracotta-50/40',
                dragOver
                  ? 'border-terracotta-400 bg-terracotta-50'
                  : 'border-border',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseFile(f);
                  e.target.value = '';
                }}
              />
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-semibold">
                Drag your CSV here or click to choose
              </p>
              <p className="text-[12px] text-muted-foreground">
                First row should contain the column headers.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">{filename}</p>
              <Badge variant="success">{validCount} valid</Badge>
              {invalidCount > 0 && (
                <Badge variant="warning">{invalidCount} invalid</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setParsed([]);
                setFilename('');
                setStep('upload');
              }}
            >
              Choose a different file
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead className="bg-warm-50/60">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                    Status
                  </th>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[11px] text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.map((p, i) => (
                  <tr
                    key={i}
                    className={cn(p.errors.length > 0 && 'bg-amber-50/40')}
                  >
                    <td className="whitespace-nowrap px-3 py-2">
                      {p.errors.length === 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Valid
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1" title={p.errors.join('; ')}>
                          <AlertCircle className="h-3 w-3" />{' '}
                          {p.errors[0] ?? 'Invalid'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">{p.data.name || '—'}</td>
                    <td className="max-w-[260px] truncate px-3 py-2 text-muted-foreground">
                      {p.data.description ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {p.data.price != null
                        ? `$${p.data.price.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2">{p.data.category || '—'}</td>
                    <td className="px-3 py-2">
                      {p.data.dietary_tags.length > 0
                        ? p.data.dietary_tags.join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {p.data.is_visible ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('upload')}
              disabled={importing}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={runImport}
              disabled={importing || validCount === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                </>
              ) : (
                `Import ${validCount} item${validCount === 1 ? '' : 's'}`
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-4">
          <div
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3',
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
                {(result.inserted + result.failed).toLocaleString()} items
              </p>
              {result.failed > 0 && (
                <p className="text-[12.5px]">
                  {result.failed} failed.{' '}
                  {result.firstError && (
                    <span className="opacity-90">
                      First error: {result.firstError}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/menu/bulk-upload">Upload another</Link>
            </Button>
            <Button
              onClick={() => {
                router.push('/dashboard/menu');
                router.refresh();
              }}
            >
              Back to menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: 'upload' | 'preview' | 'done' }) {
  const stepIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;
  const labels = ['Template & upload', 'Preview', 'Done'];
  return (
    <ol className="flex items-center gap-2 text-[12.5px]">
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <li
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1',
              i === stepIndex
                ? 'bg-terracotta-50 text-terracotta-700'
                : i < stepIndex
                  ? 'text-emerald-700'
                  : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border text-[10.5px] font-semibold',
                i === stepIndex
                  ? 'border-terracotta-300 bg-terracotta-100 text-terracotta-700'
                  : i < stepIndex
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-card',
              )}
            >
              {i + 1}
            </span>
            <span className="font-semibold">{label}</span>
          </li>
          {i < labels.length - 1 && (
            <span className="h-px w-4 bg-border" aria-hidden />
          )}
        </React.Fragment>
      ))}
    </ol>
  );
}

function UpgradeBlockedCard({ currentPlan }: { currentPlan: PlanSlug }) {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={FileSpreadsheet}
          title="Bulk upload is a Pro feature"
          description="Upgrade your plan to import an entire menu from CSV in one shot."
          action={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-terracotta-600"
            >
              View plans
            </button>
          }
        />
      </div>
      <UpgradeRequired
        open={open}
        onOpenChange={setOpen}
        currentPlan={currentPlan}
        feature="bulkUpload"
      />
    </>
  );
}

// keep Skeleton imported in case the table grows to need it later
void Skeleton;
