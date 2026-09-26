import React, { useState } from 'react';
import { Loader2, PlayCircle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/I18nProvider';
import { testConnection } from '@/lib/protocol/connector';

const ICON = { passed: [CheckCircle2, 'text-emerald-600'], failed: [XCircle, 'text-rose-600'], pending: [MinusCircle, 'text-amber-600'] };

export default function StepTest({ form, result, setResult }) {
  const { t } = useT();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setRunning(true); setError(null);
    try {
      setResult(await testConnection({ api_url: form.api_url, health_endpoint: form.health_endpoint }));
    } catch (e) {
      setError(t('test.invalid'));
    }
    setRunning(false);
  };

  const probe = (p) => p.reachable
    ? { status: p.ok ? 'passed' : 'failed', detail: t('wizard.test.httpDetail', { status: p.http_status, ms: p.latency_ms }) }
    : { status: 'failed', detail: t(`wizard.test.${p.error || 'unreachable'}`) };

  const rows = result && [
    { key: 'api', ...probe(result.api), status: result.api.reachable ? 'passed' : 'failed' },
    { key: 'auth', status: 'pending', detail: t('wizard.test.vaultPending') },
    { key: 'health', ...probe(result.health) },
    { key: 'permissions', status: 'pending', detail: t('wizard.test.lcpPending') },
    { key: 'webhook', status: 'pending', detail: t('wizard.test.lcpPending') },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-lg text-[12.5px] text-muted-foreground">{t('wizard.testIntro')}</p>
        <Button onClick={run} disabled={running} size="sm" className="h-8 gap-1.5 text-[12px]">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          {result ? t('wizard.rerun') : t('wizard.runTests')}
        </Button>
      </div>
      {error && <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>}
      <div className="divide-y rounded-md border">
        {(rows || ['api', 'auth', 'health', 'permissions', 'webhook'].map((key) => ({ key }))).map((r) => {
          const [Icon, tone] = ICON[r.status] || [];
          return (
            <div key={r.key} className="flex items-center gap-3 px-3.5 py-3">
              {running ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : Icon ? <Icon className={cn('h-4 w-4', tone)} /> : <span className="h-4 w-4 rounded-full border" />}
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium">{t(`wizard.test.${r.key}`)}</div>
                <div className="text-[11.5px] text-muted-foreground">{r.detail || t('wizard.test.notRun')}</div>
              </div>
              {r.status && <span className={cn('text-[10.5px] font-semibold uppercase tracking-wider', tone)}>{t(`wizard.test.s.${r.status}`)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}