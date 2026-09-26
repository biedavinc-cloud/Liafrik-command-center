import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, usePSPs, useCreatePaymentLink } from '@/lib/data/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Copy, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CURRENCIES = ['USD','EUR','GBP','AED','NGN','GHS','KES','ZAR','XOF','XAF','EGP','MAD','TND','DZD','CAD','JPY','CNY'];

export default function PaymentLinkDialog({ open, onOpenChange }) {
  const { t } = useT();
  const { data: apps = [] } = useApplications();
  const { data: psps = [] } = usePSPs();
  const createLink = useCreatePaymentLink();
  const { toast } = useToast();
  const [form, setForm] = useState({ provider: '', application_id: '', customer_email: '', customer_name: '', amount: '', currency: 'USD', description: '', reference: '' });
  const [result, setResult] = useState(null);

  const connectedPsps = psps.filter(p => p.status === 'connected' && p.enabled);

  const handleSubmit = async () => {
    try {
      const app = apps.find(a => a.id === form.application_id);
      const record = await createLink.mutateAsync({
        provider: form.provider,
        application_id: form.application_id || null,
        application_name: app?.name || null,
        customer_email: form.customer_email,
        customer_name: form.customer_name,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
        reference: form.reference || null,
      });
      setResult(record);
      toast({ title: t('psp.linkCreated') });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setResult(null);
    setForm({ provider: '', application_id: '', customer_email: '', customer_name: '', amount: '', currency: 'USD', description: '', reference: '' });
    onOpenChange(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.link_url);
    toast({ title: t('psp.copied') });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{result ? t('psp.linkCreated') : t('psp.createLinkTitle')}</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground mb-1">{t('psp.linkUrl', { defaultValue: 'Link URL' })}</div>
              <div className="text-[12px] font-mono break-all">{result.link_url}</div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyLink} variant="outline" className="h-9"><Copy className="h-4 w-4 mr-1.5" />{t('psp.copyLink')}</Button>
              <a href={result.link_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="h-9"><ExternalLink className="h-4 w-4 mr-1.5" />{t('psp.openLink')}</Button></a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connectedPsps.length === 0 && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-[11.5px] text-amber-800">
                {t('psp.noConnected', { defaultValue: 'No PSP is connected. Connect a provider in the PSP Center first.' })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('psp.provider')}</Label>
                <Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {connectedPsps.map(p => <SelectItem key={p.key} value={p.key}>{p.display_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('psp.application')}</Label>
                <Select value={form.application_id} onValueChange={v => setForm(f => ({ ...f, application_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {apps.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('psp.customer')}</Label>
                <Input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} placeholder="customer@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('psp.customerName')}</Label>
                <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('psp.amount')}</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="99.00" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('psp.currency')}</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('psp.description')}</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="POS Subscription" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('psp.reference')}</Label>
              <Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
            </div>
          </div>
        )}
        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>{t('common.confirm', { defaultValue: 'Done' })}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={createLink.isPending || !form.provider || !form.customer_email || !form.amount}>
                {createLink.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                {t('psp.generate')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}