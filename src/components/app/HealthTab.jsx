import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus } from '@/lib/status';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import HeartbeatSpec from '@/components/ops/HeartbeatSpec';

export default function HealthTab({ app }) {
  const { t, fmt } = useT();
  const conn = app.connection_status;
  const checks = [
    [t('monitoring.status'), <StatusBadge key="s" value={deriveStatus(app)} pulse />],
    [t('monitoring.uptime'), fmt.percent(app.uptime, 2)],
    [t('monitoring.response'), app.response_ms ? `${app.response_ms} ms` : '—'],
    [t('monitoring.api'), <StatusBadge key="a" value={conn} />],
    [t('monitoring.auth'), <StatusBadge key="au" value={conn === 'connected' ? 'connected' : 'not_connected'} />],
    [t('monitoring.webhooks'), app.capabilities?.includes('webhooks') ? <StatusBadge key="w" value={conn === 'connected' ? 'connected' : 'not_connected'} /> : t('monitoring.notDeclared')],
    [t('monitoring.database'), t('monitoring.notExposed')],
    [t('monitoring.lastHeartbeat'), `${fmt.dateTime(app.last_heartbeat)} (${fmt.ago(app.last_heartbeat)})`],
    [t('apps.version'), app.version || '—'],
    [t('apps.deployment'), fmt.dateTime(app.last_deployment)],
  ];
  return (
    <div className="space-y-4">
      <Panel title={t('health.title')} subtitle={app.is_demo ? t('health.demoNote') : t('health.liveNote')} bodyClassName="p-0">
        <dl className="grid divide-y sm:grid-cols-2 sm:divide-y-0">
          {checks.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-[12.5px] sm:odd:border-r"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
        </dl>
      </Panel>
      <HeartbeatSpec app={app} />
    </div>
  );
}