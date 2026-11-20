import { useState } from 'react';
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Ship } from 'lucide-react';
import {
  AUTO_HERO_MEDIA,
  DESTINATION_PORTS,
  PORT_REGIONS,
  TRADE_METRICS,
} from '../data/seedInventory.ts';
import type { VehicleCategory } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

export interface QuickInventorySearch {
  query: string;
  category: VehicleCategory;
  dealMode: 'All Vehicles' | 'Book from Japan' | 'Port Balance Deals';
  portId: string;
}

interface HeroSectionProps {
  totalVehiclesCount: number;
  onBrowseInventory: () => void;
  onViewBalanceDeals: () => void;
  onQuickSearch: (filters: QuickInventorySearch) => void;
}

const POPULAR_MODELS = [
  'Land Cruiser Prado',
  'Toyota Hilux',
  'Corolla Sport',
  'Toyota Aqua',
  'HiAce',
  'Crown',
];

export function HeroSection({
  totalVehiclesCount,
  onBrowseInventory,
  onViewBalanceDeals,
  onQuickSearch,
}: HeroSectionProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('All Stock');
  const [dealMode, setDealMode] = useState<
    'All Vehicles' | 'Book from Japan' | 'Port Balance Deals'
  >('All Vehicles');
  const [portId, setPortId] = useState<string>('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch({ query, category, dealMode, portId });
  };

  return (
    <section id="top" className="bg-[#F3F5F8] border-b border-slate-200 pb-12 sm:pb-16">
      {/* Upper Maritime Navy Hero Band */}
      <div className="bg-[#0B1F3A] text-white pt-10 pb-20 sm:pt-14 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-300">
                <span className="w-5 h-0.5 bg-[#C81E1E]" aria-hidden="true" />
                <span>Direct Japanese Auto Exports · Est. Yokohama Desk</span>
              </div>

              <h1 className="font-display font-bold tracking-tight text-white text-[clamp(2.15rem,3.8vw,3.35rem)] leading-[1.08]">
                Direct Japanese Vehicles, Auction-Verified &amp; Shipped Worldwide.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Search inspected Toyota, Lexus, Nissan, and Honda export stock from Yokohama,
                Nagoya, and Osaka—plus select in-transit port balance-release deals ready for
                immediate local port clearance.
              </p>

              {/* Verified Exporter Proof Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                  <span>USS · TAA · HAA · JU Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>JEVIC &amp; Odometer Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                  <span>Weekly RoRo &amp; Container</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onBrowseInventory}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Browse Live Stock ({totalVehiclesCount})</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onViewBalanceDeals}
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Port Balance-Release Deals
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl">
                <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full">
                  <ResilientImage
                    src={AUTO_HERO_MEDIA.src}
                    alt={AUTO_HERO_MEDIA.alt}
                    fallbackTitle="PJS Ventures Yokohama Export Bay"
                    priority
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07162B]/90 via-[#07162B]/40 to-transparent px-5 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
                    <span className="font-medium">Yokohama Container &amp; RoRo Staging Yard</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      Grade 4.0–5.0 Certified
                    </span>
                  </div>
                </div>

                {/* Compact Exporter Trust Metrics */}
                <div className="bg-[#07162B] px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10">
                  {TRADE_METRICS.map((metric) => (
                    <div key={metric.label}>
                      <div className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums">
                        {metric.value}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature SBT Japan / BE FORWARD / TokyoJapTru Stock Quick Finder */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0B1F3A]">
              <Search className="w-3.5 h-3.5 text-[#C81E1E]" aria-hidden="true" />
              <span>Japanese Stock Quick Search</span>
            </div>
            <div className="text-xs text-slate-500">
              Filter by model, chassis code, buying mode, or destination port
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4">
                <label
                  htmlFor="hero-search-query"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Make, Model or Chassis
                </label>
                <input
                  id="hero-search-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Prado, Hilux, Aqua, ZWE213..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                />
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="hero-search-category"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Body Type
                </label>
                <select
                  id="hero-search-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] cursor-pointer"
                >
                  <option value="All Stock">All Categories</option>
                  <option value="SUVs & 4x4">SUVs &amp; 4x4</option>
                  <option value="Hybrids">Hybrids</option>
                  <option value="Sedans">Sedans</option>
                  <option value="Commercial">Commercial / Vans</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="hero-search-mode"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Buying Mode
                </label>
                <select
                  id="hero-search-mode"
                  value={dealMode}
                  onChange={(e) =>
                    setDealMode(
                      e.target.value as 'All Vehicles' | 'Book from Japan' | 'Port Balance Deals',
                    )
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] cursor-pointer"
                >
                  <option value="All Vehicles">All Inventory</option>
                  <option value="Book from Japan">Book from Japan</option>
                  <option value="Port Balance Deals">Port Balance Deals</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="hero-search-port"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
                >
                  Destination Port
                </label>
                <select
                  id="hero-search-port"
                  value={portId}
                  onChange={(e) => setPortId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] cursor-pointer truncate"
                >
                  <option value="all">All 30+ Ports</option>
                  {PORT_REGIONS.map((region) => (
                    <optgroup key={region} label={region}>
                      {DESTINATION_PORTS.filter((p) => p.region === region).map((port) => (
                        <option key={port.id} value={port.id}>
                          {port.name} ({port.country})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>Search Stock</span>
                </button>
              </div>
            </div>

            {/* Clean Quick Model Shortcuts (Zero Pill Borders) */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="font-semibold text-slate-500">Popular Queries:</span>
              {POPULAR_MODELS.map((modelName) => (
                <button
                  key={modelName}
                  type="button"
                  onClick={() =>
                    onQuickSearch({
                      query: modelName,
                      category: 'All Stock',
                      dealMode: 'All Vehicles',
                      portId: 'all',
                    })
                  }
                  className="font-medium text-[#0B1F3A] hover:text-[#C81E1E] hover:underline underline-offset-4 cursor-pointer transition-colors"
                >
                  {modelName}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
