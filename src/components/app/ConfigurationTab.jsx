import React, { useState } from 'react';
import { Settings2, Plus, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import { useAppConfigs, useAction } from '@/lib/data/hooks';
import { setConfig, deleteConfig } from '@/lib/services/config';
import { useT } from '@/lib/i18n/I18nProvider';

const SECTIONS = ['feature_flag', 'setting', 'integration', 'security', 'limits', 'maintenance'];
const VALUE_TYPES = ['string', 'boolean', 'number', 'json', 'secret'];

export default function ConfigurationTab({ app }) {
  const { t } = useT();
  const [env, setEnv] = useState(app.environment || 'production');
  const { data: configs = [], isLoading } = useAppConfigs(app.id, env);
  const save = useAction(([key, value, section, valueType]) => setConfig(app, env, key, value, section, valueType), ['appConfigs']);
  const remove = useAction((id) => deleteConfig(app, id), ['appConfigs']);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', section: 'setting', valueType: 'string' });

  const grouped = SECTIONS.map((s) => ({ section: s, items: configs.filter((c) => c.section === s) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <Panel
        title={t('config.title')}
        subtitle={t('config.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Select value={env} onValueChange={setEnv}>
              <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setShowForm((s) => !s)}>
              <Plus className="h-3.5 w-3.5" />{t('config.add')}
            </Button>
          </div>
        }
      >
        {showForm && (
          <div className="mb-4 grid gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder={t('config.key')} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="h-8 text-[12px]" />
            <Input placeholder={t('config.value')} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="h-8 text-[12px]" />
            <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{t(`config.sections.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={form.valueType} onValueChange={(v) => setForm({ ...form, valueType: v })}>
                <SelectTrigger className="h-8 flex-1 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>{VALUE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-[12px]" disabled={!form.key || save.isPending}
                onClick={() => { save.mutate([form.key, form.value, form.section, form.valueType]); setForm({ key: '', value: '', section: 'setting', valueType: 'string' }); setShowForm(false); }}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-[12px] text-muted-foreground">{t('states.loading')}</div>
        ) : grouped.length === 0 ? (
          <EmptyState icon={Settings2} title={t('config.empty')} description={t('config.emptyDesc')} />
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.section}>
                <div className="label-caps mb-1.5">{t(`config.sections.${g.section}`)}</div>
                <div className="divide-y rounded-md border">
                  {g.items.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] font-medium">{c.key}</span>
                          {c.is_secret && <Lock className="h-3 w-3 text-muted-foreground" />}
                          <span className="rounded bg-muted px-1.5 py-px text-[10px] uppercase text-muted-foreground">{c.value_type}</span>
                        </div>
                        {c.description && <div className="text-[11px] text-muted-foreground">{c.description}</div>}
                      </div>
                      <div className="font-mono text-[12px] text-muted-foreground">{c.value}</div>
                      <button onClick={() => remove.mutate(c.id)} className="text-muted-foreground hover:text-destructive" disabled={remove.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}