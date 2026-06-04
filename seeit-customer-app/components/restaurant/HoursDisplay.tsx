import * as React from 'react';
import { View, Text } from 'react-native';
import { WeekHours } from '@/lib/types';
import { WEEKDAYS } from '@/lib/utils/constants';
import { formatDayHours } from '@/lib/utils/hours';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function HoursDisplay({ hours }: { hours: WeekHours | null | undefined }) {
  if (!hours) {
    return <Text style={{ color: '#6B7280', fontSize: 14 }}>Hours not provided</Text>;
  }
  const todayIdx = new Date().getDay(); // 0 = Sun
  return (
    <View style={{ gap: 8 }}>
      {WEEKDAYS.map(({ key, label }) => {
        const day = hours[key as keyof WeekHours];
        const isToday = DAY_KEYS[todayIdx] === key;
        return (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: isToday ? '#1A1A1A' : '#6B7280',
                fontWeight: isToday ? '700' : '500',
                width: 100,
              }}
            >
              {label}
              {isToday ? '  · Today' : ''}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isToday ? '#1A1A1A' : '#1A1A1A',
                fontWeight: isToday ? '700' : '500',
                flex: 1,
                textAlign: 'right',
              }}
            >
              {formatDayHours(day)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
