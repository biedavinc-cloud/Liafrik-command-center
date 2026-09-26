import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications } from '@/lib/data/hooks';
import { useAction } from '@/lib/data/hooks';
import { createIncident } from '@/lib/services/incidents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IncidentDialog({ open, onOpenChange, apps, onCreated }) {
  const { t } = useT();
  const [form, setForm] = useState({ application_id: '', title: '', description: '', severity: 'medium', environment: 'production' });
  const create = useAction((data) => {
    const app = apps.find((a) => a.id === data.application_id);
    return createIncident(app, data);
  }, ['incidents']);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.application_id || !form.title) return;
    create.mutate(form, { onSuccess: () => { onOpenChange(false); setForm({ application_id: '', title: '', description: '', severity: 'medium', environment: 'production' }); onCreated?.(); } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{t('incidents.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[12px]">{t('incidents.application')}</Label>
            <Select value={form.application_id} onValueChange={(v) => set('application_id', v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder={t('incidents.selectApp')} /></SelectTrigger>
              <SelectContent>{apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">{t('incidents.title')}</Label>
            <Input className="h-9" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">{t('incidents.description')}</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">{t('incidents.severity')}</Label>
              <Select value={form.severity} onValueChange={(v) => set('severity', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">{t('severity.critical')}</SelectItem>
                  <SelectItem value="high">{t('incidents.high')}</SelectItem>
                  <SelectItem value="medium">{t('incidents.medium')}</SelectItem>
                  <SelectItem value="low">{t('incidents.low')}</SelectItem>
                  <SelectItem value="info">{t('severity.info')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">{t('incidents.environment')}</Label>
              <Select value={form.environment} onValueChange={(v) => set('environment', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">{t('env.production')}</SelectItem>
                  <SelectItem value="staging">{t('env.staging')}</SelectItem>
                  <SelectItem value="development">{t('env.development')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button size="sm" disabled={create.isPending || !form.application_id || !form.title} onClick={submit}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t('incidents.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}