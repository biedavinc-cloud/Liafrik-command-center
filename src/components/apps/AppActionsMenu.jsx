import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ArrowUpRight, Settings2, Pencil, PlugZap, History, HeartPulse, UserCog, Power, Archive, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAction } from '@/lib/data/hooks';
import { setLifecycle, runConnectionTest } from '@/lib/services/applications';
import { useCan } from '@/lib/rbac';
import { useT } from '@/lib/i18n/I18nProvider';
import ConfirmDialog from '@/components/kit/ConfirmDialog';

export function useConnectionTest(app) {
  const { t } = useT();
  const { toast } = useToast();
  const m = useAction(() => runConnectionTest(app), ['applications']);
  return {
    pending: m.isPending,
    run: () => m.mutate(undefined, {
      onSuccess: (r) => toast({
        title: r.ok ? t('test.okTitle') : t('test.failTitle'),
        description: r.api?.reachable ? t('test.detail', { api: r.api.http_status, health: r.health?.http_status ?? '—', ms: r.api.latency_ms }) : t('test.unreachable'),
        variant: r.ok ? 'default' : 'destructive',
      }),
      onError: () => toast({ title: t('test.failTitle'), description: t('test.invalid'), variant: 'destructive' }),
    }),
  };
}

export default function AppActionsMenu({ app }) {
  const { t } = useT();
  const navigate = useNavigate();
  const can = useCan();
  const [confirm, setConfirm] = useState(null);
  const lifecycle = useAction((l) => setLifecycle(app, l), ['applications']);
  const test = useConnectionTest(app);
  const editable = can('applications.edit');
  const item = 'gap-2 text-[12.5px]';
  const go = (p) => navigate(`/apps/${app.slug}${p}`);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.preventDefault()}><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem className={item} onClick={() => go('')}><ArrowUpRight className="h-3.5 w-3.5" />{t('actions.open')}</DropdownMenuItem>
          <DropdownMenuItem className={item} onClick={() => go('/settings')}><Settings2 className="h-3.5 w-3.5" />{t('actions.manage')}</DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={!editable} onClick={() => go('/settings')}><Pencil className="h-3.5 w-3.5" />{t('actions.edit')}</DropdownMenuItem>
          <DropdownMenuItem className={item} disabled={!editable || !app.api_url || test.pending} onClick={test.run}><PlugZap className="h-3.5 w-3.5" />{t('actions.test')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className={item} onClick={() => go('/activity')}><History className="h-3.5 w-3.5" />{t('actions.logs')}</DropdownMenuItem>
          <DropdownMenuItem className={item} onClick={() => go('/health')}><HeartPulse className="h-3.5 w-3.5" />{t('actions.health')}</DropdownMenuItem>
          <DropdownMenuItem className={item} onClick={() => navigate(`/administrators?app=${app.id}`)}><UserCog className="h-3.5 w-3.5" />{t('actions.access')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          {app.lifecycle === 'active' ? (
            <>
              <DropdownMenuItem className={item} disabled={!editable} onClick={() => setConfirm('disabled')}><Power className="h-3.5 w-3.5" />{t('actions.disable')}</DropdownMenuItem>
              <DropdownMenuItem className={`${item} text-rose-600`} disabled={!editable} onClick={() => setConfirm('archived')}><Archive className="h-3.5 w-3.5" />{t('actions.archive')}</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem className={item} disabled={!editable} onClick={() => lifecycle.mutate('active')}><RotateCcw className="h-3.5 w-3.5" />{t('actions.restore')}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t(`confirm.${confirm}Title`, { name: app.name })}
        description={t(`confirm.${confirm}Body`)}
        confirmLabel={t(`actions.${confirm === 'archived' ? 'archive' : 'disable'}`)}
        destructive
        onConfirm={() => lifecycle.mutateAsync(confirm)}
      />
    </>
  );
}