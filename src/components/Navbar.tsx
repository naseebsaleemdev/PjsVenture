import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onBookVehicle: () => void;
  onOpenPortal: () => void;
}

export function Navbar({ onBookVehicle, onOpenPortal }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleAnchor = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-900 rounded"
        >
          CrownWheel
        </a>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
        >
          <a
            href="#inventory"
            className="whitespace-nowrap shrink-0 py-2 text-slate-600 hover:text-zinc-950 underline-offset-4 hover:underline transition-colors duration-150 rounded"
          >
            Inventory
          </a>
          <a
            href="#export-process"
            className="whitespace-nowrap shrink-0 py-2 text-slate-600 hover:text-zinc-950 underline-offset-4 hover:underline transition-colors duration-150 rounded"
          >
            How It Works
          </a>
          <a
            href="#cif-calculator"
            className="whitespace-nowrap shrink-0 py-2 text-slate-600 hover:text-zinc-950 underline-offset-4 hover:underline transition-colors duration-150 rounded"
          >
            Caribbean CIF
          </a>
          <button
            type="button"
            onClick={onOpenPortal}
            className="whitespace-nowrap shrink-0 py-2 text-slate-600 hover:text-blue-900 underline-offset-4 hover:underline transition-colors duration-150 cursor-pointer rounded"
          >
            Seller Portal
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookVehicle}
            className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
          >
            Book a Vehicle
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white text-zinc-950 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleAnchor('#inventory')}
              className="w-full text-left px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Inventory
            </button>
            <button
              type="button"
              onClick={() => handleAnchor('#export-process')}
              className="w-full text-left px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => handleAnchor('#cif-calculator')}
              className="w-full text-left px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Caribbean CIF
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenPortal();
              }}
              className="w-full text-left px-3 py-3 text-base font-medium text-blue-900 hover:bg-blue-50 rounded-lg cursor-pointer"
            >
              Seller Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBookVehicle();
              }}
              className="mt-2 w-full px-4 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
            >
              Book a Vehicle
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
