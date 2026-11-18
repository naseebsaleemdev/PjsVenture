import { useState } from 'react';
import { ArrowLeft, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { signInPortalWithGoogle } from '../lib/portalAuth.ts';

interface PortalLoginGateProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  authLoading: boolean;
  authError: string | null;
  onClearAuthError: () => void;
  onExitPortal: () => void;
}

function formatGoogleSignInError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain not authorized for Google Sign-In (${host}). Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains, then retry.`;
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in popup was closed before completion. Try again when ready.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and retry.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Could not complete Google sign-in. Please try again.';
}

export function PortalLoginGate({
  isDarkMode,
  onToggleDarkMode,
  authLoading,
  authError,
  onClearAuthError,
  onExitPortal,
}: PortalLoginGateProps) {
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

  const displayedError = localError || authError;
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setIsUnauthorizedDomain(false);
    onClearAuthError();
    setSigningIn(true);
    try {
      await signInPortalWithGoogle();
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
      }
      setLocalError(formatGoogleSignInError(err));
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

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3.5">
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
                  <span>Authorized team &amp; owner access only</span>
                </p>
              </div>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-2.5 leading-relaxed space-y-2"
              >
                <p>{displayedError}</p>
                {isUnauthorizedDomain && currentHost && (
                  <div className="pt-1 border-t border-red-200/70 dark:border-red-800/70 space-y-1.5">
                    <div className="font-mono text-[11px] bg-white/80 dark:bg-zinc-950/80 px-2 py-1 rounded border border-red-200 dark:border-red-800 select-all break-all">
                      {currentHost}
                    </div>
                    <a
                      href="https://console.firebase.google.com/project/kingly-haven-hxq1s/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-medium underline hover:opacity-80"
                    >
                      Open Firebase Authorized Domains Settings
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                <ShieldCheck className="w-4 h-4 text-blue-900 dark:text-blue-400" aria-hidden="true" />
                <span>Cloud-Synced Team Access</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Sign in with your authorized Google account (Owner or Admin-approved team email) to
                manage inventory, port tracking, and CRM buyer leads across all devices.
              </p>
            </div>

            <button
              type="button"
              disabled={signingIn || authLoading}
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-400 dark:disabled:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"
                />
              </svg>
              <span>
                {signingIn || authLoading ? 'Verifying Access...' : 'Continue with Google'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
