import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { usePSPs, usePSPAction, useApplications } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import MetricCard from '@/components/kit/MetricCard';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import PspConfigDialog from '@/components/payments/PspConfigDialog';
import { CreditCard, Globe, CheckCircle2, AlertTriangle, Key, Webhook, TestTube, Plug, PlugZap, Unplug, Settings2, Zap, Lock } from 'lucide-react';

export default function PspCenter() {
  const { t } = useT();
  const { toast } = useToast();
  const { data: psps = [], isLoading } = usePSPs();
  const { data: apps = [] } = useApplications();
  const pspAction = usePSPAction();
  const [configPsp, setConfigPsp] = useState(null);

  const connected = psps.filter((p) => p.status === 'connected');
  const configured = psps.filter((p) => p.status === 'configured' || p.secret_configured);
  const totalCurrencies = [...new Set(psps.flatMap((p) => p.supported_currencies || []))].length;
  const totalCountries = [...new Set(psps.flatMap((p) => p.supported_countries || []))].length;

  const handleAction = (action, provider, extra = {}, successMsg) => {
    pspAction.mutate({ action, provider, ...extra }, {
      onSuccess: (res) => toast({ title: successMsg || 'Success', description: res?.message || (res?.credential_hint ? `Key: ${res.credential_hint}` : undefined) }),
      onError: (err) => toast({ title: 'Action failed', description: err.message, variant: 'destructive' }),
    });
  };

  const cards = [
    { label: 'Connected PSPs', value: String(connected.length), icon: PlugZap, sub: 'actively processing' },
    { label: 'Configured', value: String(configured.length), icon: Key, sub: 'keys set' },
    { label: 'Currencies Supported', value: String(totalCurrencies), icon: Globe, sub: 'across all PSPs' },
    { label: 'Countries Covered', value: String(totalCountries), icon: CreditCard, sub: 'global reach' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('psp.title')} subtitle={t('psp.subtitle')} breadcrumbs={[{ label: t('psp.title') }]} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
      ) : psps.length === 0 ? (
        <Panel><EmptyState title="No payment providers" description="Configure your first PSP to start accepting payments" icon={CreditCard} /></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {psps.map((psp) => {
            const appsUsingPsp = apps.filter((a) => a.payment_provider === psp.key);
            return (
              <div key={psp.key} className="flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg overflow-hidden border bg-white p-1">
                      {psp.logo_url ? (
                        <img src={psp.logo_url} alt={psp.display_name} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[15px] font-bold" style={{ color: psp.color }}>{psp.display_name?.[0] || 'P'}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{psp.display_name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{psp.description}</div>
                    </div>
                  </div>
                  <StatusBadge value={psp.status} />
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  {psp.secret_configured ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  <span className="text-[11.5px] font-medium">{psp.secret_configured ? t('psp.secretConfigured') : t('psp.secretNotConfigured')}</span>
                  {psp.credential_hint && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{psp.credential_hint}</span>}
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(psp.capabilities || []).slice(0, 5).map((cap) => (
                    <span key={cap} className="rounded-md bg-muted px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground">{cap.replace(/_/g, ' ')}</span>
                  ))}
                  {(psp.capabilities || []).length > 5 && <span className="text-[9.5px] text-muted-foreground">+{psp.capabilities.length - 5} more</span>}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">{t('psp.currencies')}: </span><span className="font-medium">{(psp.supported_currencies || []).length}</span></div>
                  <div><span className="text-muted-foreground">Countries: </span><span className="font-medium">{(psp.supported_countries || []).length}</span></div>
                </div>

                {appsUsingPsp.length > 0 && (
                  <div className="mb-3 text-[11px] text-muted-foreground">
                    Used by: <span className="font-medium text-foreground">{appsUsingPsp.map((a) => a.name).join(', ')}</span>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {psp.status === 'connected' ? (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => handleAction('test', psp.key, {}, t('psp.test'))} disabled={pspAction.isPending}>
                        <Zap className="h-3 w-3" /> {t('psp.test')}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleAction('toggle', psp.key, { enabled: !psp.enabled }, psp.enabled ? t('psp.disable') : t('psp.enable'))} disabled={pspAction.isPending}>
                        {psp.enabled ? t('psp.disable') : t('psp.enable')}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setConfigPsp(psp)}>
                        <Settings2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive" onClick={() => handleAction('disconnect', psp.key, { environment: psp.environment }, t('psp.disconnect'))} disabled={pspAction.isPending}>
                        <Unplug className="h-3 w-3" />
                      </Button>
                    </>
                  ) : psp.secret_configured ? (
                    <>
                      <Button size="sm" className="h-7 text-[11px] flex-1" onClick={() => handleAction('connect', psp.key, { environment: psp.environment }, `${psp.display_name} connected`)} disabled={pspAction.isPending}>
                        <Plug className="h-3 w-3" /> {t('psp.connect')}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setConfigPsp(psp)}>
                        <Settings2 className="h-3 w-3" /> Update
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => setConfigPsp(psp)}>
                      <Key className="h-3 w-3" /> {t('psp.configureSecret')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PspConfigDialog psp={configPsp} open={!!configPsp} onOpenChange={(v) => !v && setConfigPsp(null)} />
    </div>
  );
}