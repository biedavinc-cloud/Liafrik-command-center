// Data-access layer. The only module that talks to the storage backend.
// Swapping Base44 for another backend (e.g. Neon via an API) means re-implementing `repo` only.
import { base44 } from '@/api/base44Client';

const repo = (name) => ({
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

export const Applications = repo('Application');
export const Environments = repo('ApplicationEnvironment');
export const Deployments = repo('Deployment');
export const Administrators = repo('Administrator');
export const Roles = repo('Role');
export const AuditEvents = repo('AuditEvent');
export const Notifications = repo('Notification');
export const Activity = repo('ActivityEvent');
export const Integrations = repo('Integration');
export const ApiKeys = repo('ApiKey');
export const Webhooks = repo('WebhookConfig');
export const Incidents = repo('Incident');
export const NotificationRules = repo('NotificationRule');
export const ApiLogs = repo('ApiLog');
export const SecurityEvents = repo('SecurityEvent');
export const Sessions = repo('Session');
export const ChangeRecords = repo('ChangeRecord');
export const Secrets = repo('Secret');
export const SystemStates = repo('SystemState');
export const AppConfigs = repo('AppConfig');
export const AutomationRules = repo('AutomationRule');
export const Invitations = repo('Invitation');
export const Users = repo('User');