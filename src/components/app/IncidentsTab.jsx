import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import { useIncidentsByApp } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import IncidentDialog from '@/components/incidents/IncidentDialog';

export default function IncidentsTab({ app }) {
  const { t, fmt } = useT();
  const { data: incidents = [], isLoading } = useIncidentsByApp(app.id);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <Panel title={t('nav.incidents')} subtitle={t('incidents.subtitle', { open: incidents.filter((i) => i.status === 'open').length, critical: incidents.filter((i) => i.severity === 'critical').length })}
        actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />{t('incidents.create')}</Button>}>
        {isLoading ? <div className="py-8 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
         incidents.length === 0 ? <EmptyState icon={AlertTriangle} title={t('incidents.empty')} description={t('incidents.emptyBody')} /> : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="rounded-md border px-3 py-2.5 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="flex-1 font-medium">{inc.title}</span>
                  <StatusBadge value={inc.severity === 'critical' ? 'critical' : inc.severity === 'high' ? 'error' : inc.severity === 'medium' ? 'warning' : 'info'} />
                  <StatusBadge value={inc.status === 'open' ? 'error' : inc.status === 'resolved' || inc.status === 'closed' ? 'success' : 'warning'} />
                </div>
                {inc.description && <p className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{inc.description}</p>}
                {inc.timeline && inc.timeline.length > 0 && (
                  <div className="mt-2 ml-6 space-y-1 border-l pl-3">
                    {inc.timeline.slice(-3).map((tl, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{new Date(tl.timestamp).toLocaleTimeString()}</span>
                        <span>{tl.event}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
      <IncidentDialog open={dialogOpen} onOpenChange={setDialogOpen} apps={[app]} />
    </div>
  );
}