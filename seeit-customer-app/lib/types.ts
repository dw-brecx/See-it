// Customer-app TypeScript types — mirror the relevant slice of the Supabase
// schema. Kept narrow on purpose: the customer app only reads public data and
// writes reviews / saved_items / order_lists. No admin fields here.

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';
export type KosherKind = 'meat' | 'dairy' | 'pareve' | 'mixed';
export type PortionSize = 'small' | 'right' | 'huge';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | null;

export type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
  // storefront
  tagline: string | null;
  cover_photo_url: string | null;
  story: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  theme_color: string | null;
  featured_menu_item_ids: string[] | null;
  storefront_published: boolean | null;
  is_suspended: boolean | null;
  // verification
  is_verified: boolean | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
};

export type DayHours = {
  is_closed: boolean;
  open?: string;
  close?: string;
  open_note?: string;
  close_note?: string;
};

export type WeekHours = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  DayHours
>;

export type Location = {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hours: WeekHours | null;
  is_temporarily_closed: boolean;
  reopening_date: string | null;
  cover_photo_url: string | null;
  description: string | null;
  dietary_tags: string[] | null;
  style_tags: string[] | null;
  average_rating: number | null;
  review_count: number | null;
};

export type KosherCert = {
  location_id: string;
  agency: string;
  agency_other: string | null;
  kosher_type: KosherKind | null;
  is_glatt: boolean | null;
  is_cholov_yisroel: boolean | null;
  is_pas_yisroel: boolean | null;
  is_bishul_yisroel: boolean | null;
  is_yoshon: boolean | null;
  is_kosher_for_passover: boolean | null;
  certificate_image_url: string | null;
  expiration_date: string | null;
};

export type HalalCert = {
  location_id: string;
  agency: string;
  agency_other: string | null;
  certificate_image_url: string | null;
  expiration_date: string | null;
};

export type MenuCategory = {
  id: string;
  location_id: string;
  name: string;
  display_order: number | null;
};

export type MenuItem = {
  id: string;
  location_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  dietary_tags: string[] | null;
  is_visible: boolean;
  average_rating: number | null;
  review_count: number | null;
};

export type MenuItemPhoto = {
  id: string;
  menu_item_id: string;
  user_id: string | null;
  photo_url: string;
  is_restaurant_uploaded: boolean;
  is_featured: boolean;
};

export type Review = {
  id: string;
  user_id: string;
  menu_item_id: string | null;
  location_id: string;
  rating: number;
  text: string | null;
  portion_size: PortionSize | null;
  worth_the_price: boolean | null;
  mood_tags: string[] | null;
  is_flagged: boolean;
  created_at: string;
};

export type ReviewPhoto = {
  id: string;
  review_id: string;
  photo_url: string;
  display_order: number | null;
};

export type ReviewReply = {
  id: string;
  review_id: string;
  brand_id: string;
  replier_user_id: string;
  text: string;
  created_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  item_type: 'location' | 'menu_item';
  location_id: string | null;
  menu_item_id: string | null;
  notes: string | null;
};

export type OrderList = {
  id: string;
  user_id: string;
  location_id: string;
  name: string | null;
};

export type OrderListItem = {
  id: string;
  order_list_id: string;
  menu_item_id: string;
  quantity: number;
  notes: string | null;
  assigned_to: string | null;
};

export type UserPreferences = {
  user_id: string;
  allergies: string[] | null;
  dietary_preferences: string[] | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
};

// Convenience derived types
export type BrandWithLocations = Brand & { locations: Location[] };

export type RestaurantCardData = {
  brand: Brand;
  nearest: Location | null;
  distance_miles: number | null;
};

export type DishCardData = {
  item: MenuItem;
  brand_name: string;
  brand_id: string;
  cover_photo_url: string | null;
};
