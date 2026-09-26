import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useAdministrators, useNotifications, useActivity, useDeployments } from '@/lib/data/hooks';
import TimeRangeFilter from '@/components/kit/TimeRangeFilter';
import DemoBadge from '@/components/kit/DemoBadge';
import EmptyState from '@/components/kit/EmptyState';
import KpiGrid from '@/components/overview/KpiGrid';
import EcosystemChart from '@/components/overview/EcosystemChart';
import RevenueByApp from '@/components/overview/RevenueByApp';
import AttentionPanel from '@/components/overview/AttentionPanel';
import AppHealthList from '@/components/overview/AppHealthList';
import ActivityFeed from '@/components/overview/ActivityFeed';
import IncidentsPanel from '@/components/overview/IncidentsPanel';
import SecurityPanel from '@/components/overview/SecurityPanel';

export default function Overview() {
  const { t } = useT();
  const { user } = useAuth();
  const [range, setRange] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const apps = useApplications();
  const { data: admins = [] } = useAdministrators();
  const { data: notes = [] } = useNotifications();
  const { data: activity = [] } = useActivity();
  const { data: deployments = [] } = useDeployments();
  const list = apps.data || [];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const firstName = (user?.full_name || '').split(' ')[0] || t('roles.founder');

  if (apps.error) return <EmptyState tone="error" title={t('states.errorTitle')} description={t('states.errorBody')} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10.5px] font-semibold tracking-[0.22em] text-brand">LIAFRIK COMMAND CENTER</span>
            {list.some((a) => a.is_demo) && <DemoBadge />}
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t(`overview.greeting.${greet}`, { name: firstName })}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t('overview.tagline')}</p>
        </div>
        <TimeRangeFilter value={range} onChange={setRange} custom={custom} onCustom={setCustom} />
      </div>

      <KpiGrid apps={list} admins={admins} notes={notes} loading={apps.isLoading} />

      <div className="grid gap-4 xl:grid-cols-3">
        <EcosystemChart apps={list} range={range} custom={custom} className="xl:col-span-2" />
        <AttentionPanel apps={list} notes={notes} deployments={deployments} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <RevenueByApp apps={list} />
        <AppHealthList apps={list} />
        <ActivityFeed apps={list} events={activity} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <IncidentsPanel />
        <SecurityPanel />
      </div>
    </div>
  );
}