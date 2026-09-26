import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications, useCreateTask, useUpdateTask } from '@/lib/data/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TaskDialog({ open, onOpenChange, task }) {
  const { t } = useT();
  const { data: apps = [] } = useApplications();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee_name: task?.assignee_name || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'open',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    application_id: task?.application_id || '',
    customer: task?.customer || '',
    payment_reference: task?.payment_reference || '',
    notes: task?.notes || '',
  });

  const handleSubmit = async () => {
    try {
      const app = apps.find(a => a.id === form.application_id);
      const payload = {
        ...form,
        application_id: form.application_id || null,
        application_name: app?.name || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      };
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      toast({ title: isEdit ? t('tasks.edited') : t('tasks.created') });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? t('tasks.editTask') : t('tasks.newTask')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>{t('tasks.title_field')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>{t('tasks.description')}</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t('tasks.assignee')}</Label><Input value={form.assignee_name} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>{t('tasks.application')}</Label>
              <Select value={form.application_id} onValueChange={v => setForm(f => ({ ...f, application_id: v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{apps.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t('tasks.priority')}</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('tasks.low')}</SelectItem>
                  <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
                  <SelectItem value="high">{t('tasks.high')}</SelectItem>
                  <SelectItem value="urgent">{t('tasks.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t('tasks.status')}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t('tasks.open')}</SelectItem>
                  <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('tasks.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t('tasks.dueDate')}</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>{t('tasks.customer')}</Label><Input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label>{t('tasks.paymentRef')}</Label><Input value={form.payment_reference} onChange={e => setForm(f => ({ ...f, payment_reference: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label>{t('tasks.notes')}</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createTask.isPending || updateTask.isPending || !form.title}>
            {(createTask.isPending || updateTask.isPending) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {isEdit ? t('common.confirm') : t('tasks.newTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}