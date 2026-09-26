import React, { useState } from 'react';
import { Code, Filter } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAllApiLogs, useApplications } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import DataTable from '@/components/kit/DataTable';
import StatusBadge from '@/components/kit/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusTone = (s) => (s >= 200 && s < 300 ? 'success' : s >= 400 && s < 500 ? 'warning' : s >= 500 ? 'error' : 'unknown');

export default function ApiLogs() {
  const { t, fmt } = useT();
  const { data: logs = [], isLoading } = useAllApiLogs();
  const { data: apps = [] } = useApplications();
  const [appFilter, setAppFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = logs.filter((l) => {
    if (appFilter !== 'all' && l.application_id !== appFilter) return false;
    if (envFilter !== 'all' && l.environment !== envFilter) return false;
    if (statusFilter === 'success' && !(l.status >= 200 && l.status < 300)) return false;
    if (statusFilter === 'error' && l.status < 400) return false;
    return true;
  });

  const columns = [
    { key: 'created_date', header: t('audit.time'), sortable: true, render: (l) => <span className="font-mono text-[11px]">{new Date(l.created_date).toLocaleString()}</span> },
    { key: 'application_name', header: t('security.application'), sortable: true, render: (l) => l.application_name || '—' },
    { key: 'method', header: t('apiLogs.method'), render: (l) => <span className="font-mono text-[11px] font-semibold">{l.method}</span> },
    { key: 'endpoint', header: t('apiLogs.endpoint'), render: (l) => <span className="font-mono text-[11px]">{l.endpoint}</span> },
    { key: 'status', header: t('apiLogs.status'), sortable: true, render: (l) => <StatusBadge value={statusTone(l.status)} /> },
    { key: 'latency_ms', header: t('apiLogs.latency'), sortable: true, render: (l) => `${l.latency_ms || '—'} ms` },
    { key: 'environment', header: t('apps.environment'), render: (l) => t(`env.${l.environment}`) },
    { key: 'correlation_id', header: t('apiLogs.correlationId'), render: (l) => <span className="font-mono text-[10.5px] text-muted-foreground">{l.correlation_id || '—'}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.api-logs')} subtitle={t('apiLogs.subtitle')} breadcrumbs={[{ label: t('nav.api-logs') }]} />
      <div className="flex flex-wrap gap-2">
        <Select value={appFilter} onValueChange={setAppFilter}>
          <SelectTrigger className="h-8 w-48 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('apps.name')}</SelectItem>
            {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="h-8 w-36 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allEnvironments')}</SelectItem>
            <SelectItem value="production">{t('env.production')}</SelectItem>
            <SelectItem value="staging">{t('env.staging')}</SelectItem>
            <SelectItem value="development">{t('env.development')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="success">{t('status.success')}</SelectItem>
            <SelectItem value="error">{t('status.failure')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} rows={filtered} loading={isLoading} searchKeys={['endpoint', 'correlation_id', 'application_name']} exportName="api-logs" pageSize={15} empty={{ title: t('apiLogs.empty'), description: t('apiLogs.emptyBody') }} />
    </div>
  );
}