import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAudit, useRoles } from '@/lib/data/hooks';
import StatusBadge from '@/components/kit/StatusBadge';
import AppIcon from '@/components/kit/AppIcon';

export default function AdminDrawer({ admin, apps, onClose }) {
  const { t, fmt } = useT();
  const { data: audit = [] } = useAudit();
  const { data: roles = [] } = useRoles();
  const keys = admin ? [admin.global_role, ...(admin.assignments || []).map((a) => a.role)] : [];
  const perms = [...new Set(roles.filter((r) => keys.includes(r.key)).flatMap((r) => r.permissions || []))].sort();
  const events = admin ? audit.filter((e) => e.actor === admin.full_name || e.resource_id === admin.email) : [];

  return (
    <Sheet open={!!admin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {admin && (
          <>
            <SheetHeader>
              <SheetTitle className="text-[16px]">{admin.full_name}</SheetTitle>
              <p className="text-[12px] text-muted-foreground">{admin.email}</p>
              <div className="flex gap-1.5 pt-1"><StatusBadge value={admin.status} /><span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium">{t(`roles.${admin.global_role}`)}</span></div>
            </SheetHeader>
            <Tabs defaultValue="apps" className="mt-5">
              <TabsList className="h-8 w-full justify-start overflow-x-auto">
                {['apps', 'permissions', 'activity', 'security'].map((k) => <TabsTrigger key={k} value={k} className="text-[11.5px]">{t(`admins.tabs.${k}`)}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="apps" className="mt-3 space-y-2">
                {(admin.assignments || []).map((a, i) => {
                  const app = apps.find((x) => x.id === a.application_id);
                  return <div key={i} className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-[12.5px]">{app && <AppIcon app={app} size="sm" />}<span className="flex-1 font-medium">{app?.name || '—'}</span><span className="text-muted-foreground">{t(`roles.${a.role}`)} · {t(`env.${a.environment || 'production'}`)}</span></div>;
                })}
                {!admin.assignments?.length && <p className="text-[12px] text-muted-foreground">{admin.global_role !== 'none' ? t('admins.globalScope') : t('admins.noAssignments')}</p>}
              </TabsContent>
              <TabsContent value="permissions" className="mt-3 flex flex-wrap gap-1">
                {perms.map((p) => <span key={p} className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10.5px]">{p}</span>)}
                {!perms.length && <p className="text-[12px] text-muted-foreground">—</p>}
              </TabsContent>
              <TabsContent value="activity" className="mt-3 divide-y rounded-md border">
                {events.map((e) => <div key={e.id} className="flex justify-between gap-2 px-3 py-2 text-[12px]"><span className="font-mono text-[11.5px]">{e.action}</span><span className="text-muted-foreground">{fmt.ago(e.created_date)}</span></div>)}
                {!events.length && <p className="p-3 text-[12px] text-muted-foreground">{t('overview.noActivity')}</p>}
              </TabsContent>
              <TabsContent value="security" className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between rounded-md border px-3 py-2"><span>{t('admins.mfa')}</span><StatusBadge value={admin.mfa_enabled ? 'active' : 'warning'} /></div>
                <div className="flex justify-between rounded-md border px-3 py-2"><span>{t('admins.lastActive')}</span><span>{fmt.dateTime(admin.last_active)}</span></div>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-[11.5px] text-muted-foreground">{t('admins.sessionsPending')}</p>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}