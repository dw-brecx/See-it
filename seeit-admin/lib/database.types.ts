/**
 * Typed Supabase schema for the SeeIt platform — kept in the shape that
 * `supabase gen types typescript` outputs, so we can swap to real
 * generated types in the future just by running:
 *
 *   npx supabase gen types typescript \
 *     --project-id <your-project-id> --schema public \
 *     > lib/database.types.ts
 *
 * When you do that, leave the convenience aliases at the bottom of this
 * file alone (or re-add them) so existing imports keep working.
 *
 * Wiring this `Database` type into `createBrowserClient<Database>` and
 * `createServerClient<Database>` (see `lib/supabase/*`) means TypeScript
 * catches column-name typos at build time. PostgREST string column
 * lists in `.select('foo, bar')` still aren't type-checked exhaustively,
 * but `.from()`, `.eq()`, `.update()`, `.insert()` payloads are.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ===== Enums / unions =====

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';

export type SubscriptionStatus =
  | 'inactive'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

export type TeamRole = 'owner' | 'manager' | 'staff';

export type InviteStatus = 'active' | 'pending' | 'revoked';

export type SavedItemType = 'restaurant' | 'dish' | 'want_to_try';

export type PortionSize = 'small' | 'fair' | 'generous';

export type KosherKind = 'meat' | 'dairy' | 'pareve' | 'mixed';

// ===== Database shape =====

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };

      user_preferences: {
        Row: {
          user_id: string;
          allergies: string[] | null;
          dietary_preferences: string[] | null;
          notification_email: boolean | null;
          notification_push: boolean | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          allergies?: string[] | null;
          dietary_preferences?: string[] | null;
          notification_email?: boolean | null;
          notification_push?: boolean | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          allergies?: string[] | null;
          dietary_preferences?: string[] | null;
          notification_email?: boolean | null;
          notification_push?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      brands: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          primary_cuisine: string | null;
          secondary_cuisines: string[] | null;
          owner_id: string | null;
          subscription_status: SubscriptionStatus | null;
          is_suspended: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          primary_cuisine?: string | null;
          secondary_cuisines?: string[] | null;
          owner_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          is_suspended?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          primary_cuisine?: string | null;
          secondary_cuisines?: string[] | null;
          owner_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          is_suspended?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      locations: {
        Row: {
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
          hours: Json | null;
          special_hours: Json | null;
          is_temporarily_closed: boolean;
          reopening_date: string | null;
          cover_photo_url: string | null;
          description: string | null;
          dietary_tags: string[] | null;
          style_tags: string[] | null;
          average_rating: number | null;
          review_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          hours?: Json | null;
          special_hours?: Json | null;
          is_temporarily_closed?: boolean;
          reopening_date?: string | null;
          cover_photo_url?: string | null;
          description?: string | null;
          dietary_tags?: string[] | null;
          style_tags?: string[] | null;
          average_rating?: number | null;
          review_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          hours?: Json | null;
          special_hours?: Json | null;
          is_temporarily_closed?: boolean;
          reopening_date?: string | null;
          cover_photo_url?: string | null;
          description?: string | null;
          dietary_tags?: string[] | null;
          style_tags?: string[] | null;
          average_rating?: number | null;
          review_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      kosher_certifications: {
        Row: {
          id: string;
          location_id: string;
          agency: string | null;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          agency?: string | null;
          agency_other?: string | null;
          kosher_type?: KosherKind | null;
          is_glatt?: boolean | null;
          is_cholov_yisroel?: boolean | null;
          is_pas_yisroel?: boolean | null;
          is_bishul_yisroel?: boolean | null;
          is_yoshon?: boolean | null;
          is_kosher_for_passover?: boolean | null;
          certificate_image_url?: string | null;
          expiration_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          agency?: string | null;
          agency_other?: string | null;
          kosher_type?: KosherKind | null;
          is_glatt?: boolean | null;
          is_cholov_yisroel?: boolean | null;
          is_pas_yisroel?: boolean | null;
          is_bishul_yisroel?: boolean | null;
          is_yoshon?: boolean | null;
          is_kosher_for_passover?: boolean | null;
          certificate_image_url?: string | null;
          expiration_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      menu_categories: {
        Row: {
          id: string;
          location_id: string;
          name: string;
          display_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          name: string;
          display_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          name?: string;
          display_order?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      menu_items: {
        Row: {
          id: string;
          category_id: string;
          location_id: string;
          name: string;
          description: string | null;
          price: number | null;
          dietary_tags: string[] | null;
          is_visible: boolean;
          is_featured: boolean | null;
          position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          location_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          dietary_tags?: string[] | null;
          is_visible?: boolean;
          is_featured?: boolean | null;
          position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          location_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          dietary_tags?: string[] | null;
          is_visible?: boolean;
          is_featured?: boolean | null;
          position?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      menu_item_photos: {
        Row: {
          id: string;
          menu_item_id: string;
          photo_url: string;
          is_cover: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          photo_url: string;
          is_cover?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          photo_url?: string;
          is_cover?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      reviews: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string | null;
          location_id: string;
          rating: number;
          text: string | null;
          portion_size: PortionSize | null;
          mood_tags: string[] | null;
          is_flagged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id?: string | null;
          location_id: string;
          rating: number;
          text?: string | null;
          portion_size?: PortionSize | null;
          mood_tags?: string[] | null;
          is_flagged?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          menu_item_id?: string | null;
          location_id?: string;
          rating?: number;
          text?: string | null;
          portion_size?: PortionSize | null;
          mood_tags?: string[] | null;
          is_flagged?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      review_photos: {
        Row: {
          id: string;
          review_id: string;
          photo_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          photo_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      review_replies: {
        Row: {
          id: string;
          review_id: string;
          brand_id: string;
          author_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          brand_id: string;
          author_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          brand_id?: string;
          author_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      saved_items: {
        Row: {
          id: string;
          user_id: string;
          type: SavedItemType;
          brand_id: string | null;
          location_id: string | null;
          menu_item_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: SavedItemType;
          brand_id?: string | null;
          location_id?: string | null;
          menu_item_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: SavedItemType;
          brand_id?: string | null;
          location_id?: string | null;
          menu_item_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      order_lists: {
        Row: {
          id: string;
          user_id: string;
          location_id: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_id: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_id?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      order_list_items: {
        Row: {
          id: string;
          order_list_id: string;
          menu_item_id: string;
          quantity: number;
          note: string | null;
          person_tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_list_id: string;
          menu_item_id: string;
          quantity?: number;
          note?: string | null;
          person_tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_list_id?: string;
          menu_item_id?: string;
          quantity?: number;
          note?: string | null;
          person_tags?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };

      team_members: {
        Row: {
          id: string;
          brand_id: string;
          user_id: string;
          role: TeamRole;
          location_ids: string[] | null;
          invite_status: InviteStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          user_id: string;
          role: TeamRole;
          location_ids?: string[] | null;
          invite_status?: InviteStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          user_id?: string;
          role?: TeamRole;
          location_ids?: string[] | null;
          invite_status?: InviteStatus;
          created_at?: string;
        };
        Relationships: [];
      };

      subscriptions: {
        Row: {
          id: string;
          brand_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          locations_count: number;
          current_period_end: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          locations_count?: number;
          current_period_end?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          locations_count?: number;
          current_period_end?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      qr_codes: {
        Row: {
          id: string;
          location_id: string;
          code: string;
          table_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          code: string;
          table_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          code?: string;
          table_label?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ===========================================================================
// Convenience aliases — kept so existing imports of `User`, `Brand`, etc.
// don't need to be rewritten. New code should prefer `Tables<'users'>` etc.
// ===========================================================================

type Public = Database['public']['Tables'];

export type Tables<T extends keyof Public> = Public[T]['Row'];
export type TablesInsert<T extends keyof Public> = Public[T]['Insert'];
export type TablesUpdate<T extends keyof Public> = Public[T]['Update'];

export type User = Tables<'users'>;
export type UserPreferences = Tables<'user_preferences'>;
export type Brand = Tables<'brands'>;
export type Location = Tables<'locations'>;
export type KosherCertification = Tables<'kosher_certifications'>;
export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;
export type MenuItemPhoto = Tables<'menu_item_photos'>;
export type Review = Tables<'reviews'>;
export type ReviewPhoto = Tables<'review_photos'>;
export type ReviewReply = Tables<'review_replies'>;
export type SavedItem = Tables<'saved_items'>;
export type OrderList = Tables<'order_lists'>;
export type OrderListItem = Tables<'order_list_items'>;
export type TeamMember = Tables<'team_members'>;
export type Subscription = Tables<'subscriptions'>;
export type Notification = Tables<'notifications'>;
export type QrCode = Tables<'qr_codes'>;

// ===========================================================================
// Joined / derived shapes used by admin list pages
// ===========================================================================

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
  review_photos: Pick<ReviewPhoto, 'id' | 'photo_url'>[];
};

export type SubscriptionWithBrand = Subscription & {
  brand: Pick<Brand, 'id' | 'name' | 'logo_url'> | null;
};
