import React, { useState } from 'react';
import { MoreHorizontal, Pencil, Eye, Ban, CheckCircle, KeyRound, ShieldOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useT } from '@/lib/i18n/I18nProvider';
import { useAction } from '@/lib/data/hooks';
import { setAdministratorStatus } from '@/lib/services/identity';
import { recordAudit } from '@/lib/services/audit';
import { useCan } from '@/lib/rbac';
import ConfirmDialog from '@/components/kit/ConfirmDialog';

export default function AdminRowMenu({ admin, onEdit, onView }) {
  const { t } = useT();
  const { toast } = useToast();
  const can = useCan();
  const [confirm, setConfirm] = useState(null);
  const status = useAction((s) => setAdministratorStatus(admin, s), ['administrators']);
  const reset = useAction(() => recordAudit({ action: 'administrator.access_reset', resource: 'administrator', resource_id: admin.email }));
  const ok = can('admins.suspend');
  const item = 'gap-2 text-[12.5px]';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className={item} onClick={onView}><Eye className="h-3.5 w-3.5" />{t('admins.viewActivity')}</DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={!can('admins.edit') || admin.status === 'revoked'} onClick={onEdit}><Pencil className="h-3.5 w-3.5" />{t('actions.edit')}</DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={!ok || admin.status === 'revoked'} onClick={() => reset.mutate(undefined, { onSuccess: () => toast({ title: t('admins.resetDone') }) })}><KeyRound className="h-3.5 w-3.5" />{t('admins.resetAccess')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          {admin.status === 'active'
            ? <DropdownMenuItem className={item} disabled={!ok} onClick={() => setConfirm('suspended')}><Ban className="h-3.5 w-3.5" />{t('admins.suspend')}</DropdownMenuItem>
            : <DropdownMenuItem className={item} disabled={!ok} onClick={() => status.mutate('active')}><CheckCircle className="h-3.5 w-3.5" />{t('admins.activate')}</DropdownMenuItem>}
          {admin.status !== 'revoked' && <DropdownMenuItem className={`${item} text-rose-600`} disabled={!ok} onClick={() => setConfirm('revoked')}><ShieldOff className="h-3.5 w-3.5" />{t('admins.revoke')}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t(`admins.confirm.${confirm}Title`, { name: admin.full_name })}
        description={t(`admins.confirm.${confirm}Body`)}
        confirmLabel={t(confirm === 'revoked' ? 'admins.revoke' : 'admins.suspend')}
        requireText={confirm === 'revoked' ? admin.email : undefined}
        destructive
        onConfirm={() => status.mutateAsync(confirm)}
      />
    </div>
  );
}