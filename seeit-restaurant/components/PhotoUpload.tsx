'use client';

import * as React from 'react';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket } from '@/lib/storage';
import { cn } from '@/lib/utils';

type SingleProps = {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  multiple?: false;
  label?: string;
  ownerId?: string;
  prefix?: string;
  className?: string;
};

type MultiProps = {
  bucket: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple: true;
  label?: string;
  ownerId?: string;
  prefix?: string;
  className?: string;
};

type Props = SingleProps | MultiProps;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

export function PhotoUpload(props: Props) {
  const { bucket, label, className, ownerId, prefix } = props;
  const [uploading, setUploading] = React.useState(false);

  const isMulti = props.multiple === true;
  const urls: string[] = isMulti ? props.value : props.value ? [props.value] : [];

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const toUpload = Array.from(files);

    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is over 10 MB and was skipped`);
          continue;
        }
        const { publicUrl } = await uploadToBucket(supabase, bucket, file, {
          ownerId,
          prefix,
        });
        uploaded.push(publicUrl);
      }
      if (uploaded.length === 0) return;

      if (isMulti) {
        (props as MultiProps).onChange([...(props as MultiProps).value, ...uploaded]);
      } else {
        // Single — only keep last uploaded
        (props as SingleProps).onChange(uploaded[uploaded.length - 1]);
      }
      toast.success(`${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    if (isMulti) {
      (props as MultiProps).onChange(
        (props as MultiProps).value.filter((u) => u !== url),
      );
    } else {
      (props as SingleProps).onChange(null);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <p className="text-sm font-medium">{label}</p>
      )}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div
              key={url}
              className="group relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        className={cn(
          'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent w-full sm:w-auto',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <input
          type="file"
          accept={ACCEPT}
          multiple={isMulti}
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : urls.length === 0 ? (
          <>
            <Upload className="h-4 w-4" /> {isMulti ? 'Upload photos' : 'Upload photo'}
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" /> {isMulti ? 'Add more' : 'Replace photo'}
          </>
        )}
      </label>
      <p className="text-xs text-muted-foreground">
        PNG, JPEG, WebP, or GIF · max 10 MB each
      </p>
    </div>
  );
}
