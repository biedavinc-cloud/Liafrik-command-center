import React, { useState } from 'react';
import { Plus, RefreshCw, Ban, XCircle, Loader2, KeyRound } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';
import { useApiKeys, useAction } from '@/lib/data/hooks';
import { createApiKey, rotateApiKey, revokeApiKey, disableApiKey } from '@/lib/services/keys';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';

export default function ApiKeysTab({ app }) {
  const { t, fmt } = useT();
  const { toast } = useToast();
  const { data: keys = [], isLoading } = useApiKeys(app.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', environment: 'production', scopes: '' });

  const create = useAction((data) => createApiKey(app, data), ['apiKeys']);
  const rotate = useAction((k) => rotateApiKey(app, k), ['apiKeys']);
  const revoke = useAction((k) => revokeApiKey(app, k), ['apiKeys']);
  const disable = useAction((k) => disableApiKey(app, k), ['apiKeys']);

  const submit = () => {
    create.mutate({ ...form, scopes: form.scopes.split(',').map((s) => s.trim()).filter(Boolean) }, {
      onSuccess: () => { setDialogOpen(false); setForm({ name: '', environment: 'production', scopes: '' }); toast({ title: t('apiKeys.createdToast') }); },
    });
  };

  return (
    <div className="space-y-4">
      <Panel title={t('apiKeys.title')} subtitle={t('apiKeys.subtitle')}
        actions={<Button size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />{t('apiKeys.create')}</Button>}>
        {isLoading ? <div className="py-8 text-center text-[12.5px] text-muted-foreground">Loading…</div> :
         keys.length === 0 ? <EmptyState icon={KeyRound} title={t('apiKeys.empty')} description={t('apiKeys.emptyBody')} /> : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-[12.5px]">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{k.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{k.key_hint}</span>
                    <StatusBadge value={k.status === 'active' ? 'active' : k.status === 'revoked' ? 'revoked' : 'disabled'} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                    <span>{t(`env.${k.environment}`)}</span>
                    {(k.scopes || []).length > 0 && <span>{k.scopes.join(', ')}</span>}
                    {k.expires_at && <span>Expires {fmt.dateTime(k.expires_at)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {k.status === 'active' && <>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" disabled={rotate.isPending} onClick={() => rotate.mutate(k, { onSuccess: () => toast({ title: t('apiKeys.rotatedToast') }) })}><RefreshCw className="h-3 w-3" />{t('apiKeys.rotate')}</Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" disabled={disable.isPending} onClick={() => disable.mutate(k)}><Ban className="h-3 w-3" />{t('apiKeys.disable')}</Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] text-rose-600" disabled={revoke.isPending} onClick={() => revoke.mutate(k, { onSuccess: () => toast({ title: t('apiKeys.revokedToast') }) })}><XCircle className="h-3 w-3" />{t('apiKeys.revoke')}</Button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">{t('apiKeys.create')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-[12px]">{t('apiKeys.name')}</Label><Input className="h-9" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-[12px]">{t('apiKeys.environment')}</Label>
              <Select value={form.environment} onValueChange={(v) => setForm((f) => ({ ...f, environment: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="production">{t('env.production')}</SelectItem><SelectItem value="staging">{t('env.staging')}</SelectItem><SelectItem value="development">{t('env.development')}</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[12px]">{t('apiKeys.scopes')}</Label><Input className="h-9" placeholder="read, write, admin" value={form.scopes} onChange={(e) => setForm((f) => ({ ...f, scopes: e.target.value }))} /></div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-[11.5px] text-amber-700">{t('apiKeys.secretNotice')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button size="sm" disabled={create.isPending || !form.name} onClick={submit}>{create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t('apiKeys.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}