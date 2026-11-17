import { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { createPermissionsForRole } from '../lib/portalRoles.ts';
import type { PortalPermissions, PortalRole, PortalUser } from '../types/autoTrade.ts';

interface PortalUsersPanelProps {
  users: PortalUser[];
  currentUserId: string;
  onCreateUser: (input: Omit<PortalUser, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<PortalUser>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const ROLE_OPTIONS: {
  role: PortalRole;
  summary: string;
}[] = [
  {
    role: 'Admin',
    summary: 'Full access to Inventory, CRM Leads, Videos, and Team Users',
  },
  {
    role: 'Editor',
    summary: 'Can add/edit cars, update port tracking, manage leads & videos',
  },
  {
    role: 'Viewer',
    summary: 'Read-only access to Inventory and CRM Leads without edits',
  },
];

const PERMISSION_GROUPS: {
  title: string;
  items: { key: keyof PortalPermissions; label: string; hint: string }[];
}[] = [
  {
    title: 'Inventory Module',
    items: [
      {
        key: 'inventoryRead',
        label: 'Read / View Inventory',
        hint: 'See vehicle listings, FOB/CIF prices, and port tracking',
      },
      {
        key: 'inventoryWrite',
        label: 'Write / Add & Edit Cars',
        hint: 'Publish cars, update pricing/photos, change Port Tracker stages',
      },
      {
        key: 'inventoryDelete',
        label: 'Delete Vehicles',
        hint: 'Remove cars permanently from inventory',
      },
    ],
  },
  {
    title: 'Bookings & CRM Module',
    items: [
      {
        key: 'bookingsRead',
        label: 'Read / View Leads & CRM',
        hint: 'View website inquiries, buyer contacts, and export CSV',
      },
      {
        key: 'bookingsWrite',
        label: 'Write / Update Leads & Notes',
        hint: 'Add manual leads, change pipeline stage, save CRM follow-up notes',
      },
      {
        key: 'bookingsDelete',
        label: 'Delete Leads',
        hint: 'Permanently delete inquiry records from CRM',
      },
    ],
  },
  {
    title: 'Media & Administration',
    items: [
      {
        key: 'videosManage',
        label: 'Manage Unloading Videos',
        hint: 'Publish or delete container unloading video clips',
      },
      {
        key: 'usersManage',
        label: 'Manage Team Users & Roles',
        hint: 'Create accounts, assign roles, and edit module permissions',
      },
    ],
  },
];

function formatPermissionSummary(user: PortalUser): string {
  const inv: string[] = [];
  if (user.permissions.inventoryRead) inv.push('R');
  if (user.permissions.inventoryWrite) inv.push('W');
  if (user.permissions.inventoryDelete) inv.push('D');

  const bk: string[] = [];
  if (user.permissions.bookingsRead) bk.push('R');
  if (user.permissions.bookingsWrite) bk.push('W');
  if (user.permissions.bookingsDelete) bk.push('D');

  const extras: string[] = [];
  if (user.permissions.videosManage) extras.push('Videos');
  if (user.permissions.usersManage) extras.push('Users');

  return [
    `Inventory: ${inv.length ? inv.join('/') : 'None'}`,
    `Bookings: ${bk.length ? bk.join('/') : 'None'}`,
    ...(extras.length ? [extras.join(' · ')] : []),
  ].join(' · ');
}

export function PortalUsersPanel({
  users,
  currentUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: PortalUsersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<PortalRole>('Editor');
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<PortalPermissions>(
    createPermissionsForRole('Editor'),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const editingUser = editingId ? users.find((u) => u.id === editingId) : undefined;
  const isEditingPrimaryOwner = Boolean(editingUser?.isPrimaryOwner);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('Editor');
    setActive(true);
    setPermissions(createPermissionsForRole('Editor'));
    setError(null);
  };

  const startEdit = (user: PortalUser) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setShowPassword(false);
    setRole(user.role);
    setActive(user.active);
    setPermissions({ ...user.permissions });
    setError(null);
    setNotice(null);
  };

  const handleRoleSelect = (nextRole: PortalRole) => {
    if (isEditingPrimaryOwner) return;
    setRole(nextRole);
    setPermissions(createPermissionsForRole(nextRole));
  };

  const togglePermission = (key: keyof PortalPermissions) => {
    if (isEditingPrimaryOwner) return;
    setPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // If write or delete is enabled, ensure read is also enabled for that module
      if ((key === 'inventoryWrite' || key === 'inventoryDelete') && next[key]) {
        next.inventoryRead = true;
      }
      if ((key === 'bookingsWrite' || key === 'bookingsDelete') && next[key]) {
        next.bookingsRead = true;
      }
      // If read is unchecked, disable write and delete for that module
      if (key === 'inventoryRead' && !next.inventoryRead) {
        next.inventoryWrite = false;
        next.inventoryDelete = false;
      }
      if (key === 'bookingsRead' && !next.bookingsRead) {
        next.bookingsWrite = false;
        next.bookingsDelete = false;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!name.trim() || !email.trim()) {
      setError('Please enter full name and email address.');
      return;
    }

    if (!editingId && password.trim().length < 6) {
      setError('Please set a password of at least 6 characters for the new user.');
      return;
    }

    if (editingId && password.trim().length > 0 && password.trim().length < 6) {
      setError('Updated password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateUser(editingId, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          ...(password.trim() ? { password: password.trim() } : {}),
          role: isEditingPrimaryOwner ? 'Admin' : role,
          active: isEditingPrimaryOwner ? true : active,
          permissions: isEditingPrimaryOwner ? createPermissionsForRole('Admin') : permissions,
        });
        setNotice(`Updated access permissions for ${name.trim()}.`);
      } else {
        await onCreateUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          active,
          permissions,
          isPrimaryOwner: false,
        });
        setNotice(`Created account for ${name.trim()} (${role}).`);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create / Edit User & Permissions Matrix */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              {editingId ? `Edit User — ${editingUser?.name}` : 'Create Team User'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign a role preset and customize exact module read/write access.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer shrink-0"
            >
              New User
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}

        {notice && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-950 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bilal Ahmed (Sales)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 mb-1">Login Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@pjsventures.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 mb-1">
              {editingId ? 'New Password (leave blank to keep current)' : 'Login Password (min 6 chars) *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingId}
                minLength={editingId ? undefined : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? 'Leave empty to keep existing password' : 'Set login password'}
                className="w-full pl-3 pr-9 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-950 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-950">Role Preset</label>
            {isEditingPrimaryOwner && (
              <span className="text-[11px] text-blue-900 font-medium">Primary Owner locked to Admin</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((item) => {
              const selected = role === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  disabled={isEditingPrimaryOwner}
                  onClick={() => handleRoleSelect(item.role)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-60 ${
                    selected
                      ? 'border-blue-900 bg-blue-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                  }`}
                >
                  {item.role}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            {ROLE_OPTIONS.find((r) => r.role === role)?.summary}
          </p>
        </div>

        {/* Granular Permissions Matrix */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-zinc-950">
            Module Access &amp; Permissions
          </div>
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1.5">
                {group.items.map((perm) => (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 ${
                      isEditingPrimaryOwner ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key]}
                      disabled={isEditingPrimaryOwner}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-950">{perm.label}</div>
                      <div className="text-[11px] text-slate-500 leading-snug">{perm.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isEditingPrimaryOwner && (
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
            <div>
              <div className="text-xs font-medium text-zinc-950">Account Active</div>
              <div className="text-[11px] text-slate-500">
                Allow this user to sign in to the Seller Portal
              </div>
            </div>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-900"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>
            {saving
              ? 'Saving...'
              : editingId
                ? 'Save User & Permissions'
                : 'Create User Account'}
          </span>
        </button>
      </form>

      {/* Right: Team Users List */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950">
              Team Accounts &amp; Role Access
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each user signs in at #portal using their own email and password.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {users.length} {users.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-950 truncate">
                      {user.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                        user.role === 'Admin'
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : user.role === 'Editor'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.isPrimaryOwner && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900">
                        <Shield className="w-3 h-3" aria-hidden="true" />
                        Owner
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[11px] text-slate-500">(You)</span>
                    )}
                    {!user.active && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-red-50 text-red-700 border border-red-200">
                        Suspended
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-600 truncate">{user.email}</div>

                  <div className="text-[11px] text-slate-500">
                    {formatPermissionSummary(user)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit Access</span>
                  </button>

                  {!user.isPrimaryOwner && !isSelf && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateUser(user.id, { active: !user.active })}
                        title={user.active ? 'Suspend account' : 'Reactivate account'}
                        className="p-2 text-slate-500 hover:text-zinc-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {user.active ? (
                          <UserX className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteUser(user.id)}
                        aria-label={`Delete user ${user.name}`}
                        className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
