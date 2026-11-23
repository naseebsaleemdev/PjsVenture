import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
  onSelectInventoryCategory?: (category: 'SUVs & 4x4' | 'Hybrids' | 'Sedans' | 'Commercial') => void;
}

export function Footer({ onNavigate, onSelectInventoryCategory }: FooterProps) {
  const goCategory = (cat: 'SUVs & 4x4' | 'Hybrids' | 'Sedans' | 'Commercial') => {
    if (onSelectInventoryCategory) {
      onSelectInventoryCategory(cat);
    } else {
      onNavigate('/inventory');
    }
  };

  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              aria-label="PJS Ventures Home"
              className="inline-flex items-center bg-white rounded-lg px-3 py-1.5"
            >
              <img
                src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
                alt="PJS Ventures"
                className="h-9 w-auto object-contain"
              />
            </a>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Direct Japanese vehicle sourcing, JEVIC pre-export inspection, weekly RoRo &amp;
              container dispatch from Yokohama, Nagoya, and Osaka to 30+ global ports.
            </p>

            <div className="text-xs text-slate-400 space-y-1">
              <div>Yokohama Export Desk: Naka-ku, Yokohama, Kanagawa 231-0002, Japan</div>
              <div>
                Direct Trade Desk:{' '}
                <a
                  href="mailto:trade@pjsventures.com"
                  className="text-white hover:underline underline-offset-4"
                >
                  trade@pjsventures.com
                </a>
              </div>
            </div>
          </div>

          {/* Stock Categories */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">
              Vehicle Stock
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/inventory')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Export Stock
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goCategory('SUVs & 4x4')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  4x4 SUVs &amp; Cruisers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goCategory('Hybrids')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Japanese Hybrids
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goCategory('Commercial')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pickups &amp; Vans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/port-deals')}
                  className="text-red-300 hover:text-white font-medium transition-colors cursor-pointer"
                >
                  Port Balance Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Global Shipping */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">
              Shipping &amp; Freight
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/ports')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Global Destination Ports
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/markets')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Regional Export Corridors
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/calculator')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  RoRo &amp; CIF Freight Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/auctions')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Japan Live Auctions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/how-to-buy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Auction Inspection &amp; Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Buyer Support */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-white">
              Buyer Desk
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/company')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About &amp; Bank Security
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Buyer FAQ &amp; Help
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/book')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Book a Vehicle
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/blog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Export Journal &amp; Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/portal')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Team Seller Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Yokohama · Nagoya · Osaka · Caribbean · East &amp; West Africa · UK &amp; Europe · Oceania
          </div>
          <div>© 2026 PJS Ventures. All export rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
