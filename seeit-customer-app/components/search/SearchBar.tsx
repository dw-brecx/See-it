import * as React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search restaurants or dishes',
  autoFocus,
  onSubmit,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F3F3EE',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
      }}
    >
      <Search size={18} color="#6B7280" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        style={{ flex: 1, fontSize: 15, color: '#1A1A1A', padding: 0 }}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <X size={18} color="#6B7280" />
        </Pressable>
      )}
    </View>
  );
}
