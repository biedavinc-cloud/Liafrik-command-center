import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { usePSPAction } from '@/lib/data/hooks';
import { useToast } from '@/components/ui/use-toast';

export default function PspConfigDialog({ psp, open, onOpenChange }) {
  const { t } = useT();
  const pspAction = usePSPAction();
  const { toast } = useToast();
  const [secretValue, setSecretValue] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [siteId, setSiteId] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const isCinetPay = psp?.key === 'cinetpay';

  const handleSave = async () => {
    if (!secretValue || secretValue.length < 6) {
      toast({ title: 'Error', description: 'API key must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      await pspAction.mutateAsync({
        action: 'configure',
        provider: psp.key,
        secret_value: secretValue,
        webhook_secret_value: webhookSecret || undefined,
        site_id_value: isCinetPay ? siteId : undefined,
      });
      toast({ title: 'Secret configured', description: `${psp.display_name} is ready to connect.` });
      setSecretValue('');
      setWebhookSecret('');
      setSiteId('');
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  if (!psp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-white border p-1">
              {psp.logo_url ? (
                <img src={psp.logo_url} alt={psp.display_name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm font-bold" style={{ color: psp.color }}>{psp.display_name[0]}</span>
              )}
            </div>
            <div>
              <DialogTitle className="text-base">{psp.display_name}</DialogTitle>
              <DialogDescription className="text-xs">{t('psp.configureSecret')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">API Key <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder={psp.secret_key_env || 'Enter API key'}
                className="pr-9 text-xs h-8"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Env var: {psp.secret_key_env}</p>
          </div>

          {isCinetPay && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Site ID <span className="text-destructive">*</span></Label>
              <Input
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="CinetPay Site ID"
                className="text-xs h-8"
                autoComplete="off"
              />
              <p className="text-[10px] text-muted-foreground">Env var: PSP_CINETPAY_SITE_ID</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Webhook Secret (optional)</Label>
            <Input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={psp.webhook_secret_env || 'Enter webhook secret'}
              className="text-xs h-8"
              autoComplete="off"
            />
            {psp.webhook_secret_env && <p className="text-[10px] text-muted-foreground">Env var: {psp.webhook_secret_env}</p>}
          </div>

          {['stripe', 'paystack'].includes(psp.key) ? (
            <div className="space-y-1 rounded-md border border-border bg-muted/30 p-2">
              <Label className="text-[11px] font-medium">Webhook URL</Label>
              <p className="text-[10px] text-muted-foreground">
                Register this URL in your {psp.display_name} dashboard so payments are marked as paid automatically
                {psp.key === 'stripe' ? ' (use the signing secret it gives you as the Webhook Secret above).' : ' (Paystack signs with your API key, so no separate secret is needed above).'}
              </p>
              <code className="block break-all rounded bg-background px-1.5 py-1 text-[10px]">{`${window.location.origin}/api/psp-webhook/${psp.key}`}</code>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">Automatic payment confirmation isn't available yet for {psp.display_name} — payment links won't switch to "Paid" on their own.</p>
          )}

          {psp.credential_hint && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
              Current key: {psp.credential_hint}. Enter a new key to replace it.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pspAction.isPending}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={pspAction.isPending || !secretValue}>
            {pspAction.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Save & Configure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}