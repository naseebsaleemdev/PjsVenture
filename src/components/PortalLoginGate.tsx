import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Moon, Sun } from 'lucide-react';
import {
  authenticatePortalUser,
  getPrimaryOwnerUser,
  isValidPortalEmail,
  isValidPortalPassword,
  isValidRecoveryKey,
  savePortalPassword,
} from '../lib/portalAuth.ts';
import type { PortalUser } from '../types/autoTrade.ts';

interface PortalLoginGateProps {
  users: PortalUser[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAuthenticated: (user: PortalUser) => void;
  onSyncOwnerPassword?: (userId: string, nextPassword: string) => Promise<void>;
  onExitPortal: () => void;
}

export function PortalLoginGate({
  users,
  isDarkMode,
  onToggleDarkMode,
  onAuthenticated,
  onSyncOwnerPassword,
  onExitPortal,
}: PortalLoginGateProps) {
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Reset Password fields
  const [resetEmail, setResetEmail] = useState('');
  const [verifyCredential, setVerifyCredential] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessNotice(null);
    const result = authenticatePortalUser(email, password, users);
    if (result.ok) {
      setError(null);
      onAuthenticated(result.user);
      return;
    }
    setError(result.error);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessNotice(null);
    if (!isValidPortalEmail(resetEmail)) {
      setError('Password reset is restricted to the primary owner email.');
      return;
    }
    const ownerUser = getPrimaryOwnerUser(users);
    const validCurrent =
      isValidPortalPassword(verifyCredential) || verifyCredential === ownerUser.password;
    if (!validCurrent && !isValidRecoveryKey(verifyCredential)) {
      setError('Invalid current password or owner recovery key.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    savePortalPassword(newPassword);
    if (onSyncOwnerPassword && ownerUser.id) {
      try {
        await onSyncOwnerPassword(ownerUser.id, newPassword);
      } catch {
        // Local storage password already updated
      }
    }
    setError(null);
    setEmail(resetEmail.trim());
    setPassword('');
    setVerifyCredential('');
    setNewPassword('');
    setConfirmPassword('');
    setMode('signin');
    setSuccessNotice('Owner portal password updated. Sign in below with your new password.');
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 flex flex-col justify-center px-4 py-12 transition-colors">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onExitPortal}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Return to PJS Ventures Storefront</span>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'Switch CRM to light mode' : 'Switch CRM to dark mode'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-900 dark:text-blue-400 shrink-0">
                {mode === 'reset' ? (
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Lock className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-zinc-950 dark:text-white">
                  {mode === 'reset' ? 'Reset CRM & Portal Password' : 'PJS Ventures Seller Portal'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {mode === 'reset'
                    ? 'Verify owner account to set a new password'
                    : 'Authorized team & owner access only'}
                </p>
              </div>
            </div>

            {successNotice && (
              <div
                role="status"
                className="mb-5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3.5 py-2.5 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{successNotice}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5"
              >
                {error}
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="portal-email"
                    className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                  >
                    Team / Owner Email
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="portal-password"
                      className="block text-xs font-medium text-zinc-950 dark:text-zinc-200"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessNotice(null);
                        setResetEmail(email);
                        setMode('reset');
                      }}
                      className="text-xs font-medium text-blue-900 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="portal-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter portal password"
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                >
                  Sign In to Portal
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                  >
                    Owner Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="owner@domain.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-verify"
                    className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                  >
                    Current Password or Recovery Key
                  </label>
                  <input
                    id="reset-verify"
                    type="password"
                    required
                    value={verifyCredential}
                    onChange={(e) => setVerifyCredential(e.target.value)}
                    placeholder="Enter current password or recovery key"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-new-pw"
                    className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                  >
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-pw"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-pw"
                    className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm-pw"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signin');
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                  >
                    Save New Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
