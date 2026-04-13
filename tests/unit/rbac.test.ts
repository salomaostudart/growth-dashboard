import { describe, it, expect } from 'vitest';
import {
  getPermissions,
  hasPermission,
  isAtLeast,
  getVisibleNavItems,
  getRoleBadge,
  type Role,
} from '../../src/utils/rbac';

describe('getPermissions', () => {
  it('admin has all permissions', () => {
    const p = getPermissions('admin');
    expect(p.viewDashboards).toBe(true);
    expect(p.viewRevenue).toBe(true);
    expect(p.manageAlerts).toBe(true);
    expect(p.manageUsers).toBe(true);
    expect(p.useChat).toBe(true);
    expect(p.exportData).toBe(true);
    expect(p.viewAuditLog).toBe(true);
  });

  it('analyst cannot manage users or view audit log', () => {
    const p = getPermissions('analyst');
    expect(p.viewDashboards).toBe(true);
    expect(p.viewRevenue).toBe(true);
    expect(p.manageAlerts).toBe(true);
    expect(p.manageUsers).toBe(false);
    expect(p.useChat).toBe(true);
    expect(p.exportData).toBe(true);
    expect(p.viewAuditLog).toBe(false);
  });

  it('viewer can only view dashboards', () => {
    const p = getPermissions('viewer');
    expect(p.viewDashboards).toBe(true);
    expect(p.viewRevenue).toBe(false);
    expect(p.manageAlerts).toBe(false);
    expect(p.manageUsers).toBe(false);
    expect(p.useChat).toBe(false);
    expect(p.exportData).toBe(false);
    expect(p.viewAuditLog).toBe(false);
  });
});

describe('hasPermission', () => {
  it('returns true for granted permission', () => {
    expect(hasPermission('admin', 'manageUsers')).toBe(true);
  });

  it('returns false for denied permission', () => {
    expect(hasPermission('viewer', 'manageUsers')).toBe(false);
  });
});

describe('isAtLeast', () => {
  it('admin is at least viewer', () => {
    expect(isAtLeast('admin', 'viewer')).toBe(true);
  });

  it('viewer is not at least analyst', () => {
    expect(isAtLeast('viewer', 'analyst')).toBe(false);
  });

  it('analyst is at least analyst', () => {
    expect(isAtLeast('analyst', 'analyst')).toBe(true);
  });
});

describe('getVisibleNavItems', () => {
  it('returns all nav items for any role', () => {
    const items = getVisibleNavItems('viewer');
    expect(items).toContain('overview');
    expect(items).toContain('cross-channel');
    expect(items).toContain('about');
  });
});

describe('getRoleBadge', () => {
  it('returns correct label for each role', () => {
    expect(getRoleBadge('admin').label).toBe('Admin');
    expect(getRoleBadge('analyst').label).toBe('Analyst');
    expect(getRoleBadge('viewer').label).toBe('Viewer');
  });

  it('returns a color for each role', () => {
    const roles: Role[] = ['admin', 'analyst', 'viewer'];
    roles.forEach(r => {
      expect(getRoleBadge(r).color).toMatch(/^#/);
    });
  });
});
