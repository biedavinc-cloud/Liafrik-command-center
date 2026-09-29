// Identity & access services: administrators, roles, notifications.
import { Administrators, Roles, Notifications } from '@/lib/data/repositories';
import { recordAudit } from './audit';
import { invokeFunction } from '@/lib/api';

// Actually revokes the administrator's live sessions (not just an audit log entry).
export async function resetAdministratorAccess(admin) {
  const res = await invokeFunction('resetAccess', { email: admin.email });
  if (!res.data?.success) throw new Error(res.data?.error || 'Failed to reset access');
  return res.data;
}

export async function saveAdministrator(data, existing) {
  if (existing) {
    const updated = await Administrators.update(existing.id, data);
    await recordAudit({ action: 'administrator.updated', resource: 'administrator', resource_id: existing.email, before: { global_role: existing.global_role, assignments: existing.assignments }, after: { global_role: data.global_role, assignments: data.assignments } });
    return updated;
  }
  const created = await Administrators.create({ ...data, status: 'active' });
  await recordAudit({ action: 'administrator.created', resource: 'administrator', resource_id: created.email, after: { global_role: data.global_role, assignments: data.assignments } });
  await Notifications.create({ title: created.full_name, body: 'New administrator added.', severity: 'info', category: 'security' });
  return created;
}

export async function setAdministratorStatus(admin, status) {
  const patch = status === 'revoked' ? { status, assignments: [], global_role: 'none' } : { status };
  await Administrators.update(admin.id, patch);
  await recordAudit({ action: `administrator.${status}`, resource: 'administrator', resource_id: admin.email, before: { status: admin.status }, after: { status } });
}

export async function saveRolePermissions(role, permissions) {
  await Roles.update(role.id, { permissions });
  await recordAudit({ action: 'permissions.updated', resource: 'role', resource_id: role.key, before: { permissions: role.permissions }, after: { permissions } });
}

export const markNotificationRead = (n) => Notifications.update(n.id, { read: true });
export const markAllNotificationsRead = (list) =>
  Notifications.bulkUpdate(list.filter((n) => !n.read).map((n) => ({ id: n.id, read: true })));