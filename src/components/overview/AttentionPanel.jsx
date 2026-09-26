import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Rocket, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import Panel from '@/components/kit/Panel';

export default function AttentionPanel({ apps, notes, deployments, className }) {
  const { t, fmt } = useT();
  const bySlug = (id) => apps.find((a) => a.id === id);
  const items = [
    ...notes.filter((n) => !n.read && (n.severity === 'critical' || n.severity === 'warning')).map((n) => ({
      id: n.id, icon: n.severity === 'critical' ? AlertOctagon : AlertTriangle, tone: n.severity === 'critical' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50',
      title: n.title, meta: `${bySlug(n.application_id)?.name || ''} · ${fmt.ago(n.created_date)}`, to: bySlug(n.application_id) ? `/apps/${bySlug(n.application_id).slug}` : '/notifications',
    })),
    ...deployments.filter((d) => d.status === 'failed').slice(0, 3).map((d) => ({
      id: d.id, icon: Rocket, tone: 'text-rose-600 bg-rose-50', title: t('attention.deployFailed', { version: d.version }),
      meta: `${bySlug(d.application_id)?.name || ''} · ${t(`env.${d.environment}`)}`, to: '/monitoring',
    })),
    ...apps.filter((a) => a.lifecycle === 'active' && a.connection_status !== 'connected' && !a.is_demo).map((a) => ({
      id: a.id, icon: ShieldAlert, tone: 'text-sky-600 bg-sky-50', title: t('attention.notConnected', { name: a.name }), meta: t(`status.${a.connection_status}`), to: `/apps/${a.slug}`,
    })),
  ];

  return (
    <Panel title={t('overview.attention')} subtitle={t('overview.attentionSub', { n: items.length })} className={className} bodyClassName="p-0">
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-600" />
          <p className="text-[12.5px] font-medium">{t('overview.allClear')}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.slice(0, 7).map((it) => (
            <li key={it.id}>
              <Link to={it.to} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', it.tone)}><it.icon className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{it.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{it.meta}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}