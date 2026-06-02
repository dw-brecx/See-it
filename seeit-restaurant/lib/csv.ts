/**
 * Minimal CSV utilities — no dependencies, RFC-4180-ish.
 *
 * Use {@link rowsToCsv} + {@link downloadCsv} on list pages for export.
 * Use {@link parseCsv} on the import wizard.
 */

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (Array.isArray(v)) s = v.join('; ');
  else if (typeof v === 'object') s = JSON.stringify(v);
  else s = String(v);
  // Quote if contains comma, quote, newline, or leading/trailing whitespace
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export type CsvColumn<T> = {
  /** Header label rendered in the CSV. */
  header: string;
  /** Pull the value out of a row (any shape). */
  accessor: (row: T) => unknown;
};

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(',');
  const bodyLines = rows.map((r) =>
    columns.map((c) => escapeCell(c.accessor(r))).join(','),
  );
  return [headerLine, ...bodyLines].join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  // Prepend BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV text into `{ headers, rows }`. Rows are arrays of strings,
 * indexed by header position. RFC-4180-ish: handles quoted fields with
 * embedded commas, newlines, and "" escaped quotes.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out: string[][] = [];
  let cur = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\r') {
        // skip — handled by \n
      } else if (ch === '\n') {
        row.push(cur);
        out.push(row);
        row = [];
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  // Last field (no trailing newline)
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    out.push(row);
  }

  const headers = out.shift() ?? [];
  const rows = out.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
  return { headers, rows };
}
