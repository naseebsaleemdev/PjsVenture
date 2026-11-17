import type { PortalPermissions, PortalRole, PortalUser } from '../types/autoTrade.ts';

export function emailToPortalUserId(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/[^a-z0-9_-]/g, '_');
}

export const PRIMARY_OWNER_EMAIL = 'naseebsaleemvmi@gmail.com';
export const PRIMARY_OWNER_DOC_ID = emailToPortalUserId(PRIMARY_OWNER_EMAIL);

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

export function normalizePortalUser(
  raw: Partial<PortalUser>,
  fallbackRole: PortalRole = 'Viewer',
): PortalUser {
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
    const ownerEmail = (raw.email || PRIMARY_OWNER_EMAIL).trim().toLowerCase();
    return {
      id: emailToPortalUserId(ownerEmail),
      name: raw.name?.trim() || 'Primary Owner',
      email: ownerEmail,
      role: 'Admin',
      active: true,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
      isPrimaryOwner: true,
      createdAt: raw.createdAt || '2026-11-01T00:00:00.000Z',
    };
  }

  const cleanEmail = (raw.email || '').trim().toLowerCase();
  return {
    id: cleanEmail ? emailToPortalUserId(cleanEmail) : raw.id || `usr-${Date.now()}`,
    name: raw.name?.trim() || 'Team Member',
    email: cleanEmail,
    role,
    active: typeof raw.active === 'boolean' ? raw.active : true,
    permissions: mergedPerms,
    isPrimaryOwner: false,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const INITIAL_PORTAL_USERS: PortalUser[] = [
  {
    id: PRIMARY_OWNER_DOC_ID,
    name: 'Owner Admin',
    email: PRIMARY_OWNER_EMAIL,
    role: 'Admin',
    active: true,
    permissions: { ...ROLE_DEFAULT_PERMISSIONS.Admin },
    isPrimaryOwner: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];
