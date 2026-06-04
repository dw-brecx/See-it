import * as React from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '../store';

type Status = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

/**
 * Get the device location once and stash it in the global store. Caller can
 * call `request()` to (re-)prompt. We don't watch live — the home feed
 * re-runs on tab focus, which is enough for v1.
 */
export function useDeviceLocation() {
  const setCoords = useAppStore((s) => s.setCoords);
  const coords = useAppStore((s) => s.coords);
  const [status, setStatus] = React.useState<Status>('idle');

  const request = React.useCallback(async () => {
    setStatus('requesting');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setStatus('granted');
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  }, [setCoords]);

  return { coords, status, request };
}
