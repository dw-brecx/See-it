'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WEEKDAYS, type WeekHours, type WeekdayKey, type DayHours } from '@/lib/constants';

type Props = {
  value: WeekHours;
  onChange: (next: WeekHours) => void;
};

export function HoursEditor({ value, onChange }: Props) {
  function update(day: WeekdayKey, patch: Partial<DayHours>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  return (
    <div className="rounded-md border border-border">
      {WEEKDAYS.map(({ key, label }, i) => {
        const day = value[key] ?? { is_closed: true };
        const open = !day.is_closed;
        return (
          <div
            key={key}
            className={`flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 ${
              i !== WEEKDAYS.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className="flex items-center gap-3 sm:w-32">
              <Switch
                checked={open}
                onCheckedChange={(checked) =>
                  update(key, {
                    is_closed: !checked,
                    open: open ? day.open : day.open ?? '17:00',
                    close: open ? day.close : day.close ?? '22:00',
                  })
                }
              />
              <span className="text-sm font-medium">{label}</span>
            </div>
            {open ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={day.open ?? ''}
                  onChange={(e) => update(key, { open: e.target.value })}
                  className="w-32"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={day.close ?? ''}
                  onChange={(e) => update(key, { close: e.target.value })}
                  className="w-32"
                />
              </div>
            ) : (
              <span className="text-sm italic text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
