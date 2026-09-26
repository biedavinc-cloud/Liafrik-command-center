// RBAC catalog. Frontend checks are for UX only — writes are enforced server-side (entity access rules).
import { useAuth } from '@/lib/AuthContext';

export const PERMISSION_RESOURCES = [
  { key: 'applications', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'users', actions: ['view', 'create', 'edit', 'suspend'] },
  { key: 'admins', actions: ['view', 'create', 'edit', 'suspend'] },
  { key: 'roles', actions: ['view', 'manage'] },
  { key: 'payments', actions: ['view', 'manage', 'refund'] },
  { key: 'settings', actions: ['view', 'manage'] },
  { key: 'audit', actions: ['view'] },
  { key: 'api', actions: ['view', 'manage'] },
  { key: 'security', actions: ['view', 'manage'] },
];

export const ALL_ACTIONS = ['view', 'create', 'edit', 'delete', 'suspend', 'manage', 'refund'];
export const ALL_PERMISSIONS = PERMISSION_RESOURCES.flatMap((r) => r.actions.map((a) => `${r.key}.${a}`));
export const GLOBAL_ROLES = ['superadmin', 'global_admin', 'platform_admin', 'manager', 'support', 'analyst', 'viewer'];

export const roleOfUser = (user) => (user?.role === 'admin' ? 'superadmin' : 'viewer');

export function useCan() {
  const { user } = useAuth();
  const role = roleOfUser(user);
  return (permission) => role === 'superadmin' || permission.endsWith('.view');
}