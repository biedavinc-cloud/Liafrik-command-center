import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, useAction } from '@/lib/data/hooks';
import { markAllNotificationsRead } from '@/lib/services/identity';
import { useT } from '@/lib/i18n/I18nProvider';
import NotificationItem from '@/components/notifications/NotificationItem';

export default function NotificationBell() {
  const { t } = useT();
  const { data: notes = [] } = useNotifications();
  const markAll = useAction(markAllNotificationsRead, ['notifications']);
  const unread = notes.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label={t('nav.notifications')}>
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-[13px] font-semibold">{t('nav.notifications')}</span>
          <button disabled={!unread || markAll.isPending} onClick={() => markAll.mutate(notes)} className="text-[11.5px] font-medium text-brand disabled:opacity-40">{t('notifications.markAll')}</button>
        </div>
        <div className="max-h-[360px] divide-y overflow-y-auto">
          {notes.slice(0, 6).map((n) => <NotificationItem key={n.id} n={n} compact />)}
          {notes.length === 0 && <p className="p-6 text-center text-[12px] text-muted-foreground">{t('notifications.empty')}</p>}
        </div>
        <Link to="/notifications" className="block border-t py-2.5 text-center text-[12px] font-medium hover:bg-muted">{t('notifications.viewAll')}</Link>
      </PopoverContent>
    </Popover>
  );
}