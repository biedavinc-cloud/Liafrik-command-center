import React, { useState } from 'react';
import { Shield, Monitor, AlertTriangle, Lock, KeyRound, Eye } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useSecurityEvents, useSessions, useApplications, useApiKeys } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import MetricCard from '@/components/kit/MetricCard';
import DataTable from '@/components/kit/DataTable';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { revokeSession } from '@/lib/services/security';
import { useAction } from '@/lib/data/hooks';
import { useToast } from '@/components/ui/use-toast';

function SecurityScoreCard({ score, checks }) {
  const { t } = useT();
  const items = [
    { key: 'mfa', label: t('security.checks.mfa'), passed: checks.mfa },
    { key: 'sessions', label: t('security.checks.sessions'), passed: checks.sessions },
    { key: 'apiKeys', label: t('security.checks.apiKeys'), passed: checks.apiKeys },
    { key: 'audit', label: t('security.checks.audit'), passed: checks.audit },
    { key: 'webhooks', label: t('security.checks.webhooks'), passed: checks.webhooks },
    { key: 'ipRestrictions', label: t('security.checks.ipRestrictions'), passed: checks.ipRestrictions },
  ];
  return (
    <Panel title={t('security.scoreTitle')} subtitle={t('security.scoreSub')}>
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-brand/30">
          <span className="text-[24px] font-bold tabular-nums">{score ?? '—'}</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {items.map((c) => (
            <div key={c.key} className="flex items-center gap-2 text-[12.5px]">
              <span className={c.passed ? 'text-emerald-600' : 'text-amber-600'}>
                {c.passed ? '✓' : '○'}
              </span>
              <span className="text-muted-foreground">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function SessionsTab() {
  const { t } = useT();
  const { toast } = useToast();
  const { data: sessions = [], isLoading } = useSessions();
  const revoke = useAction((s) => revokeSession(s), ['sessions']);
  const columns = [
    { key: 'user_name', header: t('security.user'), sortable: true, render: (s) => <span className="font-medium">{s.user_name}</span> },
    { key: 'device', header: t('security.device'), render: (s) => `${s.device || '—'} · ${s.browser || ''}` },
    { key: 'location', header: t('security.location'), render: (s) => s.location || '—' },
    { key: 'ip', header: 'IP', render: (s) => <span className="font-mono text-[11.5px]">{s.ip || '—'}</span> },
    { key: 'application_name', header: t('security.application'), render: (s) => s.application_name || t('security.global') },
    { key: 'last_active', header: t('security.lastActive'), sortable: true, render: (s) => s.last_active ? new Date(s.last_active).toLocaleString() : '—' },
    { key: 'status', header: t('audit.outcome'), render: (s) => <StatusBadge value={s.status === 'active' ? 'active' : 'revoked'} /> },
    { key: 'actions', header: '', render: (s) => s.status === 'active' ? (
      <Button variant="outline" size="sm" className="h-7 text-[11.5px]" disabled={revoke.isPending} onClick={(e) => { e.stopPropagation(); revoke.mutate(s, { onSuccess: () => toast({ title: t('security.sessionRevoked') }) }); }}>
        {t('security.revoke')}
      </Button>
    ) : null },
  ];
  return <DataTable columns={columns} rows={sessions} loading={isLoading} searchKeys={['user_name', 'ip', 'location']} exportName="sessions" empty={{ title: t('security.noSessions'), description: t('security.noSessionsBody') }} />;
}

function EventsTab() {
  const { t } = useT();
  const { data: events = [], isLoading } = useSecurityEvents();
  const columns = [
    { key: 'type', header: t('security.eventType'), sortable: true, render: (e) => <span className="font-mono text-[11.5px]">{e.type}</span> },
    { key: 'severity', header: t('security.severity'), render: (e) => <StatusBadge value={e.severity === 'critical' ? 'critical' : e.severity === 'high' ? 'error' : e.severity === 'medium' ? 'warning' : 'info'} /> },
    { key: 'actor', header: t('audit.actor'), sortable: true },
    { key: 'description', header: t('security.description'), render: (e) => <span className="line-clamp-1">{e.description}</span> },
    { key: 'application_name', header: t('security.application'), render: (e) => e.application_name || t('security.global') },
    { key: 'ip', header: 'IP', render: (e) => <span className="font-mono text-[11.5px]">{e.ip || '—'}</span> },
    { key: 'created_date', header: t('audit.time'), sortable: true, render: (e) => new Date(e.created_date).toLocaleString() },
  ];
  return <DataTable columns={columns} rows={events} loading={isLoading} searchKeys={['type', 'actor', 'description']} exportName="security-events" empty={{ title: t('security.noEvents'), description: t('security.noEventsBody') }} />;
}

export default function Security() {
  const { t } = useT();
  const [tab, setTab] = useState('overview');
  const { data: events = [] } = useSecurityEvents();
  const { data: sessions = [] } = useSessions();
  const { data: apps = [] } = useApplications();
  const criticalEvents = events.filter((e) => e.severity === 'critical' || e.severity === 'high').length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;

  // Simple security score based on what's actually configured
  const checks = {
    mfa: false, // no MFA configured yet
    sessions: activeSessions > 0,
    apiKeys: apps.some((a) => a.credential_hint),
    audit: true, // audit is always on
    webhooks: apps.some((a) => a.capabilities?.includes('webhooks')),
    ipRestrictions: apps.some((a) => (a.ip_restrictions || []).length > 0),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passed / Object.keys(checks).length) * 100);

  const tabs = [
    { key: 'overview', label: t('security.tabs.overview') },
    { key: 'sessions', label: t('security.tabs.sessions') },
    { key: 'events', label: t('security.tabs.events') },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('nav.security')} subtitle={t('security.subtitle')} breadcrumbs={[{ label: t('nav.security') }]} />
      <div className="flex gap-1 border-b">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`relative px-3 pb-2.5 pt-1 text-[12.5px] font-medium transition-colors ${tab === tb.key ? 'text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-brand' : 'text-muted-foreground hover:text-foreground'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label={t('security.score')} value={`${score}/100`} icon={Shield} />
            <MetricCard label={t('security.activeSessions')} value={activeSessions} icon={Monitor} />
            <MetricCard label={t('security.criticalEvents')} value={criticalEvents} icon={AlertTriangle} />
            <MetricCard label={t('security.totalEvents')} value={events.length} icon={Eye} />
          </div>
          <SecurityScoreCard score={score} checks={checks} />
          <Panel title={t('security.recentEvents')} subtitle={t('security.recentEventsSub')}>
            {events.length === 0 ? <EmptyState title={t('security.noEvents')} description={t('security.noEventsBody')} /> : (
              <div className="space-y-2">
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-[12.5px]">
                    <StatusBadge value={e.severity === 'critical' ? 'critical' : e.severity === 'high' ? 'error' : e.severity === 'medium' ? 'warning' : 'info'} />
                    <span className="font-mono text-[11px] text-muted-foreground">{e.type}</span>
                    <span className="flex-1 truncate">{e.description}</span>
                    <span className="text-[11px] text-muted-foreground">{new Date(e.created_date).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'events' && <EventsTab />}
    </div>
  );
}