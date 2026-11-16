import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Search, X } from 'lucide-react';
import { DESTINATION_PORTS, formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle, VehicleCategory } from '../types/autoTrade.ts';
import { PageBanner } from './PageBanner';
import { ResilientImage } from './ResilientImage';
import { VehicleCard } from './VehicleCard';

type ListingTab = 'All Vehicles' | 'Book from Japan' | 'Port Balance Deals';

const LISTING_TABS: ListingTab[] = ['All Vehicles', 'Book from Japan', 'Port Balance Deals'];

const CATEGORIES: VehicleCategory[] = [
  'All Stock',
  'SUVs & 4x4',
  'Hybrids',
  'Sedans',
  'Commercial',
];

const CURRENCIES: AutoCurrency[] = ['USD', 'BSD', 'XCD', 'GBP'];

interface InventorySectionProps {
  vehicles: ExportVehicle[];
  loading: boolean;
  currency: AutoCurrency;
  onCurrencyChange: (currency: AutoCurrency) => void;
  shortlistIds: string[];
  onToggleShortlist: (vehicleId: string) => void;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onRequestShortlistQuote: () => void;
  initialPortId?: string;
}

export function InventorySection({
  vehicles,
  loading,
  currency,
  onCurrencyChange,
  shortlistIds,
  onToggleShortlist,
  onInspectVehicle,
  onBookOrClaimVehicle,
  onRequestShortlistQuote,
  initialPortId = 'all',
}: InventorySectionProps) {
  const [listingTab, setListingTab] = useState<ListingTab>('All Vehicles');
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>('All Stock');
  const [selectedPortId, setSelectedPortId] = useState<string>(initialPortId);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedPortId(initialPortId);
  }, [initialPortId]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesTab =
        listingTab === 'All Vehicles' ||
        (listingTab === 'Book from Japan' && vehicle.transit.dealType === 'direct-import') ||
        (listingTab === 'Port Balance Deals' && vehicle.transit.dealType === 'balance-release');

      const matchesCategory =
        activeCategory === 'All Stock' || vehicle.category === activeCategory;

      const matchesPort =
        selectedPortId === 'all' ||
        vehicle.transit.dealType === 'direct-import' ||
        vehicle.transit.destinationPortId === selectedPortId;

      const matchesQuery =
        !query ||
        vehicle.makeModel.toLowerCase().includes(query) ||
        vehicle.trim.toLowerCase().includes(query) ||
        vehicle.chassisCode.toLowerCase().includes(query) ||
        vehicle.transit.destinationPortLabel.toLowerCase().includes(query) ||
        String(vehicle.year).includes(query);

      return matchesTab && matchesCategory && matchesPort && matchesQuery;
    });
  }, [vehicles, listingTab, activeCategory, selectedPortId, searchQuery]);

  const shortlistedVehicles = vehicles.filter((v) => shortlistIds.includes(v.id));
  const shortlistTotalUsd = shortlistedVehicles.reduce(
    (sum, v) => sum + v.transit.balanceDueUsd,
    0,
  );

  return (
    <div>
      <PageBanner
        breadcrumb="CrownWheel · Export Inventory"
        title="Japanese Vehicles Ready for Caribbean Import"
        subtitle="Book verified yard units for direct RoRo or container dispatch to your island port, or filter for select in-transit balance-release cars."
      />

      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Currency & Saved Shortlist Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div
              role="tablist"
              aria-label="Filter by booking type"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto max-w-full"
            >
              {LISTING_TABS.map((tab) => {
                const active = listingTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setListingTab(tab)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-slate-600 hover:text-zinc-950'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Select currency"
                className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg"
              >
                {CURRENCIES.map((code) => {
                  const active = currency === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onCurrencyChange(code)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-zinc-950 text-white'
                          : 'text-slate-600 hover:text-zinc-950'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 bg-white text-zinc-950 hover:border-slate-300 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-blue-900" aria-hidden="true" />
                <span>Saved</span>
                <span className="font-mono tabular-nums text-slate-600">
                  ({shortlistIds.length})
                </span>
              </button>
            </div>
          </div>

          {/* Search & Port Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border-blue-900 bg-blue-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:text-zinc-950'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                aria-label="Filter by Caribbean destination port"
                value={selectedPortId}
                onChange={(e) => setSelectedPortId(e.target.value)}
                className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                <option value="all">All Caribbean Ports</option>
                {DESTINATION_PORTS.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name} ({port.country})
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-64 shrink-0">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search make, model, chassis..."
                  aria-label="Search vehicle inventory"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mb-8 text-xs text-slate-500">
            Showing <span className="font-mono font-medium text-zinc-950">{filteredVehicles.length}</span>{' '}
            verified vehicle(s)
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-xl border border-slate-200 bg-white animate-pulse"
                />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <h3 className="font-display text-lg font-semibold text-zinc-950">
                No vehicles match this filter
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Reset filters or request a custom Japan auction import for your Caribbean port.
              </p>
              <button
                type="button"
                onClick={() => {
                  setListingTab('All Vehicles');
                  setActiveCategory('All Stock');
                  setSelectedPortId('all');
                  setSearchQuery('');
                }}
                className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
              >
                Reset Stock Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  currency={currency}
                  isShortlisted={shortlistIds.includes(vehicle.id)}
                  onToggleShortlist={onToggleShortlist}
                  onInspect={onInspectVehicle}
                  onBookOrClaim={onBookOrClaimVehicle}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Saved vehicles drawer"
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-white border-l border-slate-200 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-zinc-950">
                  Saved Vehicles
                </h3>
                <p className="text-xs text-slate-500">
                  {shortlistedVehicles.length} vehicle(s) shortlisted
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close saved drawer"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-zinc-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {shortlistedVehicles.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No vehicles saved yet. Bookmark any car to request a multi-unit Caribbean shipping
                  quote.
                </div>
              ) : (
                shortlistedVehicles.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="w-24 h-18 rounded overflow-hidden bg-slate-200 shrink-0">
                      <ResilientImage
                        src={item.image}
                        alt={item.imageAlt}
                        fallbackTitle={item.makeModel}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-950 truncate">
                        {item.year} {item.makeModel}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {item.transit.destinationPortLabel}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-blue-900 tabular-nums">
                          {formatAutoPrice(item.transit.balanceDueUsd, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleShortlist(item.id)}
                          className="text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-600">Combined CIF / Balance</span>
                <span className="font-mono text-xl font-semibold text-zinc-950 tabular-nums">
                  {formatAutoPrice(shortlistTotalUsd, currency)}
                </span>
              </div>
              <button
                type="button"
                disabled={shortlistedVehicles.length === 0}
                onClick={() => {
                  setDrawerOpen(false);
                  onRequestShortlistQuote();
                }}
                className="w-full px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                Book Shortlisted Vehicles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
