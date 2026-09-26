import React from 'react';
import { ExternalLink, Eye, Plus, Pencil, Ban, CheckCircle, Trash2, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/I18nProvider';
import { capabilityMap } from '@/lib/protocol/capabilities';
import { endpointFor, isLive } from '@/lib/protocol/connector';
import Panel from '@/components/kit/Panel';
import StatusBadge from '@/components/kit/StatusBadge';
import EmptyState from '@/components/kit/EmptyState';

const ACTIONS = [['view', Eye], ['create', Plus], ['edit', Pencil], ['suspend', Ban], ['activate', CheckCircle], ['delete', Trash2]];

export default function ConnectorModule({ app, capability }) {
  const { t } = useT();
  const cap = capabilityMap[capability];
  const live = isLive(app);
  const name = t(`cap.${capability}`);
  const reason = app.is_demo ? 'demo' : live ? 'proxy' : 'notConnected';

  return (
    <Panel
      title={<span className="flex items-center gap-2"><cap.icon className="h-4 w-4 text-brand" />{name}</span>}
      subtitle={<span className="font-mono">GET {endpointFor(app, capability) || '—'}</span>}
      actions={<StatusBadge value={app.connection_status} />}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ACTIONS.map(([k, Icon]) => (
          <Tooltip key={k}>
            <TooltipTrigger asChild>
              <span><Button variant="outline" size="sm" disabled className="h-8 gap-1.5 text-[12px]"><Icon className="h-3.5 w-3.5" />{t(`connector.actions.${k}`)}</Button></span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{t('connector.requiresLive')}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="rounded-md border border-dashed">
        <EmptyState
          icon={Unplug}
          title={t(`connector.${reason}Title`, { name })}
          description={t(`connector.${reason}Body`, { name, app: app.name })}
          action={app.admin_url && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
              <a href={app.admin_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" />{t('app.nativeAdmin')}</a>
            </Button>
          )}
        />
      </div>
    </Panel>
  );
}