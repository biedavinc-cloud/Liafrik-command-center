import { invokeFunction } from '@/lib/api';
import React, { useState } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useSystemState, useBranding, useSetBranding, useAction } from '@/lib/data/hooks';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, ShieldAlert, Palette, Database, Cpu, Save, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalSettings() {
  const { t } = useT();
  const { user } = useAuth();
  const { data: sysStates = [] } = useSystemState();
  const { data: branding = {} } = useBranding();
  const setBranding = useSetBranding();
  const [brandForm, setBrandForm] = useState({ organization_name: branding?.organization_name || '', organization_description: branding?.organization_description || '', primary_color: branding?.primary_color || '', logo_url: branding?.logo_url || '' });
  const [savingBrand, setSavingBrand] = useState(false);

  const sysState = sysStates[0] || {};
  const safeModeActive = sysState.safe_mode_enabled || false;

  const toggleSafeMode = useAction(async (enabled) => {
    return invokeFunction('neonData', { entity: 'SystemState', operation: 'update', id: sysState.id, data: { safe_mode_enabled: enabled } });
  }, ['systemState']);

  const updateMaintenance = useAction(async (mode) => {
    return invokeFunction('neonData', { entity: 'SystemState', operation: 'update', id: sysState.id, data: { maintenance_mode: mode } });
  }, ['systemState']);

  const handleSaveBrand = () => {
    setSavingBrand(true);
    setBranding.mutate(brandForm, { onSettled: () => setSavingBrand(false) });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Global Settings" subtitle="System-wide defaults, maintenance modes, and platform branding" breadcrumbs={[{ label: 'Global Settings' }]} />

      {/* Safe Mode */}
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
          <Button
            variant={safeModeActive ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => toggleSafeMode.mutate(!safeModeActive)}
            disabled={toggleSafeMode.isPending}
          >
            {safeModeActive ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {safeModeActive ? 'Disable Safe Mode' : 'Enable Safe Mode'}
          </Button>
        </div>
      </Panel>

      {/* Maintenance Mode */}
      <Panel title="Maintenance Mode" subtitle="Control platform-wide access state">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: 'normal', label: 'Normal', desc: 'Full access', color: 'border-emerald-200 bg-emerald-50/50' },
            { value: 'maintenance', label: 'Maintenance', desc: 'Read-only with banner', color: 'border-amber-200 bg-amber-50/50' },
            { value: 'read_only', label: 'Read Only', desc: 'No mutations allowed', color: 'border-blue-200 bg-blue-50/50' },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateMaintenance.mutate(mode.value)}
              disabled={updateMaintenance.isPending}
              className={cn('rounded-md border p-4 text-left transition-all hover:shadow-sm', mode.color, sysState.maintenance_mode === mode.value && 'ring-2 ring-brand')}
            >
              <div className="text-[13px] font-semibold">{mode.label}</div>
              <div className="text-[11px] text-muted-foreground">{mode.desc}</div>
            </button>
          ))}
        </div>
      </Panel>

      {/* Branding */}
      <Panel title="Platform Branding" subtitle="Organization identity and visual configuration">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div><Label className="mb-1.5 block text-[11px]">Organization Name</Label><Input value={brandForm.organization_name} onChange={(e) => setBrandForm({ ...brandForm, organization_name: e.target.value })} placeholder="Liafrik" /></div>
            <div><Label className="mb-1.5 block text-[11px]">Description</Label><Textarea value={brandForm.organization_description} onChange={(e) => setBrandForm({ ...brandForm, organization_description: e.target.value })} placeholder="Brief description..." rows={3} /></div>
            <div><Label className="mb-1.5 block text-[11px]">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input value={brandForm.primary_color} onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })} placeholder="#C8941A" className="flex-1" />
                <div className="h-9 w-9 rounded-md border" style={{ backgroundColor: brandForm.primary_color || 'hsl(var(--brand))' }} />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div><Label className="mb-1.5 block text-[11px]">Logo URL</Label><Input value={brandForm.logo_url} onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })} placeholder="https://..." className="text-[11px]" /></div>
            {brandForm.logo_url && <div className="flex h-24 items-center justify-center rounded-md border bg-muted/30"><img src={brandForm.logo_url} alt="Logo preview" className="max-h-20 max-w-full object-contain" /></div>}
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="text-[11.5px] text-muted-foreground">Branding applies across all platform modules and auth pages.</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSaveBrand} disabled={savingBrand}><Save className="h-3.5 w-3.5" /> Save Branding</Button>
        </div>
      </Panel>

      {/* System Info */}
      <Panel title="System Information" subtitle="Platform metadata and configuration">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Database', value: 'Neon PostgreSQL', icon: Database },
            { label: 'AI Provider', value: 'Gemini', icon: Cpu },
            { label: 'Auth', value: 'Base44 Secure', icon: ShieldAlert },
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