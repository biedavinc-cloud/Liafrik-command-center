import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useT } from '@/lib/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import AIResponse from './AIResponse';
import AISafetyNotice from './AISafetyNotice';
import EmptyState from '@/components/kit/EmptyState';

export default function AISecurityCopilot() {
  const { t } = useT();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('aiSecurity', {});
      setResult(res.data);
      if (res.data?.error) setError(res.data.error);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <AISafetyNotice />
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-muted-foreground">
          Analyzes security events, sessions, failed audit events, administrator permissions, and API key patterns.
        </p>
        <Button onClick={run} disabled={loading} size="sm">
          <Shield className="h-4 w-4" />
          {t('ai.runAnalysis')}
        </Button>
      </div>
      {loading && <AIResponse loading />}
      {error && <AIResponse error={error} />}
      {result && !error && <AIResponse result={result} />}
      {!loading && !result && !error && (
        <EmptyState icon={Shield} title={t('ai.noResults')} description={t('ai.security')} />
      )}
    </div>
  );
}