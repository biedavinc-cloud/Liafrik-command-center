import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useT } from '@/lib/i18n/I18nProvider';
import StatusBadge from '@/components/kit/StatusBadge';

const pretty = (s) => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } };

export default function AuditDetailSheet({ event, onClose }) {
  const { t, fmt } = useT();
  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono text-[14px]">{event.action}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <StatusBadge value={event.outcome} />
              <dl className="divide-y rounded-md border text-[12.5px]">
                {[
                  [t('audit.time'), fmt.dateTime(event.created_date)],
                  [t('audit.actor'), `${event.actor} · ${t(`roles.${event.actor_role}`)}`],
                  [t('audit.application'), event.application_name || t('audit.global')],
                  [t('audit.environment'), event.environment ? t(`env.${event.environment}`) : '—'],
                  [t('audit.resource'), `${event.resource || '—'}${event.resource_id ? ` · ${event.resource_id}` : ''}`],
                  [t('audit.ip'), event.ip || '—'],
                  ['ID', event.id],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-2 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 break-all">{v}</dd></div>
                ))}
              </dl>
              {['before', 'after'].map((k) => event[k] && (
                <div key={k}>
                  <div className="label-caps mb-1.5">{t(`audit.${k}`)}</div>
                  <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">{pretty(event[k])}</pre>
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}