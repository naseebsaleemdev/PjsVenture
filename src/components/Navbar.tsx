import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppRoute =
  | '/'
  | '/inventory'
  | '/port-deals'
  | '/markets'
  | '/ports'
  | '/calculator'
  | '/how-to-buy'
  | '/blog'
  | '/book'
  | '/portal'
  | `/listing/${string}`
  | `/blog/${string}`;

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_ITEMS: { label: string; route: AppRoute }[] = [
  { label: 'Inventory', route: '/inventory' },
  { label: 'Port Deals', route: '/port-deals' },
  { label: 'Global Ports', route: '/ports' },
  { label: 'CIF Calculator', route: '/calculator' },
  { label: 'How to Buy', route: '/how-to-buy' },
  { label: 'Blog', route: '/blog' },
];

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (route: AppRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-t-[3px] border-[#0B1F3A] border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go('/');
          }}
          aria-label="PJS Ventures Home"
          className="inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B1F3A] rounded"
        >
          <img
            src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
            alt="PJS Ventures"
            className="h-11 w-auto object-contain"
          />
        </a>

        {/* Zone 2: Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              currentRoute === item.route ||
              (item.route === '/inventory' && currentRoute.startsWith('/listing/')) ||
              (item.route === '/blog' && currentRoute.startsWith('/blog/'));
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.route);
                }}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-2 underline-offset-8 transition-colors duration-150 rounded ${
                  active
                    ? 'text-[#0B1F3A] font-semibold underline decoration-2 decoration-[#C81E1E]'
                    : 'text-slate-600 hover:text-[#0B1F3A] hover:underline decoration-slate-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => go('/book')}
            className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C81E1E]"
          >
            Book a Vehicle
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white text-[#0B1F3A] hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => go(item.route)}
                  className={`w-full text-left px-3 py-3 text-base font-medium rounded-lg cursor-pointer ${
                    active ? 'bg-[#0B1F3A]/5 text-[#0B1F3A] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => go('/book')}
              className="mt-2 w-full px-4 py-3 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg cursor-pointer"
            >
              Book a Vehicle
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
