import React from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n/I18nProvider';
import Field from '@/components/kit/Field';

export default function StepSecurity({ form, set, errors }) {
  const { t } = useT();
  const err = (k) => errors[k] && t(`wizard.errors.${errors[k]}`);
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-md border border-brand/30 bg-brand-soft px-3.5 py-3 text-[12px] leading-relaxed">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>{t('wizard.secretsNotice')}</p>
      </div>
      <div className="flex items-center justify-between rounded-md border px-3.5 py-3">
        <div>
          <div className="text-[12.5px] font-medium">{t('wizard.f.sso')}</div>
          <div className="text-[11.5px] text-muted-foreground">{t('wizard.h.sso')}</div>
        </div>
        <Switch checked={form.sso_enabled} onCheckedChange={(v) => set('sso_enabled', v)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('wizard.f.apiKey')} error={err('api_key')} hint={t('wizard.h.apiKey')} required={form.auth_method === 'api_key'}>
          <Input type="password" autoComplete="new-password" className="h-9 font-mono" value={form.api_key} onChange={(e) => set('api_key', e.target.value)} />
        </Field>
        <Field label={t('wizard.f.clientId')} error={err('client_id')} required={['oauth2', 'sso'].includes(form.auth_method)}>
          <Input className="h-9 font-mono text-[12.5px]" value={form.client_id} onChange={(e) => set('client_id', e.target.value)} />
        </Field>
        <Field label={t('wizard.f.webhookSecret')} hint={t('wizard.h.webhookSecret')}>
          <Input type="password" autoComplete="new-password" className="h-9 font-mono" value={form.webhook_secret} onChange={(e) => set('webhook_secret', e.target.value)} />
        </Field>
        <Field label={t('wizard.f.rateLimit')} error={err('rate_limit')} hint={t('wizard.h.rateLimit')}>
          <Input type="number" min={1} className="h-9" value={form.rate_limit} onChange={(e) => set('rate_limit', e.target.value)} />
        </Field>
        <Field label={t('wizard.f.origins')} error={err('allowed_origins')} hint={t('wizard.h.commaList')}>
          <Input className="h-9 text-[12.5px]" value={form.allowed_origins} onChange={(e) => set('allowed_origins', e.target.value)} placeholder="https://control.liafrik.com" />
        </Field>
        <Field label={t('wizard.f.ips')} hint={t('wizard.h.commaList')}>
          <Input className="h-9 font-mono text-[12.5px]" value={form.ip_restrictions} onChange={(e) => set('ip_restrictions', e.target.value)} placeholder="203.0.113.0/24" />
        </Field>
      </div>
    </div>
  );
}