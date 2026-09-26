import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useAudit } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import AuditTable from '@/components/audit/AuditTable';

export default function AuditLogs() {
  const { t } = useT();
  const { data: apps = [] } = useApplications();
  const { data = [], isLoading, error } = useAudit();
  const q = new URLSearchParams(window.location.search).get('q') || '';
  return (
    <div>
      <PageHeader title={t('nav.audit')} subtitle={t('audit.subtitle')} breadcrumbs={[{ label: t('nav.audit') }]} />
      <AuditTable key={q} events={data} apps={apps} loading={isLoading} error={error} initialQuery={q} />
    </div>
  );
}