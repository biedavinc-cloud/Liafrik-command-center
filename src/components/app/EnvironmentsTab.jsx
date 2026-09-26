import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useEnvironments, useDeployments } from '@/lib/data/hooks';
import EnvironmentCard from '@/components/ops/EnvironmentCard';
import DeploymentsTable from '@/components/ops/DeploymentsTable';
import EmptyState from '@/components/kit/EmptyState';

const ORDER = { production: 0, staging: 1, development: 2 };

export default function EnvironmentsTab({ app }) {
  const { t } = useT();
  const envs = useEnvironments();
  const deps = useDeployments();
  const mine = (envs.data || []).filter((e) => e.application_id === app.id).sort((a, b) => ORDER[a.name] - ORDER[b.name]);
  return (
    <div className="space-y-5">
      {mine.length === 0 && !envs.isLoading ? (
        <div className="surface"><EmptyState title={t('envs.emptyTitle')} description={t('envs.emptyBody')} /></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">{mine.map((e) => <EnvironmentCard key={e.id} env={e} />)}</div>
      )}
      <div>
        <h2 className="mb-2.5 text-[13px] font-semibold">{t('deploy.title')}</h2>
        <DeploymentsTable deployments={(deps.data || []).filter((d) => d.application_id === app.id)} apps={[app]} loading={deps.isLoading} hideApp />
      </div>
    </div>
  );
}