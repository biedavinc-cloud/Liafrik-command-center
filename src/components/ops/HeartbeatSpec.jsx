import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { LCP_VERSION } from '@/lib/protocol/connector';
import Panel from '@/components/kit/Panel';

export default function HeartbeatSpec({ app }) {
  const { t } = useT();
  const interval = app?.heartbeat_interval_sec || 60;
  const payload = {
    app_id: app?.id || '<application-id>',
    environment: app?.environment || 'production',
    version: app?.version || '1.0.0',
    status: 'online',
    checks: { database: 'ok', auth: 'ok', webhooks: 'ok' },
    sent_at: '<ISO-8601>',
  };
  return (
    <Panel title={t('heartbeat.title')} subtitle={t('heartbeat.sub', { version: LCP_VERSION })}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 text-[12.5px]">
          <p className="text-muted-foreground">{t('heartbeat.body')}</p>
          <ul className="space-y-1.5">
            <li className="flex justify-between border-b pb-1.5"><span>{t('heartbeat.interval')}</span><span className="font-medium">{interval}s</span></li>
            <li className="flex justify-between border-b pb-1.5"><span>{t('heartbeat.degradedAfter')}</span><span className="font-medium">{interval * 2}s</span></li>
            <li className="flex justify-between"><span>{t('heartbeat.offlineAfter')}</span><span className="font-medium">{interval * 5}s</span></li>
          </ul>
          <p className="text-[11.5px] text-amber-700">{t('heartbeat.pending')}</p>
        </div>
        <pre className="overflow-x-auto rounded-md bg-ink p-3.5 font-mono text-[11px] leading-relaxed text-slate-300">
{`POST /lcp/${LCP_VERSION}/heartbeat
Authorization: Bearer <app-credential>

${JSON.stringify(payload, null, 2)}`}
        </pre>
      </div>
    </Panel>
  );
}