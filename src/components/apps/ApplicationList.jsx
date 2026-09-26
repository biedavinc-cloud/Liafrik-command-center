import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { deriveStatus } from '@/lib/status';
import DataTable from '@/components/kit/DataTable';
import AppIcon from '@/components/kit/AppIcon';
import StatusBadge from '@/components/kit/StatusBadge';
import DemoBadge from '@/components/kit/DemoBadge';
import AppActionsMenu from './AppActionsMenu';

export default function ApplicationList({ apps }) {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const columns = [
    { key: 'name', header: t('apps.name'), render: (a) => (
      <div className="flex items-center gap-2.5"><AppIcon app={a} size="sm" /><div className="min-w-0"><div className="flex items-center gap-1.5 font-medium">{a.name}{a.is_demo && <DemoBadge />}</div><div className="text-[11px] text-muted-foreground">{a.domain}</div></div></div>
    ) },
    { key: 'type', header: t('apps.type'), render: (a) => t(`appType.${a.type}`), exportValue: (a) => a.type },
    { key: 'environment', header: t('apps.environment'), render: (a) => t(`env.${a.environment}`) },
    { key: 'status', header: t('apps.status'), render: (a) => <StatusBadge value={deriveStatus(a)} />, exportValue: deriveStatus },
    { key: 'version', header: t('apps.version') },
    { key: 'users_count', header: t('apps.users'), render: (a) => fmt.number(a.users_count) },
    { key: 'uptime', header: t('apps.health'), render: (a) => fmt.percent(a.uptime, 2) },
    { key: 'last_heartbeat', header: t('apps.heartbeat'), render: (a) => fmt.ago(a.last_heartbeat) },
    { key: 'last_deployment', header: t('apps.deployment'), render: (a) => fmt.ago(a.last_deployment) },
    { key: 'actions', header: '', render: (a) => <div onClick={(e) => e.stopPropagation()}><AppActionsMenu app={a} /></div> },
  ];
  return <DataTable columns={columns} rows={apps} pageSize={20} exportName="applications" onRowClick={(a) => navigate(`/apps/${a.slug}`)} />;
}