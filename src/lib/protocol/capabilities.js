// Capability catalog — the contract between the Command Center and any connected app.
// Each capability maps to a Liafrik Control Protocol (LCP) module. UI modules are rendered from this list,
// never from application names.
import { Users, ShieldCheck, KeyRound, Lock, Package, ShoppingCart, CreditCard, Wallet, Contact, Store, FileText, Star, BarChart3, Bell, ScrollText, Settings, Code, Webhook } from 'lucide-react';

export const CAPABILITIES = [
  { key: 'users', icon: Users, endpoint: '/users', module: true },
  { key: 'administrators', icon: ShieldCheck, endpoint: '/admins', module: true },
  { key: 'roles', icon: KeyRound, endpoint: '/roles', module: true },
  { key: 'permissions', icon: Lock, endpoint: '/permissions', module: true },
  { key: 'products', icon: Package, endpoint: '/products', module: true },
  { key: 'orders', icon: ShoppingCart, endpoint: '/orders', module: true },
  { key: 'payments', icon: CreditCard, endpoint: '/payments', module: true },
  { key: 'revenue', icon: Wallet, endpoint: '/metrics/revenue', module: true },
  { key: 'customers', icon: Contact, endpoint: '/customers', module: true },
  { key: 'sellers', icon: Store, endpoint: '/sellers', module: true },
  { key: 'documents', icon: FileText, endpoint: '/documents', module: true },
  { key: 'reviews', icon: Star, endpoint: '/reviews', module: true },
  { key: 'analytics', icon: BarChart3, endpoint: '/metrics', module: true },
  { key: 'notifications', icon: Bell, endpoint: '/notifications', module: false },
  { key: 'audit_logs', icon: ScrollText, endpoint: '/audit', module: false },
  { key: 'settings', icon: Settings, endpoint: '/settings', module: false },
  { key: 'api', icon: Code, endpoint: '/', module: false },
  { key: 'webhooks', icon: Webhook, endpoint: '/webhooks', module: true },
];

export const capabilityMap = Object.fromEntries(CAPABILITIES.map((c) => [c.key, c]));

export const moduleCapabilities = (app) =>
  (app?.capabilities || []).map((k) => capabilityMap[k]).filter((c) => c?.module);

export const APP_TYPES = ['saas', 'marketplace', 'crm', 'ecommerce', 'internal_tool', 'customer_portal', 'financial_platform', 'other'];
export const ENVIRONMENTS = ['development', 'staging', 'production'];
export const AUTH_METHODS = ['api_key', 'oauth2', 'jwt', 'sso'];