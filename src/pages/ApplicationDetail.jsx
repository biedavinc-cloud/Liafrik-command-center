import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAppBySlug, useAudit } from '@/lib/data/hooks';
import { moduleCapabilities, capabilityMap } from '@/lib/protocol/capabilities';
import { Breadcrumbs } from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import AppHeader from '@/components/app/AppHeader';
import AppTabs from '@/components/app/AppTabs';
import AppOverviewTab from '@/components/app/AppOverviewTab';
import ConnectorModule from '@/components/app/ConnectorModule';
import EnvironmentsTab from '@/components/app/EnvironmentsTab';
import HealthTab from '@/components/app/HealthTab';
import AppSettingsTab from '@/components/app/AppSettingsTab';
import DiagnosticsTab from '@/components/app/DiagnosticsTab';
import ApiKeysTab from '@/components/app/ApiKeysTab';
import WebhooksTab from '@/components/app/WebhooksTab';
import IncidentsTab from '@/components/app/IncidentsTab';
import ChangeHistoryTab from '@/components/app/ChangeHistoryTab';
import ConfigurationTab from '@/components/app/ConfigurationTab';
import MaintenanceBanner from '@/components/app/MaintenanceBanner';
import AuditTable from '@/components/audit/AuditTable';

function ActivityTab({ app }) {
  const { data = [], isLoading } = useAudit();
  return <AuditTable events={data.filter((e) => e.application_id === app.id)} loading={isLoading} showAppFilter={false} />;
}

export default function ApplicationDetail() {
  const { t } = useT();
  const { slug, tab = 'overview' } = useParams();
  const { data: app, isLoading, error } = useAppBySlug(slug);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-lg" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  if (error) return <div className="surface"><EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} /></div>;
  if (!app) return (
    <div className="surface"><EmptyState title={t('app.notFoundTitle')} description={t('app.notFoundBody', { slug })} action={<Button asChild size="sm" variant="outline"><Link to="/apps">{t('nav.applications')}</Link></Button>} /></div>
  );

  const moduleKeys = moduleCapabilities(app).map((c) => c.key).filter((k) => k !== 'webhooks');
  const tabs = ['overview', ...moduleKeys, 'environments', 'health', 'diagnostics', 'api-keys', 'webhooks', 'incidents', 'activity', 'changes', 'configuration', 'settings'];
  const label = capabilityMap[tab] && moduleKeys.includes(tab) ? t(`cap.${tab}`) : t(`appTabs.${tab}`);

  let content;
  if (tab === 'overview') content = <AppOverviewTab app={app} />;
  else if (moduleKeys.includes(tab)) content = <ConnectorModule app={app} capability={tab} />;
  else if (tab === 'environments') content = <EnvironmentsTab app={app} />;
  else if (tab === 'health') content = <HealthTab app={app} />;
  else if (tab === 'diagnostics') content = <DiagnosticsTab app={app} />;
  else if (tab === 'api-keys') content = <ApiKeysTab app={app} />;
  else if (tab === 'webhooks') content = <WebhooksTab app={app} />;
  else if (tab === 'incidents') content = <IncidentsTab app={app} />;
  else if (tab === 'activity') content = <ActivityTab app={app} />;
  else if (tab === 'changes') content = <ChangeHistoryTab app={app} />;
  else if (tab === 'configuration') content = <ConfigurationTab app={app} />;
  else if (tab === 'settings') content = <AppSettingsTab app={app} />;
  else content = <div className="surface"><EmptyState title={t('app.moduleMissingTitle')} description={t('app.moduleMissingBody')} /></div>;

  return (
    <div>
      <Breadcrumbs items={[{ label: t('nav.applications'), to: '/apps' }, { label: app.name, to: `/apps/${app.slug}` }, ...(tab !== 'overview' ? [{ label }] : [])]} />
      <MaintenanceBanner app={app} />
      <AppHeader app={app} />
      <AppTabs slug={app.slug} tabs={tabs} />
      <div key={tab} className="animate-in fade-in duration-300">{content}</div>
    </div>
  );
}