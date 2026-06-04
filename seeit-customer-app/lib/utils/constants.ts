// Mirrors /seeit-restaurant/lib/constants.ts so the customer app's filters and
// chips line up exactly with what restaurants choose in the dashboard.

export const CUISINE_GROUPS: { label: string; options: readonly string[] }[] = [
  // Jewish/Kosher pinned first for the target audience
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
    label: 'African',
    options: ['African', 'Eritrean', 'Ethiopian', 'Nigerian', 'South African'],
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

export const PRIMARY_CUISINES: string[] = CUISINE_GROUPS.flatMap((g) => g.options);

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

export const WEEKDAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
] as const;

// Maps a user-allergy string to the dietary tag that signals safety.
// If the dish has the safety tag, no warning shown.
export const ALLERGY_SAFE_TAG: Record<string, string | null> = {
  Peanuts: 'Nut-Free options',
  'Tree Nuts': 'Nut-Free options',
  Dairy: 'Dairy-Free options',
  'Wheat/Gluten': 'Gluten-Free options',
  Shellfish: null,
  Fish: null,
  Eggs: null,
  Soy: null,
  Sesame: null,
};
