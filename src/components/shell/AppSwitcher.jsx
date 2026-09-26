import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LayoutGrid, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useApplications, useNotifications } from '@/lib/data/hooks';
import { deriveStatus } from '@/lib/status';
import { useT } from '@/lib/i18n/I18nProvider';
import AppIcon from '@/components/kit/AppIcon';
import { StatusDot } from '@/components/kit/StatusBadge';

export default function AppSwitcher({ className }) {
  const { t, fmt } = useT();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: apps = [] } = useApplications();
  const { data: notes = [] } = useNotifications();
  const slug = pathname.match(/^\/apps\/([^/]+)/)?.[1];
  const current = apps.find((a) => a.slug === slug);
  const go = (p) => { setOpen(false); navigate(p); };
  const unread = (id) => notes.filter((n) => !n.read && n.application_id === id).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn('h-8 items-center gap-2 rounded-md border bg-card pl-1.5 pr-2 text-[12px] font-medium transition-colors hover:border-foreground/20', className)}>
          {current ? <AppIcon app={current} size="sm" /> : <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted"><LayoutGrid className="h-3.5 w-3.5" /></span>}
          <span className="max-w-[140px] truncate">{current?.name || t('switcher.all')}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <Command>
          <CommandInput placeholder={t('switcher.search')} className="text-[12.5px]" />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>{t('palette.empty')}</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => go('/apps')} className="gap-2.5 text-[12.5px]"><LayoutGrid className="h-4 w-4" />{t('switcher.all')}</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t('nav.applications')}>
              {apps.filter((a) => a.lifecycle !== 'archived').map((a) => (
                <CommandItem key={a.id} value={`${a.name} ${a.slug}`} onSelect={() => go(`/apps/${a.slug}`)} className="gap-2.5 py-2">
                  <AppIcon app={a} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium"><span className="truncate">{a.name}</span><StatusDot value={deriveStatus(a)} /></div>
                    <div className="text-[11px] text-muted-foreground">{t(`env.${a.environment}`)} · {fmt.ago(a.last_heartbeat)}</div>
                  </div>
                  {unread(a.id) > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">{unread(a.id)}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => go('/apps/new')} className="gap-2.5 text-[12.5px]"><Plus className="h-4 w-4" />{t('apps.create')}</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}