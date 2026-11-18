import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            aria-label="PJS Ventures Home"
            className="inline-flex items-center"
          >
            <img
              src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
              alt="PJS Ventures"
              className="h-12 w-auto object-contain"
            />
          </a>
          <p className="mt-2 text-xs text-slate-500">
            Yokohama <span aria-hidden="true">·</span> Caribbean <span aria-hidden="true">·</span>{' '}
            Africa <span aria-hidden="true">·</span> UK &amp; Europe <span aria-hidden="true">·</span>{' '}
            Oceania <span aria-hidden="true">·</span> trade@pjsventures.com
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
          <a
            href="/inventory"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/inventory');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            Inventory
          </a>
          <a
            href="/port-deals"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/port-deals');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            Port Deals
          </a>
          <a
            href="/markets"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/markets');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            Global Markets
          </a>
          <a
            href="/ports"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/ports');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            Global Ports
          </a>
          <a
            href="/calculator"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/calculator');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            CIF Calculator
          </a>
          <a
            href="/how-to-buy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/how-to-buy');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            How to Buy
          </a>
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/blog');
            }}
            className="hover:text-zinc-950 transition-colors"
          >
            Blog
          </a>
          <span className="text-slate-400">© 2026 PJS Ventures</span>
        </div>
      </div>
    </footer>
  );
}
