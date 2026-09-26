import React from 'react';
import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import PageHeader from '@/components/kit/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIProviderBadge from '@/components/ai/AIProviderBadge';
import AIChat from '@/components/ai/AIChat';
import AIInsights from '@/components/ai/AIInsights';
import AIIncidentCommander from '@/components/ai/AIIncidentCommander';
import AISecurityCopilot from '@/components/ai/AISecurityCopilot';
import AIOnboardingSummary from '@/components/ai/AIOnboardingSummary';
import AIGovernanceLog from '@/components/ai/AIGovernanceLog';

export default function AICommandCenter() {
  const { t } = useT();

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('ai.commandCenter')}
        subtitle={t('ai.subtitle')}
        actions={<AIProviderBadge />}
      />
      <Tabs defaultValue="assistant">
        <TabsList className="w-fit">
          <TabsTrigger value="assistant"><Sparkles className="mr-1.5 h-3.5 w-3.5" />{t('ai.assistant')}</TabsTrigger>
          <TabsTrigger value="ops">{t('ai.ops')}</TabsTrigger>
          <TabsTrigger value="incidents">{t('ai.incidents')}</TabsTrigger>
          <TabsTrigger value="security">{t('ai.security')}</TabsTrigger>
          <TabsTrigger value="onboarding">{t('ai.onboarding')}</TabsTrigger>
          <TabsTrigger value="governance">{t('ai.governance')}</TabsTrigger>
        </TabsList>
        <TabsContent value="assistant"><AIChat /></TabsContent>
        <TabsContent value="ops"><AIInsights /></TabsContent>
        <TabsContent value="incidents"><AIIncidentCommander /></TabsContent>
        <TabsContent value="security"><AISecurityCopilot /></TabsContent>
        <TabsContent value="onboarding"><AIOnboardingSummary /></TabsContent>
        <TabsContent value="governance"><AIGovernanceLog /></TabsContent>
      </Tabs>
    </div>
  );
}