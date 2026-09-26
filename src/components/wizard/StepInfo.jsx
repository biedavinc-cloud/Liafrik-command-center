import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n/I18nProvider';
import { APP_TYPES } from '@/lib/protocol/capabilities';
import Field from '@/components/kit/Field';

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function StepInfo({ form, set, errors }) {
  const { t } = useT();
  const err = (k) => errors[k] && t(`wizard.errors.${errors[k]}`);
  const onName = (v) => { set('name', v); if (!form.slugTouched) set('slug', slugify(v)); };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('wizard.f.name')} error={err('name')} required><Input className="h-9" value={form.name} onChange={(e) => onName(e.target.value)} placeholder="Liafrik Pay" /></Field>
      <Field label={t('wizard.f.slug')} error={err('slug')} hint={`/apps/${form.slug || '…'}`} required>
        <Input className="h-9 font-mono text-[12.5px]" value={form.slug} onChange={(e) => { set('slug', e.target.value); set('slugTouched', true); }} />
      </Field>
      <Field label={t('wizard.f.description')} className="sm:col-span-2"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      <Field label={t('wizard.f.type')} required>
        <Select value={form.type} onValueChange={(v) => set('type', v)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{APP_TYPES.map((o) => <SelectItem key={o} value={o}>{t(`appType.${o}`)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('wizard.f.domain')} error={err('domain')}><Input className="h-9" value={form.domain} onChange={(e) => set('domain', e.target.value.trim())} placeholder="pay.liafrik.com" /></Field>
      <Field label={t('wizard.f.adminUrl')} error={err('admin_url')} hint={t('wizard.h.adminUrl')}><Input className="h-9" value={form.admin_url} onChange={(e) => set('admin_url', e.target.value.trim())} placeholder="https://admin.example.com" /></Field>
      <Field label={t('wizard.f.apiUrl')} error={err('api_url')} required><Input className="h-9" value={form.api_url} onChange={(e) => set('api_url', e.target.value.trim())} placeholder="https://api.example.com" /></Field>
    </div>
  );
}