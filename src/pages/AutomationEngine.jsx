import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAutomationRules, useAction } from '@/lib/data/hooks';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import StatusBadge from '@/components/kit/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Edit3, ArrowRight, Bell, Webhook, ShieldAlert, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGERS = [
  { value: 'application.offline', label: 'Application goes offline', icon: Activity, color: 'text-rose-500' },
  { value: 'application.degraded', label: 'Application degraded', icon: Activity, color: 'text-amber-500' },
  { value: 'incident.created', label: 'Incident created', icon: ShieldAlert, color: 'text-rose-500' },
  { value: 'deployment.failed', label: 'Deployment failed', icon: Activity, color: 'text-rose-500' },
  { value: 'psp.payment_failed', label: 'Payment failed', icon: Activity, color: 'text-amber-500' },
  { value: 'security.alert', label: 'Security alert', icon: ShieldAlert, color: 'text-rose-500' },
];

const ACTIONS = [
  { value: 'notify_email', label: 'Send email notification', icon: Bell },
  { value: 'notify_inapp', label: 'Create in-app notification', icon: Bell },
  { value: 'call_webhook', label: 'Call webhook', icon: Webhook },
  { value: 'create_incident', label: 'Create incident', icon: ShieldAlert },
];

export default function AutomationEngine() {
  const { t } = useT();
  const { data: rules = [], isLoading } = useAutomationRules();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', trigger: '', action: '', action_config: '', enabled: true });

  const saveRule = useAction(async (data) => {
    if (editing) {
      return base44.functions.invoke('neonData', { entity: 'AutomationRule', operation: 'update', id: editing.id, data });
    }
    return base44.functions.invoke('neonData', { entity: 'AutomationRule', operation: 'create', data });
  }, ['automationRules']);

  const toggleRule = useAction(async ({ id, enabled }) => {
    return base44.functions.invoke('neonData', { entity: 'AutomationRule', operation: 'update', id, data: { enabled } });
  }, ['automationRules']);

  const deleteRule = useAction(async (id) => {
    return base44.functions.invoke('neonData', { entity: 'AutomationRule', operation: 'delete', id });
  }, ['automationRules']);

  const openForm = (rule = null) => {
    if (rule) {
      setEditing(rule);
      setForm({ name: rule.name, description: rule.description || '', trigger: rule.trigger || '', action: rule.action || '', action_config: rule.action_config || '', enabled: rule.enabled ?? true });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', trigger: '', action: '', action_config: '', enabled: true });
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.trigger || !form.action) return;
    saveRule.mutate(form, { onSuccess: () => setShowForm(false) });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Automation Engine"
        subtitle="Build if-this-then-that rules for system events and alerts"
        breadcrumbs={[{ label: 'Automation Engine' }]}
        demo={rules.some((r) => r.is_demo)}
        actions={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Rule</Button>}
      />

      {/* Flow visualization */}
      <Panel title="How It Works" subtitle="Triggers fire actions automatically when system events occur">
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2.5">
            <Zap className="h-4 w-4 text-rose-500" />
            <span className="text-[12.5px] font-medium">When event fires</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-2.5">
            <Bell className="h-4 w-4 text-blue-500" />
            <span className="text-[12.5px] font-medium">Then take action</span>
          </div>
        </div>
      </Panel>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
      ) : rules.length === 0 ? (
        <Panel><EmptyState title="No automation rules" description="Create your first rule to automate responses to system events" icon={Zap} action={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Rule</Button>} /></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((rule) => {
            const trigger = TRIGGERS.find((t) => t.value === rule.trigger);
            const action = ACTIONS.find((a) => a.value === rule.action);
            const TriggerIcon = trigger?.icon || Activity;
            const ActionIcon = action?.icon || Bell;
            return (
              <div key={rule.id} className="group rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-soft"><Zap className="h-4 w-4 text-brand" /></div>
                    <div>
                      <div className="text-[13.5px] font-semibold">{rule.name}</div>
                      {rule.description && <div className="text-[11px] text-muted-foreground">{rule.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled ?? true} onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, enabled: checked })} />
                    <button onClick={() => openForm(rule)} className="opacity-0 transition-opacity group-hover:opacity-100"><Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-brand" /></button>
                    <button onClick={() => deleteRule.mutate(rule.id)} className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <TriggerIcon className={cn('h-3.5 w-3.5', trigger?.color || 'text-muted-foreground')} />
                  <span className="text-[11.5px] font-medium">{trigger?.label || rule.trigger}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  <ActionIcon className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[11.5px] font-medium">{action?.label || rule.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-[15px] font-semibold">{editing ? 'Edit Rule' : 'New Automation Rule'}</h3>
            <div className="space-y-3">
              <div><label className="mb-1 block text-[11px] font-medium">Rule Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alert on app downtime" /></div>
              <div><label className="mb-1 block text-[11px] font-medium">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this rule do?" rows={2} /></div>
              <div><label className="mb-1 block text-[11px] font-medium">Trigger (When)</label>
                <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a trigger..." /></SelectTrigger>
                  <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="mb-1 block text-[11px] font-medium">Action (Then)</label>
                <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                  <SelectTrigger><SelectValue placeholder="Select an action..." /></SelectTrigger>
                  <SelectContent>{ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="mb-1 block text-[11px] font-medium">Action Config (JSON)</label><Textarea value={form.action_config} onChange={(e) => setForm({ ...form, action_config: e.target.value })} placeholder='{"channel":"#ops","message":"App offline"}' rows={3} className="font-mono text-[11px]" /></div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-[12px] font-medium">Enabled</span>
                <Switch checked={form.enabled} onCheckedChange={(checked) => setForm({ ...form, enabled: checked })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim() || !form.trigger || !form.action || saveRule.isPending}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}