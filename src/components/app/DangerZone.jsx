import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAction } from '@/lib/data/hooks';
import { deleteApplication, setLifecycle, lockApplication, unlockApplication } from '@/lib/services/applications';
import { useCan } from '@/lib/rbac';
import ConfirmDialog from '@/components/kit/ConfirmDialog';

export default function DangerZone({ app }) {
  const { t } = useT();
  const navigate = useNavigate();
  const can = useCan();
  const [dialog, setDialog] = useState(null);
  const lifecycle = useAction((l) => setLifecycle(app, l), ['applications']);
  const remove = useAction(() => deleteApplication(app), ['applications']);
  const lock = useAction((reason) => lockApplication(app, reason, 'admin'), ['applications']);
  const unlock = useAction(() => unlockApplication(app, 'admin'), ['applications']);

  const rows = [
    app.locked
      ? { key: 'unlock', label: t('actions.unlock'), perm: 'applications.edit' }
      : { key: 'lock', label: t('actions.lock'), perm: 'applications.edit' },
    app.lifecycle === 'active'
      ? { key: 'disabled', label: t('actions.disable'), perm: 'applications.edit' }
      : { key: 'active', label: t('actions.restore'), perm: 'applications.edit' },
    { key: 'delete', label: t('actions.delete'), perm: 'applications.delete' },
  ];

  return (
    <section className="rounded-lg border border-rose-200 bg-card">
      <header className="border-b border-rose-200 px-4 py-3">
        <h2 className="text-[13px] font-semibold text-rose-700">{t('danger.title')}</h2>
      </header>
      <div className="divide-y">
        {rows.map((r) => (
          <div key={r.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[12.5px] font-medium">{r.label}</div>
              <div className="text-[11.5px] text-muted-foreground">{t(`danger.${r.key}`)}</div>
            </div>
            <Button variant={r.key === 'active' || r.key === 'unlock' ? 'outline' : 'destructive'} size="sm" className="h-8 text-[12px]" disabled={!can(r.perm)} onClick={() => {
              if (r.key === 'active') lifecycle.mutate('active');
              else if (r.key === 'lock') lock.mutate('Locked by admin');
              else if (r.key === 'unlock') unlock.mutate();
              else setDialog(r.key);
            }}>{r.label}</Button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === 'delete' ? t('confirm.deleteTitle', { name: app.name }) : t('confirm.disabledTitle', { name: app.name })}
        description={dialog === 'delete' ? t('confirm.deleteBody') : t('confirm.disabledBody')}
        confirmLabel={dialog === 'delete' ? t('actions.delete') : t('actions.disable')}
        requireText={dialog === 'delete' ? app.slug : undefined}
        destructive
        onConfirm={async () => {
          if (dialog === 'delete') { await remove.mutateAsync(); navigate('/apps'); } else await lifecycle.mutateAsync('disabled');
        }}
      />
    </section>
  );
}