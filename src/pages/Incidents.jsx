import React, { useState } from 'react';
import { Plus, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useIncidents, useApplications } from '@/lib/data/hooks';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import IncidentDialog from '@/components/incidents/IncidentDialog';

const SEVERITY_TONE = { critical: 'rose', high: 'rose', medium: 'amber', low: 'sky', info: 'sky' };

export default function Incidents() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: incidents = [], isLoading } = useIncidents();
  const { data: apps = [] } = useApplications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = incidents.filter((i) => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const open = filtered.filter((i) => i.status === 'open' || i.status === 'investigating').length;
  const critical = filtered.filter((i) => i.severity === 'critical').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('nav.incidents')}
        subtitle={t('incidents.subtitle', { open, critical })}
        breadcrumbs={[{ label: t('nav.incidents') }]}
        actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />{t('incidents.create')}</Button>}
      />

      <div className="flex flex-wrap gap-2">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-8 w-40 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="critical">{t('severity.critical')}</SelectItem>
            <SelectItem value="high">{t('incidents.high')}</SelectItem>
            <SelectItem value="medium">{t('incidents.medium')}</SelectItem>
            <SelectItem value="low">{t('incidents.low')}</SelectItem>
            <SelectItem value="info">{t('severity.info')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="open">{t('incidents.statusOpen')}</SelectItem>
            <SelectItem value="investigating">{t('incidents.statusInvestigating')}</SelectItem>
            <SelectItem value="mitigated">{t('incidents.statusMitigated')}</SelectItem>
            <SelectItem value="resolved">{t('incidents.statusResolved')}</SelectItem>
            <SelectItem value="closed">{t('incidents.statusClosed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted/40" />)}</div>
      ) : filtered.length === 0 ? (
        <Panel><EmptyState icon={AlertTriangle} title={t('incidents.empty')} description={t('incidents.emptyBody')} /></Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => {
            const app = apps.find((a) => a.id === inc.application_id);
            return (
              <div key={inc.id} className="surface p-4 transition-shadow hover:shadow-[0_4px_16px_-8px_rgba(16,24,40,0.15)]">
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${SEVERITY_TONE[inc.severity] === 'rose' ? 'bg-rose-50 text-rose-600' : SEVERITY_TONE[inc.severity] === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-semibold">{inc.title}</h3>
                      <StatusBadge value={inc.severity === 'critical' ? 'critical' : inc.severity === 'high' ? 'error' : inc.severity === 'medium' ? 'warning' : 'info'} />
                      <StatusBadge value={inc.status === 'open' ? 'error' : inc.status === 'resolved' || inc.status === 'closed' ? 'success' : 'warning'} />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">{inc.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                      <span>{inc.application_name || '—'}</span>
                      <span>{t(`env.${inc.environment}`)}</span>
                      {inc.correlation_id && <span className="font-mono">{inc.correlation_id}</span>}
                      <span>{fmt.dateTime(inc.created_date)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => app && navigate(`/apps/${app.slug}/incidents`)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {inc.timeline && inc.timeline.length > 0 && (
                  <div className="mt-3 ml-12 space-y-1.5 border-l pl-4">
                    {inc.timeline.slice(-3).map((tl, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                        <span className="font-mono">{new Date(tl.timestamp).toLocaleTimeString()}</span>
                        <span>{tl.event}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <IncidentDialog open={dialogOpen} onOpenChange={setDialogOpen} apps={apps} onCreated={() => toast({ title: t('incidents.created') })} />
    </div>
  );
}