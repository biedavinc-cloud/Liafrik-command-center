import React from 'react';
import { useT, LANGUAGES } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useFounderMode } from '@/lib/hooks/useFounderMode';
import { useSystemState } from '@/lib/data/hooks';
import { roleOfUser } from '@/lib/rbac';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Cpu, Globe, ShieldAlert, User, Mail, KeyRound } from 'lucide-react';
import BrandingPanel from '@/components/settings/BrandingPanel';
import CurrencyPanel from '@/components/settings/CurrencyPanel';

export default function Settings() {
  const { t, lang, setLang } = useT();
  const { user } = useAuth();
  const { enabled: founderMode, toggle: toggleFounderMode } = useFounderMode();
  const { data: sysStates = [] } = useSystemState();
  const safeModeActive = sysStates[0]?.safe_mode_enabled || false;

  return (
    <div className="space-y-5">
      <PageHeader title={t('settingsPage.title')} subtitle={t('settingsPage.subtitle')} breadcrumbs={[{ label: t('settingsPage.title') }]} />
      <Panel title={t('settingsPage.profile')} subtitle={t('settingsPage.profileSub')}>
        <div className="grid max-w-md gap-3">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{t('settingsPage.name')}</div>
              <div className="text-[12.5px] font-medium">{user?.full_name || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{t('settingsPage.email')}</div>
              <div className="text-[12.5px] font-medium">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">{t('settingsPage.role')}</div>
              <div className="text-[12.5px] font-medium">{t(`roles.${roleOfUser(user)}`)}</div>
            </div>
          </div>
        </div>
      </Panel>
      <Panel title={t('settingsPage.preferences')} subtitle={t('settingsPage.preferencesSub')}>
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[12px] font-medium"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{t('settingsPage.language')}</div>
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`h-9 rounded-md border px-4 text-[12.5px] font-medium transition-colors ${lang === l ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}>
                  {l === 'en' ? 'English' : 'Français'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-[12.5px] font-medium">{t('settingsPage.founderMode')}</div>
                <div className="text-[11px] text-muted-foreground">{t('settingsPage.founderModeDesc')}</div>
              </div>
            </div>
            <button onClick={toggleFounderMode} className={`h-6 w-11 rounded-full p-0.5 transition-colors ${founderMode ? 'bg-brand' : 'bg-muted'}`}>
              <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${founderMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </Panel>
      <Panel title={t('settingsPage.system')} subtitle={t('settingsPage.systemSub')}>
        <div className="grid max-w-md gap-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className={`h-4 w-4 ${safeModeActive ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <div className="text-[12.5px] font-medium">{t('settingsPage.safeMode')}</div>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${safeModeActive ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
              {safeModeActive ? t('settingsPage.on') : t('settingsPage.off')}
            </span>
          </div>
        </div>
      </Panel>
      {user?.role === 'admin' && <BrandingPanel />}
      {user?.role === 'admin' && <CurrencyPanel />}
    </div>
  );
}