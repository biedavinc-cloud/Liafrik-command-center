import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApplications, useAction } from '@/lib/data/hooks';
import { markNotificationRead } from '@/lib/services/identity';
import { useT } from '@/lib/i18n/I18nProvider';

const META = {
  critical: [AlertOctagon, 'text-rose-600 bg-rose-50'],
  warning: [AlertTriangle, 'text-amber-600 bg-amber-50'],
  info: [Info, 'text-sky-600 bg-sky-50'],
  success: [CheckCircle2, 'text-emerald-600 bg-emerald-50'],
};

export default function NotificationItem({ n, compact }) {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: apps = [] } = useApplications();
  const app = apps.find((a) => a.id === n.application_id);
  const markRead = useAction(markNotificationRead, ['notifications']);
  const [Icon, tone] = META[n.severity] || META.info;

  const open = () => {
    if (!n.read) markRead.mutate(n);
    if (app) navigate(`/apps/${app.slug}`);
  };

  return (
    <div className={cn('group flex gap-3 px-4 transition-colors hover:bg-muted/50', compact ? 'py-2.5' : 'py-3.5', !n.read && 'bg-brand-soft/40')}>
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', tone)}><Icon className="h-3.5 w-3.5" /></span>
      <button onClick={open} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12.5px] font-medium">{n.title}</span>
          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
        </div>
        {n.body && <p className={cn('text-[11.5px] text-muted-foreground', compact && 'line-clamp-1')}>{n.body}</p>}
        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <span>{fmt.ago(n.created_date)}</span>
          {app && <><span>·</span><span>{app.name}</span></>}
          <span>·</span><span>{t(`severity.${n.severity}`)}</span>
        </div>
      </button>
      {!compact && !n.read && (
        <button onClick={() => markRead.mutate(n)} className="self-center text-[11px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">{t('notifications.markRead')}</button>
      )}
    </div>
  );
}