import React, { useState } from 'react';
import { useApplications, useSendCommunication, useChannelStatus } from '@/lib/data/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import ChannelLogo from './ChannelLogos';
import { cn } from '@/lib/utils';

export default function ExternalComposer() {
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
      toast({ title: 'Missing fields', description: 'Recipient and message are required', variant: 'destructive' });
      return;
    }
    const appName = apps.find((a) => a.id === form.application_id)?.name || '';
    try {
      await sendComm.mutateAsync({ ...form, application_name: appName });
      toast({ title: 'Message sent', description: `via ${form.channel} → ${form.recipient}` });
      setForm({ ...form, recipient: '', recipient_name: '', subject: '', text: '' });
    } catch (e) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    }
  };

  const selectedChannel = channels.find((c) => c.key === form.channel);
  const isConfigured = selectedChannel?.configured && selectedChannel?.composable !== false;
  const isChatType = selectedChannel?.type === 'chat' || selectedChannel?.type === 'sms';
  const isVideoType = selectedChannel?.type === 'video';

  const recipientLabel = () => {
    if (form.channel === 'slack') return '(channel #name or ID)';
    if (form.channel === 'teams') return '(team/channel ID)';
    if (form.channel === 'telegram') return '(chat ID)';
    if (form.channel === 'whatsapp') return '(phone +123...)';
    if (form.channel === 'twilio') return '(phone +123...)';
    if (form.channel === 'meet') return '(attendee email)';
    return '(email address)';
  };

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Send className="h-4 w-4 text-brand" />
        <h2 className="text-[13px] font-semibold">Compose Message</h2>
      </div>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label className="mb-1 block text-[11px]">Channel</Label>
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {composableChannels.map((c) => (
                  <SelectItem key={c.key} value={c.key} disabled={!c.configured} className="text-[12px]">
                    <span className="flex items-center gap-1.5">
                      {c.name}
                      {!c.configured && <span className="text-[9px] text-amber-600">(needs config)</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[11px]">Application (optional)</Label>
            <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block text-[11px]">Recipient {recipientLabel()}</Label>
            <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder={form.channel === 'slack' ? '#general' : form.channel === 'whatsapp' || form.channel === 'twilio' ? '+2376...' : 'recipient@example.com'} className="h-9 text-[12px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-[11px]">Recipient Name (optional)</Label>
            <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder="John Doe" className="h-9 text-[12px]" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px]">Subject {isChatType ? '(optional)' : ''}</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject line" className="h-9 text-[12px]" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[11px]">Message</Label>
          <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Type your message..." rows={4} className="text-[12px]" />
        </div>
        {!isConfigured && (
          <div className={cn('flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-2.5 text-[11px] text-amber-700')}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>This channel is not configured. Click the settings icon on the channel card above to configure it.</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sendComm.isPending || !form.recipient || !form.text || !isConfigured} className="h-9">
            {sendComm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}