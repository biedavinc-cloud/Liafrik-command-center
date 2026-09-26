import React from 'react';
import { ExternalLink, Loader2, PlugZap, Wrench, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus } from '@/lib/status';
import { useCan } from '@/lib/rbac';
import { checkCompatibility } from '@/lib/protocol/compatibility';
import { isInMaintenance } from '@/lib/protocol/connector';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge from '@/components/kit/StatusBadge';
import DemoBadge from '@/components/kit/DemoBadge';
import AppActionsMenu, { useConnectionTest } from '@/components/apps/AppActionsMenu';

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[12.5px] font-medium">{children}</div>
    </div>
  );
}

export default function AppHeader({ app }) {
  const { t, fmt } = useT();
  const can = useCan();
  const test = useConnectionTest(app);
  return (
    <div className="surface mb-4 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <AppIcon app={app} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[19px] font-semibold tracking-tight">{app.name}</h1>
              <StatusBadge value={deriveStatus(app)} pulse />
              {isInMaintenance(app) && <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-amber-700 ring-1 ring-inset ring-amber-600/15"><Wrench className="h-3 w-3" />{t(`maintenance.${app.maintenance_mode}`)}</span>}
              {app.locked && <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-rose-700 ring-1 ring-inset ring-rose-600/15"><Lock className="h-3 w-3" />{t('actions.lock')}</span>}
              <StatusBadge value={app.compatibility_status || 'unknown'} />
              {app.is_demo && <DemoBadge />}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{app.description || app.domain}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]" disabled={!can('applications.edit') || !app.api_url || test.pending} onClick={test.run}>
            {test.pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{t('actions.test')}</span>
          </Button>
          {app.admin_url && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
              <a href={app.admin_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('app.nativeAdmin')}</span></a>
            </Button>
          )}
          <AppActionsMenu app={app} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4 lg:grid-cols-8">
        <Meta label={t('apps.environment')}>{t(`env.${app.environment}`)}</Meta>
        <Meta label={t('apps.version')}>{app.version || '—'}</Meta>
        <Meta label={t('protocol.version')}>{app.protocol_version || 'v1'}</Meta>
        <Meta label={t('protocol.connectorVersion')}>{app.connector_version || '1.0.0'}</Meta>
        <Meta label={t('apps.health')}>{fmt.percent(app.uptime, 2)}</Meta>
        <Meta label={t('apps.heartbeat')}>{fmt.ago(app.last_heartbeat)}</Meta>
        <Meta label={t('apps.connection')}><StatusBadge value={app.connection_status} /></Meta>
        <Meta label={t('apps.domain')}>{app.domain || '—'}</Meta>
      </div>
    </div>
  );
}