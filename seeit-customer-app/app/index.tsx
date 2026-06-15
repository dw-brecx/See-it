import * as React from 'react';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/lib/store';

/**
 * First-launch routing. If we've never shown the onboarding slides,
 * land there first; otherwise straight into the discovery feed.
 * The `onboardingSeen` flag is persisted via the zustand AsyncStorage
 * partialize so it survives app restarts.
 */
export default function Index() {
  const seen = useAppStore((s) => s.onboardingSeen);
  if (!seen) {
    return <Redirect href="/(public)/onboarding" />;
  }
  return <Redirect href="/(public)/(tabs)/home" />;
}
