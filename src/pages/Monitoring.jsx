import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useDeployments } from '@/lib/data/hooks';
import { deriveStatus, ecosystemStatus, avgUptime } from '@/lib/status';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/kit/PageHeader';
import DataTable from '@/components/kit/DataTable';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge, { StatusDot } from '@/components/kit/StatusBadge';
import DeploymentsTable from '@/components/ops/DeploymentsTable';
import HeartbeatSpec from '@/components/ops/HeartbeatSpec';

const BANNER = { online: 'border-emerald-200 bg-emerald-50/60', degraded: 'border-amber-200 bg-amber-50/60', offline: 'border-rose-200 bg-rose-50/60', unknown: 'border-border bg-card' };

export default function Monitoring() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: apps = [], isLoading, error } = useApplications();
  const deps = useDeployments();
  const active = apps.filter((a) => a.lifecycle !== 'archived');
  const eco = ecosystemStatus(apps);
  const counts = ['online', 'degraded', 'warning', 'offline', 'unknown'].map((s) => [s, active.filter((a) => deriveStatus(a) === s).length]);
  const conn = (a, cap) => (cap && !a.capabilities?.includes(cap) ? <span className="text-muted-foreground">—</span> : <StatusBadge value={a.connection_status === 'connected' ? 'connected' : 'not_connected'} />);

  const columns = [
    { key: 'name', header: t('apps.name'), sortable: true, render: (a) => <span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span> },
    { key: 'status', header: t('monitoring.status'), render: (a) => <StatusBadge value={deriveStatus(a)} pulse />, exportValue: deriveStatus },
    { key: 'uptime', header: t('monitoring.uptime'), sortable: true, render: (a) => fmt.percent(a.uptime, 2) },
    { key: 'response_ms', header: t('monitoring.response'), sortable: true, render: (a) => (a.response_ms ? `${a.response_ms} ms` : '—') },
    { key: 'api', header: t('monitoring.api'), render: (a) => <StatusBadge value={a.connection_status} />, exportValue: (a) => a.connection_status },
    { key: 'auth', header: t('monitoring.auth'), render: (a) => conn(a) },
    { key: 'webhooks', header: t('monitoring.webhooks'), render: (a) => conn(a, 'webhooks') },
    { key: 'database', header: t('monitoring.database'), render: () => <span className="text-muted-foreground">{t('monitoring.notExposed')}</span> },
    { key: 'last_heartbeat', header: t('monitoring.lastHeartbeat'), sortable: true, render: (a) => fmt.ago(a.last_heartbeat) },
    { key: 'version', header: t('apps.version') },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.monitoring')} subtitle={t('monitoring.subtitle')} breadcrumbs={[{ label: t('nav.monitoring') }]} demo={apps.some((a) => a.is_demo)} />
      <div className={cn('flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between', BANNER[eco])}>
        <div className="flex items-center gap-3">
          <StatusDot value={eco} pulse className="h-2.5 w-2.5 [&>span]:h-2.5 [&>span]:w-2.5" />
          <div>
            <div className="label-caps">{t('monitoring.global')}</div>
            <div className="text-[15px] font-semibold">{t(`systemStatus.${eco}`)}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
          {counts.map(([s, n]) => <span key={s} className="flex items-center gap-1.5"><StatusDot value={s} />{t(`status.${s}`)} <b className="tabular-nums">{n}</b></span>)}
          <span className="border-l pl-5 text-muted-foreground">{t('kpi.avgUptime')} <b className="text-foreground">{fmt.percent(avgUptime(active), 2)}</b></span>
        </div>
      </div>
      <DataTable columns={columns} rows={active} loading={isLoading} error={error} searchKeys={['name', 'domain']} exportName="monitoring" onRowClick={(a) => navigate(`/apps/${a.slug}/health`)} />
      <div>
        <h2 className="mb-2.5 text-[13px] font-semibold">{t('deploy.title')}</h2>
        <DeploymentsTable deployments={deps.data || []} apps={apps} loading={deps.isLoading} />
      </div>
      <HeartbeatSpec />
    </div>
  );
}