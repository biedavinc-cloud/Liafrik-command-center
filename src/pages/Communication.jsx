import React, { useState, useRef, useEffect } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useConversations, useMessages, useSendMessage, useCreateConversation, useUsers, useChannelStatus } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Plus, Search, Users, Hash, Mail, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import ChannelCards from '@/components/communication/ChannelCards';
import ExternalComposer from '@/components/communication/ExternalComposer';
import MessageLog from '@/components/communication/MessageLog';

export default function Communication() {
  const { t } = useT();
  const [mode, setMode] = useState('internal'); // 'internal' | 'external'

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('communication.title')}
        subtitle={t('communication.subtitle')}
        breadcrumbs={[{ label: t('communication.title') }]}
        actions={
          <div className="flex rounded-lg border p-0.5">
            <button onClick={() => setMode('internal')} className={cn('flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-colors', mode === 'internal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <Users className="h-3.5 w-3.5" /> {t('communication.internal')}
            </button>
            <button onClick={() => setMode('external')} className={cn('flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-colors', mode === 'external' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <Globe className="h-3.5 w-3.5" /> {t('communication.external')}
            </button>
          </div>
        }
      />

      {mode === 'internal' ? <InternalMessaging /> : <ExternalMessaging />}
    </div>
  );
}

// ── Internal Staff Messaging ──────────────────────────────────
function InternalMessaging() {
  const { t } = useT();
  const { user } = useAuth();
  const { data: conversations = [], isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [newDialog, setNewDialog] = useState(false);
  const selected = conversations.find(c => c.id === selectedId);

  const filtered = search
    ? conversations.filter(c => (c.name || c.participants?.find(p => p.user_id !== user?.id)?.full_name || '').toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:h-[calc(100vh-220px)]">
      <div className="w-full lg:w-72 shrink-0 surface flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('communication.searchUsers')} className="h-8 pl-8 text-xs" />
          </div>
          <Button onClick={() => setNewDialog(true)} size="sm" className="w-full h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" />{t('communication.newConversation')}</Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-[11px] text-muted-foreground py-8">{t('communication.noConversation')}</div>
          ) : filtered.map(c => {
            const other = c.participants?.find(p => p.user_id !== user?.id);
            const name = c.name || other?.full_name || t('communication.directMessage');
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className={cn('w-full text-left px-3 py-2.5 border-b hover:bg-accent/50 transition-colors', selectedId === c.id && 'bg-accent')}>
                <div className="flex items-center gap-2">
                  {c.type === 'group' ? <Users className="h-3 w-3 text-muted-foreground" /> : <Hash className="h-3 w-3 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium truncate">{name}</div>
                    <div className="text-[10.5px] text-muted-foreground truncate">{c.last_message || '—'}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {selected ? <MessageThread conversation={selected} user={user} /> : (
          <div className="surface h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-[12px]">{t('communication.noConversationSelected')}</p>
          </div>
        )}
      </div>
      <NewConversationDialog open={newDialog} onOpenChange={setNewDialog} user={user} />
    </div>
  );
}

function MessageThread({ conversation, user }) {
  const { t } = useT();
  const { data: messages = [], isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage.mutateAsync({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_email: user.email,
        body: text.trim(),
      });
      setText('');
    } catch (e) { /* toast handled by parent if needed */ }
  };

  const other = conversation.participants?.find(p => p.user_id !== user?.id);
  const title = conversation.name || other?.full_name || t('communication.directMessage');

  return (
    <div className="surface h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{conversation.participants?.length || 0} {t('communication.participants')}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[11px] text-muted-foreground py-8">{t('communication.typeMessage')}</div>
        ) : messages.map(m => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn('flex flex-col max-w-[70%]', mine ? 'items-end ml-auto' : 'items-start')}>
              {!mine && <div className="text-[10px] text-muted-foreground mb-0.5">{m.sender_name}</div>}
              <div className={cn('rounded-lg px-3 py-2 text-[12px]', mine ? 'bg-brand text-white' : 'bg-muted')}>{m.body}</div>
              <div className="text-[9.5px] text-muted-foreground mt-0.5">{new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={t('communication.typeMessage')} className="h-9" />
        <Button onClick={handleSend} disabled={sendMessage.isPending || !text.trim()} size="icon" className="h-9 w-9"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function NewConversationDialog({ open, onOpenChange, user }) {
  const { t } = useT();
  const { data: users = [] } = useUsers();
  const createConv = useCreateConversation();
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.id !== user?.id && u.full_name?.toLowerCase().includes(search.toLowerCase()));

  const startConversation = async (otherUser) => {
    try {
      await createConv.mutateAsync({
        type: 'direct',
        participants: [
          { user_id: user.id, full_name: user.full_name, email: user.email },
          { user_id: otherUser.id, full_name: otherUser.full_name, email: otherUser.email },
        ],
        last_message: '',
      });
      onOpenChange(false);
    } catch (e) { /* handled */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t('communication.newConversation')}</DialogTitle></DialogHeader>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('communication.searchUsers')} className="h-9" />
        <div className="max-h-64 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <div className="text-center text-[11px] text-muted-foreground py-6">{t('communication.noConversation')}</div>
          ) : filtered.map(u => (
            <button key={u.id} onClick={() => startConversation(u)} className="w-full text-left px-2 py-2.5 hover:bg-accent/50 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand text-[11px] font-medium">{u.full_name?.[0] || '?'}</div>
              <div><div className="text-[12px] font-medium">{u.full_name}</div><div className="text-[10.5px] text-muted-foreground">{u.email}</div></div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── External Client Communication ──────────────────────────────
function ExternalMessaging() {
  const { t } = useT();
  const { data: channelData, isLoading } = useChannelStatus();
  const channels = channelData?.channels || [];
  const ready = channels.filter((c) => c.configured).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-md border border-brand/30 bg-brand-soft/40 px-4 py-2.5">
        <Mail className="h-4 w-4 text-brand" />
        <div className="flex-1">
          <span className="text-[12px] font-medium">{t('communication.channelsReady', { n: ready, total: channels.length })}</span>
          <span className="ml-2 text-[11px] text-muted-foreground">{t('communication.configHint')}</span>
        </div>
      </div>
      <ChannelCards channels={channels} isLoading={isLoading} />
      <ExternalComposer />
      <MessageLog />
    </div>
  );
}