import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAdministrators, useApplications, useAction } from '@/lib/data/hooks';
import { setAdministratorStatus } from '@/lib/services/identity';
import { useCan } from '@/lib/rbac';
import PageHeader from '@/components/kit/PageHeader';
import DataTable from '@/components/kit/DataTable';
import StatusBadge from '@/components/kit/StatusBadge';
import DemoBadge from '@/components/kit/DemoBadge';
import AdminDialog from '@/components/admins/AdminDialog';
import AdminDrawer from '@/components/admins/AdminDrawer';
import AdminRowMenu from '@/components/admins/AdminRowMenu';

export default function Administrators() {
  const { t, fmt } = useT();
  const can = useCan();
  const params = new URLSearchParams(window.location.search);
  const { data: admins = [], isLoading, error } = useAdministrators();
  const { data: apps = [] } = useApplications();
  const [appId, setAppId] = useState(params.get('app') || 'all');
  const [status, setStatus] = useState('all');
  const [dialog, setDialog] = useState({ open: params.get('new') === '1', admin: null });
  const [viewing, setViewing] = useState(null);
  const bulkSuspend = useAction((rows) => Promise.all(rows.filter((r) => r.status === 'active').map((r) => setAdministratorStatus(r, 'suspended'))), ['administrators']);

  useEffect(() => { const id = params.get('id'); if (id && admins.length) setViewing(admins.find((a) => a.id === id) || null); }, [admins.length]);

  const rows = useMemo(() => admins.filter((a) => (status === 'all' || a.status === status) && (appId === 'all' || a.assignments?.some((x) => x.application_id === appId) || (a.global_role && a.global_role !== 'none'))), [admins, status, appId]);
  const appName = (id) => apps.find((a) => a.id === id)?.name || '—';

  const columns = [
    { key: 'full_name', header: t('admins.name'), sortable: true, render: (a) => <div><div className="flex items-center gap-1.5 font-medium">{a.full_name}{a.is_demo && <DemoBadge />}</div><div className="text-[11px] text-muted-foreground">{a.email}</div></div> },
    { key: 'global_role', header: t('admins.globalRole'), render: (a) => t(`roles.${a.global_role || 'none'}`) },
    { key: 'assignments', header: t('admins.applications'), render: (a) => <div className="flex flex-wrap gap-1">{(a.assignments || []).map((x, i) => <span key={i} className="rounded border bg-muted/40 px-1.5 py-0.5 text-[10.5px]">{appName(x.application_id)} → {t(`roles.${x.role}`)}</span>)}{!a.assignments?.length && <span className="text-muted-foreground">{a.global_role !== 'none' ? t('admins.allApps') : '—'}</span>}</div>, exportValue: (a) => (a.assignments || []).map((x) => `${appName(x.application_id)}:${x.role}`).join('; ') },
    { key: 'status', header: t('apps.status'), render: (a) => <StatusBadge value={a.status} /> },
    { key: 'mfa_enabled', header: t('admins.mfa'), render: (a) => (a.mfa_enabled ? t('common.enabled') : <span className="text-amber-700">{t('common.disabled')}</span>) },
    { key: 'last_active', header: t('admins.lastActive'), sortable: true, render: (a) => fmt.ago(a.last_active) },
    { key: 'actions', header: '', render: (a) => <AdminRowMenu admin={a} onEdit={() => setDialog({ open: true, admin: a })} onView={() => setViewing(a)} /> },
  ];

  const toolbar = (
    <div className="flex gap-2">
      <Select value={appId} onValueChange={setAppId}><SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('switcher.all')}</SelectItem>{apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('filters.allStatuses')}</SelectItem>{['pending', 'active', 'suspended', 'revoked'].map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent></Select>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('nav.administrators')} subtitle={t('admins.subtitle')} breadcrumbs={[{ label: t('nav.administrators') }]}
        actions={can('admins.create') && <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setDialog({ open: true, admin: null })}><UserPlus className="h-3.5 w-3.5" />{t('admins.invite')}</Button>} />
      <DataTable columns={columns} rows={rows} loading={isLoading} error={error} searchKeys={['full_name', 'email']} selectable={can('admins.suspend')} exportName="administrators" toolbar={toolbar} onRowClick={setViewing}
        bulkActions={(sel, clear) => <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={() => bulkSuspend.mutate(sel, { onSuccess: clear })}><Ban className="h-3 w-3" />{t('admins.suspend')}</Button>}
        empty={{ title: t('admins.emptyTitle'), description: t('admins.emptyBody') }} />
      <AdminDialog open={dialog.open} admin={dialog.admin} apps={apps} admins={admins} onOpenChange={(o) => setDialog({ open: o, admin: o ? dialog.admin : null })} />
      <AdminDrawer admin={viewing} apps={apps} onClose={() => setViewing(null)} />
    </div>
  );
}