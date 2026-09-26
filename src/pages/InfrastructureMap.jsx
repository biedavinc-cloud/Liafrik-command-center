import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useEnvironments, usePSPs, useIntegrations } from '@/lib/data/hooks';
import { deriveStatus } from '@/lib/status';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import MetricCard from '@/components/kit/MetricCard';
import StatusBadge, { StatusDot } from '@/components/kit/StatusBadge';
import AppIcon from '@/components/kit/AppIcon';
import EmptyState from '@/components/kit/EmptyState';
import { Network, Server, CreditCard, Cloud, ArrowRight, Boxes, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENV_COLORS = { development: 'border-blue-200 bg-blue-50/50 text-blue-700', staging: 'border-amber-200 bg-amber-50/50 text-amber-700', production: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' };
const STATUS_LINE = { online: 'bg-emerald-400', degraded: 'bg-amber-400', offline: 'bg-rose-400', unknown: 'bg-slate-300', warning: 'bg-amber-400' };

export default function InfrastructureMap() {
  const { t } = useT();
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useApplications();
  const { data: envs = [] } = useEnvironments();
  const { data: psps = [] } = usePSPs();
  const { data: integrations = [] } = useIntegrations();

  const active = apps.filter((a) => a.lifecycle !== 'archived');

  const nodes = useMemo(() => active.map((app) => {
    const appEnvs = envs.filter((e) => e.application_id === app.id);
    const appPsp = psps.find((p) => p.key === app.payment_provider || p.provider === app.payment_provider);
    const appIntegrations = integrations.filter((i) => i.status === 'connected');
    return { app, envs: appEnvs, psp: appPsp, integrations: appIntegrations };
  }), [active, envs, psps, integrations]);

  return (
    <div className="space-y-5">
      <PageHeader title="Infrastructure Map" subtitle="Visualize connections between applications, environments, and providers" breadcrumbs={[{ label: 'Infrastructure Map' }]} demo={apps.some((a) => a.is_demo)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Applications" value={String(active.length)} icon={Server} sub="connected" />
        <MetricCard label="Environments" value={String(envs.length)} icon={Layers} sub="across all apps" />
        <MetricCard label="Payment Providers" value={String(psps.filter((p) => p.status === 'connected').length)} icon={CreditCard} sub="active" />
        <MetricCard label="Integrations" value={String(integrations.filter((i) => i.status === 'connected').length)} icon={Network} sub="connected" />
      </div>

      {/* Visual map */}
      <Panel title="Connection Topology" subtitle="How applications connect to environments and external providers">
        {nodes.length === 0 ? (
          <EmptyState title="No applications" description="Register applications to see the infrastructure map" icon={Network} />
        ) : (
          <div className="space-y-4">
            {nodes.map(({ app, envs: appEnvs, psp, integrations: appIntegrations }) => {
              const status = deriveStatus(app);
              return (
                <div key={app.id} className="rounded-lg border bg-card p-4">
                  {/* App node */}
                  <div className="mb-3 flex items-center gap-3">
                    <button onClick={() => navigate(`/apps/${app.slug}`)} className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 transition-shadow hover:shadow-md">
                      <AppIcon app={app} size="sm" />
                      <div className="text-left">
                        <div className="text-[13px] font-semibold">{app.name}</div>
                        <div className="flex items-center gap-1.5">
                          <StatusDot value={status} className="h-1.5 w-1.5" />
                          <span className="text-[10px] text-muted-foreground">{app.type} · {app.environment}</span>
                        </div>
                      </div>
                    </button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Connections grid */}
                  <div className="ml-6 grid gap-3 border-l-2 border-border pl-4 sm:grid-cols-3">
                    {/* Environments */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><Cloud className="h-3 w-3" /> Environments</div>
                      <div className="flex flex-col gap-1.5">
                        {appEnvs.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">No environments</span>
                        ) : appEnvs.map((e) => (
                          <div key={e.id} className={cn('flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]', ENV_COLORS[e.name] || 'border-border bg-card')}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_LINE[e.status] || 'bg-slate-300')} />
                            <span className="font-medium capitalize">{e.name}</span>
                            {e.version && <span className="text-muted-foreground">v{e.version}</span>}
                          </div>
                        ))}
                        {appEnvs.length === 0 && (
                          <div className={cn('flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]', ENV_COLORS[app.environment])}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_LINE[app.status])} />
                            <span className="font-medium capitalize">{app.environment}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Provider */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><CreditCard className="h-3 w-3" /> Payment</div>
                      {app.payment_provider ? (
                        <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-[11px]">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold">{app.payment_provider[0]?.toUpperCase()}</div>
                          <div><div className="font-medium capitalize">{app.payment_provider}</div><div className="text-[10px] text-muted-foreground">{app.currency || 'USD'}</div></div>
                        </div>
                      ) : <span className="text-[11px] text-muted-foreground">No PSP</span>}
                    </div>

                    {/* Integrations */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><Boxes className="h-3 w-3" /> Integrations</div>
                      <div className="flex flex-col gap-1.5">
                        {appIntegrations.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">None connected</span>
                        ) : appIntegrations.slice(0, 4).map((i) => (
                          <div key={i.id} className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span className="font-medium">{i.provider}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground capitalize">{i.category?.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Provider summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Payment Providers" subtitle="Connected PSPs and their status" bodyClassName="p-0">
          <div className="divide-y">
            {psps.length === 0 ? <div className="p-6"><EmptyState title="No PSPs" icon={CreditCard} /></div> : psps.map((p) => (
              <div key={p.key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-[12px] font-bold">{p.display_name?.[0] || 'P'}</div>
                  <div><div className="text-[12.5px] font-medium">{p.display_name}</div><div className="text-[10px] text-muted-foreground">{p.supported_currencies?.length || 0} currencies</div></div>
                </div>
                <StatusBadge value={p.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="External Integrations" subtitle="Third-party service connections" bodyClassName="p-0">
          <div className="divide-y">
            {integrations.length === 0 ? <div className="p-6"><EmptyState title="No integrations" icon={Network} /></div> : integrations.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-3">
                <div><div className="text-[12.5px] font-medium">{i.provider}</div><div className="text-[10px] text-muted-foreground capitalize">{i.category?.replace('_', ' ')}</div></div>
                <StatusBadge value={i.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}