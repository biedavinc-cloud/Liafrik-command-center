import React from 'react';
import { GitCommit } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import DataTable from '@/components/kit/DataTable';
import StatusBadge from '@/components/kit/StatusBadge';
import AppIcon from '@/components/kit/AppIcon';

export default function DeploymentsTable({ deployments, apps, loading, hideApp }) {
  const { t, fmt } = useT();
  const appOf = (id) => apps.find((a) => a.id === id);
  const columns = [
    !hideApp && { key: 'application_id', header: t('deploy.application'), render: (d) => { const a = appOf(d.application_id); return a ? <span className="flex items-center gap-2"><AppIcon app={a} size="sm" />{a.name}</span> : '—'; }, exportValue: (d) => appOf(d.application_id)?.name },
    { key: 'environment', header: t('deploy.environment'), render: (d) => t(`env.${d.environment}`) },
    { key: 'version', header: t('deploy.version'), render: (d) => <span className="font-medium">{d.version}</span> },
    { key: 'commit', header: t('deploy.commit'), render: (d) => <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-muted-foreground"><GitCommit className="h-3 w-3" />{d.commit || '—'}</span> },
    { key: 'deployed_at', header: t('deploy.time'), sortable: true, render: (d) => fmt.dateTime(d.deployed_at) },
    { key: 'status', header: t('deploy.status'), render: (d) => <StatusBadge value={d.status} /> },
    { key: 'duration_sec', header: t('deploy.duration'), sortable: true, render: (d) => (d.duration_sec ? `${Math.floor(d.duration_sec / 60)}m ${d.duration_sec % 60}s` : '—') },
  ].filter(Boolean);
  return <DataTable columns={columns} rows={deployments} loading={loading} pageSize={8} exportName="deployments" empty={{ title: t('deploy.emptyTitle'), description: t('deploy.emptyBody') }} />;
}