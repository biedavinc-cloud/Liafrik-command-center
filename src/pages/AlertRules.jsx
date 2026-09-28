import { invokeFunction } from '@/lib/api';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useNotificationRules, useAction } from '@/lib/data/hooks';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import StatusBadge from '@/components/kit/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bell, Plus, Trash2, Edit3, Mail, Smartphone, MessageSquare, Webhook, BellRing, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGERS = [
  { value: 'application.offline', label: 'Application goes offline', severity: 'critical' },
  { value: 'application.degraded', label: 'Application degraded', severity: 'high' },
  { value: 'incident.created', label: 'Incident created', severity: 'critical' },
  { value: 'incident.resolved', label: 'Incident resolved', severity: 'medium' },
  { value: 'deployment.failed', label: 'Deployment failed', severity: 'high' },
  { value: 'deployment.successful', label: 'Deployment successful', severity: 'low' },
  { value: 'security.alert', label: 'Security alert', severity: 'critical' },
  { value: 'psp.payment_failed', label: 'Payment failed', severity: 'high' },
  { value: 'psp.payment_success', label: 'Payment received', severity: 'low' },
  { value: 'api.error_rate_high', label: 'API error rate high', severity: 'high' },
];

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push Notification', icon: Smartphone },
  { value: 'in_app', label: 'In-App', icon: MessageSquare },
  { value: 'webhook', label: 'Webhook', icon: Webhook },
];

export default function AlertRules() {
  const { t } = useT();
  const { data: rules = [], isLoading } = useNotificationRules();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', trigger: '', channel: 'email', recipient: '', enabled: true, conditions: '' });

  const saveRule = useAction(async (data) => {
    if (editing) {
      return invokeFunction('neonData', { entity: 'NotificationRule', operation: 'update', id: editing.id, data });
    }
    return invokeFunction('neonData', { entity: 'NotificationRule', operation: 'create', data });
  }, ['notificationRules']);

  const deleteRule = useAction(async (id) => {
    return invokeFunction('neonData', { entity: 'NotificationRule', operation: 'delete', id });
  }, ['notificationRules']);

  const toggleRule = useAction(async ({ id, enabled }) => {
    return invokeFunction('neonData', { entity: 'NotificationRule', operation: 'update', id, data: { enabled } });
  }, ['notificationRules']);

  const openForm = (rule = null) => {
    if (rule) {
      setEditing(rule);
      setForm({ name: rule.name, description: rule.description || '', trigger: rule.trigger || '', channel: rule.channel || 'email', recipient: rule.recipient || '', enabled: rule.enabled ?? true, conditions: rule.conditions || '' });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', trigger: '', channel: 'email', recipient: '', enabled: true, conditions: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.trigger) return;
    saveRule.mutate(form, { onSuccess: () => setShowForm(false) });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alert Rules"
        subtitle="Define custom notification rules with trigger conditions and delivery channels"
        breadcrumbs={[{ label: 'Alert Rules' }]}
        demo={rules.some((r) => r.is_demo)}
        actions={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Alert Rule</Button>}
      />

      {/* Channel overview */}
      <Panel title="Delivery Channels" subtitle="Available notification channels for alert delivery">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const count = rules.filter((r) => r.channel === ch.value).length;
            return (
              <div key={ch.value} className="flex items-center gap-2.5 rounded-md border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                <div><div className="text-[12.5px] font-medium">{ch.label}</div><div className="text-[10px] text-muted-foreground">{count} rules</div></div>
              </div>
            );
          })}
        </div>
      </Panel>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
      ) : rules.length === 0 ? (
        <Panel><EmptyState title="No alert rules" description="Create your first alert rule to get notified about system events" icon={BellRing} action={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Alert Rule</Button>} /></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((rule) => {
            const trigger = TRIGGERS.find((t) => t.value === rule.trigger);
            const channel = CHANNELS.find((c) => c.value === rule.channel);
            const ChannelIcon = channel?.icon || Bell;
            return (
              <div key={rule.id} className="group rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', rule.enabled ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground')}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">{rule.name}</div>
                      {rule.description && <div className="text-[11px] text-muted-foreground">{rule.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled ?? true} onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, enabled: checked })} />
                    <button onClick={() => openForm(rule)} className="opacity-0 transition-opacity group-hover:opacity-100"><Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-brand" /></button>
                    <button onClick={() => deleteRule.mutate(rule.id)} className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Trigger */}
                  <div className="flex items-center gap-2 rounded-md bg-rose-50/50 px-3 py-2">
                    <Zap className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-[11.5px] font-medium">{trigger?.label || rule.trigger}</span>
                    {trigger && <span className={cn('ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium uppercase', trigger.severity === 'critical' ? 'bg-rose-200 text-rose-700' : trigger.severity === 'high' ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 text-slate-600')}>{trigger.severity}</span>}
                  </div>
                  {/* Channel + recipient */}
                  <div className="flex items-center gap-2 rounded-md bg-blue-50/50 px-3 py-2">
                    <ChannelIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[11.5px] font-medium">{channel?.label || rule.channel}</span>
                    {rule.recipient && <span className="ml-auto text-[11px] text-muted-foreground">→ {rule.recipient}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> {editing ? 'Edit Alert Rule' : 'New Alert Rule'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="mb-1 block text-[11px]">Rule Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Notify on app downtime" /></div>
            <div><Label className="mb-1 block text-[11px]">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this alert do?" rows={2} /></div>
            <div><Label className="mb-1 block text-[11px]">Trigger Condition</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue placeholder="Select a trigger..." /></SelectTrigger>
                <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1 block text-[11px]">Delivery Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="mb-1 block text-[11px]">Recipient</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="email, URL, user..." /></div>
            </div>
            <div><Label className="mb-1 block text-[11px]">Additional Conditions (JSON, optional)</Label><Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder='{"severity":"critical"}' rows={2} className="font-mono text-[11px]" /></div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-[12px] font-medium">Enabled</span>
              <Switch checked={form.enabled} onCheckedChange={(checked) => setForm({ ...form, enabled: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim() || !form.trigger || saveRule.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}