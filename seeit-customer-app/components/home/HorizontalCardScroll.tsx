import * as React from 'react';
import { ScrollView, View } from 'react-native';

export function HorizontalCardScroll({
  children,
  gap = 14,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap }}
    >
      {children}
    </ScrollView>
  );
}
