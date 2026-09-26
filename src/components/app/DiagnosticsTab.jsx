import React, { useState } from 'react';
import { Loader2, PlugZap, CheckCircle, AlertTriangle, XCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAction } from '@/lib/data/hooks';
import { runConnectionTest } from '@/lib/services/applications';
import { buildDiagnostics, CHECK_STATUS } from '@/lib/protocol/diagnostics';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';

const ICON = { pass: CheckCircle, warning: AlertTriangle, fail: XCircle, not_tested: MinusCircle };
const COLOR = { pass: 'text-emerald-600', warning: 'text-amber-600', fail: 'text-rose-600', not_tested: 'text-muted-foreground' };

export default function DiagnosticsTab({ app }) {
  const { t } = useT();
  const [result, setResult] = useState(null);
  const test = useAction(() => runConnectionTest(app), ['applications']);

  const run = () => test.mutate(undefined, { onSuccess: (r) => setResult(r) });
  const diag = result ? buildDiagnostics(result) : null;

  const checks = ['dns', 'https', 'api', 'authentication', 'authorization', 'health', 'capabilities', 'webhook', 'latency'];

  return (
    <div className="space-y-4">
      <Panel
        title={t('diagnostics.title')}
        subtitle={t('diagnostics.subtitle')}
        actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" disabled={test.isPending || !app.api_url} onClick={run}>
          {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}{t('diagnostics.rerun')}
        </Button>}
      >
        {!diag ? (
          <div className="flex flex-col items-center py-8 text-center">
            <PlugZap className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-[12.5px] text-muted-foreground">{t('diagnostics.subtitle')}</p>
            <Button size="sm" className="mt-3 h-8 gap-1.5 text-[12px]" disabled={test.isPending || !app.api_url} onClick={run}>
              {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}{t('diagnostics.rerun')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {checks.map((key) => {
              const check = diag.checks[key];
              const Icon = ICON[check.status];
              return (
                <div key={key} className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-[12.5px]">
                  <Icon className={`h-4 w-4 shrink-0 ${COLOR[check.status]}`} />
                  <span className="flex-1 font-medium">{t(`diagnostics.${key}`)}</span>
                  <span className={`text-[11.5px] ${COLOR[check.status]}`}>{t(`diagnostics.${check.status === 'not_tested' ? 'notTested' : check.status}`)}</span>
                  {check.detail && <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">{check.detail}</span>}
                </div>
              );
            })}
            <div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-[12px]">
              <span className="text-muted-foreground">{diag.passed} / {diag.total} {t('diagnostics.pass').toLowerCase()}</span>
              <span className={diag.hasFail ? 'text-rose-600' : 'text-emerald-600'}>{diag.hasFail ? t('diagnostics.hasFail') : t('diagnostics.allPassed')}</span>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}