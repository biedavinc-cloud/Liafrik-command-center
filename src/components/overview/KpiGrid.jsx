import React from 'react';
import { AppWindow, CircleCheck, AlertTriangle, Users, ArrowLeftRight, Wallet, ShieldCheck, HeartPulse } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus, avgUptime } from '@/lib/status';
import MetricCard from '@/components/kit/MetricCard';

const sum = (arr, k) => arr.reduce((s, a) => s + (a[k] || 0), 0);

export default function KpiGrid({ apps, admins, notes, loading }) {
  const { t, fmt } = useT();
  const active = apps.filter((a) => a.lifecycle === 'active');
  const online = active.filter((a) => deriveStatus(a) === 'online').length;
  const warnings = notes.filter((n) => !n.read && (n.severity === 'warning' || n.severity === 'critical')).length;
  const activeAdmins = admins.filter((a) => a.status === 'active').length;

  const cards = [
    { label: t('kpi.applications'), value: fmt.number(active.length), icon: AppWindow, hint: t('kpi.registered', { n: apps.length }) },
    { label: t('kpi.online'), value: fmt.number(online), icon: CircleCheck, hint: t('kpi.ofActive', { n: active.length }) },
    { label: t('kpi.warnings'), value: fmt.number(warnings), icon: AlertTriangle, hint: t('kpi.unreadAlerts') },
    { label: t('kpi.users'), value: fmt.number(sum(active, 'users_count')), icon: Users, hint: t('kpi.acrossApps') },
    { label: t('kpi.transactions'), value: fmt.number(sum(active, 'transactions')), icon: ArrowLeftRight, hint: t('kpi.period') },
    { label: t('kpi.revenue'), value: fmt.currency(sum(active, 'revenue')), icon: Wallet, hint: t('kpi.period') },
    { label: t('kpi.administrators'), value: fmt.number(activeAdmins), icon: ShieldCheck, hint: t('kpi.activeAdmins') },
    { label: t('kpi.health'), value: fmt.percent(avgUptime(active)), icon: HeartPulse, hint: t('kpi.avgUptime') },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-8">
      {cards.map((c) => <MetricCard key={c.label} {...c} loading={loading} />)}
    </div>
  );
}