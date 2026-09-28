import React, { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/lib/AuthContext';
import { useMyProfile, useSetMyProfile } from '@/lib/data/hooks';
import { fileToDataUrl } from '@/lib/imageUpload';
import { updateUser } from '@/lib/neonAuth';
import Panel from '@/components/kit/Panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Save, Trash2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { roleOfUser } from '@/lib/rbac';

const TIMEZONES = ['Asia/Dubai', 'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Casablanca', 'Africa/Tunis', 'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Toronto', 'UTC'];

export default function ProfilePanel() {
  const { t } = useT();
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const setProfile = useSetMyProfile();
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [fullName, setFullName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const file_url = await fileToDataUrl(file);
      setForm(f => ({ ...f, photo_url: file_url }));
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update full name on the auth user
      if (fullName && fullName !== user?.full_name) {
        await updateUser({ name: fullName });
      }
      // Update staff profile
      await setProfile.mutateAsync({
        photo_url: form.photo_url,
        job_title: form.job_title,
        department: form.department,
        phone: form.phone,
        timezone: form.timezone,
      });
      toast({ title: t('profile.saved') });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Panel title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className="grid max-w-xl gap-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
            {form.photo_url ? <img src={form.photo_url} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-7 w-7 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            <Label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => handlePhoto(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium hover:bg-muted">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? t('branding.uploading') : t('profile.uploadPhoto')}
              </span>
            </Label>
            {form.photo_url && (
              <button onClick={() => setForm(f => ({ ...f, photo_url: null }))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">{t('profile.fullName')}</Label>
            <Input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('profile.email')}</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-title">{t('profile.jobTitle')}</Label>
            <Input id="job-title" value={form.job_title || ''} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">{t('profile.department')}</Label>
            <Input id="department" value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('profile.phone')}</Label>
            <Input id="phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('profile.timezone')}</Label>
            <Select value={form.timezone || 'Asia/Dubai'} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium">{t(`roles.${roleOfUser(user)}`)}</span>
          </div>
          <Button onClick={handleSave} disabled={setProfile.isPending} className="h-9 ml-auto">
            {setProfile.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Panel>
  );
}