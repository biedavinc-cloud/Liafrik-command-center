import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAction } from '@/lib/data/hooks';
import { updateApplication, setMaintenanceMode } from '@/lib/services/applications';
import { APP_TYPES } from '@/lib/protocol/capabilities';
import { checkCompatibility } from '@/lib/protocol/compatibility';
import { useCan } from '@/lib/rbac';
import { validateStep } from '@/components/wizard/validate';
import Field from '@/components/kit/Field';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import StepCapabilities from '@/components/wizard/StepCapabilities';
import DangerZone from './DangerZone';

const FIELDS = ['name', 'description', 'type', 'domain', 'admin_url', 'api_url', 'health_endpoint', 'version', 'capabilities'];
const pick = (app) => Object.fromEntries(FIELDS.map((k) => [k, app[k] ?? (k === 'capabilities' ? [] : '')]));

export default function AppSettingsTab({ app }) {
  const { t } = useT();
  const { toast } = useToast();
  const can = useCan();
  const [form, setForm] = useState(pick(app));
  const [errors, setErrors] = useState({});
  useEffect(() => setForm(pick(app)), [app]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = useAction((patch) => updateApplication(app, patch), ['applications']);
  const maintenance = useAction((mode) => setMaintenanceMode(app, mode), ['applications']);
  const compat = checkCompatibility(app);
  const disabled = !can('applications.edit');
  const dirty = JSON.stringify(form) !== JSON.stringify(pick(app));
  const err = (k) => errors[k] && t(`wizard.errors.${errors[k]}`);

  const submit = () => {
    const e = { ...validateStep('info', { ...form, slug: app.slug }, []), ...(form.capabilities.length ? {} : { capabilities: 'capabilities' }) };
    if (!form.health_endpoint?.startsWith('/')) e.health_endpoint = 'path';
    setErrors(e);
    if (Object.keys(e).length) return;
    const patch = Object.fromEntries(FIELDS.filter((k) => JSON.stringify(form[k]) !== JSON.stringify(app[k] ?? (k === 'capabilities' ? [] : ''))).map((k) => [k, form[k]]));
    save.mutate(patch, { onSuccess: () => toast({ title: t('settings.saved') }) });
  };

  return (
    <div className="space-y-4">
      <Panel title={t('settings.general')} subtitle={t('settings.generalSub')} actions={
        <Button size="sm" className="h-8 gap-1.5 text-[12px]" disabled={disabled || !dirty || save.isPending} onClick={submit}>
          {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{t('common.save')}
        </Button>
      }>
        <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('wizard.f.name')} error={err('name')} required><Input className="h-9" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label={t('wizard.f.type')}>
            <Select value={form.type} onValueChange={(v) => set('type', v)} disabled={disabled}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{APP_TYPES.map((o) => <SelectItem key={o} value={o}>{t(`appType.${o}`)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t('wizard.f.description')} className="sm:col-span-2"><Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label={t('wizard.f.domain')} error={err('domain')}><Input className="h-9" value={form.domain} onChange={(e) => set('domain', e.target.value.trim())} /></Field>
          <Field label={t('wizard.f.version')}><Input className="h-9" value={form.version} onChange={(e) => set('version', e.target.value)} /></Field>
          <Field label={t('wizard.f.apiUrl')} error={err('api_url')} required><Input className="h-9" value={form.api_url} onChange={(e) => set('api_url', e.target.value.trim())} /></Field>
          <Field label={t('wizard.f.adminUrl')} error={err('admin_url')}><Input className="h-9" value={form.admin_url} onChange={(e) => set('admin_url', e.target.value.trim())} /></Field>
          <Field label={t('wizard.f.healthEndpoint')} error={err('health_endpoint')}><Input className="h-9 font-mono text-[12.5px]" value={form.health_endpoint} onChange={(e) => set('health_endpoint', e.target.value.trim())} /></Field>
        </fieldset>
      </Panel>
      <Panel title={t('wizard.steps.capabilities')} subtitle={t('settings.capabilitiesSub')}>
        <fieldset disabled={disabled}><StepCapabilities form={form} set={set} errors={errors} /></fieldset>
      </Panel>
      <Panel title={t('protocol.compatibilityTitle')} subtitle={t('protocol.compatibilitySub')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border px-3 py-2.5 text-[12.5px]">
            <div className="text-[11px] text-muted-foreground">{t('protocol.version')}</div>
            <div className="mt-0.5 font-mono font-medium">{app.protocol_version || 'v1'}</div>
          </div>
          <div className="rounded-md border px-3 py-2.5 text-[12.5px]">
            <div className="text-[11px] text-muted-foreground">{t('protocol.connectorVersion')}</div>
            <div className="mt-0.5 font-mono font-medium">{app.connector_version || '1.0.0'}</div>
          </div>
          <div className="rounded-md border px-3 py-2.5 text-[12.5px]">
            <div className="text-[11px] text-muted-foreground">{t('protocol.apiVersion')}</div>
            <div className="mt-0.5 font-mono font-medium">{app.api_version || 'v1'}</div>
          </div>
          <div className="rounded-md border px-3 py-2.5 text-[12.5px]">
            <div className="text-[11px] text-muted-foreground">{t('protocol.compatible')}</div>
            <div className="mt-0.5"><StatusBadge value={compat.status} /></div>
          </div>
        </div>
        {compat.status === 'incompatible' && compat.missing.length > 0 && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50/60 px-3 py-2 text-[12px] text-rose-700">
            {compat.missing.map((m, i) => (
              <div key={i}>{m.type === 'protocol' ? `${t('protocol.requiredVersion')}: ${m.required}, ${t('protocol.installedVersion')}: ${m.installed}` : m.type === 'connector' ? `${t('protocol.connectorVersion')} — ${t('protocol.requiredVersion')}: ${m.required}, ${t('protocol.installedVersion')}: ${m.installed}` : `${t('protocol.missingCapabilities')}: ${m.missing?.join(', ')}`}</div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title={t('maintenance.title')} subtitle={t('maintenance.setMode')}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {['normal', 'maintenance', 'read_only', 'disabled'].map((mode) => (
            <button key={mode} disabled={disabled || maintenance.isPending} onClick={() => maintenance.mutate(mode)}
              className={`rounded-md border p-3 text-left transition-colors disabled:opacity-50 ${app.maintenance_mode === mode ? 'border-brand bg-brand-soft/40 ring-1 ring-brand/30' : 'hover:border-foreground/20'}`}>
              <div className="text-[12.5px] font-medium">{t(`maintenance.${mode}`)}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{t(`maintenance.${mode}Desc`)}</div>
            </button>
          ))}
        </div>
      </Panel>
      <DangerZone app={app} />
    </div>
  );
}