import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { tapLight } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';
import { supabase } from '@/lib/supabase/client';

function Row({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tapLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: destructive ? colors.danger : colors.text,
        }}
      >
        {label}
      </Text>
      {!destructive && <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 64 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.4 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontWeight: '700',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  // Real stat counts (head: true returns just the count, no rows pulled).
  const stats = useQuery({
    queryKey: ['profile.stats', user?.id],
    queryFn: async () => {
      if (!user) return { reviews: 0, photos: 0, saved: 0 };
      const [r, p, s] = await Promise.all([
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('menu_item_photos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('saved_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      return {
        reviews: r.count ?? 0,
        photos: p.count ?? 0,
        saved: s.count ?? 0,
      };
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Sparkles size={32} color={colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.4,
          }}
        >
          Make SeeIt yours
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Sign in to save spots, write reviews,{'\n'}and build order lists for the table.
        </Text>
        <Button label="Sign in" fullWidth size="lg" onPress={() => router.push('/(auth)/signin')} />
        <Pressable
          onPress={() => router.push('/(auth)/signup')}
          hitSlop={8}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            New here?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              Create an account
            </Text>
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
      >
        <Avatar url={user.avatar_url} name={user.name ?? user.email} size={88} />
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: colors.text,
            marginTop: 12,
            letterSpacing: -0.4,
          }}
        >
          {user.name ?? user.email}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
          {user.email}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: colors.surface,
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 16,
            marginTop: 20,
            alignSelf: 'stretch',
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Stat value={stats.data?.reviews ?? 0} label="Reviews" />
          <View style={{ width: 1, height: 28, backgroundColor: colors.borderLight }} />
          <Stat value={stats.data?.photos ?? 0} label="Photos" />
          <View style={{ width: 1, height: 28, backgroundColor: colors.borderLight }} />
          <Stat value={stats.data?.saved ?? 0} label="Saved" />
        </View>
      </View>

      <View
        style={{
          marginTop: 20,
          marginHorizontal: 20,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <Row label="My reviews" onPress={() => router.push('/(auth)/profile/my-reviews')} />
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
        <Row
          label="Allergies & dietary preferences"
          onPress={() => router.push('/(auth)/profile/allergies')}
        />
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
        <Row label="Edit profile" onPress={() => router.push('/(auth)/profile/edit')} />
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
        <Row
          label="Notifications"
          onPress={() => router.push('/(auth)/profile/notifications-settings')}
        />
      </View>

      <View
        style={{
          marginTop: 16,
          marginHorizontal: 20,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <Row label="About SeeIt" onPress={() => router.push('/(auth)/profile/about')} />
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
        <Row label="Sign out" onPress={signOut} destructive />
      </View>
    </ScrollView>
  );
}
