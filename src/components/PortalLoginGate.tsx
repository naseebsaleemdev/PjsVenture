import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';

interface PortalLoginGateProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  authLoading: boolean;
  authError: string | null;
  onClearAuthError: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onExitPortal: () => void;
}

export function PortalLoginGate({
  isDarkMode,
  onToggleDarkMode,
  authLoading,
  authError,
  onClearAuthError,
  onLogin,
  onExitPortal,
}: PortalLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayedError = localError || authError;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearAuthError();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError('Please enter a valid portal email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your portal password.');
      return;
    }

    setSigningIn(true);
    try {
      await onLogin(cleanEmail, password);
    } catch (err) {
      setLocalError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not sign in. Please check your email and password.',
      );
    } finally {
      setSigningIn(false);
    }
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

          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-3.5 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white border border-slate-200 dark:border-zinc-200 p-1 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
                  alt="PJS Ventures"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-zinc-950 dark:text-white">
                  PJS Ventures Seller Portal
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>Sign in with your team email &amp; password</span>
                </p>
              </div>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5 leading-relaxed"
              >
                {displayedError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="portal-login-email"
                  className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                >
                  Portal Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="portal-login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (localError) setLocalError(null);
                      if (authError) onClearAuthError();
                    }}
                    placeholder="name@pjsventures.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="portal-login-password"
                  className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="portal-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (localError) setLocalError(null);
                      if (authError) onClearAuthError();
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
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

            <button
              type="submit"
              disabled={signingIn || authLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-400 dark:disabled:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {signingIn || authLoading ? 'Signing In...' : 'Sign In to Seller Portal'}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-500 dark:text-zinc-400 leading-relaxed">
              Multiple team members can sign in simultaneously on separate devices or browsers using
              their assigned email and password.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
