import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useEnvironments } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import AppIcon from '@/components/kit/AppIcon';
import EmptyState from '@/components/kit/EmptyState';
import EnvironmentCard from '@/components/ops/EnvironmentCard';

const ORDER = { production: 0, staging: 1, development: 2 };

export default function Environments() {
  const { t } = useT();
  const { data: apps = [] } = useApplications();
  const { data: envs = [], isLoading, error } = useEnvironments();
  const groups = apps.filter((a) => a.lifecycle !== 'archived').map((a) => ({ app: a, envs: envs.filter((e) => e.application_id === a.id).sort((x, y) => ORDER[x.name] - ORDER[y.name]) }));

  return (
    <div>
      <PageHeader title={t('nav.environments')} subtitle={t('envs.subtitle')} breadcrumbs={[{ label: t('nav.environments') }]} demo={envs.some((e) => e.is_demo)} />
      {error ? <div className="surface"><EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} /></div>
        : isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}</div>
        : (
          <div className="space-y-6">
            {groups.map(({ app, envs: list }) => (
              <section key={app.id}>
                <Link to={`/apps/${app.slug}/environments`} className="mb-2.5 inline-flex items-center gap-2 text-[13px] font-semibold hover:text-brand">
                  <AppIcon app={app} size="sm" />{app.name}<span className="font-normal text-muted-foreground">· {t('envs.count', { n: list.length })}</span>
                </Link>
                {list.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((e) => <EnvironmentCard key={e.id} env={e} />)}</div>
                  : <div className="surface"><EmptyState title={t('envs.emptyTitle')} description={t('envs.emptyBody')} className="py-6" /></div>}
              </section>
            ))}
          </div>
        )}
    </div>
  );
}