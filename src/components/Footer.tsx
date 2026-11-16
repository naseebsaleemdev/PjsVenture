interface FooterProps {
  onOpenPortal: () => void;
}

export function Footer({ onOpenPortal }: FooterProps) {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-zinc-950"
          >
            CrownWheel
          </a>
          <p className="mt-1 text-xs text-slate-500">
            Yokohama <span aria-hidden="true">·</span> Nassau <span aria-hidden="true">·</span>{' '}
            Kingston <span aria-hidden="true">·</span> Cayman <span aria-hidden="true">·</span>{' '}
            trade@crownwheel.jp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <a href="#inventory" className="hover:text-zinc-950 transition-colors">
            Inventory
          </a>
          <a href="#export-process" className="hover:text-zinc-950 transition-colors">
            How It Works
          </a>
          <a href="#cif-calculator" className="hover:text-zinc-950 transition-colors">
            Caribbean CIF
          </a>
          <button
            type="button"
            onClick={onOpenPortal}
            className="hover:text-blue-900 transition-colors cursor-pointer"
          >
            Seller Portal
          </button>
          <span className="text-slate-400">© 2026 CrownWheel Auto Trade</span>
        </div>
      </div>
    </footer>
  );
}
