import React from 'react';
import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Panel from '@/components/kit/Panel';
import PageHeader from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import DemoBadge from '@/components/kit/DemoBadge';
import { useAutomationRules, useAction } from '@/lib/data/hooks';
import { AutomationRules } from '@/lib/data/repositories';
import { useT } from '@/lib/i18n/I18nProvider';

export default function Rules() {
  const { t } = useT();
  const { data: rules = [], isLoading } = useAutomationRules();
  const toggle = useAction(async (rule) => AutomationRules.update(rule.id, { enabled: !rule.enabled }), ['automationRules']);

  return (
    <div>
      <PageHeader title={t('rules.title')} subtitle={t('rules.subtitle')} />
      <Panel actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]"><Plus className="h-3.5 w-3.5" />{t('rules.create')}</Button>}>
        {isLoading ? (
          <div className="py-8 text-center text-[12px] text-muted-foreground">{t('states.loading')}</div>
        ) : rules.length === 0 ? (
          <EmptyState icon={Zap} title={t('rules.empty')} description={t('rules.emptyBody')} />
        ) : (
          <div className="divide-y">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 py-3">
                <Zap className={`h-4 w-4 shrink-0 ${rule.enabled ? 'text-brand' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium">{rule.name}</span>
                    {rule.is_demo && <DemoBadge />}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{rule.description}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10.5px]">
                    <span className="rounded bg-muted px-1.5 py-px font-mono">{rule.trigger_event}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="rounded bg-brand-soft/40 px-1.5 py-px text-brand">{t(`rules.actions.${rule.action_type}`)}</span>
                    {rule.environment_scope && rule.environment_scope !== 'all' && (
                      <span className="rounded bg-muted px-1.5 py-px uppercase text-muted-foreground">{rule.environment_scope}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {rule.fire_count > 0 && <div>{t('rules.fireCount', { n: rule.fire_count })}</div>}
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggle.mutate(rule)} disabled={toggle.isPending} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}