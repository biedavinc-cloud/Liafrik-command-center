import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useIncidents } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';

export default function IncidentsPanel() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: incidents = [], isLoading } = useIncidents();
  const open = incidents.filter((i) => i.status === 'open' || i.status === 'investigating');
  const recent = (incidents.length > 0 ? incidents : []).slice(0, 5);

  return (
    <Panel title={t('nav.incidents')} subtitle={t('incidents.subtitle', { open: open.length, critical: incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed').length })}
      actions={<button onClick={() => navigate('/incidents')} className="text-[11.5px] text-brand hover:underline">{t('common.viewAll')}</button>}>
      {isLoading ? <div className="py-6 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
       recent.length === 0 ? <EmptyState title={t('incidents.empty')} description={t('incidents.emptyBody')} /> : (
        <div className="space-y-2">
          {recent.map((inc) => (
            <div key={inc.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-[12.5px] hover:bg-muted/40 cursor-pointer" onClick={() => navigate('/incidents')}>
              <AlertTriangle className={`h-4 w-4 shrink-0 ${inc.severity === 'critical' ? 'text-rose-500' : inc.severity === 'high' ? 'text-amber-500' : 'text-sky-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{inc.title}</div>
                <div className="text-[11px] text-muted-foreground">{inc.application_name} · {fmt.ago(inc.created_date)}</div>
              </div>
              <StatusBadge value={inc.status === 'open' ? 'error' : inc.status === 'resolved' || inc.status === 'closed' ? 'success' : 'warning'} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}