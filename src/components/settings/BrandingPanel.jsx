import React, { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useBranding, useSetBranding } from '@/lib/data/hooks';
import { fileToDataUrl } from '@/lib/imageUpload';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Save, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function BrandingPanel() {
  const { t } = useT();
  const { data: branding } = useBranding();
  const setBranding = useSetBranding();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(null);

  useEffect(() => { if (branding) setForm(branding); }, [branding]);

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const file_url = await fileToDataUrl(file, 512);
      setForm(f => ({ ...f, [field]: file_url }));
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    try {
      await setBranding.mutateAsync({
        organization_name: form.organization_name,
        organization_description: form.organization_description,
        logo_url: form.logo_url,
        logo_dark_url: form.logo_dark_url,
        favicon_url: form.favicon_url,
      });
      toast({ title: t('branding.saved') });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const UploadField = ({ field, label }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
          {form[field] ? <img src={form[field]} alt="" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <Label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(field, e.target.files?.[0])} />
          <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium hover:bg-muted">
            {uploading === field ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading === field ? t('branding.uploading') : t('branding.upload')}
          </span>
        </Label>
        {form[field] && (
          <button onClick={() => setForm(f => ({ ...f, [field]: null }))} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Panel title={t('branding.title')} subtitle={t('branding.subtitle')}>
      <div className="grid max-w-xl gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">{t('branding.organizationName')}</Label>
          <Input id="org-name" value={form.organization_name || ''} onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-desc">{t('branding.organizationDescription')}</Label>
          <Input id="org-desc" value={form.organization_description || ''} onChange={e => setForm(f => ({ ...f, organization_description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UploadField field="logo_url" label={t('branding.logo')} />
          <UploadField field="logo_dark_url" label={t('branding.logoDark')} />
          <UploadField field="favicon_url" label={t('branding.favicon')} />
        </div>
        <p className="text-[11px] text-muted-foreground">{t('branding.hint')}</p>
        <div>
          <Button onClick={handleSave} disabled={setBranding.isPending} className="h-9">
            {setBranding.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Panel>
  );
}