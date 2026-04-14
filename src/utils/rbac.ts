/**
 * RBAC — Role-Based Access Control types and helpers.
 * Roles: admin > analyst > viewer.
 */

export type Role = 'admin' | 'analyst' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  displayName?: string;
}

/** Permissions by feature area */
export interface Permissions {
  viewDashboards: boolean;
  viewRevenue: boolean;
  manageAlerts: boolean;
  manageUsers: boolean;
  useChat: boolean;
  exportData: boolean;
  viewAuditLog: boolean;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  analyst: 2,
  viewer: 1,
};

export function getPermissions(role: Role): Permissions {
  return {
    viewDashboards: true,
    viewRevenue: role !== 'viewer',
    manageAlerts: role === 'admin' || role === 'analyst',
    manageUsers: role === 'admin',
    useChat: role !== 'viewer',
    exportData: role !== 'viewer',
    viewAuditLog: role === 'admin',
  };
}

export function hasPermission(role: Role, permission: keyof Permissions): boolean {
  return getPermissions(role)[permission];
}

export function isAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** Nav items visible to this role */
export function getVisibleNavItems(_role: Role): string[] {
  const base = [
    'overview', 'web-performance', 'seo', 'email',
    'social', 'crm-pipeline', 'cross-channel', 'martech-health', 'about',
  ];
  // All pages visible to all roles — revenue data hidden at component level
  return base;
}

/** Role display config */
export function getRoleBadge(role: Role): { label: string; color: string } {
  switch (role) {
    case 'admin': return { label: 'Admin', color: '#818cf8' };
    case 'analyst': return { label: 'Analyst', color: '#10b981' };
    case 'viewer': return { label: 'Viewer', color: '#94a3b8' };
  }
}
