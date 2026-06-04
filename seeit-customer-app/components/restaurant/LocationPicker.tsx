import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { Location } from '@/lib/types';
import { tapLight, selection } from '@/lib/utils/haptics';
import { formatDistance } from '@/lib/utils/formatDistance';
import { distanceMiles } from '@/lib/utils/distance';
import { useAppStore } from '@/lib/store';

type Props = {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function LocationPicker({ locations, selectedId, onSelect }: Props) {
  const [open, setOpen] = React.useState(false);
  const coords = useAppStore((s) => s.coords);
  const selected = locations.find((l) => l.id === selectedId) ?? locations[0];

  return (
    <>
      <Pressable
        onPress={() => {
          tapLight();
          setOpen(true);
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#F3F3EE',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          alignSelf: 'flex-start',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <MapPin size={14} color="#1A1A1A" />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>
          {selected?.name ?? 'Choose location'}
        </Text>
        <ChevronDown size={14} color="#1A1A1A" />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Choose a location">
        <View style={{ gap: 8 }}>
          {locations.map((l) => {
            const d =
              coords && l.latitude != null && l.longitude != null
                ? distanceMiles(coords.latitude, coords.longitude, l.latitude, l.longitude)
                : null;
            const isSelected = l.id === selectedId;
            return (
              <Pressable
                key={l.id}
                onPress={() => {
                  selection();
                  onSelect(l.id);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: isSelected ? '#FDF2EE' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isSelected ? '#E85D3A' : '#E5E5E0',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{l.name}</Text>
                  <Text style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>
                    {l.address}
                    {l.city ? `, ${l.city}` : ''}
                  </Text>
                </View>
                {d != null && (
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>
                    {formatDistance(d)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
