import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications } from '@/lib/data/hooks';
import { buildSeries } from '@/lib/demoSeries';
import PageHeader from '@/components/kit/PageHeader';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import TimeRangeFilter from '@/components/kit/TimeRangeFilter';
import RevenueByApp from '@/components/overview/RevenueByApp';
import ChartCard, { axisProps, chartTooltipStyle } from '@/components/kit/ChartCard';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppIcon from '@/components/kit/AppIcon';
import { Wallet, ArrowLeftRight, TrendingUp } from 'lucide-react';

export default function Revenue() {
  const { t, fmt, locale } = useT();
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const { data: apps = [], isLoading } = useApplications();
  const active = apps.filter((a) => a.lifecycle === 'active' && a.revenue > 0);
  const totalRevenue = active.reduce((s, a) => s + (a.revenue || 0), 0);
  const totalTransactions = active.reduce((s, a) => s + (a.transactions || 0), 0);
  const avgRevenue = active.length ? totalRevenue / active.length : 0;
  const series = buildSeries(range, active, locale, custom);

  const cards = [
    { label: t('revenue.total'), value: fmt.currency(totalRevenue), icon: Wallet },
    { label: t('revenue.transactions'), value: fmt.number(totalTransactions), icon: ArrowLeftRight },
    { label: t('revenue.avgPerApp'), value: fmt.currency(avgRevenue), icon: TrendingUp },
  ];

  const appColumns = [
    { key: 'name', header: t('revenue.app'), render: (a) => <span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span> },
    { key: 'revenue', header: t('revenue.revenue'), sortable: true, render: (a) => fmt.currency(a.revenue || 0, a.currency || 'AED') },
    { key: 'transactions', header: t('revenue.transactions'), sortable: true, render: (a) => fmt.number(a.transactions || 0) },
    { key: 'payment_provider', header: t('revenue.provider'), render: (a) => a.payment_provider || '—' },
    { key: 'currency', header: t('revenue.currency'), render: (a) => a.currency || 'AED' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.revenue')} subtitle={t('revenue.subtitle')} breadcrumbs={[{ label: t('nav.revenue') }]} demo={apps.some((a) => a.is_demo)} />
      <div className="flex justify-end">
        <TimeRangeFilter value={range} onChange={setRange} custom={custom} onCustom={setCustom} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueByApp apps={apps} />
        <ChartCard title={t('revenue.trend')} data={series} exportKeys={['revenue']} exportName="revenue-trend">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={(v) => fmt.compact(v)} width={48} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [fmt.currency(v), t('metric.revenue')]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--brand))" strokeWidth={1.8} fill="url(#revFill)" animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <Panel title={t('revenue.byApp')} bodyClassName="p-0">
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