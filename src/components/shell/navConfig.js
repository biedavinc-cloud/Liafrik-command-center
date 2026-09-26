import { LayoutDashboard, AppWindow, Users, ShieldCheck, KeyRound, BarChart3, Wallet, Activity, Bell, ScrollText, Plug, Layers, Shield, Settings, AlertTriangle, Code, Zap, Sparkles, CreditCard, Link2, MessageSquare, ListChecks } from 'lucide-react';

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
  ] },
  { group: 'system', items: [
    { key: 'security', path: '/security', icon: Shield },
    { key: 'settings', path: '/settings', icon: Settings },
  ] },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);