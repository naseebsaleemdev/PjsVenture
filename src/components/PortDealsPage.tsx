import { Anchor, ArrowRight, FileCheck2, Ship } from 'lucide-react';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';
import { VehicleCard } from './VehicleCard';

interface PortDealsPageProps {
  vehicles: ExportVehicle[];
  currency: AutoCurrency;
  shortlistIds: string[];
  onToggleShortlist: (vehicleId: string) => void;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onNavigate: (route: AppRoute) => void;
}

export function PortDealsPage({
  vehicles,
  currency,
  shortlistIds,
  onToggleShortlist,
  onInspectVehicle,
  onBookOrClaimVehicle,
  onNavigate,
}: PortDealsPageProps) {
  const balanceUnits = vehicles.filter((v) => v.transit.dealType === 'balance-release');

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Port Balance-Release Deals"
        title="Already shipped. Half paid. Settle the remaining balance at your port."
        subtitle="Select units where the original buyer paid a 40%–50% deposit prior to sailing and backed out before discharge. Claim the re-assigned Bill of Lading and clear directly at your destination port."
      />

      {/* 3-Step Balance Clearance Explainer */}
      <section className="py-12 bg-[#F3F5F8] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <Ship className="w-5 h-5 text-[#C81E1E] mb-3" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-zinc-950">
              1. Already Aboard Vessel or Docked
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              No 5-week sea wait. These vehicles have already passed pre-export inspection and are
              approaching or docked at destination ports worldwide.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <Anchor className="w-5 h-5 text-[#C81E1E] mb-3" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-zinc-950">
              2. Pay Only the Remaining Balance
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              The prior buyer&apos;s forfeited deposit (40%–50% of full CIF) is deducted upfront so
              you acquire the vehicle well below normal landed cost.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <FileCheck2 className="w-5 h-5 text-[#C81E1E] mb-3" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-zinc-950">
              3. Direct B/L Consignee Transfer
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Upon balance settlement, we endorse the original Bill of Lading and Export Certificate
              into your name for immediate customs clearance.
            </p>
          </div>
        </div>
      </section>

      {/* Active Port Balance Units */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950">
                Currently Available Balance-Release Units ({balanceUnits.length})
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Updated live as vehicles arrive or get claimed by local island buyers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#C81E1E] hover:underline underline-offset-4 cursor-pointer"
            >
              <span>Browse All Direct Japan Imports</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {balanceUnits.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-10 text-center bg-slate-50">
              <h3 className="font-display text-lg font-semibold text-zinc-950">
                No defaulted balance-release units open right now
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Register your local port on our booking page to be notified first when a vessel unit
                opens, or book directly from our ready Japan yard stock.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg cursor-pointer"
              >
                Register Port Alert
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {balanceUnits.map((vehicle) => (
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
    </div>
  );
}
