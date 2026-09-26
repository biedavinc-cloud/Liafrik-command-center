import React, { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useAppConfigs, useAction } from '@/lib/data/hooks';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import AppIcon from '@/components/kit/AppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, Plus, Trash2, Edit3, ToggleLeft, Sliders, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENV_TABS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const SECTIONS = ['feature_flag', 'setting', 'integration', 'security', 'limits', 'maintenance'];
const VALUE_TYPES = ['string', 'boolean', 'number', 'json', 'secret'];

function ConfigRow({ config, onEdit, onDelete }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        {config.is_secret ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : config.value_type === 'boolean' ? <ToggleLeft className="h-3.5 w-3.5 text-blue-500" /> : <Settings className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium">{config.key}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{config.value_type}</span>
          {config.is_secret && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">SECRET</span>}
        </div>
        {config.description && <div className="text-[11px] text-muted-foreground">{config.description}</div>}
      </div>
      <div className="max-w-[200px] truncate font-mono text-[11px] text-muted-foreground">
        {config.is_secret ? '••••••••' : config.value || '—'}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onEdit(config)}><Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-brand" /></button>
        <button onClick={() => onDelete(config.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" /></button>
      </div>
    </div>
  );
}

function ConfigForm({ form, setForm, onSubmit, onCancel, isPending, editing }) {
  return (
    <div className="space-y-3">
      <div><label className="mb-1 block text-[11px] font-medium">Key</label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. MAX_CONNECTIONS" /></div>
      <div><label className="mb-1 block text-[11px] font-medium">Value</label>
        {form.value_type === 'json' ? <Textarea value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} rows={3} className="font-mono text-[11px]" placeholder='{"key":"value"}' /> : <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value..." type={form.is_secret ? 'password' : 'text'} />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-[11px] font-medium">Type</label>
          <Select value={form.value_type} onValueChange={(v) => setForm({ ...form, value_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VALUE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><label className="mb-1 block text-[11px] font-medium">Section</label>
          <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><label className="mb-1 block text-[11px] font-medium">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this config do?" /></div>
      <label className="flex items-center gap-2 rounded-md border p-3">
        <input type="checkbox" checked={form.is_secret} onChange={(e) => setForm({ ...form, is_secret: e.target.checked })} className="h-4 w-4 rounded border-input" />
        <div><div className="text-[12px] font-medium">Mark as secret</div><div className="text-[10px] text-muted-foreground">Value will be masked in the UI</div></div>
      </label>
    </div>
  );
}

export default function EnvironmentConfig() {
  const { t } = useT();
  const { data: apps = [], isLoading } = useApplications();
  const [selectedApp, setSelectedApp] = useState(null);
  const [env, setEnv] = useState('production');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: '', value: '', value_type: 'string', section: 'setting', description: '', is_secret: false });

  const app = apps.find((a) => a.id === selectedApp) || apps[0];
  const { data: configs = [], isLoading: loadingConfigs } = useAppConfigs(app?.id, env);

  const saveConfig = useAction(async (data) => {
    if (editing) {
      return base44.functions.invoke('neonData', { entity: 'AppConfig', operation: 'update', id: editing.id, data });
    }
    return base44.functions.invoke('neonData', {
      entity: 'AppConfig', operation: 'create',
      data: { ...data, application_id: app.id, application_name: app.name, environment: env, is_configured: true, last_changed_at: new Date().toISOString() }
    });
  }, ['appConfigs']);

  const deleteConfig = useAction(async (id) => {
    return base44.functions.invoke('neonData', { entity: 'AppConfig', operation: 'delete', id });
  }, ['appConfigs']);

  const openForm = (config = null) => {
    if (config) {
      setEditing(config);
      setForm({ key: config.key, value: config.value || '', value_type: config.value_type || 'string', section: config.section || 'setting', description: config.description || '', is_secret: config.is_secret || false });
    } else {
      setEditing(null);
      setForm({ key: '', value: '', value_type: 'string', section: 'setting', description: '', is_secret: false });
    }
    setShowForm(true);
  };

  const grouped = useMemo(() => {
    const map = {};
    configs.forEach((c) => { (map[c.section] = map[c.section] || []).push(c); });
    return map;
  }, [configs]);

  const activeApps = apps.filter((a) => a.lifecycle !== 'archived');

  return (
    <div className="space-y-5">
      <PageHeader title="Environment Configuration" subtitle="Manage variables and settings partitioned by development, staging, and production" breadcrumbs={[{ label: 'Environment Config' }]} />

      <Panel title="Select Application" subtitle="Choose an application to manage its environment configurations">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center"><div className="h-6 w-6 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
        ) : activeApps.length === 0 ? (
          <EmptyState title="No applications" icon={Settings} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeApps.map((a) => (
              <button key={a.id} onClick={() => setSelectedApp(a.id)} className={cn('flex items-center gap-2 rounded-md border px-3 py-2 transition-all', (app?.id === a.id) ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'bg-card hover:bg-muted')}>
                <AppIcon app={a} size="sm" />
                <span className="text-[12.5px] font-medium">{a.name}</span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {app && (
        <Tabs value={env} onValueChange={setEnv}>
          <div className="flex items-center justify-between">
            <TabsList>
              {ENV_TABS.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="text-[12px]">{tab.label}</TabsTrigger>)}
            </TabsList>
            <Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> Add Config</Button>
          </div>
          {ENV_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loadingConfigs ? (
                <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
              ) : configs.length === 0 ? (
                <Panel><EmptyState title={`No ${tab.label.toLowerCase()} configs`} description="Add configuration variables for this environment" icon={Sliders} action={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> Add Config</Button>} /></Panel>
              ) : (
                <div className="space-y-4">
                  {SECTIONS.filter((s) => grouped[s]).map((section) => (
                    <Panel key={section} title={section.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} bodyClassName="p-0">
                      <div className="divide-y">
                        {grouped[section].map((c) => (
                          <ConfigRow key={c.id} config={c} onEdit={openForm} onDelete={(id) => deleteConfig.mutate(id)} />
                        ))}
                      </div>
                    </Panel>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-[15px] font-semibold">{editing ? 'Edit Config' : 'Add Configuration'}</h3>
            <ConfigForm form={form} setForm={setForm} editing={editing} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => saveConfig.mutate(form, { onSuccess: () => setShowForm(false) })} disabled={!form.key.trim() || saveConfig.isPending}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}