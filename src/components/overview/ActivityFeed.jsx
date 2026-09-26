import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import Panel from '@/components/kit/Panel';
import AppIcon from '@/components/kit/AppIcon';
import DemoBadge from '@/components/kit/DemoBadge';

export default function ActivityFeed({ apps, events, limit = 8, title }) {
  const { t, fmt } = useT();
  const appOf = (id) => apps.find((a) => a.id === id);
  const rows = events.slice(0, limit);
  return (
    <Panel title={title || t('overview.activity')} subtitle={t('overview.activitySub')} bodyClassName="p-0" actions={rows.some((e) => e.is_demo) && <DemoBadge />}>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12px] text-muted-foreground">{t('overview.noActivity')}</p>
      ) : (
        <ol className="relative px-4 py-2">
          {rows.map((e) => {
            const app = appOf(e.application_id);
            const to = app ? `/apps/${app.slug}${e.capability && app.capabilities?.includes(e.capability) ? `/${e.capability}` : ''}` : '/';
            return (
              <li key={e.id}>
                <Link to={to} className="group -mx-2 flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50">
                  <span className="w-10 shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">{fmt.time(e.occurred_at || e.created_date)}</span>
                  {app && <AppIcon app={app} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-muted-foreground">{app?.name}</div>
                    <div className="truncate text-[12.5px] group-hover:text-foreground">{e.message}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}