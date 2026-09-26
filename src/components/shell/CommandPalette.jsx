import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, ScrollText, Bell, Languages, ExternalLink, Activity, Settings, LayoutDashboard, History, ShieldCheck, AlertCircle, AlertTriangle, Shield } from 'lucide-react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useApplications, useAdministrators, useAudit, useNotifications, useIncidents, useSecurityEvents } from '@/lib/data/hooks';
import { moduleCapabilities } from '@/lib/protocol/capabilities';
import { useT } from '@/lib/i18n/I18nProvider';
import AppIcon from '@/components/kit/AppIcon';
import { NAV_ITEMS } from './navConfig';

const itemCls = 'gap-2.5 text-[12.5px]';

export default function CommandPalette({ open, onOpenChange }) {
  const { t, lang, setLang } = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const { data: apps = [] } = useApplications();
  const { data: admins = [] } = useAdministrators();
  const { data: audit = [] } = useAudit();
  const { data: notes = [] } = useNotifications();
  const { data: incidents = [] } = useIncidents();
  const { data: secEvents = [] } = useSecurityEvents();
  const current = apps.find((a) => a.slug === pathname.match(/^\/apps\/([^/]+)/)?.[1]);
  const run = (fn) => { onOpenChange(false); setQ(''); fn(); };
  const go = (p) => run(() => navigate(p));
  const appName = (id) => apps.find((a) => a.id === id)?.name;
  const searching = q.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={q} onValueChange={setQ} placeholder={t('palette.placeholder')} className="text-[13px]" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty className="py-8 text-center text-[12.5px] text-muted-foreground">{t('palette.empty')}</CommandEmpty>
        {current && (
          <CommandGroup heading={current.name}>
            <CommandItem className={itemCls} onSelect={() => go(`/apps/${current.slug}`)}><LayoutDashboard className="h-4 w-4" />{t('appTabs.overview')}</CommandItem>
            {moduleCapabilities(current).map((c) => (
              <CommandItem key={c.key} className={itemCls} value={`${current.name} ${t(`cap.${c.key}`)}`} onSelect={() => go(`/apps/${current.slug}/${c.key}`)}><c.icon className="h-4 w-4" />{t('palette.open', { name: t(`cap.${c.key}`) })}</CommandItem>
            ))}
            <CommandItem className={itemCls} onSelect={() => go(`/apps/${current.slug}/health`)}><Activity className="h-4 w-4" />{t('palette.viewHealth')}</CommandItem>
            <CommandItem className={itemCls} onSelect={() => go(`/apps/${current.slug}/activity`)}><History className="h-4 w-4" />{t('palette.viewLogs')}</CommandItem>
            <CommandItem className={itemCls} onSelect={() => go(`/apps/${current.slug}/settings`)}><Settings className="h-4 w-4" />{t('palette.open', { name: t('appTabs.settings') })}</CommandItem>
            {current.admin_url && <CommandItem className={itemCls} onSelect={() => run(() => window.open(current.admin_url, '_blank', 'noopener'))}><ExternalLink className="h-4 w-4" />{t('app.nativeAdmin')}</CommandItem>}
          </CommandGroup>
        )}
        <CommandGroup heading={t('palette.actions')}>
          <CommandItem className={itemCls} onSelect={() => go('/apps/new')}><Plus className="h-4 w-4" />{t('apps.create')}</CommandItem>
          <CommandItem className={itemCls} onSelect={() => go('/administrators?new=1')}><UserPlus className="h-4 w-4" />{t('admins.add')}</CommandItem>
          <CommandItem className={itemCls} onSelect={() => go('/audit')}><ScrollText className="h-4 w-4" />{t('palette.viewAudit')}</CommandItem>
          <CommandItem className={itemCls} onSelect={() => go('/notifications')}><Bell className="h-4 w-4" />{t('palette.openNotifications')}</CommandItem>
          <CommandItem className={itemCls} onSelect={() => run(() => setLang(lang === 'en' ? 'fr' : 'en'))}><Languages className="h-4 w-4" />{t('palette.switchLanguage')}</CommandItem>
        </CommandGroup>
        <CommandGroup heading={t('palette.navigation')}>
          {NAV_ITEMS.map((it) => (
            <CommandItem key={it.key} className={itemCls} value={`go ${t(`nav.${it.key}`)}`} onSelect={() => go(it.path)}><it.icon className="h-4 w-4" />{t('palette.goTo', { name: t(`nav.${it.key}`) })}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('nav.applications')}>
          {apps.map((a) => (
            <CommandItem key={a.id} className={itemCls} value={`${a.name} ${a.slug} ${a.domain || ''}`} onSelect={() => go(`/apps/${a.slug}`)}><AppIcon app={a} size="sm" />{t('palette.open', { name: a.name })}<span className="ml-auto text-[11px] text-muted-foreground">{a.domain}</span></CommandItem>
          ))}
        </CommandGroup>
        {searching && (
          <>
            <CommandGroup heading={t('nav.administrators')}>
              {admins.map((ad) => (
                <CommandItem key={ad.id} className={itemCls} value={`${ad.full_name} ${ad.email}`} onSelect={() => go(`/administrators?id=${ad.id}`)}>
                  <ShieldCheck className="h-4 w-4" />{ad.full_name}
                  <span className="ml-auto truncate text-[11px] text-muted-foreground">{(ad.assignments || []).map((x) => appName(x.application_id)).filter(Boolean).join(', ') || t(`roles.${ad.global_role}`)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={t('nav.audit')}>
              {audit.slice(0, 50).map((e) => (
                <CommandItem key={e.id} className={itemCls} value={`${e.action} ${e.actor} ${e.application_name || ''} ${e.resource_id || ''} ${e.id}`} onSelect={() => go(`/audit?q=${encodeURIComponent(e.resource_id || e.action)}`)}>
                  <ScrollText className="h-4 w-4" />{e.action}<span className="ml-auto text-[11px] text-muted-foreground">{e.application_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={t('palette.alerts')}>
              {notes.map((n) => (
                <CommandItem key={n.id} className={itemCls} value={`${n.title} ${n.body || ''} ${n.id}`} onSelect={() => go('/notifications')}>
                  <AlertCircle className="h-4 w-4" />{n.title}<span className="ml-auto text-[11px] text-muted-foreground">{appName(n.application_id)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={t('nav.incidents')}>
              {incidents.slice(0, 10).map((inc) => (
                <CommandItem key={inc.id} className={itemCls} value={`${inc.title} ${inc.description || ''} ${inc.application_name || ''} ${inc.correlation_id || ''}`} onSelect={() => go('/incidents')}>
                  <AlertTriangle className="h-4 w-4" />{inc.title}<span className="ml-auto text-[11px] text-muted-foreground">{inc.application_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={t('nav.security')}>
              {secEvents.slice(0, 10).map((e) => (
                <CommandItem key={e.id} className={itemCls} value={`${e.type} ${e.description} ${e.actor || ''}`} onSelect={() => go('/security')}>
                  <Shield className="h-4 w-4" />{e.description}<span className="ml-auto text-[11px] text-muted-foreground">{e.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}