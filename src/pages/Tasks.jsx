import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useStaffTasks, useUpdateTask, useDeleteTask } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, Plus, Pencil, Trash2, CheckCircle2, Circle, Clock, XCircle, LayoutGrid, AlignLeft, Calendar, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TaskDialog from '@/components/tasks/TaskDialog';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700' };
const COLUMNS = [
  { key: 'open', label: 'Open', icon: Circle, dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, dot: 'bg-blue-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, dot: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, dot: 'bg-rose-500' },
];

function TaskCard({ task, onMove, onDelete, onEdit }) {
  return (
    <div className="group rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <button onClick={() => onEdit(task)} className="text-left text-[12.5px] font-medium leading-snug hover:text-brand">{task.title}</button>
        <button onClick={() => onDelete(task.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" />
        </button>
      </div>
      {task.description && <p className="mb-2 text-[11px] text-muted-foreground line-clamp-2">{task.description}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide', PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium)}>{task.priority || 'medium'}</span>
        {task.assignee_name && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><User className="h-2.5 w-2.5" />{task.assignee_name}</span>}
        {task.due_date && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Calendar className="h-2.5 w-2.5" />{new Date(task.due_date).toLocaleDateString()}</span>}
      </div>
      {task.application_name && <div className="mt-1.5 text-[10px] text-muted-foreground">📁 {task.application_name}</div>}
      <div className="mt-2 flex gap-1">
        {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
          <button key={c.key} onClick={() => onMove(task.id, c.key)} className="flex-1 rounded border px-1 py-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            → {c.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { t } = useT();
  const { data: tasks = [], isLoading } = useStaffTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('board');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const byStatus = (status) => tasks.filter((task) => (task.status || 'open') === status);

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
        demo={tasks.some((t) => t.is_demo)}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border p-0.5">
              <button onClick={() => setView('board')} className={cn('flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors', view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="h-3 w-3" />Board</button>
              <button onClick={() => setView('list')} className={cn('flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}><AlignLeft className="h-3 w-3" />List</button>
            </div>
            <Button onClick={openCreate} className="h-9"><Plus className="h-4 w-4 mr-1.5" />{t('tasks.newTask')}</Button>
          </div>
        }
      />

      {view === 'list' && (
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
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 border-2 border-muted border-t-foreground rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <Panel><EmptyState icon={ListChecks} title={t('tasks.noTasks')} description={t('tasks.noTasksBody')} action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />{t('tasks.newTask')}</Button>} /></Panel>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  <span className="text-[12.5px] font-semibold">{col.label}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums">{byStatus(col.key).length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {byStatus(col.key).map((task) => (
                  <TaskCard key={task.id} task={task} onMove={(id, status) => quickStatus({ id }, status)} onDelete={handleDelete} onEdit={openEdit} />
                ))}
                {byStatus(col.key).length === 0 && <div className="rounded-md border border-dashed py-6 text-center text-[11px] text-muted-foreground">No tasks</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface divide-y">
          {filtered.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(task)} className="text-[12.5px] font-medium truncate hover:text-brand">{task.title}</button>
                  <span className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-medium', PRIORITY_COLORS[task.priority] || '')}>{t(`tasks.${task.priority}`)}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-medium', task.status === 'open' ? 'bg-slate-100 text-slate-600' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>{t(`tasks.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}</span>
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