// Data-access layer. The only module that talks to the storage backend.
// All business entities now read/write directly to Neon PostgreSQL via the
// `neonData` backend function. The User entity stays on Base44 because it is
// the built-in auth entity managed by the platform's auth system.
import { invokeFunction } from '@/lib/api';
import { base44 } from '@/api/base44Client';

const neonRepo = (name) => ({
  list: (sort = '-created_date', limit = 500) =>
    invokeFunction('neonData', { entity: name, operation: 'list', sort, limit }).then(r => r.data),
  filter: (query, sort = '-created_date', limit = 500) =>
    invokeFunction('neonData', { entity: name, operation: 'filter', query, sort, limit }).then(r => r.data),
  get: (id) =>
    invokeFunction('neonData', { entity: name, operation: 'get', id }).then(r => r.data),
  create: (data) =>
    invokeFunction('neonData', { entity: name, operation: 'create', data }).then(r => r.data),
  bulkCreate: (rows) =>
    invokeFunction('neonData', { entity: name, operation: 'bulkCreate', rows }).then(r => r.data),
  update: (id, data) =>
    invokeFunction('neonData', { entity: name, operation: 'update', id, data }).then(r => r.data),
  bulkUpdate: (rows) =>
    invokeFunction('neonData', { entity: name, operation: 'bulkUpdate', rows }).then(r => r.data),
  updateMany: (query, update) =>
    invokeFunction('neonData', { entity: name, operation: 'updateMany', query, update }).then(r => r.data),
  remove: (id) =>
    invokeFunction('neonData', { entity: name, operation: 'delete', id }).then(r => r.data),
  deleteMany: (query) =>
    invokeFunction('neonData', { entity: name, operation: 'deleteMany', query }).then(r => r.data),
  count: (query = {}) =>
    invokeFunction('neonData', { entity: name, operation: 'count', query }).then(r => r.data),
});

// User is the built-in Base44 auth entity — keep on platform storage
const base44Repo = (name) => ({
  list: (sort = '-created_date', limit = 500) => base44.entities[name].list(sort, limit),
  filter: (query, sort = '-created_date', limit = 500) => base44.entities[name].filter(query, sort, limit),
  get: (id) => base44.entities[name].get(id),
  create: (data) => base44.entities[name].create(data),
  bulkCreate: (rows) => base44.entities[name].bulkCreate(rows),
  update: (id, data) => base44.entities[name].update(id, data),
  bulkUpdate: (rows) => base44.entities[name].bulkUpdate(rows),
  updateMany: (query, update) => base44.entities[name].updateMany(query, update),
  remove: (id) => base44.entities[name].delete(id),
  deleteMany: (query) => base44.entities[name].deleteMany(query),
});

export const Applications = neonRepo('Application');
export const Environments = neonRepo('ApplicationEnvironment');
export const Deployments = neonRepo('Deployment');
export const Administrators = neonRepo('Administrator');
export const Roles = neonRepo('Role');
export const AuditEvents = neonRepo('AuditEvent');
export const Notifications = neonRepo('Notification');
export const Activity = neonRepo('ActivityEvent');
export const Integrations = neonRepo('Integration');
export const ApiKeys = neonRepo('ApiKey');
export const Webhooks = neonRepo('WebhookConfig');
export const Incidents = neonRepo('Incident');
export const NotificationRules = neonRepo('NotificationRule');
export const ApiLogs = neonRepo('ApiLog');
export const SecurityEvents = neonRepo('SecurityEvent');
export const Sessions = neonRepo('Session');
export const ChangeRecords = neonRepo('ChangeRecord');
export const Secrets = neonRepo('Secret');
export const SystemStates = neonRepo('SystemState');
export const AppConfigs = neonRepo('AppConfig');
export const AutomationRules = neonRepo('AutomationRule');
export const Invitations = neonRepo('Invitation');
export const Users = base44Repo('User');
export const CurrencyRates = neonRepo('CurrencyRate');
export const StaffProfiles = neonRepo('StaffProfile');
export const Branding = {
  get: () => invokeFunction('manageBranding', { operation: 'get' }).then(r => r.data),
  set: (data) => invokeFunction('manageBranding', { operation: 'set', ...data }).then(r => r.data),
};
export const syncRates = (base) => invokeFunction('syncExchangeRates', { base }).then(r => r.data);
export const MyProfile = {
  get: () => invokeFunction('manageProfile', { operation: 'get' }).then(r => r.data),
  set: (data) => invokeFunction('manageProfile', { operation: 'set', ...data }).then(r => r.data),
};
export const PaymentProviders = neonRepo('PaymentProvider');
export const PaymentLinks = neonRepo('PaymentLink');
export const StaffTasks = neonRepo('StaffTask');
export const Messages = neonRepo('Message');
export const Conversations = neonRepo('Conversation');
export const OutboundMessages = neonRepo('OutboundMessage');
export const CommunicationChannels = neonRepo('CommunicationChannel');
export const PSP = {
  list: () => invokeFunction('managePsp', { operation: 'list' }).then(r => r.data),
  connect: (data) => invokeFunction('managePsp', { operation: 'connect', ...data }).then(r => r.data),
  disconnect: (data) => invokeFunction('managePsp', { operation: 'disconnect', ...data }).then(r => r.data),
  toggle: (data) => invokeFunction('managePsp', { operation: 'toggle', ...data }).then(r => r.data),
  test: (data) => invokeFunction('managePsp', { operation: 'test', ...data }).then(r => r.data),
  configure: (data) => invokeFunction('managePsp', { operation: 'configure', ...data }).then(r => r.data),
};
export const createPaymentLink = (data) => invokeFunction('createPaymentLink', data).then(r => r.data);