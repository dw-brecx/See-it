import * as React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export function Input({ label, error, hint, leadingIcon, trailingIcon, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>{label}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F3EE',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: error ? 1 : 0,
          borderColor: error ? '#EF4444' : 'transparent',
          gap: 8,
        }}
      >
        {leadingIcon}
        <TextInput
          {...rest}
          placeholderTextColor="#9CA3AF"
          style={[
            {
              flex: 1,
              fontSize: 15,
              color: '#1A1A1A',
              padding: 0,
            },
            style,
          ]}
        />
        {trailingIcon}
      </View>
      {(error ?? hint) && (
        <Text style={{ fontSize: 12, color: error ? '#EF4444' : '#6B7280' }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
