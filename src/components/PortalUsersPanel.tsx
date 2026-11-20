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
import { formatPortalErrorMessage } from '../lib/storeClient.ts';
import type { PortalPermissions, PortalRole, PortalUser } from '../types/autoTrade.ts';

interface PortalUsersPanelProps {
  users: PortalUser[];
  currentUserId: string;
  onCreateUser: (input: Omit<PortalUser, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<PortalUser>) => Promise<void>;
  onRequestDeleteUser: (user: PortalUser) => void;
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
  onRequestDeleteUser,
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
      if ((key === 'inventoryWrite' || key === 'inventoryDelete') && next[key]) {
        next.inventoryRead = true;
      }
      if ((key === 'bookingsWrite' || key === 'bookingsDelete') && next[key]) {
        next.bookingsRead = true;
      }
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

    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!trimmedName) {
      setError('Please enter the team member full name.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid team email address (e.g. staff@pjsventures.com).');
      return;
    }

    if (!editingId && cleanPassword.length < 6) {
      setError('Please set an initial password of at least 6 characters for this user.');
      return;
    }

    if (editingId && cleanPassword.length > 0 && cleanPassword.length < 6) {
      setError('New password must be at least 6 characters long (or leave blank to keep current).');
      return;
    }

    if (
      users.some(
        (u) => u.id !== editingId && u.email.trim().toLowerCase() === cleanEmail,
      )
    ) {
      setError('A user with this email already exists. Use a different email for each user.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await onUpdateUser(editingId, {
          name: trimmedName,
          ...(isEditingPrimaryOwner ? {} : { email: cleanEmail }),
          ...(cleanPassword.length > 0 ? { password: cleanPassword } : {}),
          role: isEditingPrimaryOwner ? 'Admin' : role,
          active: isEditingPrimaryOwner ? true : active,
          permissions: isEditingPrimaryOwner ? createPermissionsForRole('Admin') : permissions,
        });
        resetForm();
        setNotice(`Updated account & permissions for ${trimmedName}.`);
      } else {
        await onCreateUser({
          name: trimmedName,
          email: cleanEmail,
          password: cleanPassword,
          role,
          active,
          permissions,
          isPrimaryOwner: false,
        });
        resetForm();
        setNotice(
          `Created ${trimmedName} (${cleanEmail}) as ${role}. They can now sign in at #portal using their email and password.`,
        );
      }
    } catch (err) {
      setError(formatPortalErrorMessage(err, 'Failed to save user.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create / Edit User & Permissions Matrix */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-5"
      >
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
              {editingId ? `Edit User — ${editingUser?.name}` : 'Create Team User'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Assign login credentials, role preset, and exact module read/write access.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md cursor-pointer shrink-0"
            >
              + New User
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5">
            {error}
          </p>
        )}

        {notice && (
          <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3.5 py-2.5 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{notice}</span>
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ali Shehbaaz"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              Team Login Email *
            </label>
            <input
              type="email"
              required
              disabled={isEditingPrimaryOwner}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@pjsventures.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500 disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {isEditingPrimaryOwner
                ? 'Primary Owner email is permanently bound to this workspace.'
                : 'User signs in at #portal using this email and password.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
              {editingId ? 'Reset Password (optional)' : 'Portal Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingId}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  editingId
                    ? 'Leave blank to keep existing password'
                    : 'Minimum 6 characters'
                }
                className="w-full pl-3 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-950 dark:hover:text-zinc-200 cursor-pointer"
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
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-950 dark:text-zinc-200">
              Role Preset
            </label>
            {isEditingPrimaryOwner && (
              <span className="text-[11px] text-blue-900 dark:text-blue-400 font-medium">
                Primary Owner locked to Admin
              </span>
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
                      ? 'border-blue-900 dark:border-blue-500 bg-blue-900 dark:bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {item.role}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            {ROLE_OPTIONS.find((r) => r.role === role)?.summary}
          </p>
        </div>

        {/* Granular Permissions Matrix */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
            Module Access &amp; Permissions
          </div>
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1.5">
                {group.items.map((perm) => (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 ${
                      isEditingPrimaryOwner
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={permissions[perm.key]}
                      disabled={isEditingPrimaryOwner}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-blue-900 dark:text-blue-500 focus:ring-blue-900"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-950 dark:text-zinc-100">
                        {perm.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                        {perm.hint}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isEditingPrimaryOwner && (
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 cursor-pointer">
            <div>
              <div className="text-xs font-medium text-zinc-950 dark:text-zinc-100">
                Account Active
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                Allow this user to sign in to the Seller Portal
              </div>
            </div>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-blue-900 dark:text-blue-500"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-400 dark:disabled:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
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
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
              Team Accounts &amp; Role Access
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Live team sync — each staff member signs in at #portal with their email and password.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
            {users.length} {users.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                      {user.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                        user.role === 'Admin'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : user.role === 'Editor'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.isPrimaryOwner && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900 dark:text-blue-400">
                        <Shield className="w-3 h-3" aria-hidden="true" />
                        Owner
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">(You)</span>
                    )}
                    {!user.active && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Suspended
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-600 dark:text-zinc-300 truncate">
                    {user.email}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {formatPermissionSummary(user)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
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
                        className="p-2 text-slate-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {user.active ? (
                          <UserX className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRequestDeleteUser(user)}
                        aria-label={`Delete user ${user.name}`}
                        className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
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
