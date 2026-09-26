import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AppWindow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications } from '@/lib/data/hooks';
import { deriveStatus } from '@/lib/status';
import { useCan } from '@/lib/rbac';
import PageHeader from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import AppFilters from '@/components/apps/AppFilters';
import ApplicationCard from '@/components/apps/ApplicationCard';
import ApplicationList from '@/components/apps/ApplicationList';

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  users: (a, b) => (b.users_count || 0) - (a.users_count || 0),
  health: (a, b) => (b.uptime || 0) - (a.uptime || 0),
  heartbeat: (a, b) => new Date(b.last_heartbeat || 0) - new Date(a.last_heartbeat || 0),
};

export default function Applications() {
  const { t } = useT();
  const can = useCan();
  const { data: apps = [], isLoading, error } = useApplications();
  const [view, setView] = useState(() => localStorage.getItem('lcc.appsView') || 'grid');
  const [f, setF] = useState({ q: '', status: 'all', env: 'all', type: 'all', lifecycle: 'active', sort: 'name' });
  const changeView = (v) => { localStorage.setItem('lcc.appsView', v); setView(v); };

  const filtered = useMemo(() => apps.filter((a) =>
    (!f.q || `${a.name} ${a.domain} ${a.slug}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (f.status === 'all' || deriveStatus(a) === f.status) &&
    (f.env === 'all' || a.environment === f.env) &&
    (f.type === 'all' || a.type === f.type) &&
    (f.lifecycle === 'all' || a.lifecycle === f.lifecycle)
  ).sort(SORTS[f.sort]), [apps, f]);

  const create = can('applications.create') && (
    <Button asChild size="sm" className="h-8 gap-1.5 text-[12px]"><Link to="/apps/new"><Plus className="h-3.5 w-3.5" />{t('apps.create')}</Link></Button>
  );

  return (
    <div>
      <PageHeader title={t('nav.applications')} subtitle={t('apps.subtitle', { n: apps.length })} breadcrumbs={[{ label: t('nav.applications') }]} actions={create} />
      <AppFilters f={f} setF={setF} view={view} setView={changeView} />
      {error ? (
        <div className="surface"><EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} /></div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[196px] rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="surface"><EmptyState icon={AppWindow} title={apps.length ? t('apps.noMatch') : t('apps.emptyTitle')} description={apps.length ? t('apps.noMatchBody') : t('apps.emptyBody')} action={!apps.length && create} /></div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map((a) => <ApplicationCard key={a.id} app={a} />)}</div>
      ) : (
        <ApplicationList apps={filtered} />
      )}
    </div>
  );
}