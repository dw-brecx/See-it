/**
 * Catalog of every integration the admin can connect.
 *
 * Each entry defines its own config schema (which keys it needs, how they're
 * labeled, whether they're secrets). The integrations panel renders the
 * appropriate form from this metadata.
 *
 * To add an integration: append an entry here. UI picks it up automatically.
 */

export type IntegrationCategory =
  | 'payments'
  | 'email'
  | 'sms'
  | 'maps'
  | 'analytics'
  | 'monitoring'
  | 'ai'
  | 'storage'
  | 'comms';

export type IntegrationField = {
  key: string;
  label: string;
  /** Render as a password input + masked when shown. */
  secret?: boolean;
  /** Render as a long textarea (for JSON keys, etc). */
  multiline?: boolean;
  placeholder?: string;
  description?: string;
  /** Show this field only when these conditions are met. */
  requiredFor?: 'live' | 'webhook';
};

export type IntegrationDef = {
  provider: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  /** SVG color used for the badge accent. */
  accent: string;
  /** Lucide icon name (lookup happens in the panel). */
  icon: 'CreditCard' | 'Mail' | 'MessageCircle' | 'MapPin' | 'BarChart3' | 'AlertTriangle' | 'Sparkles' | 'Cloud' | 'Slack' | 'Phone';
  docsUrl: string;
  fields: IntegrationField[];
  /** Whether SeeIt currently has a server route to use this integration. */
  wired: boolean;
  /** Short blurb explaining what activating this unlocks in the app. */
  unlocks: string;
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    provider: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description:
      'Subscription billing for store plans. Charge cards, handle trials, sync subscription status back into SeeIt.',
    accent: '#635bff',
    icon: 'CreditCard',
    docsUrl: 'https://stripe.com/docs/keys',
    unlocks: 'Plan-to-Stripe checkout, automated subscription sync, discount code redemption.',
    wired: false,
    fields: [
      {
        key: 'publishable_key',
        label: 'Publishable key',
        placeholder: 'pk_live_…',
      },
      {
        key: 'secret_key',
        label: 'Secret key',
        secret: true,
        placeholder: 'sk_live_…',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook signing secret',
        secret: true,
        placeholder: 'whsec_…',
        description: 'For verifying incoming webhook events. Get it from Stripe → Developers → Webhooks.',
      },
    ],
  },

  {
    provider: 'resend',
    name: 'Resend',
    category: 'email',
    description:
      'Transactional email — invite emails, password resets, weekly digest, review-flag alerts.',
    accent: '#000000',
    icon: 'Mail',
    docsUrl: 'https://resend.com/docs',
    unlocks: 'User invites by email, password reset flow, admin email digests.',
    wired: false,
    fields: [
      {
        key: 'api_key',
        label: 'API key',
        secret: true,
        placeholder: 're_…',
      },
      {
        key: 'from_address',
        label: 'From address',
        placeholder: 'team@seeit.example',
      },
    ],
  },

  {
    provider: 'twilio',
    name: 'Twilio',
    category: 'sms',
    description:
      'SMS alerts — text store owners when a 1-star review hits, or text customers when their reservation is up.',
    accent: '#f22f46',
    icon: 'MessageCircle',
    docsUrl: 'https://www.twilio.com/docs/iam/api-keys',
    unlocks: 'SMS-based notifications, phone verification for customer accounts.',
    wired: false,
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'AC…' },
      { key: 'auth_token', label: 'Auth token', secret: true },
      { key: 'from_number', label: 'From number (E.164)', placeholder: '+15551234567' },
    ],
  },

  {
    provider: 'google_maps',
    name: 'Google Maps',
    category: 'maps',
    description:
      'Geocoding (turn addresses into lat/lng on save) and embedded maps on store profile pages.',
    accent: '#4285f4',
    icon: 'MapPin',
    docsUrl: 'https://developers.google.com/maps/documentation/javascript/get-api-key',
    unlocks: 'Auto-geocoded locations, "Nearby" search, embedded maps on storefront.',
    wired: false,
    fields: [
      {
        key: 'api_key',
        label: 'API key',
        secret: true,
        placeholder: 'AIza…',
        description: 'Restrict the key in Google Cloud Console to your Vercel domain.',
      },
    ],
  },

  {
    provider: 'mapbox',
    name: 'Mapbox',
    category: 'maps',
    description:
      'Alternative map provider — often cheaper than Google for embedded maps and custom styling.',
    accent: '#1d3d6e',
    icon: 'MapPin',
    docsUrl: 'https://docs.mapbox.com/help/getting-started/access-tokens/',
    unlocks: 'Custom-styled maps, cheaper geocoding at scale.',
    wired: false,
    fields: [
      { key: 'public_token', label: 'Public access token', placeholder: 'pk.…' },
      { key: 'secret_token', label: 'Secret token (for geocoding)', secret: true },
    ],
  },

  {
    provider: 'openai',
    name: 'OpenAI',
    category: 'ai',
    description:
      'AI-assisted menu copy, smart review summaries, "diners loved this" recommendations.',
    accent: '#10a37f',
    icon: 'Sparkles',
    docsUrl: 'https://platform.openai.com/api-keys',
    unlocks: 'AI-generated menu descriptions, sentiment analysis on reviews, smart search.',
    wired: false,
    fields: [
      { key: 'api_key', label: 'API key', secret: true, placeholder: 'sk-…' },
      {
        key: 'model',
        label: 'Default model',
        placeholder: 'gpt-4o-mini',
        description: 'Override per-feature in code if needed.',
      },
    ],
  },

  {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    category: 'ai',
    description:
      'Alternative AI provider for menu descriptions, moderation, smart support replies.',
    accent: '#cc785c',
    icon: 'Sparkles',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    unlocks: 'Same AI features as OpenAI; pick whichever you prefer.',
    wired: false,
    fields: [
      { key: 'api_key', label: 'API key', secret: true, placeholder: 'sk-ant-…' },
      { key: 'model', label: 'Default model', placeholder: 'claude-sonnet-4-5' },
    ],
  },

  {
    provider: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    description:
      'Error monitoring. Catch broken pages, slow API calls, and JS exceptions in production.',
    accent: '#362d59',
    icon: 'AlertTriangle',
    docsUrl: 'https://docs.sentry.io/product/sentry-basics/dsn-explainer/',
    unlocks: 'Real-time error alerts, stack traces, performance traces.',
    wired: false,
    fields: [
      { key: 'dsn', label: 'DSN', placeholder: 'https://…@sentry.io/…' },
      { key: 'environment', label: 'Environment', placeholder: 'production' },
    ],
  },

  {
    provider: 'posthog',
    name: 'PostHog',
    category: 'analytics',
    description:
      'Product analytics — see what restaurants edit most, what reviewers click, where flows drop off.',
    accent: '#f9bd2b',
    icon: 'BarChart3',
    docsUrl: 'https://posthog.com/docs/getting-started/install',
    unlocks: 'Event analytics across admin + customer app, session replays, funnels.',
    wired: false,
    fields: [
      { key: 'project_api_key', label: 'Project API key', placeholder: 'phc_…' },
      { key: 'host', label: 'Host', placeholder: 'https://app.posthog.com' },
    ],
  },

  {
    provider: 'slack',
    name: 'Slack',
    category: 'comms',
    description:
      'Pipe admin events (new store signups, flagged reviews, big subscriptions) into a Slack channel.',
    accent: '#4a154b',
    icon: 'Slack',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    unlocks: 'Real-time team notifications without leaving Slack.',
    wired: false,
    fields: [
      {
        key: 'webhook_url',
        label: 'Incoming webhook URL',
        secret: true,
        placeholder: 'https://hooks.slack.com/services/…',
      },
      { key: 'channel', label: 'Channel', placeholder: '#seeit-ops' },
    ],
  },

  {
    provider: 'cloudflare_r2',
    name: 'Cloudflare R2',
    category: 'storage',
    description:
      'Alternative photo storage — zero egress fees. Migrate away from Supabase Storage if costs balloon.',
    accent: '#f48120',
    icon: 'Cloud',
    docsUrl: 'https://developers.cloudflare.com/r2/api/s3/tokens/',
    unlocks: 'Cheaper photo hosting at scale; CDN included.',
    wired: false,
    fields: [
      { key: 'account_id', label: 'Account ID' },
      { key: 'access_key_id', label: 'Access key ID', secret: true },
      { key: 'secret_access_key', label: 'Secret access key', secret: true },
      { key: 'bucket', label: 'Bucket name', placeholder: 'seeit-photos' },
      { key: 'public_url', label: 'Public URL prefix', placeholder: 'https://photos.seeit.example' },
    ],
  },

  {
    provider: 'vonage',
    name: 'Vonage (Nexmo)',
    category: 'sms',
    description:
      'Alternative SMS provider — sometimes cheaper internationally than Twilio.',
    accent: '#871e54',
    icon: 'Phone',
    docsUrl: 'https://developer.vonage.com/getting-started/concepts/authentication',
    unlocks: 'Same SMS features as Twilio.',
    wired: false,
    fields: [
      { key: 'api_key', label: 'API key', secret: true },
      { key: 'api_secret', label: 'API secret', secret: true },
      { key: 'from', label: 'From (sender ID or number)' },
    ],
  },
];

export const CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: 'payments', label: 'Payments' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'maps', label: 'Maps' },
  { id: 'ai', label: 'AI' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'comms', label: 'Communications' },
  { id: 'storage', label: 'Storage' },
];
