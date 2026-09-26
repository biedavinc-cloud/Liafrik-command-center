import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus } from '@/lib/status';
import Panel from '@/components/kit/Panel';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge from '@/components/kit/StatusBadge';

export default function AppHealthList({ apps }) {
  const { t, fmt } = useT();
  return (
    <Panel title={t('overview.appHealth')} subtitle={t('overview.appHealthSub')} bodyClassName="p-0" actions={<Link to="/monitoring" className="text-[11.5px] font-medium text-brand">{t('common.viewAll')}</Link>}>
      <ul className="divide-y">
        {apps.filter((a) => a.lifecycle === 'active').map((a) => (
          <li key={a.id}>
            <Link to={`/apps/${a.slug}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
              <AppIcon app={a} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium">{a.name}</div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.max(0, (a.uptime ?? 0) - 90) * 10}%` }} />
                </div>
              </div>
              <div className="w-14 text-right text-[11.5px] tabular-nums text-muted-foreground">{fmt.percent(a.uptime, 2)}</div>
              <StatusBadge value={deriveStatus(a)} className="hidden sm:inline-flex" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}