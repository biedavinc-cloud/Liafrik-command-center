import React, { useState, useRef, useEffect } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useConversations, useMessages, useSendMessage, useCreateConversation } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Search, Plus, MessageSquare, Users, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function InternalMessaging() {
  const { t } = useT();
  const { user } = useAuth();
  const { data: conversations = [], isLoading: loadingConvs } = useConversations();
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const scrollRef = useRef(null);

  const { data: messages = [], isLoading: loadingMsgs } = useMessages(activeId);
  const sendMessage = useSendMessage();
  const createConv = useCreateConversation();

  const filtered = conversations.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = () => {
    if (!body.trim() || !activeId) return;
    sendMessage.mutate({
      conversation_id: activeId,
      sender_id: user?.id,
      sender_name: user?.full_name || user?.email,
      sender_email: user?.email,
      body: body.trim(),
    });
    setBody('');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createConv.mutate({ type: 'group', name: newName.trim() }, {
      onSuccess: (conv) => { setActiveId(conv.id); setShowNew(false); setNewName(''); }
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Internal Messaging" subtitle="Secure real-time staff communication and incident coordination" breadcrumbs={[{ label: 'Internal Messaging' }]} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar */}
        <Panel bodyClassName="p-0 flex flex-col h-full">
          <div className="border-b p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="pl-8 h-8 text-[12.5px]" />
            </div>
            <Button size="sm" className="w-full h-8 text-[12px]" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5" /> New Conversation
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {filtered.length === 0 ? (
                <div className="p-6"><EmptyState title="No conversations" icon={MessageSquare} /></div>
              ) : filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn('flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50', activeId === c.id && 'bg-brand-soft/40')}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    {c.type === 'group' ? <Users className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{c.name || 'Direct message'}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{c.last_message || 'No messages yet'}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Panel>

        {/* Chat area */}
        <Panel bodyClassName="p-0 flex flex-col h-full">
          {!active ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState title="Select a conversation" description="Choose a conversation from the left to start messaging" icon={MessageSquare} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {active.type === 'group' ? <Users className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">{active.name || 'Direct message'}</div>
                    <div className="text-[11px] text-muted-foreground">{active.participants?.length || 0} participants</div>
                  </div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex h-full items-center justify-center"><div className="h-6 w-6 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <EmptyState title="No messages yet" description="Start the conversation" icon={MessageSquare} />
                ) : messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-[11px] bg-brand-soft text-brand">
                          {(m.sender_name || m.sender_email || '?')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('max-w-[70%] rounded-lg px-3 py-2', isMe ? 'bg-brand text-primary-foreground' : 'bg-muted')}>
                        {!isMe && <div className="mb-0.5 text-[10px] font-medium text-muted-foreground">{m.sender_name || m.sender_email}</div>}
                        <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{m.body}</div>
                        <div className={cn('mt-0.5 text-[9px]', isMe ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{timeAgo(m.created_date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Type a message..."
                    className="h-9 text-[12.5px]"
                  />
                  <Button size="icon" onClick={handleSend} disabled={!body.trim() || sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-sm rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[14px] font-semibold">New Conversation</h3>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Conversation name..." className="mb-3" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createConv.isPending}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}