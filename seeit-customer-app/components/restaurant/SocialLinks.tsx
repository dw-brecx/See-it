import * as React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { Instagram, Facebook, Globe } from 'lucide-react-native';
import { tapLight } from '@/lib/utils/haptics';

type Brand = {
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
};

export function SocialLinks({ brand }: { brand: Brand }) {
  const links: { url: string; icon: React.ReactNode; key: string }[] = [];
  if (brand.website_url)
    links.push({ url: brand.website_url, key: 'web', icon: <Globe size={20} color="#1A1A1A" /> });
  if (brand.instagram_url)
    links.push({ url: brand.instagram_url, key: 'ig', icon: <Instagram size={20} color="#1A1A1A" /> });
  if (brand.facebook_url)
    links.push({ url: brand.facebook_url, key: 'fb', icon: <Facebook size={20} color="#1A1A1A" /> });
  // TikTok / X don't have first-class Lucide icons — use text glyphs
  // (or swap to @expo/vector-icons later if you want brand-accurate marks).

  if (links.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      {links.map((l) => (
        <Pressable
          key={l.key}
          onPress={() => {
            tapLight();
            Linking.openURL(l.url).catch(() => {});
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {l.icon}
        </Pressable>
      ))}
    </View>
  );
}
