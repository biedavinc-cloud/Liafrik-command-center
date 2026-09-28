import { invokeFunction } from '@/lib/api';
import React, { useRef, useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AIResponse from './AIResponse';
import AISafetyNotice from './AISafetyNotice';

const SUGGESTIONS = [
  'What is the current system status?',
  'Which applications have the most errors?',
  'Summarize recent incidents',
  'Are there any security concerns?',
];

export default function AIChat() {
  const { t } = useT();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: prompt }]);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const res = await invokeFunction('aiQuery', { prompt });
      setMessages((prev) => [...prev, { role: 'ai', result: res.data, error: res.data?.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', error: err.message }]);
    }
    setLoading(false);
    scrollToBottom();
  };

  return (
    <div className="flex flex-col gap-3">
      <AISafetyNotice />
      <div className="flex flex-col rounded-lg border bg-card" style={{ minHeight: '400px' }}>
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 360px)' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-[14px] font-semibold">AI Assistant</h3>
              <p className="mt-1 max-w-sm text-[12.5px] text-muted-foreground">
                Ask questions about your applications, incidents, deployments, audit logs, or system status.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border bg-muted/50 px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-foreground text-background' : 'bg-brand-soft text-brand'}`}>
                {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                {msg.role === 'user' ? (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-[13px]">{msg.text}</p>
                ) : (
                  <AIResponse result={msg.result} error={msg.error} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1"><AIResponse loading /></div>
            </div>
          )}
        </div>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={t('ai.askQuestion')}
              disabled={loading}
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} size="sm">
              <Send className="h-4 w-4" />
              {t('ai.send')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}