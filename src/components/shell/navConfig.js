import { LayoutDashboard, AppWindow, Users, ShieldCheck, KeyRound, BarChart3, Wallet, Activity, Bell, ScrollText, Plug, Layers, Shield, Settings, AlertTriangle, Code, Zap, Sparkles, CreditCard, Link2, MessageSquare, ListChecks, Network, Database, Gauge, Rocket, Sliders, BellRing, Boxes } from 'lucide-react';

// `planned` modules render the roadmap view until their phase ships.
export const NAV_SECTIONS = [
  { group: 'core', items: [
    { key: 'overview', path: '/', icon: LayoutDashboard },
    { key: 'applications', path: '/apps', icon: AppWindow },
  ] },
  { group: 'ai', items: [
    { key: 'ai', path: '/ai', icon: Sparkles },
  ] },
  { group: 'payments', items: [
    { key: 'psp-center', path: '/payments', icon: CreditCard },
    { key: 'payment-links', path: '/payment-links', icon: Link2 },
    { key: 'financial-integrations', path: '/financial-integrations', icon: Boxes },
    { key: 'revenue-analytics', path: '/revenue-analytics', icon: Wallet },
  ] },
  { group: 'identity', items: [
    { key: 'users', path: '/users', icon: Users },
    { key: 'administrators', path: '/administrators', icon: ShieldCheck },
    { key: 'roles', path: '/roles', icon: KeyRound },
  ] },
  { group: 'insights', items: [
    { key: 'analytics', path: '/analytics', icon: BarChart3 },
    { key: 'revenue', path: '/revenue', icon: Wallet },
    { key: 'monitoring', path: '/monitoring', icon: Activity },
    { key: 'health-monitor', path: '/health-monitor', icon: Gauge },
    { key: 'infrastructure-map', path: '/infrastructure-map', icon: Network },
  ] },
  { group: 'operations', items: [
    { key: 'incidents', path: '/incidents', icon: AlertTriangle },
    { key: 'rules', path: '/rules', icon: Zap },
    { key: 'notifications', path: '/notifications', icon: Bell },
    { key: 'audit', path: '/audit', icon: ScrollText },
    { key: 'api-logs', path: '/api-logs', icon: Code },
    { key: 'integrations', path: '/integrations', icon: Plug },
    { key: 'environments', path: '/environments', icon: Layers },
    { key: 'communication', path: '/communication', icon: MessageSquare },
    { key: 'tasks', path: '/tasks', icon: ListChecks },
    { key: 'internal-messaging', path: '/internal-messaging', icon: MessageSquare },
    { key: 'task-management', path: '/task-management', icon: ListChecks },
    { key: 'automation-engine', path: '/automation-engine', icon: Zap },
    { key: 'alert-rules', path: '/alert-rules', icon: BellRing },
    { key: 'deployments', path: '/deployments', icon: Rocket },
    { key: 'environment-config', path: '/environment-config', icon: Sliders },
  ] },
  { group: 'system', items: [
    { key: 'security', path: '/security', icon: Shield },
    { key: 'settings', path: '/settings', icon: Settings },
    { key: 'global-settings', path: '/global-settings', icon: Settings },
    { key: 'database-inspector', path: '/database-inspector', icon: Database },
  ] },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);