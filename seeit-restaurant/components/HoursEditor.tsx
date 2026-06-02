'use client';

import { Clock, NotebookPen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WEEKDAYS, type WeekHours, type WeekdayKey, type DayHours } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Props = {
  value: WeekHours;
  onChange: (next: WeekHours) => void;
};

/** Suggestions for the open-time note field. */
const OPEN_NOTE_SUGGESTIONS = [
  'After Shabbos',
  'After candle lighting',
  '1 hour after sunset',
  'By appointment',
];

/** Suggestions for the close-time note field. */
const CLOSE_NOTE_SUGGESTIONS = [
  'Until sunset',
  '1 hour before Shabbos',
  'Until candle lighting',
  'Until last customer',
];

export function HoursEditor({ value, onChange }: Props) {
  function update(day: WeekdayKey, patch: Partial<DayHours>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  return (
    <div className="rounded-md border border-border">
      {WEEKDAYS.map(({ key, label }, i) => {
        const day = value[key] ?? { is_closed: true };
        const isOpen = !day.is_closed;
        const last = i === WEEKDAYS.length - 1;
        return (
          <div
            key={key}
            className={cn(
              'flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:gap-3',
              !last && 'border-b border-border',
            )}
          >
            <div className="flex shrink-0 items-center gap-3 sm:w-32 sm:pt-2">
              <Switch
                checked={isOpen}
                onCheckedChange={(checked) =>
                  update(key, {
                    is_closed: !checked,
                    open: !checked ? day.open : day.open ?? '17:00',
                    close: !checked ? day.close : day.close ?? '22:00',
                  })
                }
              />
              <span className="text-sm font-medium">{label}</span>
            </div>

            {isOpen ? (
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
                <SideField
                  ariaLabel={`${label} opening`}
                  time={day.open}
                  note={day.open_note}
                  suggestions={OPEN_NOTE_SUGGESTIONS}
                  timePlaceholder="17:00"
                  notePlaceholder="e.g. After Shabbos"
                  onChange={(patch) => update(key, patch)}
                  field="open"
                />
                <span className="hidden pt-2.5 text-xs text-muted-foreground sm:inline">
                  to
                </span>
                <SideField
                  ariaLabel={`${label} closing`}
                  time={day.close}
                  note={day.close_note}
                  suggestions={CLOSE_NOTE_SUGGESTIONS}
                  timePlaceholder="22:00"
                  notePlaceholder="e.g. Until sunset"
                  onChange={(patch) => update(key, patch)}
                  field="close"
                />
              </div>
            ) : (
              <span className="pt-2 text-sm italic text-muted-foreground">
                Closed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * One side (open OR close) of a day — small segmented control to pick
 * "Time" or "Note" mode, then the corresponding input. Notes get a
 * suggestion row underneath for common Jewish-calendar phrasing.
 */
function SideField({
  ariaLabel,
  time,
  note,
  suggestions,
  timePlaceholder,
  notePlaceholder,
  onChange,
  field,
}: {
  ariaLabel: string;
  time: string | undefined;
  note: string | undefined;
  suggestions: string[];
  timePlaceholder: string;
  notePlaceholder: string;
  onChange: (patch: Partial<DayHours>) => void;
  field: 'open' | 'close';
}) {
  const noteField: 'open_note' | 'close_note' =
    field === 'open' ? 'open_note' : 'close_note';
  // Note mode is active whenever the note property is *defined* — even an
  // empty string counts, otherwise toggling Note→type→delete would silently
  // flip back to Time mode and surprise the user.
  const mode: 'time' | 'note' = note !== undefined && note !== null ? 'note' : 'time';

  function pickTime() {
    // Drop the note key entirely so mode flips to 'time' on next render.
    onChange({ [noteField]: undefined, [field]: time ?? '' } as any);
  }
  function pickNote() {
    // If user already had a note, keep it; otherwise pre-fill with the first
    // suggestion so they see something useful and the textbox isn't blank.
    const next = note ?? suggestions[0] ?? '';
    onChange({ [noteField]: next } as any);
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className="flex items-stretch gap-2">
        <div
          role="tablist"
          aria-label={`${ariaLabel} mode`}
          className="inline-flex rounded-md border border-border bg-warm-50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'time'}
            onClick={pickTime}
            title="Use a clock time"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors',
              mode === 'time' && 'bg-card text-foreground shadow-xs',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'note'}
            onClick={pickNote}
            title="Write a custom note"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors',
              mode === 'note' && 'bg-card text-foreground shadow-xs',
            )}
          >
            <NotebookPen className="h-3.5 w-3.5" />
          </button>
        </div>

        {mode === 'time' ? (
          <Input
            type="time"
            aria-label={ariaLabel}
            placeholder={timePlaceholder}
            value={time ?? ''}
            onChange={(e) => onChange({ [field]: e.target.value } as any)}
            className="w-32 sm:w-36"
          />
        ) : (
          <Input
            type="text"
            aria-label={ariaLabel}
            placeholder={notePlaceholder}
            value={note ?? ''}
            onChange={(e) => onChange({ [noteField]: e.target.value } as any)}
            maxLength={60}
            className="flex-1"
          />
        )}
      </div>

      {mode === 'note' && (
        <div className="flex flex-wrap gap-1 pl-[68px]">
          {suggestions.map((s) => {
            const active = note === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ [noteField]: s } as any)}
                className={cn(
                  'rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium transition-colors',
                  active
                    ? 'border-terracotta-200 bg-terracotta-50 text-terracotta-700'
                    : 'border-border bg-card text-muted-foreground hover:border-warm-300 hover:text-foreground',
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
