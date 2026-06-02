/**
 * Authoritative typed schema for the SeeIt admin app, hand-mirrored to the
 * actual Supabase `public` schema dump. Keep this in sync whenever a
 * migration runs — every `<Database>`-typed Supabase client query is checked
 * against these definitions at compile time.
 *
 * Generated shape is compatible with `@supabase/postgrest-js` — every table
 * needs `Row` / `Insert` / `Update` / `Relationships: []`.
 */

// ──────────────────────────────────────────────────────────────────────────
// Enum-like unions (DB columns are text, but values are constrained in app)
// ──────────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'
  | 'inactive';
export type SubscriptionPlan = 'starter' | 'pro' | 'premium';
export type TeamRole = 'owner' | 'manager' | 'staff';
export type SavedItemType = 'location' | 'menu_item';
export type PortionSize = 'small' | 'right' | 'huge';
export type KosherKind = 'meat' | 'dairy' | 'pareve' | 'mixed';

// ──────────────────────────────────────────────────────────────────────────
// Database
// ──────────────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      // ──────────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          is_suspended: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_suspended?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_suspended?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      user_preferences: {
        Row: {
          user_id: string;
          allergies: string[] | null;
          dietary_preferences: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          allergies?: string[] | null;
          dietary_preferences?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          allergies?: string[] | null;
          dietary_preferences?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
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
          plan_id: string | null;
          plan: string | null;
          is_suspended: boolean | null;
          // Storefront profile fields (migration 003)
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
          created_at: string | null;
          updated_at: string | null;
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
          plan_id?: string | null;
          plan?: string | null;
          is_suspended?: boolean | null;
          tagline?: string | null;
          cover_photo_url?: string | null;
          story?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          x_url?: string | null;
          theme_color?: string | null;
          featured_menu_item_ids?: string[] | null;
          storefront_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
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
          plan_id?: string | null;
          plan?: string | null;
          is_suspended?: boolean | null;
          tagline?: string | null;
          cover_photo_url?: string | null;
          story?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          x_url?: string | null;
          theme_color?: string | null;
          featured_menu_item_ids?: string[] | null;
          storefront_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      locations: {
        Row: {
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
          hours: Record<string, unknown> | null;
          special_hours: Record<string, unknown>[] | null;
          is_temporarily_closed: boolean | null;
          reopening_date: string | null;
          cover_photo_url: string | null;
          description: string | null;
          dietary_tags: string[] | null;
          style_tags: string[] | null;
          average_rating: number | null;
          review_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          address: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          hours?: Record<string, unknown> | null;
          special_hours?: Record<string, unknown>[] | null;
          is_temporarily_closed?: boolean | null;
          reopening_date?: string | null;
          cover_photo_url?: string | null;
          description?: string | null;
          dietary_tags?: string[] | null;
          style_tags?: string[] | null;
          average_rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          hours?: Record<string, unknown> | null;
          special_hours?: Record<string, unknown>[] | null;
          is_temporarily_closed?: boolean | null;
          reopening_date?: string | null;
          cover_photo_url?: string | null;
          description?: string | null;
          dietary_tags?: string[] | null;
          style_tags?: string[] | null;
          average_rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      kosher_certifications: {
        // PK is location_id (no surrogate id column in DB)
        Row: {
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
          updated_at: string | null;
        };
        Insert: {
          location_id: string;
          agency: string;
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
          updated_at?: string | null;
        };
        Update: {
          location_id?: string;
          agency?: string;
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
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      menu_categories: {
        Row: {
          id: string;
          location_id: string;
          name: string;
          display_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          name: string;
          display_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          name?: string;
          display_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      menu_items: {
        Row: {
          id: string;
          location_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number | null;
          dietary_tags: string[] | null;
          is_visible: boolean | null;
          average_rating: number | null;
          review_count: number | null;
          photo_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price?: number | null;
          dietary_tags?: string[] | null;
          is_visible?: boolean | null;
          average_rating?: number | null;
          review_count?: number | null;
          photo_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number | null;
          dietary_tags?: string[] | null;
          is_visible?: boolean | null;
          average_rating?: number | null;
          review_count?: number | null;
          photo_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      menu_item_photos: {
        Row: {
          id: string;
          menu_item_id: string;
          user_id: string | null;
          photo_url: string;
          is_restaurant_uploaded: boolean | null;
          is_featured: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          user_id?: string | null;
          photo_url: string;
          is_restaurant_uploaded?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          user_id?: string | null;
          photo_url?: string;
          is_restaurant_uploaded?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      reviews: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string | null;
          location_id: string;
          rating: number;
          text: string | null;
          portion_size: PortionSize | null;
          worth_the_price: boolean | null;
          mood_tags: string[] | null;
          is_flagged: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id?: string | null;
          location_id: string;
          rating: number;
          text?: string | null;
          portion_size?: PortionSize | null;
          worth_the_price?: boolean | null;
          mood_tags?: string[] | null;
          is_flagged?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          menu_item_id?: string | null;
          location_id?: string;
          rating?: number;
          text?: string | null;
          portion_size?: PortionSize | null;
          worth_the_price?: boolean | null;
          mood_tags?: string[] | null;
          is_flagged?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      review_photos: {
        Row: {
          id: string;
          review_id: string;
          photo_url: string;
          display_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          review_id: string;
          photo_url: string;
          display_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          review_id?: string;
          photo_url?: string;
          display_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      review_replies: {
        Row: {
          id: string;
          review_id: string;
          brand_id: string;
          replier_user_id: string;
          text: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          review_id: string;
          brand_id: string;
          replier_user_id: string;
          text: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          review_id?: string;
          brand_id?: string;
          replier_user_id?: string;
          text?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      saved_items: {
        Row: {
          id: string;
          user_id: string;
          item_type: SavedItemType;
          location_id: string | null;
          menu_item_id: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: SavedItemType;
          location_id?: string | null;
          menu_item_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: SavedItemType;
          location_id?: string | null;
          menu_item_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      order_lists: {
        Row: {
          id: string;
          user_id: string;
          location_id: string;
          name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_id: string;
          name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_id?: string;
          name?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      order_list_items: {
        Row: {
          id: string;
          order_list_id: string;
          menu_item_id: string;
          quantity: number | null;
          notes: string | null;
          assigned_to: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_list_id: string;
          menu_item_id: string;
          quantity?: number | null;
          notes?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_list_id?: string;
          menu_item_id?: string;
          quantity?: number | null;
          notes?: string | null;
          assigned_to?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      team_members: {
        Row: {
          id: string;
          brand_id: string;
          user_id: string;
          role: TeamRole;
          location_ids: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          user_id: string;
          role: TeamRole;
          location_ids?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          user_id?: string;
          role?: TeamRole;
          location_ids?: string[] | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      subscriptions: {
        Row: {
          id: string;
          brand_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: SubscriptionPlan | null;
          status: SubscriptionStatus | null;
          current_period_end: string | null;
          locations_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan | null;
          status?: SubscriptionStatus | null;
          current_period_end?: string | null;
          locations_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan | null;
          status?: SubscriptionStatus | null;
          current_period_end?: string | null;
          locations_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      // ──────────────────────────────────────────────────────────────────
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          related_id: string | null;
          is_read: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          related_id?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          related_id?: string | null;
          is_read?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price_cents: number;
          billing_interval: 'month' | 'year';
          location_limit: number | null;
          features: string[];
          is_active: boolean;
          display_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price_cents?: number;
          billing_interval?: 'month' | 'year';
          location_limit?: number | null;
          features?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          price_cents?: number;
          billing_interval?: 'month' | 'year';
          location_limit?: number | null;
          features?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      discount_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          percent_off: number | null;
          amount_off_cents: number | null;
          valid_from: string | null;
          valid_until: string | null;
          max_uses: number | null;
          used_count: number;
          applies_to_plan_id: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          percent_off?: number | null;
          amount_off_cents?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          max_uses?: number | null;
          used_count?: number;
          applies_to_plan_id?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          percent_off?: number | null;
          amount_off_cents?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
          max_uses?: number | null;
          used_count?: number;
          applies_to_plan_id?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      qr_codes: {
        Row: {
          id: string;
          location_id: string;
          code: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          code: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          code?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };

      integrations: {
        Row: {
          id: string;
          provider: string;
          is_enabled: boolean;
          config: Record<string, unknown>;
          last_tested_at: string | null;
          last_test_ok: boolean | null;
          last_test_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          is_enabled?: boolean;
          config?: Record<string, unknown>;
          last_tested_at?: string | null;
          last_test_ok?: boolean | null;
          last_test_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          is_enabled?: boolean;
          config?: Record<string, unknown>;
          last_tested_at?: string | null;
          last_test_ok?: boolean | null;
          last_test_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      admin_audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          target_label: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          target_label?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          target_label?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Convenience aliases used across the app
// ──────────────────────────────────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type User = Tables<'users'>;
export type Brand = Tables<'brands'>;
export type Location = Tables<'locations'>;
export type KosherCertification = Tables<'kosher_certifications'>;
export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;
export type MenuItemPhoto = Tables<'menu_item_photos'>;
export type Review = Tables<'reviews'>;
export type ReviewPhoto = Tables<'review_photos'>;
export type ReviewReply = Tables<'review_replies'>;
export type Subscription = Tables<'subscriptions'>;
export type TeamMember = Tables<'team_members'>;
export type SavedItem = Tables<'saved_items'>;
export type OrderList = Tables<'order_lists'>;
export type OrderListItem = Tables<'order_list_items'>;
export type Notification = Tables<'notifications'>;
export type QrCode = Tables<'qr_codes'>;
export type UserPreferences = Tables<'user_preferences'>;
export type Plan = Tables<'plans'>;
export type DiscountCode = Tables<'discount_codes'>;
export type AdminAuditLog = Tables<'admin_audit_log'>;
export type Integration = Tables<'integrations'>;
