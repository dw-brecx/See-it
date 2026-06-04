import * as React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';
import { ReviewWithAuthor } from '@/lib/api/reviews';

const PORTION_LABELS: Record<string, string> = {
  small: 'Small portion',
  right: 'Just right',
  huge: 'Generous portion',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar url={review.reviewer_avatar_url} name={review.reviewer_name} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: '#1A1A1A', fontSize: 14 }}>
            {review.reviewer_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StarRating value={review.rating} size={12} />
            <Text style={{ fontSize: 12, color: '#6B7280' }}>· {timeAgo(review.created_at)}</Text>
          </View>
        </View>
      </View>

      {review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
            {review.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.photo_url }}
                style={{ width: 140, height: 140, borderRadius: 12 }}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {review.text && (
        <Text style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 20 }}>{review.text}</Text>
      )}

      {(review.portion_size || review.worth_the_price != null || (review.mood_tags ?? []).length > 0) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {review.portion_size ? (
            <Badge label={PORTION_LABELS[review.portion_size] ?? review.portion_size} />
          ) : null}
          {review.worth_the_price === true ? (
            <Badge label="Worth the price 👍" variant="success" />
          ) : review.worth_the_price === false ? (
            <Badge label="Not worth it" variant="warning" />
          ) : null}
          {(review.mood_tags ?? []).map((m) => (
            <Badge key={m} label={m} />
          ))}
        </View>
      )}

      {review.reply && (
        <View
          style={{
            backgroundColor: '#FDF2EE',
            borderLeftWidth: 3,
            borderLeftColor: '#E85D3A',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#E85D3A' }}>
            Response from the owner
          </Text>
          <Text style={{ fontSize: 13, color: '#1A1A1A', marginTop: 4, lineHeight: 18 }}>
            {review.reply.text}
          </Text>
        </View>
      )}
    </View>
  );
}
