/**
 * Centralised lists used across admin forms.
 * Edit here once, everywhere updates.
 */

/**
 * Cuisines grouped by region. This is the source of truth.
 * The flat `PRIMARY_CUISINES` array below is derived from it.
 *
 * Used by:
 *   - BrandForm primary cuisine select (renders groups visually)
 *   - BrandForm secondary cuisines MultiSelect (flat search)
 */
export const CUISINE_GROUPS: { label: string; options: readonly string[] }[] = [
  {
    label: 'African',
    options: [
      'African',
      'Eritrean',
      'Ethiopian',
      'Nigerian',
      'South African',
    ],
  },
  {
    label: 'American',
    options: [
      'American',
      'BBQ',
      'Burgers',
      'Cajun / Creole',
      'Diner',
      'Hawaiian',
      'Hot Dogs',
      'Sandwiches / Deli',
      'Soul Food',
      'Steakhouse',
      'Tex-Mex',
      'Wings',
    ],
  },
  {
    label: 'Asian',
    options: [
      'Cantonese',
      'Chinese',
      'Dim Sum',
      'Filipino',
      'Indonesian',
      'Japanese',
      'Korean',
      'Malaysian',
      'Ramen',
      'Sushi',
      'Szechuan',
      'Thai',
      'Vietnamese',
    ],
  },
  {
    label: 'European',
    options: [
      'French',
      'German',
      'Italian',
      'Pizza',
      'Polish / Eastern European',
      'Russian',
      'Spanish',
      'Ukrainian',
    ],
  },
  {
    label: 'Halal',
    options: [
      'Halal American',
      'Halal Chicken',
      'Halal Mediterranean',
      'Halal Mexican',
      'Halal Steakhouse',
      'Pakistani Halal',
      'Shawarma / Falafel',
    ],
  },
  {
    label: 'Jewish / Kosher',
    options: [
      'Bukharian',
      'Chasidish / Heimish',
      'Israeli',
      'Jewish Deli',
      'Moroccan Jewish',
      'Sephardic',
      'Yemenite',
    ],
  },
  {
    label: 'Latin American',
    options: [
      'Argentinian',
      'Brazilian',
      'Caribbean',
      'Colombian',
      'Cuban',
      'Dominican',
      'Mexican',
      'Peruvian',
      'Puerto Rican',
      'Venezuelan',
    ],
  },
  {
    label: 'Middle Eastern / Mediterranean',
    options: [
      'Egyptian',
      'Georgian',
      'Greek',
      'Lebanese',
      'Mediterranean',
      'Middle Eastern',
      'Moroccan',
      'Persian',
      'Turkish',
    ],
  },
  {
    label: 'South Asian',
    options: [
      'Bangladeshi',
      'Indian',
      'Nepali',
      'North Indian',
      'Pakistani',
      'South Indian',
    ],
  },
  {
    label: 'Specialty / Style',
    options: [
      'Acai',
      'Bakery',
      'Bar / Pub',
      'Breakfast / Brunch',
      'Buffet',
      'Cafe / Coffee',
      'Dessert / Ice Cream',
      'Fast Food',
      'Fine Dining',
      'Food Truck',
      'Fusion',
      'Juice Bar / Smoothie',
      'Plant-based / Health',
      'Poke',
      'Salad / Bowls',
      'Seafood',
      'Vegan-focused',
    ],
  },
];

/** Flat list of every cuisine — used by MultiSelect (search-friendly) and validation. */
export const PRIMARY_CUISINES: string[] = CUISINE_GROUPS.flatMap((g) => g.options);

/**
 * What kind of place it is. Stored alongside STYLE_TAGS inside the
 * `style_tags` text[] column on `locations` (no schema change needed).
 * Code splits these out from style tags when loading the form and merges
 * them back together on save.
 */
export const ESTABLISHMENT_TYPES = [
  'Restaurant',
  'Take-out only',
  'Catering',
  'Food truck',
  'Grocery / Market with prepared food',
  'Butcher with prepared food',
  'Bakery',
  'Pizza shop',
  'Cafe / Coffee shop',
  'Bar / Lounge',
  'Ice cream / Dessert shop',
  'Juice bar',
  'Food court vendor',
  'Pop-up',
  'Ghost kitchen / Delivery only',
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

/** Vibe / service style. Lives in `style_tags` alongside ESTABLISHMENT_TYPES. */
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

/**
 * Halal certifying bodies — listed alphabetically. Mirrors the KOSHER_AGENCIES
 * shape so the HalalCertForm can use the same Select pattern.
 */
export const HALAL_AGENCIES = [
  { value: 'AHF', label: 'AHF (American Halal Foundation)' },
  { value: 'HFA', label: 'HFA (Halal Food Authority)' },
  { value: 'HFSAA', label: 'HFSAA (Halal Food Standards Alliance of America)' },
  { value: 'HMA', label: 'HMA (Halal Monitoring Authority)' },
  { value: 'IFANCA', label: 'IFANCA (Islamic Food and Nutrition Council of America)' },
  { value: 'ISWA', label: 'ISWA Halal Certification' },
  { value: 'JAKIM', label: 'JAKIM (Malaysia)' },
  { value: 'Local Imam / Masjid', label: 'Local Imam / Masjid' },
  { value: 'MUI', label: 'MUI (Indonesian Ulema Council)' },
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
  /** Clock time HH:MM for opening — ignored when open_note is set. */
  open?: string;
  /** Clock time HH:MM for closing — ignored when close_note is set. */
  close?: string;
  /**
   * Free-text override for opening, e.g. "after Shabbos", "1 hour after sunset".
   * Use this when the open time isn't a fixed clock value.
   */
  open_note?: string;
  /**
   * Free-text override for closing, e.g. "until sunset", "1 hour before Shabbos".
   */
  close_note?: string;
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

// ---------- style_tags split/merge helpers ----------

/** When loading existing data, split the `style_tags` array into the two UI buckets. */
export function splitStyleTags(stored: string[] | null | undefined) {
  const all = stored ?? [];
  const estSet = new Set<string>(ESTABLISHMENT_TYPES);
  const styleSet = new Set<string>(STYLE_TAGS);
  return {
    establishment_types: all.filter((t) => estSet.has(t)),
    style_tags: all.filter((t) => styleSet.has(t)),
    // anything that isn't in either list — preserve it so we don't accidentally
    // drop tags added directly via SQL or future expansion
    other: all.filter((t) => !estSet.has(t) && !styleSet.has(t)),
  };
}

/** When saving, merge the two UI bucket arrays (plus any preserved "other" tags) back into one. */
export function mergeStyleTags(
  establishmentTypes: string[],
  styleTags: string[],
  other: string[] = [],
): string[] {
  return Array.from(new Set([...establishmentTypes, ...styleTags, ...other]));
}
