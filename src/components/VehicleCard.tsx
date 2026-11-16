import { Bookmark, FileText } from 'lucide-react';
import { formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

interface VehicleCardProps {
  vehicle: ExportVehicle;
  currency: AutoCurrency;
  isShortlisted: boolean;
  onToggleShortlist: (vehicleId: string) => void;
  onInspect: (vehicle: ExportVehicle) => void;
  onBookOrClaim: (vehicle: ExportVehicle) => void;
}

export function VehicleCard({
  vehicle,
  currency,
  isShortlisted,
  onToggleShortlist,
  onInspect,
  onBookOrClaim,
}: VehicleCardProps) {
  const isBalanceDeal = vehicle.transit.dealType === 'balance-release';

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5">
      <div>
        <button
          type="button"
          onClick={() => onInspect(vehicle)}
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
              <span className={`font-medium ${isBalanceDeal ? 'text-blue-900' : 'text-zinc-950'}`}>
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
              <span className="tabular-nums">{vehicle.mileageKm.toLocaleString('en-US')} km</span>
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
              <span className="text-xs font-semibold text-zinc-950">Balance Due to Clear</span>
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
              <span className="text-xs font-semibold text-zinc-950">Caribbean CIF Estimate</span>
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
            aria-pressed={isShortlisted}
            aria-label={
              isShortlisted ? `Remove ${vehicle.makeModel} from saved` : `Save ${vehicle.makeModel}`
            }
            className={`p-2.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
              isShortlisted
                ? 'border-blue-900 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white text-slate-600 hover:text-zinc-950 hover:border-slate-300'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onInspect(vehicle)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Inspect</span>
          </button>

          <button
            type="button"
            onClick={() => onBookOrClaim(vehicle)}
            className="flex-1 px-3.5 py-2.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            {isBalanceDeal ? 'Claim Balance' : 'Book This Car'}
          </button>
        </div>
      </div>
    </article>
  );
}
