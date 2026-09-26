import React, { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useCurrencyRates, useSyncRates } from '@/lib/data/hooks';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CURRENCIES = ['USD','EUR','GBP','AED','NGN','GHS','KES','ZAR','XOF','XAF','EGP','MAD','TND','DZD','CAD','JPY','CNY','INR','BRL','AUD'];

export default function CurrencyPanel() {
  const { t } = useT();
  const [base, setBase] = useState('USD');
  const { data: ratesData } = useCurrencyRates(base);
  const syncRates = useSyncRates();
  const { toast } = useToast();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('AED');
  const [amount, setAmount] = useState(100);

  const rates = ratesData?.[0]?.rates || {};
  const fetchedAt = ratesData?.[0]?.fetched_at;
  const provider = ratesData?.[0]?.provider;

  const handleSync = async () => {
    try {
      await syncRates.mutateAsync(base);
      toast({ title: t('currency.syncSuccess') });
    } catch (e) {
      toast({ title: t('currency.syncError'), description: e.message, variant: 'destructive' });
    }
  };

  const result = useMemo(() => {
    const rFrom = rates[from]; const rTo = rates[to];
    if (!rFrom || !rTo) return null;
    return (amount / rFrom) * rTo;
  }, [amount, from, to, rates]);

  return (
    <Panel title={t('currency.title')} subtitle={t('currency.subtitle')}>
      <div className="grid max-w-xl gap-5">
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label>{t('currency.baseCurrency')}</Label>
            <Select value={base} onValueChange={setBase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSync} disabled={syncRates.isPending} variant="outline" className="h-9">
            {syncRates.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            {syncRates.isPending ? t('currency.syncing') : t('currency.sync')}
          </Button>
        </div>
        {fetchedAt ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>{t('currency.lastSync')}: {new Date(fetchedAt).toLocaleString()}</span>
            <span>{t('currency.provider')}: {provider}</span>
            <span>{t('currency.rateCount', { n: Object.keys(rates).length })}</span>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">{t('currency.notSynced')}</p>
        )}
        {Object.keys(rates).length > 0 && (
          <div className="rounded-md border p-4 space-y-3">
            <div className="text-[12px] font-medium">{t('currency.convert')}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">{t('currency.from')}</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">{t('currency.to')}</Label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">{t('currency.amount')}</Label>
                <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>
            {result != null && (
              <div className="text-[14px] font-semibold">{result.toFixed(2)} {to}</div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}