import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useStaffTasks, useCreateTask, useUpdateTask, useDeleteTask, useAdministrators } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CheckCircle2, Circle, Clock, XCircle, Trash2, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { key: 'open', label: 'Open', icon: Circle, color: 'text-slate-500', dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500', dot: 'bg-blue-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', dot: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-500', dot: 'bg-rose-500' },
];

const PRIORITY = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-rose-100 text-rose-700' };

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
        <span className={cn('rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide', PRIORITY[task.priority] || PRIORITY.medium)}>{task.priority || 'medium'}</span>
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

export default function TaskManagement() {
  const { t } = useT();
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useStaffTasks();
  const { data: admins = [] } = useAdministrators();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', application_name: '' });

  const openForm = (task = null) => {
    if (task) {
      setEditing(task);
      setForm({ title: task.title, description: task.description || '', priority: task.priority || 'medium', assignee_id: task.assignee_id || '', due_date: task.due_date ? task.due_date.slice(0, 10) : '', application_name: task.application_name || '' });
    } else {
      setEditing(null);
      setForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', application_name: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const data = { ...form, assignee_name: admins.find((a) => a.id === form.assignee_id)?.full_name || '', due_date: form.due_date ? new Date(form.due_date).toISOString() : null };
    if (editing) {
      updateTask.mutate({ id: editing.id, ...data });
    } else {
      createTask.mutate(data);
    }
    setShowForm(false);
  };

  const byStatus = (status) => tasks.filter((task) => (task.status || 'open') === status);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task Management"
        subtitle="Assign operational duties and track completion across the team"
        breadcrumbs={[{ label: 'Task Management' }]}
        demo={tasks.some((t) => t.is_demo)}
        actions={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Task</Button>}
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 border-2 border-muted border-t-brand rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <Panel><EmptyState title="No tasks yet" description="Create your first task to get started" icon={CheckCircle2} action={<Button size="sm" onClick={() => openForm()}><Plus className="h-3.5 w-3.5" /> New Task</Button>} /></Panel>
      ) : (
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
                  <TaskCard key={task.id} task={task} onMove={(id, status) => updateTask.mutate({ id, status })} onDelete={(id) => deleteTask.mutate(id)} onEdit={openForm} />
                ))}
                {byStatus(col.key).length === 0 && <div className="rounded-md border border-dashed py-6 text-center text-[11px] text-muted-foreground">No tasks</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-[15px] font-semibold">{editing ? 'Edit Task' : 'New Task'}</h3>
            <div className="space-y-3">
              <div><label className="mb-1 block text-[11px] font-medium">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title..." /></div>
              <div><label className="mb-1 block text-[11px] font-medium">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add details..." rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-[11px] font-medium">Priority</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{['low', 'medium', 'high', 'urgent'].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="mb-1 block text-[11px] font-medium">Due Date</label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div><label className="mb-1 block text-[11px] font-medium">Assignee</label>
                <Select value={form.assignee_id} onValueChange={(v) => setForm({ ...form, assignee_id: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="mb-1 block text-[11px] font-medium">Application (optional)</label><Input value={form.application_name} onChange={(e) => setForm({ ...form, application_name: e.target.value })} placeholder="Related app..." /></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!form.title.trim() || createTask.isPending || updateTask.isPending}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}