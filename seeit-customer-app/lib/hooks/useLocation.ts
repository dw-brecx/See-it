import * as React from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../store';
import { debugLog } from '../utils/debugLog';

type Status = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

/**
 * Request foreground location, write to the global store, and clear any
 * stale manual city pick. The "clear manual" part is important — without
 * it the user can grant GPS but stay on Brooklyn coords from a previous
 * city pick, causing wrong distance labels on storefronts.
 */
export function useDeviceLocation() {
  const setCoords = useAppStore((s) => s.setCoords);
  const setManualLocation = useAppStore((s) => s.setManualLocation);
  const coords = useAppStore((s) => s.coords);
  const [status, setStatus] = React.useState<Status>('idle');

  const request = React.useCallback(async () => {
    debugLog('location.request', 'asking for foreground permission');
    setStatus('requesting');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      debugLog('location.request', 'permission result', { perm });
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      debugLog('location.request', 'gps fix', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      // Clear manual label so the home pill shows "Near you" + storefront
      // distance recomputes from actual coords, not yesterday's NYC pick.
      setManualLocation(null, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setStatus('granted');
      return true;
    } catch (e: any) {
      debugLog('location.request', 'error', { message: e?.message });
      setStatus('error');
      return false;
    }
  }, [setCoords, setManualLocation]);

  return { coords, status, request };
}
