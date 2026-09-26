import React, { useState } from 'react';
import { Plus, Webhook, Power, Trash2, Send, RotateCw, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useWebhooks, useAction } from '@/lib/data/hooks';
import { createWebhook, toggleWebhook, deleteWebhook, retryWebhook } from '@/lib/services/webhooks';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';

const EVENTS = ['user.created', 'user.updated', 'order.created', 'payment.completed', 'payment.failed', 'application.health_changed', 'administrator.created'];

export default function WebhooksTab({ app }) {
  const { t, fmt } = useT();
  const { toast } = useToast();
  const { data: hooks = [], isLoading } = useWebhooks(app.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ event: 'user.created', endpoint: '' });

  const create = useAction((data) => createWebhook(app, data), ['webhooks']);
  const toggle = useAction((h, enabled) => toggleWebhook(app, h, enabled), ['webhooks']);
  const remove = useAction((h) => deleteWebhook(app, h), ['webhooks']);
  const retry = useAction((h) => retryWebhook(app, h), ['webhooks']);

  const submit = () => {
    create.mutate(form, { onSuccess: () => { setDialogOpen(false); setForm({ event: 'user.created', endpoint: '' }); toast({ title: t('webhooks.created') || 'Webhook created' }); } });
  };

  return (
    <div className="space-y-4">
      <Panel title={t('webhooks.title')} subtitle={t('webhooks.subtitle')}
        actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />{t('webhooks.create')}</Button>}>
        {isLoading ? <div className="py-8 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
         hooks.length === 0 ? <EmptyState icon={Webhook} title={t('webhooks.empty')} description={t('webhooks.emptyBody')} /> : (
          <div className="space-y-2">
            {hooks.map((h) => (
              <div key={h.id} className="rounded-md border px-3 py-2.5 text-[12.5px]">
                <div className="flex items-center gap-3">
                  <Webhook className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11.5px] font-medium">{h.event}</span>
                      <StatusBadge value={h.status === 'active' ? 'active' : 'disabled'} />
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{h.endpoint}</div>
                    {(h.success_count > 0 || h.failure_count > 0) && (
                      <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                        <span className="text-emerald-600">✓ {h.success_count}</span>
                        <span className="text-rose-600">✕ {h.failure_count}</span>
                        {h.retry_count > 0 && <span>↻ {h.retry_count}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => retry.mutate(h)}><Send className="h-3 w-3" />{t('webhooks.test')}</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => toggle.mutate(h, h.status !== 'active')}>
                      {h.status === 'active' ? <><Power className="h-3 w-3" />{t('webhooks.disable')}</> : <><Power className="h-3 w-3" />{t('webhooks.enable')}</>}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] text-rose-600" onClick={() => remove.mutate(h)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                {h.deliveries && h.deliveries.length > 0 && (
                  <div className="mt-2 ml-7 space-y-1 border-l pl-3">
                    {h.deliveries.slice(-3).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${d.result === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono">{new Date(d.timestamp).toLocaleTimeString()}</span>
                        <span>HTTP {d.http_status}</span>
                        <span>{d.response_time_ms}ms</span>
                        {d.correlation_id && <span className="font-mono text-[10px]">{d.correlation_id}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">{t('webhooks.create')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-[12px]">{t('webhooks.event')}</Label>
              <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.event} onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))}>
                {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-[12px]">{t('webhooks.endpoint')}</Label><Input className="h-9" placeholder="https://..." value={form.endpoint} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button size="sm" disabled={create.isPending || !form.endpoint} onClick={submit}>{create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t('webhooks.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}