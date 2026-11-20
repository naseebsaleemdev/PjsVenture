import { useEffect, useMemo, useState } from 'react';
import { Bookmark, LayoutGrid, List, Search, X } from 'lucide-react';
import { DESTINATION_PORTS, PORT_REGIONS, formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle, VehicleCategory } from '../types/autoTrade.ts';
import { PageBanner } from './PageBanner';
import { ResilientImage } from './ResilientImage';
import { VehicleCard } from './VehicleCard';

export type ListingTab = 'All Vehicles' | 'Book from Japan' | 'Port Balance Deals';
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'mileage-asc' | 'balance-first';
type ViewMode = 'grid' | 'table';

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
  initialCategory?: VehicleCategory;
  initialListingTab?: ListingTab;
  initialSearchQuery?: string;
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
  initialCategory = 'All Stock',
  initialListingTab = 'All Vehicles',
  initialSearchQuery = '',
}: InventorySectionProps) {
  const [listingTab, setListingTab] = useState<ListingTab>(initialListingTab);
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>(initialCategory);
  const [selectedPortId, setSelectedPortId] = useState<string>(initialPortId);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedPortId(initialPortId);
  }, [initialPortId]);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setListingTab(initialListingTab);
  }, [initialListingTab]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = vehicles.filter((vehicle) => {
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

    const sorted = [...list];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.transit.balanceDueUsd - b.transit.balanceDueUsd);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.transit.balanceDueUsd - a.transit.balanceDueUsd);
    } else if (sortBy === 'mileage-asc') {
      sorted.sort((a, b) => a.mileageKm - b.mileageKm);
    } else if (sortBy === 'balance-first') {
      sorted.sort((a, b) => {
        if (a.transit.dealType === b.transit.dealType) return 0;
        return a.transit.dealType === 'balance-release' ? -1 : 1;
      });
    }
    return sorted;
  }, [vehicles, listingTab, activeCategory, selectedPortId, searchQuery, sortBy]);

  const shortlistedVehicles = vehicles.filter((v) => shortlistIds.includes(v.id));
  const shortlistTotalUsd = shortlistedVehicles.reduce(
    (sum, v) => sum + v.transit.balanceDueUsd,
    0,
  );

  const resetAllFilters = () => {
    setListingTab('All Vehicles');
    setActiveCategory('All Stock');
    setSelectedPortId('all');
    setSortBy('newest');
    setSearchQuery('');
  };

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Global Export Stock List"
        title="Japanese & International Vehicles Ready for Export"
        subtitle="Book verified yard units for direct RoRo or container dispatch to Caribbean, African, UK, European, Asian, or Pacific ports—or filter for select in-transit balance-release deals."
      />

      <section className="py-10 sm:py-14 bg-[#F3F5F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Exporter Search & Filter Console */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-8 space-y-4 shadow-xs">
            {/* Row 1: Deal Type Tabs, Currency, View Mode & Shortlist */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div
                role="tablist"
                aria-label="Filter by booking type"
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg max-w-full"
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
                      className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-[#0B1F3A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#0B1F3A]'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  role="group"
                  aria-label="Select currency"
                  className="inline-flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {CURRENCIES.map((code) => {
                    const active = currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => onCurrencyChange(code)}
                        className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#0B1F3A] text-white'
                            : 'text-slate-600 hover:text-[#0B1F3A]'
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>

                {/* Grid vs Exporter Table Toggle */}
                <div
                  role="group"
                  aria-label="Stock display layout"
                  className="inline-flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    title="Card grid view"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'text-slate-500 hover:text-[#0B1F3A]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    aria-pressed={viewMode === 'table'}
                    title="Compact exporter stock table"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'text-slate-500 hover:text-[#0B1F3A]'
                    }`}
                  >
                    <List className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 bg-white text-[#0B1F3A] hover:border-[#0B1F3A] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-[#C81E1E]" aria-hidden="true" />
                  <span>Saved</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    ({shortlistIds.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Row 2: Search, Destination Port & Sort Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="relative sm:col-span-2 lg:col-span-5">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search make, model, chassis code, or year..."
                  aria-label="Search vehicle inventory"
                  className="w-full pl-10 pr-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/15 focus:border-[#0B1F3A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="lg:col-span-4">
                <select
                  aria-label="Filter by destination port"
                  value={selectedPortId}
                  onChange={(e) => setSelectedPortId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/15 focus:border-[#0B1F3A] truncate cursor-pointer"
                >
                  <option value="all">All Destination Ports</option>
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

              <div className="lg:col-span-3">
                <select
                  aria-label="Sort inventory"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/15 focus:border-[#0B1F3A] cursor-pointer"
                >
                  <option value="newest">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="mileage-asc">Lowest Mileage</option>
                  <option value="balance-first">Port Balance Deals First</option>
                </select>
              </div>
            </div>

            {/* Row 3: Body Categories & Result Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((category) => {
                  const active = activeCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-[#C81E1E] bg-[#C81E1E] text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-[#0B1F3A]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  Showing{' '}
                  <span className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                    {filteredVehicles.length}
                  </span>{' '}
                  verified vehicle(s)
                </span>
                {(listingTab !== 'All Vehicles' ||
                  activeCategory !== 'All Stock' ||
                  selectedPortId !== 'all' ||
                  searchQuery.trim() !== '' ||
                  sortBy !== 'newest') && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-[#C81E1E] hover:underline font-medium cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
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
              <h3 className="font-display text-lg font-semibold text-[#0B1F3A]">
                No vehicles match this filter
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Reset filters or request a custom Japan auction import for your destination port.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
              >
                Reset Stock Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0B1F3A] text-white uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-semibold">Vehicle &amp; Chassis</th>
                      <th className="py-3 px-3 font-semibold">Year</th>
                      <th className="py-3 px-3 font-semibold">Mileage</th>
                      <th className="py-3 px-3 font-semibold">Engine / Drive</th>
                      <th className="py-3 px-3 font-semibold">Grade</th>
                      <th className="py-3 px-3 font-semibold">Port / Status</th>
                      <th className="py-3 px-3 font-semibold text-right">Price ({currency})</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredVehicles.map((vehicle) => {
                      const isBalance = vehicle.transit.dealType === 'balance-release';
                      return (
                        <tr
                          key={vehicle.id}
                          className="hover:bg-slate-50/90 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[230px]">
                              <button
                                type="button"
                                onClick={() => onInspectVehicle(vehicle)}
                                className="w-20 aspect-[4/3] rounded overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer"
                              >
                                <ResilientImage
                                  src={vehicle.image}
                                  alt={vehicle.imageAlt}
                                  fallbackTitle={vehicle.makeModel}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onInspectVehicle(vehicle)}
                                  className="font-display text-sm font-bold text-[#0B1F3A] hover:text-[#C81E1E] text-left cursor-pointer"
                                >
                                  {vehicle.makeModel}
                                </button>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {vehicle.trim}
                                </div>
                                <div className="font-mono text-[11px] text-slate-600">
                                  {vehicle.chassisCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900 tabular-nums">
                            {vehicle.year}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                            {vehicle.mileageKm.toLocaleString('en-US')} km
                          </td>
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                            {vehicle.engine} · {vehicle.drive} · {vehicle.steering}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-[#0B1F3A]">
                            {vehicle.inspection.overallGrade}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900">
                              {vehicle.transit.destinationPortLabel}
                            </div>
                            <div
                              className={`text-[11px] font-medium ${
                                isBalance ? 'text-[#C81E1E]' : 'text-slate-500'
                              }`}
                            >
                              {isBalance ? 'Port Balance Deal' : vehicle.status}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div
                              className={`font-mono text-sm font-bold tabular-nums ${
                                isBalance ? 'text-[#C81E1E]' : 'text-[#0B1F3A]'
                              }`}
                            >
                              {formatAutoPrice(
                                isBalance
                                  ? vehicle.transit.balanceDueUsd
                                  : vehicle.transit.fullCifUsd,
                                currency,
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                              {isBalance
                                ? 'Balance Due'
                                : `FOB ${formatAutoPrice(vehicle.fobUsd, currency)}`}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onInspectVehicle(vehicle)}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                Inspect
                              </button>
                              <button
                                type="button"
                                onClick={() => onBookOrClaimVehicle(vehicle)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded cursor-pointer"
                              >
                                {isBalance ? 'Claim' : 'Book'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-white border-l border-slate-200 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
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
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-[#0B1F3A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {shortlistedVehicles.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No vehicles saved yet. Bookmark any car to request a multi-unit CIF shipping quote.
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
                      <div className="text-sm font-semibold text-[#0B1F3A] truncate">
                        {item.year} {item.makeModel}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {item.transit.destinationPortLabel}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-[#C81E1E] tabular-nums">
                          {formatAutoPrice(item.transit.balanceDueUsd, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleShortlist(item.id)}
                          className="text-xs text-slate-500 hover:text-[#C81E1E] cursor-pointer"
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
                <span className="font-mono text-xl font-bold text-[#0B1F3A] tabular-nums">
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
                className="w-full px-5 py-3 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
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
