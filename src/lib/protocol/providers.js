// Provider abstractions — the Command Center does not hard-code around a specific
// infrastructure provider. Each provider category defines a contract; concrete adapters
// (GitHub, Cloudflare, Neon, etc.) implement it. No provider is marked "connected"
// until a real integration exists.

export const PROVIDER_CATEGORIES = {
  source_control: {
    key: 'source_control',
    capabilities: ['repositories', 'branches', 'commits', 'pull_requests', 'deployments', 'releases', 'build_status'],
  },
  edge: {
    key: 'edge',
    capabilities: ['projects', 'deployments', 'domains', 'dns', 'environments', 'build_status'],
  },
  database: {
    key: 'database',
    capabilities: ['projects', 'databases', 'branches', 'connection_status', 'environments'],
  },
  hosting: {
    key: 'hosting',
    capabilities: ['projects', 'deployments', 'domains', 'environments'],
  },
  payments: {
    key: 'payments',
    capabilities: ['charges', 'refunds', 'subscriptions', 'webhooks'],
  },
  email: {
    key: 'email',
    capabilities: ['send', 'templates', 'webhooks'],
  },
  analytics: {
    key: 'analytics',
    capabilities: ['events', 'funnels', 'retention'],
  },
  auth: {
    key: 'auth',
    capabilities: ['users', 'sessions', 'tokens', 'sso'],
  },
};

// Known providers per category. `adapter` is the key the integration layer uses.
// `connected` is always false until a real OAuth or API-key connection is established.
export const PROVIDERS = [
  { key: 'github', name: 'GitHub', category: 'source_control', adapter: 'github', connected: false },
  { key: 'gitlab', name: 'GitLab', category: 'source_control', adapter: 'gitlab', connected: false },
  { key: 'bitbucket', name: 'Bitbucket', category: 'source_control', adapter: 'bitbucket', connected: false },

  { key: 'cloudflare', name: 'Cloudflare', category: 'edge', adapter: 'cloudflare', connected: false },
  { key: 'vercel', name: 'Vercel', category: 'hosting', adapter: 'vercel', connected: false },
  { key: 'netlify', name: 'Netlify', category: 'hosting', adapter: 'netlify', connected: false },

  { key: 'neon', name: 'Neon', category: 'database', adapter: 'neon', connected: false },
  { key: 'supabase', name: 'Supabase', category: 'database', adapter: 'supabase', connected: false },

  { key: 'stripe', name: 'Stripe', category: 'payments', adapter: 'stripe', connected: false },

  { key: 'resend', name: 'Resend', category: 'email', adapter: 'resend', connected: false },
  { key: 'sendgrid', name: 'SendGrid', category: 'email', adapter: 'sendgrid', connected: false },

  { key: 'posthog', name: 'PostHog', category: 'analytics', adapter: 'posthog', connected: false },

  { key: 'auth0', name: 'Auth0', category: 'auth', adapter: 'auth0', connected: false },
];

export const providersByCategory = (category) => PROVIDERS.filter((p) => p.category === category);

export const getProvider = (key) => PROVIDERS.find((p) => p.key === key);

// Honest status: no provider is connected until a real integration exists.
export const anyConnected = () => PROVIDERS.some((p) => p.connected);