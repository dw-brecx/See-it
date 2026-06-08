import * as React from 'react';
import { View, Pressable, Text, Linking } from 'react-native';
import { Globe, Link2 } from 'lucide-react-native';
import { tapLight } from '@/lib/utils/haptics';

type Brand = {
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
};

// Lucide v1 removed brand icons (Instagram/Facebook/etc.) for trademark
// reasons. We render labelled pills instead — clearer anyway since users
// don't always recognise mono icons.
const NETWORKS: { key: keyof Brand; label: string }[] = [
  { key: 'website_url', label: 'Website' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'tiktok_url', label: 'TikTok' },
  { key: 'facebook_url', label: 'Facebook' },
  { key: 'x_url', label: 'X' },
];

export function SocialLinks({ brand }: { brand: Brand }) {
  const links = NETWORKS.filter((n) => brand[n.key]);
  if (links.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {links.map((n) => (
        <Pressable
          key={n.key}
          onPress={() => {
            tapLight();
            Linking.openURL(brand[n.key]!).catch(() => {});
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: '#F3F3EE',
            borderRadius: 999,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {n.key === 'website_url' ? (
            <Globe size={16} color="#1A1A1A" />
          ) : (
            <Link2 size={16} color="#1A1A1A" />
          )}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>{n.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
