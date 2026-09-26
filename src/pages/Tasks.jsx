import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useStaffTasks, useUpdateTask, useDeleteTask } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TaskDialog from '@/components/tasks/TaskDialog';

const PRIORITY_COLORS = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700' };
const STATUS_COLORS = { open: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-muted text-muted-foreground' };

export default function Tasks() {
  const { t } = useT();
  const { data: tasks = [], isLoading } = useStaffTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const openCreate = () => { setEditTask(null); setDialogOpen(true); };
  const openEdit = (task) => { setEditTask(task); setDialogOpen(true); };

  const handleDelete = async (id) => {
    try { await deleteTask.mutateAsync(id); toast({ title: t('tasks.deleted') }); }
    catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const quickStatus = async (task, status) => {
    try { await updateTask.mutateAsync({ id: task.id, status }); }
    catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('tasks.title')} subtitle={t('tasks.subtitle')}
        breadcrumbs={[{ label: t('tasks.title') }]}
        actions={<Button onClick={openCreate} className="h-9"><Plus className="h-4 w-4 mr-1.5" />{t('tasks.newTask')}</Button>}
      />
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('tasks.all')}</SelectItem>
            <SelectItem value="open">{t('tasks.open')}</SelectItem>
            <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
            <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('tasks.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground">{filtered.length} {t('tasks.title').toLowerCase()}</span>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title={t('tasks.noTasks')} body={t('tasks.noTasksBody')} action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />{t('tasks.newTask')}</Button>} />
      ) : (
        <div className="surface divide-y">
          {filtered.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium truncate">{task.title}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>{t(`tasks.${task.priority}`)}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-medium ${STATUS_COLORS[task.status] || ''}`}>{t(`tasks.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {task.assignee_name || '—'} · {task.application_name || '—'} {task.due_date ? `· ${new Date(task.due_date).toLocaleDateString()}` : ''}
                </div>
              </div>
              <Select value={task.status} onValueChange={v => quickStatus(task, v)}>
                <SelectTrigger className="w-32 h-7 text-[10.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t('tasks.open')}</SelectItem>
                  <SelectItem value="in_progress">{t('tasks.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('tasks.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('tasks.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(task)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} />
    </div>
  );
}