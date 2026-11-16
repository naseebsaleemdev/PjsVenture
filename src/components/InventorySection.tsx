import { useMemo, useState } from 'react';
import { Bookmark, FileText, Search, X } from 'lucide-react';
import { DESTINATION_PORTS, formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle, VehicleCategory } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';
import { VehicleModal } from './VehicleModal';

type ListingTab = 'All Vehicles' | 'Book from Japan' | 'Port Balance Deals';

const LISTING_TABS: ListingTab[] = [
  'All Vehicles',
  'Book from Japan',
  'Port Balance Deals',
];

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
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onRequestShortlistQuote: () => void;
  activeTabExternal?: ListingTab | null;
  onClearExternalTab?: () => void;
}

export function InventorySection({
  vehicles,
  loading,
  currency,
  onCurrencyChange,
  shortlistIds,
  onToggleShortlist,
  onBookOrClaimVehicle,
  onRequestShortlistQuote,
  activeTabExternal,
  onClearExternalTab,
}: InventorySectionProps) {
  const [listingTab, setListingTab] = useState<ListingTab>('All Vehicles');
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>('All Stock');
  const [selectedPortId, setSelectedPortId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<ExportVehicle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const effectiveTab = activeTabExternal ?? listingTab;

  const handleTabChange = (tab: ListingTab) => {
    setListingTab(tab);
    onClearExternalTab?.();
  };

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesTab =
        effectiveTab === 'All Vehicles' ||
        (effectiveTab === 'Book from Japan' && vehicle.transit.dealType === 'direct-import') ||
        (effectiveTab === 'Port Balance Deals' && vehicle.transit.dealType === 'balance-release');

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
  }, [vehicles, effectiveTab, activeCategory, selectedPortId, searchQuery]);

  const shortlistedVehicles = vehicles.filter((v) => shortlistIds.includes(v.id));
  const shortlistTotalUsd = shortlistedVehicles.reduce(
    (sum, v) => sum + v.transit.balanceDueUsd,
    0,
  );

  return (
    <section id="inventory" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-blue-900 mb-2">Caribbean Export Inventory</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Book verified Japanese cars for import, or claim select port-arrival units.
            </h2>
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
              <span className="font-mono tabular-nums text-slate-600">({shortlistIds.length})</span>
            </button>
          </div>
        </div>

        {/* Listing Type Tabs & Port Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div
            role="tablist"
            aria-label="Filter by booking type"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start overflow-x-auto max-w-full"
          >
            {LISTING_TABS.map((tab) => {
              const active = effectiveTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(tab)}
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              aria-label="Filter by Caribbean destination port"
              value={selectedPortId}
              onChange={(e) => setSelectedPortId(e.target.value)}
              className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            >
              <option value="all">All Caribbean & Global Ports</option>
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

        {/* Body Category Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 border-b border-slate-200">
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
              Reset filters or send a booking request below and our Japan desk will source your
              exact trim for Caribbean shipping.
            </p>
            <button
              type="button"
              onClick={() => {
                handleTabChange('All Vehicles');
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
            {filteredVehicles.map((vehicle) => {
              const isSaved = shortlistIds.includes(vehicle.id);
              const isBalanceDeal = vehicle.transit.dealType === 'balance-release';

              return (
                <article
                  key={vehicle.id}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-900"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                        <ResilientImage
                          src={vehicle.image}
                          alt={vehicle.imageAlt}
                          fallbackTitle={vehicle.makeModel}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-6 pb-4">
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                          <span
                            className={`font-medium ${
                              isBalanceDeal ? 'text-blue-900' : 'text-zinc-950'
                            }`}
                          >
                            {isBalanceDeal ? 'Port Balance Deal' : 'Direct Japan Import'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{vehicle.status}</span>
                          <span aria-hidden="true">·</span>
                          <span>Grade {vehicle.inspection.overallGrade}</span>
                        </div>

                        <h3 className="font-display text-lg font-semibold text-zinc-950 group-hover:text-blue-900 transition-colors">
                          {vehicle.year} {vehicle.makeModel}
                        </h3>
                        <p className="text-sm text-slate-600">{vehicle.trim}</p>

                        <div className="mt-2.5 text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="tabular-nums">
                            {vehicle.mileageKm.toLocaleString('en-US')} km
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{vehicle.engine}</span>
                          <span aria-hidden="true">·</span>
                          <span>{vehicle.transit.destinationPortLabel}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-slate-100 space-y-4">
                    {isBalanceDeal ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Original CIF Value</span>
                          <span className="font-mono tabular-nums line-through">
                            {formatAutoPrice(vehicle.transit.fullCifUsd, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-800">
                          <span>Prior Deposit Paid</span>
                          <span className="font-mono font-medium tabular-nums">
                            -{formatAutoPrice(vehicle.transit.priorDepositUsd, currency)}
                          </span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-zinc-950">
                            Balance Due to Clear
                          </span>
                          <span className="font-mono text-lg font-semibold text-blue-900 tabular-nums">
                            {formatAutoPrice(vehicle.transit.balanceDueUsd, currency)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>FOB Japan</span>
                          <span className="font-mono tabular-nums">
                            {formatAutoPrice(vehicle.fobUsd, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="text-xs font-semibold text-zinc-950">
                            Caribbean CIF Estimate
                          </span>
                          <span className="font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                            {formatAutoPrice(vehicle.transit.fullCifUsd, currency)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleShortlist(vehicle.id)}
                        aria-pressed={isSaved}
                        aria-label={
                          isSaved
                            ? `Remove ${vehicle.makeModel} from saved list`
                            : `Save ${vehicle.makeModel}`
                        }
                        className={`p-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
                          isSaved
                            ? 'border-blue-900 bg-blue-50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:text-zinc-950 hover:border-slate-300'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onBookOrClaimVehicle(vehicle)}
                        className="flex-1 px-3.5 py-2.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                      >
                        {isBalanceDeal ? 'Claim Balance' : 'Book This Car'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedVehicle && (
        <VehicleModal
          vehicle={selectedVehicle}
          currency={currency}
          isShortlisted={shortlistIds.includes(selectedVehicle.id)}
          onToggleShortlist={() => onToggleShortlist(selectedVehicle.id)}
          onBookOrClaim={() => {
            const target = selectedVehicle;
            setSelectedVehicle(null);
            onBookOrClaimVehicle(target);
          }}
          onClose={() => setSelectedVehicle(null)}
        />
      )}

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
    </section>
  );
}
