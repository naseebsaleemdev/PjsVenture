import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';

interface PortalLoginGateProps {
  onAuthenticated: () => void;
  onExitPortal: () => void;
}

const EXPECTED_EMAIL =
  (import.meta.env.VITE_PORTAL_EMAIL as string | undefined)?.trim().toLowerCase() ||
  'naseebsaleemvmi@gmail.com';

const ENV_PASSWORD = (import.meta.env.VITE_PORTAL_PASSWORD as string | undefined)?.trim();

function isValidPassword(input: string): boolean {
  if (ENV_PASSWORD) {
    return input === ENV_PASSWORD;
  }
  return input === 'PJS#2026' || input === 'CrownWheel#2026';
}

export function PortalLoginGate({ onAuthenticated, onExitPortal }: PortalLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === EXPECTED_EMAIL && isValidPassword(password)) {
      setError(null);
      onAuthenticated();
      return;
    }
    setError('Invalid owner email or password. Access is restricted to authorized sellers.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={onExitPortal}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Return to PJS Ventures Storefront</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-zinc-950">
                PJS Ventures Seller Portal
              </h1>
              <p className="text-xs text-slate-500">Private owner access only</p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="portal-email"
                className="block text-xs font-medium text-zinc-950 mb-1.5"
              >
                Owner Email
              </label>
              <input
                id="portal-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@domain.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="portal-password"
                className="block text-xs font-medium text-zinc-950 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="portal-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter portal password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
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

            <button
              type="submit"
              className="w-full mt-2 px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
            >
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
