import { Anchor, Bookmark, CheckCircle2, X } from 'lucide-react';
import { formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

interface VehicleModalProps {
  vehicle: ExportVehicle;
  currency: AutoCurrency;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  onBookOrClaim: () => void;
  onClose: () => void;
}

export function VehicleModal({
  vehicle,
  currency,
  isShortlisted,
  onToggleShortlist,
  onBookOrClaim,
  onClose,
}: VehicleModalProps) {
  const isBalanceDeal = vehicle.transit.dealType === 'balance-release';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-mono">
            <span>{vehicle.chassisCode}</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans text-zinc-950 font-medium">{vehicle.status}</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans text-blue-900 font-medium">
              {vehicle.transit.destinationPortLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close vehicle details"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-zinc-950 hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src={vehicle.image}
                alt={vehicle.imageAlt}
                fallbackTitle={vehicle.makeModel}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <Anchor className="w-4 h-4 text-blue-900" aria-hidden="true" />
                <span>Shipping & Port Dispatch</span>
              </div>

              <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs sm:text-sm">
                <dt className="text-slate-500">Dispatch Mode</dt>
                <dd className="text-zinc-950 font-medium text-right">
                  {isBalanceDeal ? 'Port Balance Release' : 'Direct Japan Import'}
                </dd>

                <dt className="text-slate-500">Vessel / Schedule</dt>
                <dd className="text-zinc-950 font-medium text-right">
                  {vehicle.transit.vesselName}
                </dd>

                <dt className="text-slate-500">Status</dt>
                <dd className="text-blue-900 font-medium text-right">
                  {vehicle.transit.arrivalStatus}
                </dd>

                <dt className="text-slate-500">Bill of Lading</dt>
                <dd className="text-zinc-950 font-medium text-right">{vehicle.transit.blStatus}</dd>
              </dl>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <h4 className="text-sm font-semibold text-zinc-950 mb-3">Vehicle Specifications</h4>
              <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs sm:text-sm">
                <dt className="text-slate-500">Year / Mileage</dt>
                <dd className="text-zinc-950 font-medium font-mono tabular-nums text-right">
                  {vehicle.year} · {vehicle.mileageKm.toLocaleString('en-US')} km
                </dd>

                <dt className="text-slate-500">Engine</dt>
                <dd className="text-zinc-950 font-medium text-right">{vehicle.engine}</dd>

                <dt className="text-slate-500">Transmission</dt>
                <dd className="text-zinc-950 font-medium text-right">{vehicle.transmission}</dd>

                <dt className="text-slate-500">Drive / Steering</dt>
                <dd className="text-zinc-950 font-medium text-right">
                  {vehicle.drive} · {vehicle.steering}
                </dd>
              </dl>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h3
                  id="vehicle-modal-title"
                  className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950"
                >
                  {vehicle.year} {vehicle.makeModel}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{vehicle.trim}</p>
              </div>

              {/* Financial Summary */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 space-y-3">
                {isBalanceDeal ? (
                  <>
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-slate-600">Original Shipped CIF Value</span>
                      <span className="font-mono text-slate-400 line-through tabular-nums">
                        {formatAutoPrice(vehicle.transit.fullCifUsd, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-emerald-800">Prior Buyer Deposit Paid</span>
                      <span className="font-mono font-medium text-emerald-800 tabular-nums">
                        -{formatAutoPrice(vehicle.transit.priorDepositUsd, currency)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-zinc-950">
                        Remaining Balance to Clear
                      </span>
                      <span className="font-mono text-2xl font-semibold text-blue-900 tabular-nums">
                        {formatAutoPrice(vehicle.transit.balanceDueUsd, currency)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-slate-600">FOB Japan Price</span>
                      <span className="font-mono font-medium text-zinc-950 tabular-nums">
                        {formatAutoPrice(vehicle.fobUsd, currency)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-zinc-950">
                        Estimated Caribbean CIF
                      </span>
                      <span className="font-mono text-2xl font-semibold text-blue-900 tabular-nums">
                        {formatAutoPrice(vehicle.transit.fullCifUsd, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Translated Auction Sheet */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-950">
                    Japanese Auction Inspection
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {vehicle.inspection.auctionHouse} · Lot #{vehicle.inspection.lotNumber}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">Overall Grade</div>
                    <div className="font-mono text-xl font-semibold text-zinc-950 mt-0.5">
                      {vehicle.inspection.overallGrade}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">Exterior</div>
                    <div className="font-mono text-xl font-semibold text-zinc-950 mt-0.5">
                      {vehicle.inspection.exteriorGrade}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[11px] text-slate-500">Interior</div>
                    <div className="font-mono text-xl font-semibold text-zinc-950 mt-0.5">
                      {vehicle.inspection.interiorGrade}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-800">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Odometer Verified
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="font-mono text-slate-700">
                    {vehicle.inspection.radiationCheck}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {vehicle.inspection.inspectorSummary}
                </p>

                <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                  {vehicle.inspection.bodyNotes.map((note) => (
                    <li key={note} className="text-xs text-slate-600 flex items-baseline gap-2">
                      <span className="text-slate-400 font-mono" aria-hidden="true">
                        —
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onToggleShortlist}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-slate-200 text-zinc-950 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Bookmark
                  className={`w-4 h-4 ${isShortlisted ? 'fill-current text-blue-900' : ''}`}
                  aria-hidden="true"
                />
                <span>{isShortlisted ? 'Shortlisted' : 'Save Unit'}</span>
              </button>

              <button
                type="button"
                onClick={onBookOrClaim}
                className="flex-1 px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
              >
                {isBalanceDeal ? 'Claim & Pay Remaining Balance' : 'Book This Car for Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
