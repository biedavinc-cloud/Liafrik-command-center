import React, { useState } from 'react';
import { useApplications, useSendCommunication, useChannelStatus } from '@/lib/data/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export default function ExternalComposer() {
  const { t } = useT();
  const { toast } = useToast();
  const { data: apps = [] } = useApplications();
  const { data: channelData, isLoading: loadingChannels } = useChannelStatus();
  const sendComm = useSendCommunication();
  const channels = channelData?.channels || [];
  const composableChannels = channels.filter(c => c.composable !== false);

  const [form, setForm] = useState({
    channel: 'email',
    application_id: '',
    recipient: '',
    recipient_name: '',
    subject: '',
    text: '',
  });

  const handleSend = async () => {
    if (!form.recipient || !form.text) {
      toast({ title: t('communication.missingFields'), description: t('communication.missingFieldsDesc'), variant: 'destructive' });
      return;
    }
    const appName = apps.find((a) => a.id === form.application_id)?.name || '';
    try {
      await sendComm.mutateAsync({ ...form, application_name: appName });
      toast({ title: t('communication.messageSent'), description: `via ${form.channel} → ${form.recipient}` });
      setForm({ ...form, recipient: '', recipient_name: '', subject: '', text: '' });
    } catch (e) {
      toast({ title: t('communication.sendFailed'), description: e.message, variant: 'destructive' });
    }
  };

  const selectedChannel = channels.find((c) => c.key === form.channel);
  const isConfigured = selectedChannel?.configured && selectedChannel?.composable !== false;
  const isChatType = selectedChannel?.type === 'chat' || selectedChannel?.type === 'sms';

  const recipientLabel = () => {
    if (form.channel === 'slack') return t('communication.recipientSlack');
    if (form.channel === 'teams') return t('communication.recipientTeams');
    if (form.channel === 'telegram') return t('communication.recipientTelegram');
    if (form.channel === 'whatsapp') return t('communication.recipientWhatsApp');
    if (form.channel === 'twilio') return t('communication.recipientTwilio');
    if (form.channel === 'meet') return t('communication.recipientMeet');
    return t('communication.recipientEmail');
  };

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Send className="h-4 w-4 text-brand" />
        <h2 className="text-[13px] font-semibold">{t('communication.composeMessage')}</h2>
      </div>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label className="mb-1 block text-[11px]">{t('communication.channel')}</Label>
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {composableChannels.map((c) => (
                  <SelectItem key={c.key} value={c.key} disabled={!c.configured} className="text-[12px]">
                    <span className="flex items-center gap-1.5">
                      {c.name}
                      {!c.configured && <span className="text-[9px] text-amber-600">{t('communication.needsConfigBadge')}</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[11px]">{t('communication.applicationOptional')}</Label>
            <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder={t('communication.none')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('communication.none')}</SelectItem>
                {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block text-[11px]">{t('communication.recipient')} {recipientLabel()}</Label>
            <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder={form.channel === 'slack' ? '#general' : form.channel === 'whatsapp' || form.channel === 'twilio' ? '+2376...' : 'recipient@example.com'} className="h-9 text-[12px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-[11px]">{t('communication.recipientNameOptional')}</Label>
            <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder="John Doe" className="h-9 text-[12px]" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px]">{t('communication.subject')} {isChatType ? `(${t('communication.subjectOptional')})` : ''}</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="..." className="h-9 text-[12px]" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[11px]">{t('communication.message')}</Label>
          <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder={t('communication.typeYourMessage')} rows={4} className="text-[12px]" />
        </div>
        {!isConfigured && (
          <div className={cn('flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-2.5 text-[11px] text-amber-700')}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{t('communication.channelNotConfigured')}</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sendComm.isPending || !form.recipient || !form.text || !isConfigured} className="h-9">
            {sendComm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('communication.sendMessage')}
          </Button>
        </div>
      </div>
    </div>
  );
}