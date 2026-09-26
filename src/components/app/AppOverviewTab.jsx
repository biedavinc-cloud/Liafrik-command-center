import React from 'react';
import { Users, ArrowLeftRight, Wallet, HeartPulse, Timer } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useActivity } from '@/lib/data/hooks';
import { capabilityMap } from '@/lib/protocol/capabilities';
import { endpointFor } from '@/lib/protocol/connector';
import MetricCard from '@/components/kit/MetricCard';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import ActivityFeed from '@/components/overview/ActivityFeed';

export default function AppOverviewTab({ app }) {
  const { t, fmt } = useT();
  const { data: activity = [] } = useActivity();
  const caps = app.capabilities || [];
  const rows = [
    [t('apps.connection'), <StatusBadge key="c" value={app.connection_status} />],
    [t('app.lcpEndpoint'), <span key="e" className="break-all font-mono text-[11.5px]">{endpointFor(app, 'health') || '—'}</span>],
    [t('wizard.f.authMethod'), t(`auth.${app.auth_method}`)],
    [t('wizard.f.sso'), app.sso_enabled ? t('common.enabled') : t('common.disabled')],
    [t('app.credential'), app.credential_hint ? t('app.credentialVault', { hint: app.credential_hint }) : t('common.notSet')],
    [t('wizard.f.rateLimit'), `${fmt.number(app.rate_limit)} / h`],
    [t('app.paymentProvider'), app.payment_provider || '—'],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label={t('kpi.users')} value={fmt.number(app.users_count)} icon={Users} />
        {caps.includes('payments') && <MetricCard label={t('kpi.transactions')} value={fmt.number(app.transactions)} icon={ArrowLeftRight} />}
        {caps.includes('revenue') && <MetricCard label={t('kpi.revenue')} value={fmt.currency(app.revenue, app.currency || 'AED')} icon={Wallet} />}
        <MetricCard label={t('apps.health')} value={fmt.percent(app.uptime, 2)} icon={HeartPulse} />
        <MetricCard label={t('monitoring.response')} value={app.response_ms ? `${app.response_ms} ms` : '—'} icon={Timer} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t('app.connectionTitle')} subtitle={t('app.connectionSub')} bodyClassName="p-0">
          <dl className="divide-y text-[12.5px]">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-5 gap-2 px-4 py-2.5"><dt className="col-span-2 text-muted-foreground">{k}</dt><dd className="col-span-3">{v}</dd></div>)}
          </dl>
        </Panel>
        <Panel title={t('app.capabilities')} subtitle={t('app.capabilitiesSub', { n: caps.length })}>
          <div className="flex flex-wrap gap-1.5">
            {caps.map((k) => { const C = capabilityMap[k]; return C && <span key={k} className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-[11.5px]"><C.icon className="h-3 w-3 text-brand" />{t(`cap.${k}`)}</span>; })}
          </div>
        </Panel>
        <ActivityFeed apps={[app]} events={activity.filter((e) => e.application_id === app.id)} limit={6} />
      </div>
    </div>
  );
}