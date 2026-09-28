import { invokeFunction } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import * as R from './repositories';

const opts = { staleTime: 30_000 };

export const useApplications = () => useQuery({ queryKey: ['applications'], queryFn: () => R.Applications.list('name'), ...opts });
export const useEnvironments = () => useQuery({ queryKey: ['environments'], queryFn: () => R.Environments.list(), ...opts });
export const useDeployments = () => useQuery({ queryKey: ['deployments'], queryFn: () => R.Deployments.list('-deployed_at', 200), ...opts });
export const useAdministrators = () => useQuery({ queryKey: ['administrators'], queryFn: () => R.Administrators.list('full_name'), ...opts });
export const useRoles = () => useQuery({ queryKey: ['roles'], queryFn: () => R.Roles.list('rank'), ...opts });
export const useAudit = () => useQuery({ queryKey: ['audit'], queryFn: () => R.AuditEvents.list('-created_date', 500), ...opts });
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: () => R.Notifications.list('-created_date', 200), ...opts });
export const useActivity = () => useQuery({ queryKey: ['activity'], queryFn: () => R.Activity.list('-occurred_at', 100), ...opts });
export const useIntegrations = () => useQuery({ queryKey: ['integrations'], queryFn: () => R.Integrations.list('provider'), ...opts });

// Phase 2 hooks
export const useApiKeys = (appId) => useQuery({
  queryKey: ['apiKeys', appId],
  queryFn: () => R.ApiKeys.filter({ application_id: appId }, '-created_date'),
  enabled: !!appId,
  ...opts,
});
export const useWebhooks = (appId) => useQuery({
  queryKey: ['webhooks', appId],
  queryFn: () => R.Webhooks.filter({ application_id: appId }, '-created_date'),
  enabled: !!appId,
  ...opts,
});
export const useIncidents = () => useQuery({ queryKey: ['incidents'], queryFn: () => R.Incidents.list('-created_date', 200), ...opts });
export const useIncidentsByApp = (appId) => useQuery({
  queryKey: ['incidents', appId],
  queryFn: () => R.Incidents.filter({ application_id: appId }, '-created_date'),
  enabled: !!appId,
  ...opts,
});
export const useNotificationRules = () => useQuery({ queryKey: ['notificationRules'], queryFn: () => R.NotificationRules.list('name'), ...opts });
export const useApiLogs = (appId) => useQuery({
  queryKey: ['apiLogs', appId],
  queryFn: () => R.ApiLogs.filter({ application_id: appId }, '-created_date', 100),
  enabled: !!appId,
  ...opts,
});
export const useAllApiLogs = () => useQuery({ queryKey: ['apiLogs'], queryFn: () => R.ApiLogs.list('-created_date', 200), ...opts });
export const useSecurityEvents = () => useQuery({ queryKey: ['securityEvents'], queryFn: () => R.SecurityEvents.list('-created_date', 200), ...opts });
export const useSessions = () => useQuery({ queryKey: ['sessions'], queryFn: () => R.Sessions.list('-last_active', 100), ...opts });
export const useChangeRecords = (appId) => useQuery({
  queryKey: ['changeRecords', appId],
  queryFn: () => R.ChangeRecords.filter({ application_id: appId }, '-created_date'),
  enabled: !!appId,
  ...opts,
});
export const useSecrets = () => useQuery({ queryKey: ['secrets'], queryFn: () => R.Secrets.list('name'), ...opts });
export const useSystemState = () => useQuery({ queryKey: ['systemState'], queryFn: () => R.SystemStates.filter({ key: 'global' }), ...opts });
export const useAppConfigs = (appId, env) => useQuery({ queryKey: ['appConfigs', appId, env], queryFn: () => R.AppConfigs.filter({ application_id: appId, environment: env || 'production' }, 'section'), enabled: !!appId, ...opts });
export const useAutomationRules = () => useQuery({ queryKey: ['automationRules'], queryFn: () => R.AutomationRules.list('name'), ...opts });
export const useInvitations = () => useQuery({ queryKey: ['invitations'], queryFn: () => R.Invitations.list('-created_date'), ...opts });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: () => R.Users.list('full_name'), ...opts });
export const useBranding = () => useQuery({ queryKey: ['branding'], queryFn: () => R.Branding.get(), ...opts });
export const useCurrencyRates = (base = 'USD') => useQuery({ queryKey: ['currencyRates', base], queryFn: () => R.CurrencyRates.filter({ base_currency: base }, '-fetched_at', 1), ...opts });
export const useStaffProfile = (userId) => useQuery({ queryKey: ['staffProfile', userId], queryFn: () => R.StaffProfiles.filter({ user_id: userId }, '-created_date', 1), enabled: !!userId, ...opts });
export function useSetBranding() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => R.Branding.set(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['branding'] }) });
}
export function useSyncRates() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (base) => R.syncRates(base), onSuccess: () => qc.invalidateQueries({ queryKey: ['currencyRates'] }) });
}
export const useMyProfile = () => useQuery({ queryKey: ['myProfile'], queryFn: () => R.MyProfile.get(), ...opts });
export function useSetMyProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => R.MyProfile.set(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['myProfile'] }) });
}
export const usePSPs = () => useQuery({ queryKey: ['psps'], queryFn: () => R.PSP.list(), ...opts });
export const usePaymentLinks = () => useQuery({ queryKey: ['paymentLinks'], queryFn: () => R.PaymentLinks.list('-created_date'), ...opts });
export const useStaffTasks = () => useQuery({ queryKey: ['staffTasks'], queryFn: () => R.StaffTasks.list('-created_date'), ...opts });
export const useConversations = () => useQuery({ queryKey: ['conversations'], queryFn: () => R.Conversations.list('-last_message_at'), ...opts });
export function usePSPAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, ...data }) => {
      switch (action) {
        case 'connect': return R.PSP.connect(data);
        case 'disconnect': return R.PSP.disconnect(data);
        case 'toggle': return R.PSP.toggle(data);
        case 'test': return R.PSP.test(data);
        case 'configure': return R.PSP.configure(data);
        default: throw new Error('Unknown PSP action');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['psps'] }),
  });
}
export function useCreatePaymentLink() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data) => R.createPaymentLink(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['paymentLinks'] }); qc.invalidateQueries({ queryKey: ['audit'] }); } });
}

// Communication hooks
export const useMessages = (conversationId) => useQuery({
  queryKey: ['messages', conversationId],
  queryFn: () => R.Messages.filter({ conversation_id: conversationId }, 'created_date'),
  enabled: !!conversationId,
  ...opts,
});
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => R.Messages.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.conversation_id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => R.Conversations.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

// Communication hooks
export const useChannelStatus = () => useQuery({
  queryKey: ['channelStatus'],
  queryFn: async () => {
    const res = await invokeFunction('sendCommunication', { action: 'status' });
    return res.data;
  },
  ...opts,
});
export function useSendCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await invokeFunction('sendCommunication', { action: 'send', ...data });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outboundMessages'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
export const useOutboundMessages = () => useQuery({ queryKey: ['outboundMessages'], queryFn: () => R.OutboundMessages.list('-created_date', 50), ...opts });

export function useConfigureChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await invokeFunction('sendCommunication', { action: 'configure', ...data });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channelStatus'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
export function useTestChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await invokeFunction('sendCommunication', { action: 'test', ...data });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channelStatus'] }),
  });
}
export function useDeleteChannelConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await invokeFunction('sendCommunication', { action: 'delete_config', ...data });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channelStatus'] }),
  });
}

// Staff task hooks
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => R.StaffTasks.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffTasks'] }),
  });
}
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => R.StaffTasks.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffTasks'] }),
  });
}
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => R.StaffTasks.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staffTasks'] }),
  });
}

export function useAppBySlug(slug) {
  const q = useApplications();
  return { ...q, data: q.data?.find((a) => a.slug === slug) };
}

// Runs a service function and refreshes the given query keys (audit is always refreshed).
export function useAction(fn, keys = [], bypassSafeMode = false) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args) => {
      if (!bypassSafeMode) {
        const state = await R.SystemStates.filter({ key: 'global' });
        if (state[0]?.safe_mode_enabled) throw new Error('Safe Mode is active. All mutations are disabled.');
      }
      return fn(args);
    },
    onSuccess: () => [...keys, 'audit', 'systemState'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
}