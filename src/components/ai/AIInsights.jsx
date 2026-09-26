import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useT } from '@/lib/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AIResponse from './AIResponse';
import AISafetyNotice from './AISafetyNotice';
import EmptyState from '@/components/kit/EmptyState';

export default function AIInsights() {
  const { t } = useT();
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('aiAnalyze', { focus: focus.trim() || undefined });
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
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="label-caps mb-1 block">{t('ai.focus')}</label>
          <Input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder={t('ai.focusPlaceholder')}
            disabled={loading}
          />
        </div>
        <Button onClick={run} disabled={loading} size="sm">
          <Activity className="h-4 w-4" />
          {t('ai.runAnalysis')}
        </Button>
      </div>
      {loading && <AIResponse loading />}
      {error && <AIResponse error={error} />}
      {result && !error && <AIResponse result={result} />}
      {!loading && !result && !error && (
        <EmptyState icon={Activity} title={t('ai.noResults')} description={t('ai.ops')} />
      )}
    </div>
  );
}