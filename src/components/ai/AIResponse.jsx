import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Database, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIResponse({ result, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-6 text-[13px] text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <span>AI is analyzing…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] text-rose-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">AI request failed</p>
          <p className="mt-0.5 text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!result?.text) return null;

  return (
    <div className="space-y-3">
      <div className="prose prose-sm max-w-none rounded-md border bg-card px-4 py-3.5 text-[13px] leading-relaxed">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h3 className="mb-2 mt-3 text-[14px] font-semibold">{children}</h3>,
            h2: ({ children }) => <h3 className="mb-2 mt-3 text-[14px] font-semibold">{children}</h3>,
            h3: ({ children }) => <h4 className="mb-1.5 mt-2.5 text-[13px] font-semibold">{children}</h4>,
            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-[12px] font-mono">{children}</code>,
            hr: () => <hr className="my-3 border-border" />,
          }}
        >
          {result.text}
        </ReactMarkdown>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        {result.correlationId && (
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className="font-mono">{result.correlationId.slice(0, 20)}…</span>
          </span>
        )}
        {result.dataSources?.length > 0 && (
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {result.dataSources.length} sources
          </span>
        )}
        {result.tokensUsed > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {result.tokensUsed} tokens
          </span>
        )}
        {result.provider && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{result.provider}</span>
        )}
      </div>
    </div>
  );
}