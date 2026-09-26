import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/I18nProvider';
import { usePSPs, usePSPAction } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Zap, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PspCenter() {
  const { t } = useT();
  const { data: psps = [], isLoading } = usePSPs();
  const pspAction = usePSPAction();
  const { toast } = useToast();

  const handleAction = async (action, provider, extra = {}) => {
    try {
      const res = await pspAction.mutateAsync({ action, provider, ...extra });
      if (action === 'test') {
        toast({ title: res.status === 'passed' ? t('psp.testPassed') : t('psp.testFailed'), description: res.message });
      } else {
        toast({ title: 'Success' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('psp.title')} subtitle={t('psp.subtitle')} breadcrumbs={[{ label: t('psp.title') }]} />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {psps.map((psp) => (
            <div key={psp.key} className="surface p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold" style={{ background: psp.color }}>
                  {psp.display_name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{psp.display_name}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2">{psp.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${
                  psp.status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                  psp.status === 'configured' ? 'bg-amber-100 text-amber-700' :
                  'bg-muted text-muted-foreground'
                }`}>{psp.status.replace(/_/g, ' ')}</span>
                {psp.enabled && <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">{t('psp.enable')}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {psp.capabilities.map(c => (
                  <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground">{c.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <div className="text-[10.5px] text-muted-foreground">
                <span className="font-medium">{t('psp.currencies')}:</span> {psp.supported_currencies.slice(0, 8).join(', ')}{psp.supported_currencies.length > 8 ? '…' : ''}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {psp.secret_configured ? (
                  <><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-muted-foreground">{t('psp.secretConfigured')} {psp.credential_hint}</span></>
                ) : (
                  <><X className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">{t('psp.secretNotConfigured')}</span></>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {psp.status === 'connected' ? (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleAction('test', psp.key)} disabled={pspAction.isPending}>
                      <Zap className="h-3 w-3 mr-1" />{t('psp.test')}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleAction('toggle', psp.key, { enabled: !psp.enabled })} disabled={pspAction.isPending}>
                      {psp.enabled ? t('psp.disable') : t('psp.enable')}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive" onClick={() => handleAction('disconnect', psp.key)} disabled={pspAction.isPending}>
                      {t('psp.disconnect')}
                    </Button>
                  </>
                ) : psp.secret_configured ? (
                  <Button size="sm" className="h-7 text-[11px]" onClick={() => handleAction('connect', psp.key)} disabled={pspAction.isPending}>
                    {t('psp.connect')}
                  </Button>
                ) : (
                  <Link to="/settings"><Button size="sm" variant="outline" className="h-7 text-[11px]"><SettingsIcon className="h-3 w-3 mr-1" />{t('psp.configureSecret')}</Button></Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}