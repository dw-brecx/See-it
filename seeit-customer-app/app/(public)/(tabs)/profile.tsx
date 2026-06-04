import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, LogOut, Heart, Sparkles } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { tapLight } from '@/lib/utils/haptics';

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
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: destructive ? '#EF4444' : '#1A1A1A',
        }}
      >
        {label}
      </Text>
      {!destructive && <ChevronRight size={18} color="#9CA3AF" />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAFAF7',
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
            backgroundColor: '#FDF2EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Sparkles size={32} color="#E85D3A" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.4 }}>
          Make SeeIt yours
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Sign in to save spots, write reviews,{'\n'}and build order lists for the table.
        </Text>
        <Button label="Sign in" fullWidth onPress={() => router.push('/(auth)/signin')} />
        <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8} style={{ marginTop: 12 }}>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>
            New here? <Text style={{ color: '#E85D3A', fontWeight: '700' }}>Create an account</Text>
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAFAF7' }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, alignItems: 'center' }}>
        <Avatar url={user.avatar_url} name={user.name ?? user.email} size={88} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginTop: 12, letterSpacing: -0.4 }}>
          {user.name ?? user.email}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{user.email}</Text>
      </View>

      <View
        style={{
          marginTop: 24,
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
        <View style={{ height: 1, backgroundColor: '#F3F3EE' }} />
        <Row label="Allergies & dietary preferences" onPress={() => router.push('/(auth)/profile/allergies')} />
        <View style={{ height: 1, backgroundColor: '#F3F3EE' }} />
        <Row label="Edit profile" onPress={() => router.push('/(auth)/profile/edit')} />
        <View style={{ height: 1, backgroundColor: '#F3F3EE' }} />
        <Row label="Notifications" onPress={() => router.push('/(auth)/profile/notifications-settings')} />
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
        <View style={{ height: 1, backgroundColor: '#F3F3EE' }} />
        <Row label="Sign out" onPress={signOut} destructive />
      </View>
    </ScrollView>
  );
}
