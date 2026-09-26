import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useDeployments, useAllApiLogs, useSecurityEvents } from '@/lib/data/hooks';
import { deriveStatus, ecosystemStatus, avgUptime } from '@/lib/status';
import PageHeader from '@/components/kit/PageHeader';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import StatusBadge, { StatusDot } from '@/components/kit/StatusBadge';
import ChartCard, { axisProps, chartTooltipStyle } from '@/components/kit/ChartCard';
import EmptyState from '@/components/kit/EmptyState';
import AppIcon from '@/components/kit/AppIcon';
import { Activity, Clock, Zap, AlertTriangle, Gauge, Timer, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

const BANNER = { online: 'border-emerald-200 bg-emerald-50/60', degraded: 'border-amber-200 bg-amber-50/60', offline: 'border-rose-200 bg-rose-50/60', unknown: 'border-border bg-card' };

export default function HealthMonitor() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useApplications();
  const { data: allLogs = [] } = useAllApiLogs();
  const { data: securityEvents = [] } = useSecurityEvents();

  const active = apps.filter((a) => a.lifecycle !== 'archived');
  const eco = ecosystemStatus(apps);
  const counts = ['online', 'degraded', 'warning', 'offline', 'unknown'].map((s) => [s, active.filter((a) => deriveStatus(a) === s).length]);
  const avgLatency = active.filter((a) => a.response_ms).reduce((s, a) => s + a.response_ms, 0) / (active.filter((a) => a.response_ms).length || 1);
  const totalRequests = active.reduce((s, a) => s + (a.request_count || 0), 0);
  const avgErrRate = active.filter((a) => a.error_rate).reduce((s, a) => s + a.error_rate, 0) / (active.filter((a) => a.error_rate).length || 1);

  const latencyData = useMemo(() => active.filter((a) => a.response_ms).map((a) => ({ name: a.name, latency: a.response_ms, uptime: a.uptime || 0 })).sort((a, b) => b.latency - a.latency).slice(0, 10), [active]);

  const cards = [
    { label: 'Ecosystem Status', value: t(`systemStatus.${eco}`), icon: Activity, sub: `${active.length} applications` },
    { label: 'Avg Uptime', value: fmt.percent(avgUptime(active), 2), icon: Gauge, sub: 'across all apps' },
    { label: 'Avg Latency', value: avgLatency ? `${Math.round(avgLatency)} ms` : '—', icon: Timer, sub: 'response time' },
    { label: 'Total Requests', value: fmt.compact(totalRequests), icon: Zap, sub: 'all time' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="System Health Monitor" subtitle="Real-time connectivity, latency, and uptime for every connected application" breadcrumbs={[{ label: 'System Health Monitor' }]} demo={apps.some((a) => a.is_demo)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>

      {/* Ecosystem banner */}
      <div className={cn('flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between', BANNER[eco])}>
        <div className="flex items-center gap-3">
          <StatusDot value={eco} pulse className="h-3 w-3" />
          <div>
            <div className="label-caps">Global Ecosystem</div>
            <div className="text-[15px] font-semibold">{t(`systemStatus.${eco}`)}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          {counts.map(([s, n]) => <span key={s} className="flex items-center gap-1.5"><StatusDot value={s} />{t(`status.${s}`)} <b className="tabular-nums">{n}</b></span>)}
          {avgErrRate > 0 && <span className="border-l pl-5 text-muted-foreground">Error Rate <b className="text-foreground">{fmt.percent(avgErrRate, 2)}</b></span>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Response Latency by Application" data={latencyData} exportKeys={['name', 'latency']} exportName="latency-by-app">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => `${v}ms`} unit="ms" />
                <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v} ms`, 'Latency']} />
                <Bar dataKey="latency" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Uptime by Application" data={latencyData} exportKeys={['name', 'uptime']} exportName="uptime-by-app">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} unit="%" />
                <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [`${v}%`, 'Uptime']} />
                <Bar dataKey="uptime" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Per-app health table */}
      <Panel title="Application Health Matrix" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Application</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Uptime</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Latency</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Error Rate</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Requests</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No applications connected</td></tr>
              ) : active.map((a) => {
                const status = deriveStatus(a);
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/apps/${a.slug}/health`)}>
                    <td className="px-4 py-2.5"><span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span></td>
                    <td className="px-4 py-2.5"><StatusBadge value={status} pulse /></td>
                    <td className="px-4 py-2.5 tabular-nums">{fmt.percent(a.uptime, 2)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{a.response_ms ? `${a.response_ms} ms` : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{a.error_rate ? fmt.percent(a.error_rate, 2) : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{fmt.compact(a.request_count || 0)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmt.ago(a.last_heartbeat)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Security events */}
      {securityEvents.length > 0 && (
        <Panel title="Recent Security Events" subtitle="Security-relevant activity across the platform" bodyClassName="p-0">
          <div className="divide-y">
            {securityEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                <AlertTriangle className={cn('h-4 w-4 shrink-0', ev.severity === 'critical' ? 'text-rose-500' : ev.severity === 'high' ? 'text-amber-500' : 'text-muted-foreground')} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{ev.event_type || ev.message}</div>
                  <div className="text-[11px] text-muted-foreground">{ev.actor} · {fmt.ago(ev.occurred_at || ev.created_date)}</div>
                </div>
                <StatusBadge value={ev.severity} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}