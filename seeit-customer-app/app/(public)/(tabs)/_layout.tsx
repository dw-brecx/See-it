import * as React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Bookmark, User, ScanLine } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tapLight } from '@/lib/utils/haptics';

const ACCENT = '#E85D3A';

function TabIcon({
  Icon,
  label,
  focused,
}: {
  Icon: any;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 56, gap: 2 }}>
      <Icon size={22} color={focused ? ACCENT : '#9CA3AF'} strokeWidth={focused ? 2.2 : 1.8} />
      <Text
        style={{
          fontSize: 10.5,
          color: focused ? ACCENT : '#9CA3AF',
          fontWeight: focused ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ScanCenterButton() {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
        shadowColor: ACCENT,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <ScanLine size={26} color="#FFFFFF" strokeWidth={2.4} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Reserve room for the home indicator on notched iPhones (insets.bottom),
  // plus an icon+label area. Without explicit paddingBottom, RN's
  // bottom-tabs renderer crops the label area into the safe-area zone.
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 12,
        },
        tabBarButton: (props) => (
          <Pressable
            {...(props as any)}
            onPress={(e) => {
              tapLight();
              props.onPress?.(e as any);
            }}
            style={({ pressed }) => [
              { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Search} label="Search" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: () => <ScanCenterButton />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Bookmark} label="Saved" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
