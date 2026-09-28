import { invokeFunction } from '@/lib/api';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useDeployments, useAction } from '@/lib/data/hooks';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import AppIcon from '@/components/kit/AppIcon';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket, GitCommit, CheckCircle2, XCircle, Clock, PlayCircle, Zap, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  building: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Building' },
  deploying: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Deploying' },
  successful: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Successful' },
  failed: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-100', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Cancelled' },
};

function PipelineStage({ status, label, active }) {
  const cfg = { pending: 'bg-slate-200', running: 'bg-blue-500 animate-pulse', success: 'bg-emerald-500', failed: 'bg-rose-500' };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn('h-3 w-3 rounded-full', cfg[status] || cfg.pending)} />
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export default function DeploymentPipeline() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useApplications();
  const { data: deployments = [], isLoading: loadingDeps } = useDeployments();
  const [filterApp, setFilterApp] = useState('all');
  const [filterEnv, setFilterEnv] = useState('all');

  const active = apps.filter((a) => a.lifecycle !== 'archived');
  const filtered = useMemo(() => deployments.filter((d) => {
    if (filterApp !== 'all' && d.application_id !== filterApp) return false;
    if (filterEnv !== 'all' && d.environment !== filterEnv) return false;
    return true;
  }), [deployments, filterApp, filterEnv]);

  const stats = useMemo(() => ({
    total: deployments.length,
    successful: deployments.filter((d) => d.status === 'successful').length,
    failed: deployments.filter((d) => d.status === 'failed').length,
    avgDuration: (() => {
      const withDuration = deployments.filter((d) => d.duration_sec);
      return withDuration.length ? Math.round(withDuration.reduce((s, d) => s + d.duration_sec, 0) / withDuration.length) : 0;
    })(),
  }), [deployments]);

  const triggerDeploy = useAction(async ({ appId, env, version }) => {
    return invokeFunction('neonData', {
      entity: 'Deployment', operation: 'create',
      data: { application_id: appId, environment: env, version: version || 'v1.0.0', status: 'building', source: 'manual', deployed_at: new Date().toISOString() }
    });
  }, ['deployments']);

  const cards = [
    { label: 'Total Deployments', value: String(stats.total), icon: Rocket, sub: 'all time' },
    { label: 'Successful', value: String(stats.successful), icon: CheckCircle2, sub: `${stats.total ? Math.round(stats.successful / stats.total * 100) : 0}% success rate` },
    { label: 'Failed', value: String(stats.failed), icon: XCircle, sub: 'needs attention' },
    { label: 'Avg Duration', value: stats.avgDuration ? `${stats.avgDuration}s` : '—', icon: Timer, sub: 'build + deploy' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Deployment Pipeline" subtitle="Track deployment statuses, version history, and manual triggers" breadcrumbs={[{ label: 'Deployment Pipeline' }]} demo={deployments.some((d) => d.is_demo)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading || loadingDeps} />)}
      </div>

      {/* Active pipeline visualization */}
      <Panel title="Active Pipelines" subtitle="Live deployment stages for connected applications">
        {active.length === 0 ? (
          <EmptyState title="No applications" icon={Rocket} />
        ) : (
          <div className="space-y-3">
            {active.slice(0, 6).map((app) => {
              const appDeps = deployments.filter((d) => d.application_id === app.id).sort((a, b) => new Date(b.deployed_at) - new Date(a.deployed_at));
              const latest = appDeps[0];
              const stage = latest?.status === 'successful' ? 'success' : latest?.status === 'failed' ? 'failed' : latest?.status === 'building' ? 'running' : 'pending';
              return (
                <div key={app.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => navigate(`/apps/${app.slug}`)} className="flex items-center gap-2">
                      <AppIcon app={app} size="sm" />
                      <span className="text-[13px] font-medium">{app.name}</span>
                      {latest?.version && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{latest.version}</span>}
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <PipelineStage status={stage === 'success' ? 'success' : stage === 'failed' ? 'failed' : 'pending'} label="Build" />
                        <div className={cn('h-0.5 w-8', stage === 'success' ? 'bg-emerald-500' : stage === 'failed' ? 'bg-rose-500' : 'bg-slate-200')} />
                        <PipelineStage status={stage === 'success' ? 'success' : stage === 'failed' ? 'failed' : 'pending'} label="Deploy" />
                        <div className={cn('h-0.5 w-8', stage === 'success' ? 'bg-emerald-500' : 'bg-slate-200')} />
                        <PipelineStage status={stage === 'success' ? 'success' : 'pending'} label="Live" />
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => triggerDeploy.mutate({ appId: app.id, env: app.environment || 'production', version: `v${(parseFloat(app.version || '1.0') + 0.1).toFixed(1)}` })}>
                        <PlayCircle className="h-3 w-3" /> Deploy
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterApp} onValueChange={setFilterApp}>
          <SelectTrigger className="w-[200px] h-8 text-[12px]"><SelectValue placeholder="All applications" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All applications</SelectItem>
            {active.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEnv} onValueChange={setFilterEnv}>
          <SelectTrigger className="w-[160px] h-8 text-[12px]"><SelectValue placeholder="All environments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All environments</SelectItem>
            {['development', 'staging', 'production'].map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Deployment history table */}
      <Panel title="Deployment History" subtitle="Recent deployments across all applications" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Application</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Version</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Environment</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Commit</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Duration</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Deployed</th>
                <th className="px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No deployments found</td></tr>
              ) : filtered.slice(0, 30).map((d) => {
                const app = apps.find((a) => a.id === d.application_id);
                const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.building;
                return (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2.5"><span className="flex items-center gap-2 font-medium"><AppIcon app={app || {}} size="sm" />{app?.name || 'Unknown'}</span></td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{d.version || '—'}</td>
                    <td className="px-4 py-2.5"><span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', d.environment === 'production' ? 'bg-emerald-100 text-emerald-700' : d.environment === 'staging' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>{d.environment}</span></td>
                    <td className="px-4 py-2.5"><span className="flex items-center gap-1.5"><cfg.icon className={cn('h-3.5 w-3.5', cfg.color)} /><span className="text-[11.5px] font-medium">{cfg.label}</span></span></td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{d.commit ? d.commit.slice(0, 7) : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{d.duration_sec ? `${d.duration_sec}s` : '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmt.ago(d.deployed_at)}</td>
                    <td className="px-4 py-2.5"><span className="text-[11px] capitalize text-muted-foreground">{d.source || 'manual'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}