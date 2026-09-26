import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus } from '@/lib/status';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge from '@/components/kit/StatusBadge';
import DemoBadge from '@/components/kit/DemoBadge';
import AppActionsMenu from './AppActionsMenu';

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-medium tabular-nums">{value}</div>
    </div>
  );
}

export default function ApplicationCard({ app }) {
  const { t, fmt } = useT();
  return (
    <div className="surface group relative flex flex-col transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_28px_-14px_rgba(16,24,40,0.25)]">
      <Link to={`/apps/${app.slug}`} className="absolute inset-0 rounded-lg" aria-label={app.name} />
      <div className="flex items-start gap-3 p-4 pb-3">
        <AppIcon app={app} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold">{app.name}</h3>
          </div>
          <p className="truncate text-[11.5px] text-muted-foreground">{app.domain || '—'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge value={deriveStatus(app)} pulse />
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">{t(`env.${app.environment}`)}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">{t(`appType.${app.type}`)}</span>
            {app.is_demo && <DemoBadge />}
          </div>
        </div>
        <div className="relative z-10"><AppActionsMenu app={app} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3 border-t px-4 py-3">
        <Stat label={t('apps.users')} value={fmt.compact(app.users_count)} />
        <Stat label={t('apps.version')} value={app.version || '—'} />
        <Stat label={t('apps.health')} value={fmt.percent(app.uptime, 2)} />
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="truncate">{t('apps.heartbeat')} {fmt.ago(app.last_heartbeat)}</span>
        <StatusBadge value={app.connection_status} />
      </div>
    </div>
  );
}