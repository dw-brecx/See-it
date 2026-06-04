import * as React from 'react';
import { View, Text } from 'react-native';
import { StarRating } from '../ui/StarRating';
import { Review } from '@/lib/types';

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;
  const avg = total === 1 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 20,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 80 }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: '#1A1A1A' }}>
          {avg.toFixed(1)}
        </Text>
        <StarRating value={avg} size={14} />
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{total} reviews</Text>
      </View>
      <View style={{ flex: 1, gap: 6, justifyContent: 'center' }}>
        {counts.map(({ star, count }) => (
          <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', width: 14 }}>{star}</Text>
            <View
              style={{
                flex: 1,
                height: 6,
                backgroundColor: '#F3F3EE',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(count / total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#F59E0B',
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280', width: 22, textAlign: 'right' }}>
              {count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
