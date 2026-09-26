import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications } from '@/lib/data/hooks';
import { ecosystemMetrics } from '@/lib/services/observability';
import PageHeader from '@/components/kit/PageHeader';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import TimeRangeFilter from '@/components/kit/TimeRangeFilter';
import EcosystemChart from '@/components/overview/EcosystemChart';
import AppIcon from '@/components/kit/AppIcon';
import { Users as UsersIcon, ArrowLeftRight, Wallet, Code } from 'lucide-react';

export default function Analytics() {
  const { t, fmt } = useT();
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const { data: apps = [], isLoading } = useApplications();
  const active = apps.filter((a) => a.lifecycle === 'active');
  const metrics = ecosystemMetrics(apps);

  const cards = [
    { label: t('kpi.users'), value: fmt.number(metrics.totalUsers), icon: UsersIcon, hint: t('kpi.acrossApps') },
    { label: t('kpi.transactions'), value: fmt.number(metrics.totalTransactions), icon: ArrowLeftRight, hint: t('kpi.period') },
    { label: t('kpi.revenue'), value: fmt.currency(metrics.totalRevenue), icon: Wallet, hint: t('kpi.period') },
    { label: t('metric.api'), value: fmt.number(metrics.totalApiRequests), icon: Code, hint: t('kpi.period') },
  ];

  const appColumns = [
    { key: 'name', header: t('analytics.app'), render: (a) => <span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span> },
    { key: 'users_count', header: t('analytics.users'), sortable: true, render: (a) => fmt.number(a.users_count || 0) },
    { key: 'transactions', header: t('analytics.transactions'), sortable: true, render: (a) => fmt.number(a.transactions || 0) },
    { key: 'revenue', header: t('analytics.revenue'), sortable: true, render: (a) => fmt.currency(a.revenue || 0, a.currency || 'AED') },
    { key: 'request_count', header: t('analytics.requests'), sortable: true, render: (a) => fmt.number(a.request_count || 0) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.analytics')} subtitle={t('analytics.subtitle')} breadcrumbs={[{ label: t('nav.analytics') }]} demo={apps.some((a) => a.is_demo)} />
      <div className="flex justify-end">
        <TimeRangeFilter value={range} onChange={setRange} custom={custom} onCustom={setCustom} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>
      <EcosystemChart apps={active} range={range} custom={custom} />
      <Panel title={t('analytics.perApp')} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                {appColumns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{c.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={appColumns.length} className="px-4 py-8 text-center text-muted-foreground">{t('table.empty')}</td></tr>
              ) : active.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                  {appColumns.map((c) => <td key={c.key} className="px-4 py-2.5">{c.render ? c.render(a) : a[c.key] ?? '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}