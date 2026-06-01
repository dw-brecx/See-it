/**
 * Centralised lists used across admin forms.
 * Edit here once, everywhere updates.
 */

export const PRIMARY_CUISINES = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Sushi',
  'Thai',
  'Vietnamese',
  'Korean',
  'Indian',
  'Mediterranean',
  'Middle Eastern',
  'Greek',
  'French',
  'Spanish',
  'Latin American',
  'Caribbean',
  'African',
  'Ethiopian',
  'BBQ',
  'Steakhouse',
  'Seafood',
  'Pizza',
  'Burgers',
  'Sandwiches/Deli',
  'Bakery',
  'Cafe/Coffee',
  'Breakfast/Brunch',
  'Dessert/Ice Cream',
  'Bar/Pub',
  'Fast Food',
  'Fine Dining',
  'Food Truck',
  'Buffet',
  'Fusion',
] as const;

export const DIETARY_TAGS = [
  'Kosher',
  'Halal',
  'Vegan',
  'Vegetarian',
  'Gluten-Free options',
  'Dairy-Free options',
  'Nut-Free options',
  'Organic',
  'Farm-to-Table',
  'Locally Sourced',
] as const;

export const STYLE_TAGS = [
  'Sit-down',
  'Counter service',
  'Takeout',
  'Delivery',
  'Drive-thru',
  'Outdoor seating',
  'Bar seating',
  'Family-friendly',
  'Romantic',
  'Casual',
  'Upscale',
  'Late night',
] as const;

export const ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Dairy',
  'Eggs',
  'Wheat/Gluten',
  'Soy',
  'Sesame',
] as const;

export const MOOD_TAGS = [
  'Spicy',
  'Instagrammable',
  'Comfort food',
  'Date night',
  'Generous portion',
  'Worth it',
  'Great value',
  'Authentic',
  'Quick bite',
  'Fresh',
  'Crispy',
  'Rich',
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: 'inactive', label: 'Inactive' },
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceled', label: 'Canceled' },
] as const;

export const USER_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'restaurant_owner', label: 'Restaurant owner' },
  { value: 'admin', label: 'Admin' },
] as const;

export const KOSHER_AGENCIES = [
  { value: 'OU', label: 'OU (Orthodox Union)' },
  { value: 'OK', label: 'OK Kosher' },
  { value: 'Star-K', label: 'Star-K' },
  { value: 'Kof-K', label: 'Kof-K' },
  { value: 'CRC', label: 'CRC (Central Rabbinical Congress)' },
  { value: 'Chicago Rabbinical Council', label: 'Chicago Rabbinical Council' },
  { value: 'Vaad HaRabbonim', label: 'Vaad HaRabbonim' },
  { value: 'Local Vaad', label: 'Local Vaad' },
  { value: 'Other', label: 'Other' },
] as const;

export const KOSHER_TYPES = [
  { value: 'meat', label: 'Meat (Fleishig)' },
  { value: 'dairy', label: 'Dairy (Milchig)' },
  { value: 'pareve', label: 'Pareve' },
  { value: 'mixed', label: 'Mixed' },
] as const;

export const PORTION_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'fair', label: 'Fair' },
  { value: 'generous', label: 'Generous' },
] as const;

/** Storage bucket names — must match what's configured in Supabase. */
export const STORAGE = {
  RESTAURANT_PHOTOS: 'restaurant-photos',
  MENU_PHOTOS: 'menu-photos',
  REVIEW_PHOTOS: 'review-photos',
  KOSHER_CERTS: 'kosher-certs',
  AVATARS: 'avatars',
} as const;

/** Days of the week in display order, used by hours editor. */
export const WEEKDAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]['key'];

export type DayHours = {
  is_closed: boolean;
  open?: string; // "17:00"
  close?: string; // "22:00"
};

export type WeekHours = Record<WeekdayKey, DayHours>;

export const DEFAULT_HOURS: WeekHours = {
  mon: { is_closed: true },
  tue: { is_closed: false, open: '17:00', close: '22:00' },
  wed: { is_closed: false, open: '17:00', close: '22:00' },
  thu: { is_closed: false, open: '17:00', close: '22:00' },
  fri: { is_closed: false, open: '17:00', close: '23:00' },
  sat: { is_closed: false, open: '11:30', close: '23:00' },
  sun: { is_closed: false, open: '11:30', close: '21:00' },
};
