import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { success, error as errorHaptic } from '@/lib/utils/haptics';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refresh } = useAuth();
  const [name, setName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ name: name || null, phone: phone || null })
      .eq('id', user.id);
    if (error) {
      errorHaptic();
    } else {
      success();
      await refresh();
      router.back();
    }
    setSaving(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="#1A1A1A" />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Edit profile</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <Avatar url={user?.avatar_url} name={name || user?.email} size={88} />
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 12 }}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button label="Save changes" fullWidth onPress={save} loading={saving} />
      </View>
    </View>
  );
}
