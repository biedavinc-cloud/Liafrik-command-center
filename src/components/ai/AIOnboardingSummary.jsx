import { invokeFunction } from '@/lib/api';
import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useApplications } from '@/lib/data/hooks';
import AIResponse from './AIResponse';
import AISafetyNotice from './AISafetyNotice';
import EmptyState from '@/components/kit/EmptyState';

export default function AIOnboardingSummary() {
  const { t } = useT();
  const { data: apps, isLoading } = useApplications();
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await invokeFunction('aiOnboard', { applicationId: selectedId });
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
        <div className="flex-1 min-w-[240px]">
          <label className="label-caps mb-1 block">{t('ai.selectApplication')}</label>
          <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || isLoading}>
            <SelectTrigger><SelectValue placeholder={t('ai.selectApplication')} /></SelectTrigger>
            <SelectContent>
              {(apps || []).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={analyze} disabled={loading || !selectedId} size="sm">
          <Rocket className="h-4 w-4" />
          {t('ai.analyzeApp')}
        </Button>
      </div>
      {loading && <AIResponse loading />}
      {error && <AIResponse error={error} />}
      {result && !error && <AIResponse result={result} />}
      {!loading && !result && !error && (
        <EmptyState icon={Rocket} title={t('ai.noResults')} description={t('ai.onboarding')} />
      )}
    </div>
  );
}