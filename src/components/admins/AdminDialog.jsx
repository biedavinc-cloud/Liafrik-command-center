import { invokeFunction } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { Loader2, Plus, X, Mail, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAction } from '@/lib/data/hooks';
import { saveAdministrator } from '@/lib/services/identity';
import { GLOBAL_ROLES, PERMISSION_RESOURCES } from '@/lib/rbac';
import { ENVIRONMENTS } from '@/lib/protocol/capabilities';
import Field from '@/components/kit/Field';

const EMPTY = { full_name: '', email: '', global_role: 'none', assignments: [], permissions: [] };
const APP_ROLES = GLOBAL_ROLES.filter((r) => !['superadmin', 'global_admin'].includes(r));

function Pick({ value, onChange, options, labelOf, className }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || 'h-9'}><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{labelOf(o)}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export default function AdminDialog({ open, onOpenChange, admin, apps, admins }) {
  const { t } = useT();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [inviting, setInviting] = useState(false);
  const isEditing = !!admin;

  useEffect(() => {
    if (open) {
      setForm(admin
        ? { full_name: admin.full_name, email: admin.email, global_role: admin.global_role || 'none', assignments: admin.assignments || [], permissions: admin.permissions || [] }
        : EMPTY
      );
      setErrors({});
    }
  }, [open, admin]);

  const save = useAction((d) => saveAdministrator(d, admin), ['administrators', 'notifications']);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setA = (i, k, v) => set('assignments', form.assignments.map((a, j) => (j === i ? { ...a, [k]: v } : a)));

  const togglePermission = (perm) => {
    set('permissions', form.permissions.includes(perm)
      ? form.permissions.filter((p) => p !== perm)
      : [...form.permissions, perm]
    );
  };

  const submit = async () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = t('wizard.errors.required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('admins.errors.email');
    else if (admins.some((a) => a.email.toLowerCase() === form.email.toLowerCase() && a.id !== admin?.id)) e.email = t('admins.errors.emailTaken');
    if (form.global_role === 'none' && !form.assignments.some((a) => a.application_id && a.role)) e.assignments = t('admins.errors.scope');
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = { ...form, assignments: form.assignments.filter((a) => a.application_id && a.role) };

    if (isEditing) {
      // Edit existing admin — direct update
      save.mutate(payload, {
        onSuccess: () => { toast({ title: t('admins.updated') }); onOpenChange(false); },
      });
    } else {
      // New admin — send invitation via backend function
      setInviting(true);
      try {
        const res = await invokeFunction('inviteAdministrator', payload);
        if (res.data?.success) {
          toast({ title: t('invite.sent'), description: t('invite.sentBody', { email: form.email }) });
          onOpenChange(false);
        } else {
          toast({ title: t('invite.failed'), description: res.data?.error || 'Unknown error', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: t('invite.failed'), description: err.message || 'Unknown error', variant: 'destructive' });
      } finally {
        setInviting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{isEditing ? t('admins.edit') : t('admins.invite')}</DialogTitle>
          <DialogDescription className="text-[12px]">{isEditing ? t('admins.dialogSub') : t('invite.subtitle')}</DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div className="flex items-center gap-2 rounded-md bg-brand-soft/40 border border-brand/30 px-3 py-2 text-[11.5px]">
            <Mail className="h-3.5 w-3.5 text-brand shrink-0" />
            <span>{t('invite.hint')}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('admins.name')} error={errors.full_name} required>
            <Input className="h-9" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} disabled={isEditing} />
          </Field>
          <Field label={t('admins.email')} error={errors.email} required>
            <Input className="h-9" type="email" value={form.email} onChange={(e) => set('email', e.target.value.trim())} disabled={isEditing} />
          </Field>
          <Field label={t('admins.globalRole')} className="sm:col-span-2" hint={t('admins.globalRoleHint')}>
            <Pick value={form.global_role} onChange={(v) => set('global_role', v)} options={['none', ...GLOBAL_ROLES.filter((r) => r !== 'superadmin')]} labelOf={(o) => t(`roles.${o}`)} />
          </Field>
        </div>

        {/* Application Access & Environment Access */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium">{t('admins.assignments')}</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11.5px]" onClick={() => set('assignments', [...form.assignments, { application_id: '', role: 'support', environment: 'production' }])}><Plus className="h-3 w-3" />{t('admins.addAssignment')}</Button>
          </div>
          <div className="space-y-2">
            {form.assignments.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                <Pick className="h-8 text-[12px]" value={a.application_id} onChange={(v) => setA(i, 'application_id', v)} options={apps.map((x) => x.id)} labelOf={(id) => apps.find((x) => x.id === id)?.name} />
                <Pick className="h-8 text-[12px]" value={a.role} onChange={(v) => setA(i, 'role', v)} options={APP_ROLES} labelOf={(o) => t(`roles.${o}`)} />
                <Pick className="h-8 text-[12px]" value={a.environment || 'production'} onChange={(v) => setA(i, 'environment', v)} options={ENVIRONMENTS} labelOf={(o) => t(`env.${o}`)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => set('assignments', form.assignments.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {form.assignments.length === 0 && <p className="rounded-md border border-dashed px-3 py-3 text-center text-[11.5px] text-muted-foreground">{t('admins.noAssignments')}</p>}
            {errors.assignments && <p className="text-[11.5px] text-rose-600">{errors.assignments}</p>}
          </div>
        </div>

        {/* Permissions */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            <span className="text-[12px] font-medium">{t('invite.permissions')}</span>
            <span className="text-[10.5px] text-muted-foreground">({form.permissions.length} {t('invite.selected')})</span>
          </div>
          <div className="max-h-32 overflow-y-auto rounded-md border p-2">
            <div className="flex flex-wrap gap-1">
              {PERMISSION_RESOURCES.map((resource) => (
                <div key={resource.key} className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground px-1">{resource.key}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {resource.actions.map((action) => {
                      const perm = `${resource.key}.${action}`;
                      const active = form.permissions.includes(perm);
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(perm)}
                          className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono transition-colors ${active ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-1 text-[10.5px] text-muted-foreground">{t('invite.permissionsHint')}</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-9 text-[12.5px]" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button size="sm" className="h-9 gap-1.5 text-[12.5px]" onClick={submit} disabled={save.isPending || inviting}>
            {(save.isPending || inviting) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? t('common.save') : t('invite.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}