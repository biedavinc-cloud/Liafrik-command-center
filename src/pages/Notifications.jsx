import React, { useState } from 'react';
import { CheckCheck, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/I18nProvider';
import { useNotifications, useAction } from '@/lib/data/hooks';
import { markAllNotificationsRead } from '@/lib/services/identity';
import PageHeader from '@/components/kit/PageHeader';
import Segmented from '@/components/kit/Segmented';
import EmptyState from '@/components/kit/EmptyState';
import NotificationItem from '@/components/notifications/NotificationItem';
import NotificationRules from '@/components/notifications/NotificationRules';

const SEVERITIES = ['all', 'critical', 'warning', 'info', 'success'];

export default function Notifications() {
  const { t } = useT();
  const { data: notes = [], isLoading, error } = useNotifications();
  const [sev, setSev] = useState('all');
  const [read, setRead] = useState('all');
  const markAll = useAction(markAllNotificationsRead, ['notifications']);
  const list = notes.filter((n) => (sev === 'all' || n.severity === sev) && (read === 'all' || (read === 'unread' ? !n.read : n.read)));
  const unread = notes.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title={t('nav.notifications')}
        subtitle={t('notifications.subtitle', { n: unread })}
        breadcrumbs={[{ label: t('nav.notifications') }]}
        demo={notes.some((n) => n.is_demo)}
        actions={<Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate(notes)}><CheckCheck className="h-3.5 w-3.5" />{t('notifications.markAll')}</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="surface overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
            <Segmented value={sev} onChange={setSev} options={SEVERITIES.map((s) => ({ value: s, label: t(s === 'all' ? 'common.all' : `severity.${s}`) }))} className="max-w-full overflow-x-auto scrollbar-none" />
            <Segmented value={read} onChange={setRead} options={['all', 'unread', 'read'].map((s) => ({ value: s, label: t(`notifications.${s}`) }))} className="ml-auto" />
          </div>
          {error ? <EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} />
            : isLoading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            : list.length === 0 ? <EmptyState icon={BellOff} title={t('notifications.empty')} description={t('notifications.emptyBody')} />
            : <div className="divide-y">{list.map((n) => <NotificationItem key={n.id} n={n} />)}</div>}
        </div>
        <NotificationRules />
      </div>
    </div>
  );
}