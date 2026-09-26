import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useUsers, useAdministrators } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import DataTable from '@/components/kit/DataTable';
import MetricCard from '@/components/kit/MetricCard';
import { Users as UsersIcon, ShieldCheck, CircleCheck } from 'lucide-react';

export default function Users() {
  const { t, fmt } = useT();
  const { data: users = [], isLoading, error } = useUsers();
  const { data: admins = [] } = useAdministrators();
  const adminEmails = new Set(admins.map((a) => a.email?.toLowerCase()));
  const activeAdmins = admins.filter((a) => a.status === 'active');

  const columns = [
    { key: 'full_name', header: t('users.name'), sortable: true, render: (u) => <span className="font-medium">{u.full_name || '—'}</span> },
    { key: 'email', header: t('users.email'), sortable: true },
    { key: 'role', header: t('users.role'), render: (u) => <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{u.role === 'admin' ? t('users.roleAdmin') : t('users.roleUser')}</span> },
    { key: 'admin', header: t('users.admin'), render: (u) => adminEmails.has(u.email?.toLowerCase()) ? <span className="font-medium text-brand">{t('users.yes')}</span> : <span className="text-muted-foreground">{t('users.no')}</span> },
    { key: 'created_date', header: t('users.joined'), sortable: true, render: (u) => fmt.date(u.created_date) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.users')} subtitle={t('users.subtitle')} breadcrumbs={[{ label: t('nav.users') }]} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label={t('users.total')} value={fmt.number(users.length)} icon={UsersIcon} loading={isLoading} />
        <MetricCard label={t('users.admins')} value={fmt.number(admins.length)} icon={ShieldCheck} loading={isLoading} />
        <MetricCard label={t('users.active')} value={fmt.number(activeAdmins.length)} icon={CircleCheck} loading={isLoading} />
      </div>
      <DataTable columns={columns} rows={users} loading={isLoading} error={error} searchKeys={['full_name', 'email']} exportName="users" empty={{ title: t('users.empty'), description: t('users.emptyBody') }} />
    </div>
  );
}