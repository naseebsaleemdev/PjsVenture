import { ArrowRight } from 'lucide-react';
import { DESTINATION_PORTS } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import { AuctionProcessSection } from './AuctionProcessSection';
import { HeroSection } from './HeroSection';
import type { AppRoute } from './Navbar';
import { VehicleCard } from './VehicleCard';

interface HomePageProps {
  vehicles: ExportVehicle[];
  currency: AutoCurrency;
  shortlistIds: string[];
  onToggleShortlist: (vehicleId: string) => void;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onNavigate: (route: AppRoute) => void;
  onSelectPortForInventory: (portId: string) => void;
}

export function HomePage({
  vehicles,
  currency,
  shortlistIds,
  onToggleShortlist,
  onInspectVehicle,
  onBookOrClaimVehicle,
  onNavigate,
  onSelectPortForInventory,
}: HomePageProps) {
  // Showcase 3 featured vehicles: prioritize 2 direct imports + 1 port balance deal
  const directSample = vehicles
    .filter((v) => v.transit.dealType === 'direct-import')
    .slice(0, 2);
  const balanceSample = vehicles
    .filter((v) => v.transit.dealType === 'balance-release')
    .slice(0, 1);
  const featured = [...directSample, ...balanceSample].slice(0, 3);

  const nearUsPorts = DESTINATION_PORTS.slice(0, 4);

  return (
    <>
      <HeroSection
        onBrowseInventory={() => onNavigate('/inventory')}
        onViewBalanceDeals={() => onNavigate('/port-deals')}
      />

      {/* Featured Vehicles Preview */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">Featured Stock</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Book ready Japanese imports or claim select port-arrival units.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View All {vehicles.length} Vehicles</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featured.map((vehicle) => (
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
        </div>
      </section>

      {/* Near-US Caribbean Shipping Corridors Preview */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Near-US Caribbean Corridors
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
                Direct weekly sailings to Bahamas, Jamaica, Cayman & Turks & Caicos.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/ports')}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>All 8 Caribbean Ports & Rates</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {nearUsPorts.map((port) => (
              <button
                key={port.id}
                type="button"
                onClick={() => {
                  onSelectPortForInventory(port.id);
                  onNavigate('/inventory');
                }}
                className="text-left p-5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-900 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-blue-900">{port.country}</div>
                  <h3 className="font-display text-base font-semibold text-zinc-950 mt-1">
                    {port.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{port.regionTag}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">RoRo from</span>
                  <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                    ${port.roroUsd.toLocaleString('en-US')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AuctionProcessSection />
    </>
  );
}
