import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApplications } from '@/lib/data/hooks';
import { registerApplication } from '@/lib/services/applications';
import { useCan } from '@/lib/rbac';
import PageHeader from '@/components/kit/PageHeader';
import EmptyState from '@/components/kit/EmptyState';
import WizardSteps from '@/components/wizard/WizardSteps';
import StepInfo from '@/components/wizard/StepInfo';
import StepTechnical from '@/components/wizard/StepTechnical';
import StepCapabilities from '@/components/wizard/StepCapabilities';
import StepSecurity from '@/components/wizard/StepSecurity';
import StepTest from '@/components/wizard/StepTest';
import StepReview from '@/components/wizard/StepReview';
import { WIZARD_STEPS, validateStep, splitList, PALETTE } from '@/components/wizard/validate';

const INITIAL = {
  name: '', slug: '', slugTouched: false, description: '', type: 'saas', domain: '', admin_url: '', api_url: '',
  auth_method: 'api_key', environment: 'production', api_version: 'v1', version: '1.0.0', health_endpoint: '/health',
  capabilities: ['users', 'settings'], sso_enabled: true, api_key: '', client_id: '', webhook_secret: '',
  allowed_origins: '', ip_restrictions: '', rate_limit: 1000,
};

export default function CreateApplication() {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const can = useCan();
  const { data: apps = [] } = useApplications();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const key = WIZARD_STEPS[step];

  if (!can('applications.create')) return <div className="surface"><EmptyState tone="error" title={t('states.forbiddenTitle')} description={t('states.forbiddenBody')} /></div>;

  const next = () => {
    const e = validateStep(key, form, apps.map((a) => a.slug));
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(step + 1);
  };

  const connect = async () => {
    setSaving(true);
    const { slugTouched, ...rest } = form;
    try {
      const app = await registerApplication({
        ...rest,
        allowed_origins: splitList(form.allowed_origins),
        ip_restrictions: splitList(form.ip_restrictions),
        rate_limit: Number(form.rate_limit),
        icon_color: PALETTE[apps.length % PALETTE.length],
        users_count: 0, transactions: 0, revenue: 0,
      }, result);
      ['applications', 'environments', 'notifications', 'audit'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({ title: t('wizard.successTitle'), description: t('wizard.successBody', { name: app.name }) });
      navigate(`/apps/${app.slug}`);
    } catch (e) {
      toast({ title: t('states.errorTitle'), description: e.message, variant: 'destructive' });
      setSaving(false);
    }
  };

  const STEP = { info: StepInfo, technical: StepTechnical, capabilities: StepCapabilities, security: StepSecurity }[key];

  return (
    <div>
      <PageHeader title={t('apps.create')} subtitle={t('wizard.subtitle')} breadcrumbs={[{ label: t('nav.applications'), to: '/apps' }, { label: t('apps.create') }]} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside><WizardSteps current={step} onJump={setStep} /></aside>
        <section className="surface">
          <header className="border-b px-5 py-4">
            <h2 className="text-[15px] font-semibold">{t(`wizard.steps.${key}`)}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{t(`wizard.stepsHint.${key}`)}</p>
          </header>
          <div key={key} className="animate-in fade-in slide-in-from-bottom-1 p-5 duration-300">
            {STEP && <STEP form={form} set={set} errors={errors} />}
            {key === 'test' && <StepTest form={form} result={result} setResult={setResult} />}
            {key === 'review' && <StepReview form={form} result={result} />}
          </div>
          <footer className="flex items-center justify-between border-t px-5 py-3.5">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => (step ? setStep(step - 1) : navigate('/apps'))} disabled={saving}>
              <ArrowLeft className="h-3.5 w-3.5" />{step ? t('common.back') : t('common.cancel')}
            </Button>
            {key === 'review' ? (
              <Button size="sm" className="h-9 gap-1.5 px-4 text-[12px] font-semibold tracking-wide" onClick={connect} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}{t('wizard.connect')}
              </Button>
            ) : (
              <Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={next}>
                {key === 'test' && !result ? t('wizard.skipTests') : t('common.continue')}<ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}