'use client';

import * as React from 'react';
import { CheckCircle2, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket } from '@/lib/storage';
import { cn } from '@/lib/utils';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

type UploadResult = { url: string; file: File };

type Props = {
  bucket: string;
  /**
   * Optional prefix for storage paths, e.g. `items/<brandId>`. Combined
   * with `ownerId` by `uploadToBucket`.
   */
  prefix?: string;
  ownerId?: string;
  /**
   * Called when at least one file has finished uploading. Receives
   * `{ url, file }` pairs in the order they completed.
   */
  onUploaded: (results: UploadResult[]) => void;
  /** Optional max number of files per drop. Defaults to 20. */
  maxFiles?: number;
  className?: string;
  /** Optional label shown above the drop zone. */
  label?: string;
  /** Optional hint shown below the drop zone. */
  hint?: string;
  /** When true, the uploader is disabled — e.g. while a dish hasn't been picked. */
  disabled?: boolean;
};

type Progress = {
  id: string;
  name: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

/**
 * Drag-and-drop multi-file uploader for photos. Each selected file is
 * uploaded in parallel; the parent receives the final list once every
 * upload settles. Per-file progress dots are shown beneath the drop zone.
 */
export function PhotoUploader({
  bucket,
  prefix,
  ownerId,
  onUploaded,
  maxFiles = 20,
  className,
  label,
  hint,
  disabled,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [items, setItems] = React.useState<Progress[]>([]);
  const [busy, setBusy] = React.useState(false);

  async function handleFiles(files: FileList | File[] | null) {
    if (!files || disabled) return;
    const arr = Array.from(files).slice(0, maxFiles);
    const valid: File[] = [];
    for (const f of arr) {
      if (!ACCEPT.includes(f.type)) {
        toast.error(`${f.name} — unsupported file type`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is over 10 MB`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    const supabase = createClient();
    const initial: Progress[] = valid.map((f) => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      name: f.name,
      status: 'uploading',
    }));
    setItems((prev) => [...prev, ...initial]);
    setBusy(true);

    const results = await Promise.all(
      valid.map(async (file, i) => {
        try {
          const { publicUrl } = await uploadToBucket(supabase, bucket, file, {
            ownerId,
            prefix,
          });
          setItems((prev) =>
            prev.map((p) =>
              p.id === initial[i].id ? { ...p, status: 'done' as const } : p,
            ),
          );
          return { url: publicUrl, file };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          setItems((prev) =>
            prev.map((p) =>
              p.id === initial[i].id
                ? { ...p, status: 'error' as const, error: msg }
                : p,
            ),
          );
          return null;
        }
      }),
    );
    setBusy(false);

    const ok = results.filter((r): r is UploadResult => r !== null);
    if (ok.length > 0) {
      onUploaded(ok);
      toast.success(
        `${ok.length} photo${ok.length === 1 ? '' : 's'} uploaded`,
      );
    }
    // Auto-clear successful rows after a moment so the list doesn't pile up
    setTimeout(() => {
      setItems((prev) => prev.filter((p) => p.status !== 'done'));
    }, 1500);
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-warm-50/60 px-6 py-8 text-center transition-colors',
          'hover:border-terracotta-300 hover:bg-terracotta-50/40',
          dragOver
            ? 'border-terracotta-400 bg-terracotta-50'
            : 'border-border',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-7 w-7 text-muted-foreground" />
        )}
        <p className="text-sm font-semibold">
          {dragOver ? 'Drop to upload' : 'Drag photos here or click to choose'}
        </p>
        <p className="text-xs text-muted-foreground">
          {hint ?? 'PNG, JPEG, WebP, GIF · up to 10 MB each'}
        </p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1 rounded-md border border-border bg-card p-2 text-[12.5px]">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              {p.status === 'uploading' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {p.status === 'done' && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
              {p.status === 'error' && (
                <X className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.status === 'error' && (
                <span className="text-destructive">
                  {p.error ?? 'Failed'}
                </span>
              )}
              {p.status === 'uploading' && (
                <span className="text-muted-foreground">Uploading…</span>
              )}
              {p.status === 'done' && (
                <span className="text-emerald-600">Done</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
