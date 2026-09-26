import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useConfigureChannel, useTestChannel, useDeleteChannelConfig, useChannelStatus } from '@/lib/data/hooks';
import ChannelLogo from './ChannelLogos';
import { useT } from '@/lib/i18n/I18nProvider';
import { Loader2, Save, Trash2, TestTube, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChannelConfigDialog({ channel, open, onOpenChange }) {
  const { t } = useT();
  const { toast } = useToast();
  const configure = useConfigureChannel();
  const test = useTestChannel();
  const remove = useDeleteChannelConfig();
  const { data: channelData } = useChannelStatus();
  const channels = channelData?.channels || [];
  const ch = channels.find(c => c.key === channel);

  const [values, setValues] = useState({});
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    if (ch?.hints) {
      const init = {};
      for (const f of ch.fields || []) init[f.key] = '';
      setValues(init);
    }
  }, [channel, open]);

  if (!ch) return null;

  const handleSave = async () => {
    try {
      await configure.mutateAsync({ channel, credentials: values });
      toast({ title: t('communication.channelConfigured'), description: t('communication.channelConfiguredDesc', { name: ch.name }) });
      onOpenChange(false);
    } catch (e) {
      toast({ title: t('communication.configFailed'), description: e.message, variant: 'destructive' });
    }
  };

  const handleTest = async () => {
    try {
      const res = await test.mutateAsync({ channel });
      toast({ title: t('communication.testSuccess'), description: res.result });
    } catch (e) {
      toast({ title: t('communication.testFailed'), description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync({ channel });
      toast({ title: t('communication.configRemoved'), description: t('communication.configRemovedDesc', { name: ch.name }) });
      onOpenChange(false);
    } catch (e) {
      toast({ title: t('communication.failed'), description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <ChannelLogo channel={ch.key} size="sm" />
            {t('communication.configureChannel', { name: ch.name })}
          </DialogTitle>
        </DialogHeader>

        {ch.auth === 'builtin' && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-[12px] text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t('communication.builtinAvailable')}
          </div>
        )}

        {ch.auth === 'oauth' && (
          <div className="space-y-3">
            <div className={cn('flex items-center gap-2 rounded-md border p-3 text-[12px]', ch.configured ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700' : 'border-amber-200 bg-amber-50/50 text-amber-700')}>
              {ch.configured ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              {ch.configured ? t('communication.oauthReady') : t('communication.oauthRequired')}
            </div>
            <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">{t('communication.howToAuthorize')}</p>
                <p>{t('communication.authorizeHint', { connector: ch.connector })}</p>
              </div>
            </div>
          </div>
        )}

        {ch.auth === 'secret' && (
          <div className="space-y-3">
            {ch.configured && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-2.5 text-[11px] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {t('communication.currentlyConfigured')}
              </div>
            )}
            {(ch.fields || []).map((field) => (
              <div key={field.key}>
                <Label className="mb-1 block text-[11px]">{field.label}{field.required && <span className="text-rose-500"> *</span>}</Label>
                <div className="relative">
                  <Input
                    type={field.type === 'password' && !showValues ? 'password' : 'text'}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={ch.hints?.[field.key] ? `${ch.hints[field.key]}` : `Enter ${field.label}`}
                    className="h-9 text-[12px] pr-16"
                  />
                  {field.type === 'password' && (
                    <button type="button" onClick={() => setShowValues(!showValues)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground">
                      {showValues ? t('communication.hide') : t('communication.show')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {ch.last_test_result && (
              <div className={cn('flex items-start gap-2 rounded-md p-2.5 text-[11px]', ch.last_test_result.includes('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
                <TestTube className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div><span className="font-medium">{t('communication.lastTest')}</span> {ch.last_test_result}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2">
          {ch.auth === 'secret' && ch.configured && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={remove.isPending} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" /> {t('communication.remove')}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            {ch.auth === 'secret' && ch.configured && (
              <Button variant="outline" size="sm" onClick={handleTest} disabled={test.isPending}>
                {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                {t('communication.test')}
              </Button>
            )}
            {ch.auth === 'secret' && (
              <Button size="sm" onClick={handleSave} disabled={configure.isPending}>
                {configure.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('communication.save')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}