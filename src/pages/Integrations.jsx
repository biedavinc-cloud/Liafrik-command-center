import React from 'react';
import { GitBranch, Cloud, Database, CreditCard, Mail, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/I18nProvider';
import { useIntegrations, useApplications } from '@/lib/data/hooks';
import { LCP_MODULES, LCP_VERSION } from '@/lib/protocol/connector';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import DataTable from '@/components/kit/DataTable';
import AppIcon from '@/components/kit/AppIcon';

const CAT_ICON = { source_control: GitBranch, edge: Cloud, database: Database, payments: CreditCard, email: Mail, analytics: BarChart3 };
const SDK = ['registration', 'auth', 'heartbeat', 'health', 'metrics', 'audit', 'admin', 'permissions', 'notifications', 'webhooks'];

export default function Integrations() {
  const { t } = useT();
  const { data: providers = [] } = useIntegrations();
  const { data: apps = [], isLoading } = useApplications();
  const columns = [
    { key: 'name', header: t('apps.name'), render: (a) => <span className="flex items-center gap-2 font-medium"><AppIcon app={a} size="sm" />{a.name}</span> },
    { key: 'connection_status', header: t('apps.connection'), render: (a) => <StatusBadge value={a.connection_status} /> },
    { key: 'auth_method', header: t('wizard.f.authMethod'), render: (a) => t(`auth.${a.auth_method}`) },
    { key: 'credential_hint', header: t('app.credential'), render: (a) => (a.credential_hint ? <span className="font-mono text-[11.5px]">{a.credential_hint}</span> : <span className="text-muted-foreground">{t('common.notSet')}</span>) },
    { key: 'webhooks', header: t('cap.webhooks'), render: (a) => (a.capabilities?.includes('webhooks') ? t('integrations.declared') : '—') },
    { key: 'rate_limit', header: t('wizard.f.rateLimit'), render: (a) => `${a.rate_limit || '—'} / h` },
  ];

  return (
    <div>
      <PageHeader title={t('nav.integrations')} subtitle={t('integrations.subtitle')} breadcrumbs={[{ label: t('nav.integrations') }]} />
      <Tabs defaultValue="providers">
        <TabsList className="mb-4 h-9">
          {['providers', 'connections', 'protocol'].map((k) => <TabsTrigger key={k} value={k} className="text-[12px]">{t(`integrations.tabs.${k}`)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="providers">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {providers.map((p) => {
              const Icon = CAT_ICON[p.category] || Cloud;
              return (
                <div key={p.id} className="surface p-4">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/40"><Icon className="h-4 w-4" /></span>
                    <StatusBadge value={p.status} />
                  </div>
                  <div className="mt-3 text-[13.5px] font-semibold">{p.provider}</div>
                  <div className="text-[11.5px] text-muted-foreground">{t(`intCat.${p.category}`)}</div>
                  <div className="mt-3 border-t pt-2.5 font-mono text-[10.5px] text-muted-foreground">adapter: {p.adapter}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11.5px] text-muted-foreground">{t('integrations.honestNote')}</p>
        </TabsContent>
        <TabsContent value="connections">
          <DataTable columns={columns} rows={apps} loading={isLoading} searchKeys={['name']} exportName="connections" />
        </TabsContent>
        <TabsContent value="protocol" className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('integrations.lcpTitle', { version: LCP_VERSION })} subtitle={t('integrations.lcpSub')} bodyClassName="p-0">
            <ul className="divide-y">
              {LCP_MODULES.map((m) => (
                <li key={m.key} className="flex items-center gap-3 px-4 py-2 text-[12px]">
                  <span className="w-12 font-mono text-[10.5px] font-semibold text-brand">{m.method}</span>
                  <span className="flex-1 font-mono">/lcp/{LCP_VERSION}{m.path}</span>
                  <span className="text-muted-foreground">{t(`lcp.${m.key}`)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="@liafrik/control-sdk" subtitle={t('integrations.sdkSub')}>
            <div className="flex flex-wrap gap-1.5">
              {SDK.map((k) => <span key={k} className="rounded-md border bg-muted/40 px-2 py-1 text-[11.5px]">{t(`sdk.${k}`)}</span>)}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">{t('integrations.sdkNote')}</p>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}