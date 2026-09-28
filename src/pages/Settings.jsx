import { invokeFunction } from '@/lib/api';
import React, { useState } from 'react';
import { useT, LANGUAGES } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useFounderMode } from '@/lib/hooks/useFounderMode';
import { useSystemState, useAction } from '@/lib/data/hooks';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cpu, Globe, ShieldAlert, Lock, Unlock, Database, Save } from 'lucide-react';
import BrandingPanel from '@/components/settings/BrandingPanel';
import CurrencyPanel from '@/components/settings/CurrencyPanel';
import ProfilePanel from '@/components/settings/ProfilePanel';

export default function Settings() {
  const { t, lang, setLang } = useT();
  const { user } = useAuth();
  const { enabled: founderMode, toggle: toggleFounderMode } = useFounderMode();
  const { data: sysStates = [] } = useSystemState();
  const sysState = sysStates[0] || {};
  const safeModeActive = sysState.safe_mode_enabled || false;
  const maintenanceMode = sysState.maintenance_mode || 'normal';

  const toggleSafeMode = useAction(async (enabled) => {
    return invokeFunction('neonData', { entity: 'SystemState', operation: 'update', id: sysState.id, data: { safe_mode_enabled: enabled } });
  }, ['systemState']);

  const updateMaintenance = useAction(async (mode) => {
    return invokeFunction('neonData', { entity: 'SystemState', operation: 'update', id: sysState.id, data: { maintenance_mode: mode } });
  }, ['systemState']);

  return (
    <div className="space-y-5">
      <PageHeader title={t('settingsPage.title')} subtitle={t('settingsPage.subtitle')} breadcrumbs={[{ label: t('settingsPage.title') }]} />

      <ProfilePanel />

      <Panel title={t('settingsPage.preferences')} subtitle={t('settingsPage.preferencesSub')}>
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[12px] font-medium"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{t('settingsPage.language')}</div>
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button key={l} onClick={() => setLang(l)} className={cn('h-9 rounded-md border px-4 text-[12.5px] font-medium transition-colors', lang === l ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>
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
            <button onClick={toggleFounderMode} className={cn('h-6 w-11 rounded-full p-0.5 transition-colors', founderMode ? 'bg-brand' : 'bg-muted')}>
              <span className={cn('block h-5 w-5 rounded-full bg-white transition-transform', founderMode && 'translate-x-5')} />
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Safe Mode" subtitle="When enabled, all mutations are blocked server-side">
        <div className="flex items-center justify-between rounded-md border p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', safeModeActive ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground')}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold">{safeModeActive ? 'Safe Mode is Active' : 'Safe Mode is Off'}</div>
              <div className="text-[11.5px] text-muted-foreground">{safeModeActive ? 'All create/update/delete operations are blocked.' : 'All operations are permitted normally.'}</div>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Button variant={safeModeActive ? 'destructive' : 'outline'} size="sm" onClick={() => toggleSafeMode.mutate(!safeModeActive)} disabled={toggleSafeMode.isPending}>
              {safeModeActive ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {safeModeActive ? 'Disable' : 'Enable'}
            </Button>
          )}
        </div>
      </Panel>

      {user?.role === 'admin' && (
        <Panel title="Maintenance Mode" subtitle="Control platform-wide access state">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: 'normal', label: 'Normal', desc: 'Full access', color: 'border-emerald-200 bg-emerald-50/50' },
              { value: 'maintenance', label: 'Maintenance', desc: 'Read-only with banner', color: 'border-amber-200 bg-amber-50/50' },
              { value: 'read_only', label: 'Read Only', desc: 'No mutations allowed', color: 'border-blue-200 bg-blue-50/50' },
            ].map((mode) => (
              <button key={mode.value} onClick={() => updateMaintenance.mutate(mode.value)} disabled={updateMaintenance.isPending}
                className={cn('rounded-md border p-4 text-left transition-all hover:shadow-sm', mode.color, maintenanceMode === mode.value && 'ring-2 ring-brand')}>
                <div className="text-[13px] font-semibold">{mode.label}</div>
                <div className="text-[11px] text-muted-foreground">{mode.desc}</div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {user?.role === 'admin' && <BrandingPanel />}
      {user?.role === 'admin' && <CurrencyPanel />}

      <Panel title="System Information" subtitle="Platform metadata and configuration">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Database', value: 'Neon PostgreSQL', icon: Database },
            { label: 'AI Provider', value: 'Gemini', icon: Cpu },
            { label: 'Auth', value: 'Neon Auth', icon: ShieldAlert },
            { label: 'Region', value: 'UAE / Global', icon: Globe },
          ].map((info) => (
            <div key={info.label} className="rounded-md border p-3">
              <div className="mb-1.5 flex items-center gap-2 text-muted-foreground"><info.icon className="h-3.5 w-3.5" /><span className="text-[10px] font-medium uppercase tracking-wide">{info.label}</span></div>
              <div className="text-[13px] font-semibold">{info.value}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}