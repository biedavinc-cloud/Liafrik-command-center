import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useT } from '@/lib/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useIncidents } from '@/lib/data/hooks';
import AIResponse from './AIResponse';
import AISafetyNotice from './AISafetyNotice';
import EmptyState from '@/components/kit/EmptyState';

export default function AIIncidentCommander() {
  const { t } = useT();
  const { data: incidents, isLoading } = useIncidents();
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openIncidents = (incidents || []).filter((i) => i.status === 'open' || i.status === 'investigating');
  const recentIncidents = (incidents || []).slice(0, 20);
  const incidentList = [...openIncidents, ...recentIncidents.filter((i) => !openIncidents.includes(i))];

  const analyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('aiIncident', { incidentId: selectedId });
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
          <label className="label-caps mb-1 block">{t('ai.selectIncident')}</label>
          <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || isLoading}>
            <SelectTrigger><SelectValue placeholder={t('ai.selectIncident')} /></SelectTrigger>
            <SelectContent>
              {incidentList.map((inc) => (
                <SelectItem key={inc.id} value={inc.id}>
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${inc.severity === 'critical' ? 'bg-rose-500' : inc.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                    {inc.title} — {inc.application_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={analyze} disabled={loading || !selectedId} size="sm">
          <AlertTriangle className="h-4 w-4" />
          {t('ai.analyzeIncident')}
        </Button>
      </div>
      {loading && <AIResponse loading />}
      {error && <AIResponse error={error} />}
      {result && !error && <AIResponse result={result} />}
      {!loading && !result && !error && (
        <EmptyState icon={AlertTriangle} title={t('ai.noResults')} description={t('ai.incidents')} />
      )}
    </div>
  );
}