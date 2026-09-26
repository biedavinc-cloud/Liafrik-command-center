import React, { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/I18nProvider';
import DataTable from '@/components/kit/DataTable';
import StatusBadge from '@/components/kit/StatusBadge';
import DemoBadge from '@/components/kit/DemoBadge';
import AuditDetailSheet from './AuditDetailSheet';

export default function AuditTable({ events, loading, error, apps = [], showAppFilter = true, initialQuery }) {
  const { t, fmt } = useT();
  const [outcome, setOutcome] = useState('all');
  const [appId, setAppId] = useState('all');
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => events.filter((e) => (outcome === 'all' || e.outcome === outcome) && (appId === 'all' || e.application_id === appId)), [events, outcome, appId]);

  const columns = [
    { key: 'created_date', header: t('audit.time'), sortable: true, render: (e) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{fmt.dateTime(e.created_date)}</span> },
    { key: 'actor', header: t('audit.actor'), sortable: true, render: (e) => <div><div className="font-medium">{e.actor}</div><div className="text-[11px] text-muted-foreground">{t(`roles.${e.actor_role}`)}</div></div> },
    { key: 'action', header: t('audit.action'), sortable: true, render: (e) => <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">{e.action}{e.is_demo && <DemoBadge />}</span> },
    { key: 'application_name', header: t('audit.application'), sortable: true, render: (e) => e.application_name || t('audit.global') },
    { key: 'environment', header: t('audit.environment'), render: (e) => (e.environment ? t(`env.${e.environment}`) : '—') },
    { key: 'resource', header: t('audit.resource'), render: (e) => <span className="text-muted-foreground">{e.resource}{e.resource_id ? ` · ${e.resource_id}` : ''}</span> },
    { key: 'ip', header: t('audit.ip'), render: (e) => <span className="font-mono text-[11.5px] text-muted-foreground">{e.ip || '—'}</span> },
    { key: 'outcome', header: t('audit.outcome'), render: (e) => <StatusBadge value={e.outcome} /> },
  ];

  const toolbar = (
    <div className="flex gap-2">
      <Select value={outcome} onValueChange={setOutcome}>
        <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit.allOutcomes')}</SelectItem>
          <SelectItem value="success">{t('status.success')}</SelectItem>
          <SelectItem value="failure">{t('status.failure')}</SelectItem>
        </SelectContent>
      </Select>
      {showAppFilter && (
        <Select value={appId} onValueChange={setAppId}>
          <SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('switcher.all')}</SelectItem>
            {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        searchKeys={['actor', 'action', 'application_name', 'resource', 'resource_id', 'ip']}
        pageSize={15}
        exportName="audit-log"
        toolbar={toolbar}
        onRowClick={setOpen}
        initialQuery={initialQuery}
        empty={{ title: t('audit.emptyTitle'), description: t('audit.emptyBody') }}
      />
      <AuditDetailSheet event={open} onClose={() => setOpen(null)} />
    </>
  );
}