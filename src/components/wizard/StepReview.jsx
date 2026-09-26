import React from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { splitList } from './validate';

function Section({ title, rows }) {
  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/40 px-3.5 py-2 label-caps">{title}</div>
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-5 gap-3 px-3.5 py-2 text-[12.5px]">
            <dt className="col-span-2 text-muted-foreground">{k}</dt>
            <dd className="col-span-3 break-words font-medium">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function StepReview({ form, result }) {
  const { t } = useT();
  const masked = (v) => (v ? `••••••••${v.slice(-4)}` : t('common.notSet'));
  const passed = result?.api?.reachable && result?.health?.ok;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title={t('wizard.steps.info')} rows={[[t('wizard.f.name'), form.name], [t('wizard.f.slug'), form.slug], [t('wizard.f.type'), t(`appType.${form.type}`)], [t('wizard.f.domain'), form.domain], [t('wizard.f.apiUrl'), form.api_url], [t('wizard.f.adminUrl'), form.admin_url]]} />
      <Section title={t('wizard.steps.technical')} rows={[[t('wizard.f.authMethod'), t(`auth.${form.auth_method}`)], [t('wizard.f.environment'), t(`env.${form.environment}`)], [t('wizard.f.apiVersion'), form.api_version], [t('wizard.f.version'), form.version], [t('wizard.f.healthEndpoint'), form.health_endpoint]]} />
      <Section title={t('wizard.steps.capabilities')} rows={[[t('wizard.capCount', { n: form.capabilities.length }), form.capabilities.map((c) => t(`cap.${c}`)).join(', ')]]} />
      <Section title={t('wizard.steps.security')} rows={[[t('wizard.f.sso'), form.sso_enabled ? t('common.yes') : t('common.no')], [t('wizard.f.apiKey'), masked(form.api_key)], [t('wizard.f.webhookSecret'), masked(form.webhook_secret)], [t('wizard.f.origins'), splitList(form.allowed_origins).join(', ')], [t('wizard.f.rateLimit'), form.rate_limit]]} />
      <div className="rounded-md border px-3.5 py-3 text-[12.5px] lg:col-span-2">
        <span className="font-medium">{t('wizard.resultingStatus')}: </span>
        <span className={passed ? 'text-sky-700' : 'text-amber-700'}>{t(`status.${passed ? 'configured' : 'pending'}`)}</span>
        <span className="text-muted-foreground"> — {t(passed ? 'wizard.statusConfigured' : 'wizard.statusPending')}</span>
      </div>
    </div>
  );
}