import type { PortalPermissions, PortalRole, PortalUser } from '../types/autoTrade.ts';

export const ROLE_DEFAULT_PERMISSIONS: Record<PortalRole, PortalPermissions> = {
  Admin: {
    inventoryRead: true,
    inventoryWrite: true,
    inventoryDelete: true,
    bookingsRead: true,
    bookingsWrite: true,
    bookingsDelete: true,
    videosManage: true,
    usersManage: true,
  },
  Editor: {
    inventoryRead: true,
    inventoryWrite: true,
    inventoryDelete: false,
    bookingsRead: true,
    bookingsWrite: true,
    bookingsDelete: false,
    videosManage: true,
    usersManage: false,
  },
  Viewer: {
    inventoryRead: true,
    inventoryWrite: false,
    inventoryDelete: false,
    bookingsRead: true,
    bookingsWrite: false,
    bookingsDelete: false,
    videosManage: false,
    usersManage: false,
  },
};

export function createPermissionsForRole(role: PortalRole): PortalPermissions {
  return { ...ROLE_DEFAULT_PERMISSIONS[role] };
}

export function normalizePortalUser(raw: Partial<PortalUser>, fallbackRole: PortalRole = 'Viewer'): PortalUser {
  const role: PortalRole =
    raw.role === 'Admin' || raw.role === 'Editor' || raw.role === 'Viewer'
      ? raw.role
      : fallbackRole;
  const basePerms = ROLE_DEFAULT_PERMISSIONS[role];
  const mergedPerms: PortalPermissions = {
    inventoryRead:
      typeof raw.permissions?.inventoryRead === 'boolean'
        ? raw.permissions.inventoryRead
        : basePerms.inventoryRead,
    inventoryWrite:
      typeof raw.permissions?.inventoryWrite === 'boolean'
        ? raw.permissions.inventoryWrite
        : basePerms.inventoryWrite,
    inventoryDelete:
      typeof raw.permissions?.inventoryDelete === 'boolean'
        ? raw.permissions.inventoryDelete
        : basePerms.inventoryDelete,
    bookingsRead:
      typeof raw.permissions?.bookingsRead === 'boolean'
        ? raw.permissions.bookingsRead
        : basePerms.bookingsRead,
    bookingsWrite:
      typeof raw.permissions?.bookingsWrite === 'boolean'
        ? raw.permissions.bookingsWrite
        : basePerms.bookingsWrite,
    bookingsDelete:
      typeof raw.permissions?.bookingsDelete === 'boolean'
        ? raw.permissions.bookingsDelete
        : basePerms.bookingsDelete,
    videosManage:
      typeof raw.permissions?.videosManage === 'boolean'
        ? raw.permissions.videosManage
        : basePerms.videosManage,
    usersManage:
      typeof raw.permissions?.usersManage === 'boolean'
        ? raw.permissions.usersManage
        : basePerms.usersManage,
  };

  if (raw.isPrimaryOwner) {
    return {
      id: raw.id || 'owner-admin',
      name: raw.name?.trim() || 'Primary Owner',
      email: (raw.email || 'naseebsaleemvmi@gmail.com').trim().toLowerCase(),
      password: raw.password || 'PJS#2026',
      role: 'Admin',
      active: true,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
      isPrimaryOwner: true,
      createdAt: raw.createdAt || '2026-11-01T00:00:00.000Z',
    };
  }

  return {
    id: raw.id || `usr-${Date.now()}`,
    name: raw.name?.trim() || 'Team Member',
    email: (raw.email || '').trim().toLowerCase(),
    password: raw.password || '',
    role,
    active: typeof raw.active === 'boolean' ? raw.active : true,
    permissions: mergedPerms,
    isPrimaryOwner: false,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const INITIAL_PORTAL_USERS: PortalUser[] = [
  {
    id: 'owner-admin',
    name: 'Owner Admin',
    email: 'naseebsaleemvmi@gmail.com',
    password: 'PJS#2026',
    role: 'Admin',
    active: true,
    permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
    isPrimaryOwner: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];
