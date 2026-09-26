import React, { useEffect, useState } from 'react';
import { Lock, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { useRoles, useAdministrators, useAction } from '@/lib/data/hooks';
import { saveRolePermissions } from '@/lib/services/identity';
import { useCan } from '@/lib/rbac';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import PermissionMatrix from '@/components/roles/PermissionMatrix';

export default function Roles() {
  const { t } = useT();
  const { toast } = useToast();
  const can = useCan();
  const { data: roles = [], isLoading, error } = useRoles();
  const { data: admins = [] } = useAdministrators();
  const [selectedId, setSelectedId] = useState(null);
  const role = roles.find((r) => r.id === selectedId) || roles[0];
  const [perms, setPerms] = useState([]);
  useEffect(() => setPerms(role?.permissions || []), [role?.id, role?.permissions]);
  const save = useAction(() => saveRolePermissions(role, perms), ['roles']);
  const holders = (key) => admins.filter((a) => a.global_role === key || a.assignments?.some((x) => x.role === key)).length;
  const dirty = role && JSON.stringify([...perms].sort()) !== JSON.stringify([...(role.permissions || [])].sort());
  const locked = role?.locked || !can('roles.manage');

  if (error) return <div className="surface"><EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} /></div>;

  return (
    <div>
      <PageHeader title={t('nav.roles')} subtitle={t('roles.subtitle')} breadcrumbs={[{ label: t('nav.roles') }]} />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="surface overflow-hidden">
          {isLoading ? <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div> : (
            <ul className="divide-y">
              {roles.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelectedId(r.id)} className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors', role?.id === r.id ? 'bg-brand-soft' : 'hover:bg-muted/50')}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-medium">{t(`roles.${r.key}`)}{r.locked && <Lock className="h-3 w-3 text-muted-foreground" />}</div>
                      <div className="text-[11px] text-muted-foreground">{t('roles.permCount', { n: r.permissions?.length || 0 })} · {t('roles.holders', { n: holders(r.key) })}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {role && (
          <Panel
            title={t(`roles.${role.key}`)}
            subtitle={t(`roleDesc.${role.key}`)}
            actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" disabled={locked || !dirty || save.isPending} onClick={() => save.mutate(undefined, { onSuccess: () => toast({ title: t('settings.saved') }) })}>{save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{t('common.save')}</Button>}
          >
            {role.locked && <p className="mb-3 flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-[11.5px] text-muted-foreground"><Lock className="h-3.5 w-3.5" />{t('roles.lockedNote')}</p>}
            <PermissionMatrix value={perms} onChange={setPerms} disabled={locked} />
            <p className="mt-4 text-[11.5px] text-muted-foreground">{t('roles.scopeNote')}</p>
          </Panel>
        )}
      </div>
    </div>
  );
}