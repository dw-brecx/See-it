/** Preset cities for the manual location picker. */
export type City = { id: string; label: string; latitude: number; longitude: number };

export const PRESET_CITIES: City[] = [
  { id: 'nyc', label: 'New York, NY', latitude: 40.7128, longitude: -74.006 },
  { id: 'brooklyn', label: 'Brooklyn, NY', latitude: 40.6782, longitude: -73.9442 },
  { id: 'monsey', label: 'Monsey, NY', latitude: 41.1117, longitude: -74.0687 },
  { id: 'lakewood', label: 'Lakewood, NJ', latitude: 40.0979, longitude: -74.2179 },
  { id: 'miami', label: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
  { id: 'la', label: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
  { id: 'chicago', label: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
  { id: 'sf', label: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { id: 'london', label: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  { id: 'tlv', label: 'Tel Aviv, IL', latitude: 32.0853, longitude: 34.7818 },
];
