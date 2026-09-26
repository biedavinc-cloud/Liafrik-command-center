import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { useSecurityEvents } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';

export default function SecurityPanel() {
  const { t, fmt } = useT();
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useSecurityEvents();
  const recent = events.slice(0, 5);

  return (
    <Panel title={t('nav.security')} subtitle={t('security.recentEventsSub')}
      actions={<button onClick={() => navigate('/security')} className="text-[11.5px] text-brand hover:underline">{t('common.viewAll')}</button>}>
      {isLoading ? <div className="py-6 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
       recent.length === 0 ? <EmptyState icon={Shield} title={t('security.noEvents')} description={t('security.noEventsBody')} /> : (
        <div className="space-y-2">
          {recent.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-[12.5px] hover:bg-muted/40 cursor-pointer" onClick={() => navigate('/security')}>
              <Shield className={`h-4 w-4 shrink-0 ${e.severity === 'critical' || e.severity === 'high' ? 'text-rose-500' : e.severity === 'medium' ? 'text-amber-500' : 'text-sky-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{e.description}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{e.type} · {fmt.ago(e.created_date)}</div>
              </div>
              <StatusBadge value={e.severity === 'critical' ? 'critical' : e.severity === 'high' ? 'error' : e.severity === 'medium' ? 'warning' : 'info'} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}