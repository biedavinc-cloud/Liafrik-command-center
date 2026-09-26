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
import { CreditCard, Globe, CheckCircle2, AlertTriangle, Key, Webhook, TestTube, Plug, PlugZap, Unplug, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FinancialIntegrations() {
  const { t } = useT();
  const { toast } = useToast();
  const { data: psps = [], isLoading } = usePSPs();
  const { data: apps = [] } = useApplications();
  const pspAction = usePSPAction();
  const [configPsp, setConfigPsp] = useState(null);
  const [configForm, setConfigForm] = useState({ secret_value: '', webhook_secret_value: '', site_id_value: '', environment: 'production' });

  const connected = psps.filter((p) => p.status === 'connected');
  const configured = psps.filter((p) => p.status === 'configured' || p.secret_configured);
  const totalCurrencies = [...new Set(psps.flatMap((p) => p.supported_currencies || []))].length;
  const totalCountries = [...new Set(psps.flatMap((p) => p.supported_countries || []))].length;

  const handleAction = (action, data, successMsg) => {
    pspAction.mutate({ action, ...data }, {
      onSuccess: (res) => toast({ title: successMsg, description: res?.message || res?.credential_hint ? `Key: ${res.credential_hint}` : undefined }),
      onError: (err) => toast({ title: 'Action failed', description: err.message, variant: 'destructive' }),
    });
  };

  const openConfig = (psp) => {
    setConfigPsp(psp);
    setConfigForm({ secret_value: '', webhook_secret_value: '', site_id_value: '', environment: psp.environment || 'production' });
  };

  const handleConfigure = () => {
    if (!configForm.secret_value || configForm.secret_value.length < 6) {
      toast({ title: 'Invalid key', description: 'API key must be at least 6 characters', variant: 'destructive' });
      return;
    }
    pspAction.mutate({ action: 'configure', provider: configPsp.key, ...configForm }, {
      onSuccess: () => { toast({ title: `${configPsp.display_name} configured` }); setConfigPsp(null); },
      onError: (err) => toast({ title: 'Configuration failed', description: err.message, variant: 'destructive' }),
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
      <PageHeader title="Financial Integrations" subtitle="Configure and monitor payment provider integrations, status, and credential validity" breadcrumbs={[{ label: 'Financial Integrations' }]} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <MetricCard key={c.label} {...c} loading={isLoading} />)}
      </div>

      {/* PSP Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {psps.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3"><Panel><EmptyState title="No payment providers" description="Configure your first PSP to start accepting payments" icon={CreditCard} /></Panel></div>
        ) : psps.map((psp) => {
          const appsUsingPsp = apps.filter((a) => a.payment_provider === psp.key);
          return (
            <div key={psp.key} className="flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg text-white text-[15px] font-bold" style={{ backgroundColor: psp.color || 'hsl(var(--brand))' }}>
                    {psp.display_name?.[0] || 'P'}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">{psp.display_name}</div>
                    <div className="text-[11px] text-muted-foreground">{psp.description}</div>
                  </div>
                </div>
                <StatusBadge value={psp.status} />
              </div>

              {/* Credential status */}
              <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                {psp.secret_configured ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-[11.5px] font-medium">{psp.secret_configured ? 'Credentials configured' : 'No credentials set'}</span>
                {psp.credential_hint && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{psp.credential_hint}</span>}
              </div>

              {/* Capabilities */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(psp.capabilities || []).slice(0, 5).map((cap) => (
                  <span key={cap} className="rounded-md bg-muted px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground">{cap.replace(/_/g, ' ')}</span>
                ))}
                {(psp.capabilities || []).length > 5 && <span className="text-[9.5px] text-muted-foreground">+{psp.capabilities.length - 5} more</span>}
              </div>

              {/* Regions */}
              <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-muted-foreground">Currencies: </span><span className="font-medium">{(psp.supported_currencies || []).length}</span></div>
                <div><span className="text-muted-foreground">Countries: </span><span className="font-medium">{(psp.supported_countries || []).length}</span></div>
              </div>

              {/* Apps using this PSP */}
              {appsUsingPsp.length > 0 && (
                <div className="mb-3 text-[11px] text-muted-foreground">
                  Used by: <span className="font-medium text-foreground">{appsUsingPsp.map((a) => a.name).join(', ')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={() => openConfig(psp)}>
                  <Settings2 className="h-3 w-3" /> Configure
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleAction('test', { provider: psp.key }, `${psp.display_name} tested`)}>
                  <TestTube className="h-3 w-3" /> Test
                </Button>
                {psp.status === 'connected' ? (
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleAction('disconnect', { provider: psp.key, environment: psp.environment }, `${psp.display_name} disconnected`)}>
                    <Unplug className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-[11px]" disabled={!psp.secret_configured} onClick={() => handleAction('connect', { provider: psp.key, environment: psp.environment }, `${psp.display_name} connected`)}>
                    <Plug className="h-3 w-3" /> Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configPsp} onOpenChange={(open) => !open && setConfigPsp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Configure {configPsp?.display_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="mb-1 block text-[11px]">API Key / Secret</Label><Input type="password" value={configForm.secret_value} onChange={(e) => setConfigForm({ ...configForm, secret_value: e.target.value })} placeholder="Enter API key..." /></div>
            <div><Label className="mb-1 block text-[11px]">Webhook Secret (optional)</Label><Input type="password" value={configForm.webhook_secret_value} onChange={(e) => setConfigForm({ ...configForm, webhook_secret_value: e.target.value })} placeholder="Enter webhook secret..." /></div>
            {configPsp?.key === 'cinetpay' && <div><Label className="mb-1 block text-[11px]">Site ID</Label><Input value={configForm.site_id_value} onChange={(e) => setConfigForm({ ...configForm, site_id_value: e.target.value })} placeholder="Enter site ID..." /></div>}
            <div><Label className="mb-1 block text-[11px]">Environment</Label>
              <Select value={configForm.environment} onValueChange={(v) => setConfigForm({ ...configForm, environment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 text-[11px] text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Credentials are stored encrypted server-side. Only masked hints are visible in the UI.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfigPsp(null)}>Cancel</Button>
            <Button size="sm" onClick={handleConfigure} disabled={pspAction.isPending}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}