/**
 * Hand-written TypeScript types for the SeeIt Supabase database.
 *
 * If/when you want to regenerate these from the live schema, run:
 *   npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
 * Then swap the import below to use the generated `Database` type.
 */

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  allergies: string[] | null;
  dietary_preferences: string[] | null;
  notification_email: boolean | null;
  notification_push: boolean | null;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
  owner_id: string;
  subscription_status: SubscriptionStatus | null;
  is_suspended: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hours: Record<string, unknown> | null;
  special_hours: Record<string, unknown> | null;
  is_temporarily_closed: boolean;
  reopening_date: string | null;
  cover_photo_url: string | null;
  description: string | null;
  dietary_tags: string[] | null;
  style_tags: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  created_at: string;
}

export interface KosherCertification {
  id: string;
  location_id: string;
  agency: string;
  type: ('meat' | 'dairy' | 'pareve')[];
  sub_certifications: string[] | null;
  certificate_url: string | null;
  expiration_date: string | null;
  passover_certified: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  location_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  location_id: string;
  name: string;
  description: string | null;
  price: number | null;
  dietary_tags: string[] | null;
  is_visible: boolean;
  is_featured: boolean;
  position: number;
  created_at: string;
}

export interface MenuItemPhoto {
  id: string;
  menu_item_id: string;
  url: string;
  is_cover: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  menu_item_id: string | null;
  location_id: string;
  rating: number;
  text: string | null;
  portion_size: 'small' | 'fair' | 'generous' | null;
  worth_it: boolean | null;
  mood_tags: string[] | null;
  is_flagged: boolean;
  created_at: string;
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  url: string;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  brand_id: string;
  author_id: string;
  text: string;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  type: 'restaurant' | 'dish' | 'want_to_try';
  brand_id: string | null;
  location_id: string | null;
  menu_item_id: string | null;
  note: string | null;
  created_at: string;
}

export interface OrderList {
  id: string;
  user_id: string;
  location_id: string;
  name: string | null;
  created_at: string;
}

export interface OrderListItem {
  id: string;
  order_list_id: string;
  menu_item_id: string;
  quantity: number;
  note: string | null;
  person_tags: string[] | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  brand_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  location_ids: string[] | null;
  invite_status: 'active' | 'pending' | 'revoked';
  created_at: string;
}

export interface Subscription {
  id: string;
  brand_id: string;
  plan: 'starter' | 'pro' | 'premium';
  status: SubscriptionStatus;
  locations_count: number;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export interface QrCode {
  id: string;
  location_id: string;
  code: string;
  table_label: string | null;
  created_at: string;
}

// ---------- Derived / joined types used by admin pages ----------

export type BrandWithOwner = Brand & {
  owner: Pick<User, 'id' | 'email' | 'name'> | null;
  locations: { count: number }[];
};

export type LocationWithBrand = Location & {
  brand: Pick<Brand, 'id' | 'name' | 'logo_url'> | null;
};

export type UserWithCounts = User & {
  reviews?: { count: number }[];
};

export type ReviewWithRelations = Review & {
  user: Pick<User, 'id' | 'name' | 'avatar_url' | 'email'> | null;
  location: Pick<Location, 'id' | 'name' | 'brand_id'> | null;
  menu_item: Pick<MenuItem, 'id' | 'name'> | null;
  review_photos: Pick<ReviewPhoto, 'id' | 'url'>[];
};

export type SubscriptionWithBrand = Subscription & {
  brand: Pick<Brand, 'id' | 'name' | 'logo_url'> | null;
};
