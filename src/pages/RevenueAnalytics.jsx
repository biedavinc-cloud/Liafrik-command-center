import React, { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, usePaymentLinks, usePSPs, useCurrencyRates } from '@/lib/data/hooks';
import { buildSeries } from '@/lib/demoSeries';
import PageHeader from '@/components/kit/PageHeader';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import ChartCard, { axisProps, chartTooltipStyle } from '@/components/kit/ChartCard';
import TimeRangeFilter from '@/components/kit/TimeRangeFilter';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, ArrowLeftRight, TrendingUp, Building2, CreditCard, AlertCircle } from 'lucide-react';

const PIE_COLORS = ['hsl(var(--brand))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function RevenueAnalytics() {
  const { t, fmt, locale } = useT();
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const { data: apps = [], isLoading } = useApplications();
  const { data: links = [] } = usePaymentLinks();
  const { data: psps = [] } = usePSPs();

  const active = useMemo(() => apps.filter((a) => a.lifecycle === 'active' && a.revenue > 0), [apps]);
  const totalRevenue = active.reduce((s, a) => s + (a.revenue || 0), 0);
  const totalTransactions = active.reduce((s, a) => s + (a.transactions || 0), 0);
  const avgRevenue = active.length ? totalRevenue / active.length : 0;
  const paidLinks = links.filter((l) => l.status === 'paid');
  const linksRevenue = paidLinks.reduce((s, l) => s + (l.amount || 0), 0);
  const series = buildSeries(range, active, locale, custom);

  const byProvider = useMemo(() => {
    const map = {};
    active.forEach((a) => {
      const p = a.payment_provider || 'unknown';
      map[p] = (map[p] || 0) + (a.revenue || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [active]);

  const byApp = useMemo(() => active.map((a) => ({ name: a.name, revenue: a.revenue || 0, transactions: a.transactions || 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, 8), [active]);

  const cards = [
    { label: 'Total Revenue', value: fmt.currency(totalRevenue), icon: Wallet, sub: `${active.length} active apps` },
    { label: 'Transactions', value: fmt.number(totalTransactions), icon: ArrowLeftRight, sub: 'across all apps' },
    { label: 'Avg per App', value: fmt.currency(avgRevenue), icon: TrendingUp, sub: 'monthly average' },
    { label: 'Payment Links', value: fmt.currency(linksRevenue), icon: CreditCard, sub: `${paidLinks.length} paid links` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Revenue Analytics" subtitle="Aggregate revenue across all PSPs and applications" breadcrumbs={[{ label: 'Revenue Analytics' }]} demo={apps.some((a) => a.is_demo)} />
      <div className="flex justify-end">
        <TimeRangeFilter value={range} onChange={setRange} custom={custom} onCustom={setCustom} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue Trend" data={series} exportKeys={['revenue']} exportName="revenue-trend" className="lg:col-span-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={(v) => fmt.compact(v)} width={48} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [fmt.currency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Revenue by Provider" data={byProvider} exportKeys={['name', 'value']} exportName="revenue-by-provider">
          <div className="h-[260px]">
            {byProvider.length === 0 ? (
              <EmptyState title="No provider data" icon={AlertCircle} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byProvider} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {byProvider.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} formatter={(v) => fmt.currency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top Applications by Revenue" data={byApp} exportKeys={['name', 'revenue']} exportName="top-apps-revenue">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byApp} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => fmt.compact(v)} />
                <YAxis type="category" dataKey="name" {...axisProps} width={100} tick={{ fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [fmt.currency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <Panel title="Payment Provider Status" bodyClassName="p-0">
          <div className="divide-y">
            {psps.length === 0 ? (
              <div className="p-6"><EmptyState title="No PSPs configured" icon={CreditCard} /></div>
            ) : psps.map((p) => (
              <div key={p.key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-[13px] font-semibold">{p.display_name?.[0] || 'P'}</div>
                  <div>
                    <div className="text-[13px] font-medium">{p.display_name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.supported_currencies?.length || 0} currencies · {p.supported_countries?.length || 0} countries</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">{p.secret_configured ? 'Key set' : 'No key'}</span>
                  <StatusBadge value={p.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Revenue by Application" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Application</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Revenue</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Transactions</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Provider</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Currency</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No revenue data available</td></tr>
              ) : active.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-2.5"><span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span></td>
                  <td className="px-4 py-2.5 tabular-nums">{fmt.currency(a.revenue || 0, a.currency || 'AED')}</td>
                  <td className="px-4 py-2.5 tabular-nums">{fmt.number(a.transactions || 0)}</td>
                  <td className="px-4 py-2.5">{a.payment_provider || '—'}</td>
                  <td className="px-4 py-2.5">{a.currency || 'AED'}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}