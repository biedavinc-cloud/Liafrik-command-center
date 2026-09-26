import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/I18nProvider';
import { AUTH_METHODS, ENVIRONMENTS } from '@/lib/protocol/capabilities';
import { LCP_VERSION } from '@/lib/protocol/connector';
import Field from '@/components/kit/Field';

function Pick({ value, onChange, options, labelOf }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{labelOf(o)}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export default function StepTechnical({ form, set, errors }) {
  const { t } = useT();
  const err = (k) => errors[k] && t(`wizard.errors.${errors[k]}`);
  const endpoint = `${(form.api_url || 'https://api.example.com').replace(/\/$/, '')}/lcp/${LCP_VERSION}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('wizard.f.lcpEndpoint')} hint={t('wizard.h.lcpEndpoint')} className="sm:col-span-2">
        <Input className="h-9 bg-muted/50 font-mono text-[12px]" value={endpoint} readOnly />
      </Field>
      <Field label={t('wizard.f.authMethod')} required><Pick value={form.auth_method} onChange={(v) => set('auth_method', v)} options={AUTH_METHODS} labelOf={(o) => t(`auth.${o}`)} /></Field>
      <Field label={t('wizard.f.environment')} required><Pick value={form.environment} onChange={(v) => set('environment', v)} options={ENVIRONMENTS} labelOf={(o) => t(`env.${o}`)} /></Field>
      <Field label={t('wizard.f.apiVersion')} error={err('api_version')} required><Input className="h-9" value={form.api_version} onChange={(e) => set('api_version', e.target.value)} /></Field>
      <Field label={t('wizard.f.version')} error={err('version')} required><Input className="h-9" value={form.version} onChange={(e) => set('version', e.target.value)} /></Field>
      <Field label={t('wizard.f.healthEndpoint')} error={err('health_endpoint')} hint={t('wizard.h.healthEndpoint')} className="sm:col-span-2" required>
        <Input className="h-9 font-mono text-[12.5px]" value={form.health_endpoint} onChange={(e) => set('health_endpoint', e.target.value.trim())} />
      </Field>
    </div>
  );
}