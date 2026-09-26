import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/i18n/I18nProvider';
import Panel from '@/components/kit/Panel';

const CATEGORIES = ['monitoring', 'deployment', 'security', 'api', 'webhook', 'applications'];

// Rules persist on the founder's identity; delivery channels arrive with the notification service.
export default function NotificationRules() {
  const { t } = useT();
  const { toast } = useToast();
  const { user } = useAuth();
  const [rules, setRules] = useState(() => ({ ...Object.fromEntries(CATEGORIES.map((c) => [c, true])), ...(user?.notification_rules || {}) }));

  const toggle = async (c, v) => {
    const next = { ...rules, [c]: v };
    setRules(next);
    await base44.auth.updateMe({ notification_rules: next });
    toast({ title: t('settings.saved') });
  };

  return (
    <Panel title={t('notifications.rules')} subtitle={t('notifications.rulesSub')} bodyClassName="p-0">
      <ul className="divide-y">
        {CATEGORIES.map((c) => (
          <li key={c} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <div className="text-[12.5px] font-medium">{t(`notifCat.${c}`)}</div>
              <div className="text-[11px] text-muted-foreground">{t(`notifCatHint.${c}`)}</div>
            </div>
            <Switch checked={!!rules[c]} onCheckedChange={(v) => toggle(c, v)} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}