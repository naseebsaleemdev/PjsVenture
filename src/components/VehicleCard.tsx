import { useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatAutoPrice, formatEtaDate, getVehicleImages } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import { PortTrackingProgress } from './PortTrackingProgress';
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
  const gallery = getVehicleImages(vehicle);
  const [slideIndex, setSlideIndex] = useState(0);
  const activeIndex = slideIndex < gallery.length ? slideIndex : 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % gallery.length);
  };

  return (
    <article className="group bg-white border border-slate-200 hover:border-[#0B1F3A]/40 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        {/* Vehicle Photo Viewport */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => onInspect(vehicle)}
            aria-label={`Inspect ${vehicle.year} ${vehicle.makeModel}`}
            className="block w-full h-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0B1F3A]"
          >
            <ResilientImage
              src={gallery[activeIndex]}
              alt={`${vehicle.imageAlt} (Photo ${activeIndex + 1} of ${gallery.length})`}
              fallbackTitle={vehicle.makeModel}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Single Quiet Corner Identifier */}
          <div
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide pointer-events-none ${
              isBalanceDeal
                ? 'bg-[#C81E1E] text-white'
                : 'bg-[#0B1F3A]/90 text-white'
            }`}
          >
            {isBalanceDeal ? 'PORT BALANCE DEAL' : `GRADE ${vehicle.inspection.overallGrade}`}
          </div>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-950/75 text-white hover:bg-slate-950 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-950/75 text-white hover:bg-slate-950 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1 pointer-events-auto">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex(idx);
                      }}
                      aria-label={`View photo ${idx + 1}`}
                      className={`h-1.5 rounded-sm transition-all cursor-pointer ${
                        idx === activeIndex ? 'w-5 bg-white' : 'w-2 bg-white/55 hover:bg-white/85'
                      }`}
                    />
                  ))}
                </div>

                <span className="px-2 py-0.5 rounded bg-slate-950/80 text-white font-mono text-[11px] tabular-nums">
                  {activeIndex + 1}/{gallery.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Title, Stock Metadata & 2x2 Spec Sheet */}
        <button
          type="button"
          onClick={() => onInspect(vehicle)}
          className="block w-full text-left p-5 pb-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0B1F3A]"
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 mb-1.5">
            <span className="truncate font-medium text-[#0B1F3A]">{vehicle.chassisCode}</span>
            <span className="shrink-0">
              {vehicle.status} · Grade {vehicle.inspection.overallGrade}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-[#0B1F3A] group-hover:text-[#C81E1E] transition-colors leading-snug">
            {vehicle.year} {vehicle.makeModel}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 truncate">{vehicle.trim}</p>

          {/* Compact Exporter 2x2 Spec Strip */}
          <dl className="mt-3.5 grid grid-cols-2 rounded-lg border border-slate-200 bg-[#F8FAFC] overflow-hidden text-xs">
            <div className="px-2.5 py-2 border-b border-r border-slate-200">
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">Mileage</dt>
              <dd className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                {vehicle.mileageKm.toLocaleString('en-US')} km
              </dd>
            </div>
            <div className="px-2.5 py-2 border-b border-slate-200">
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">Engine / Fuel</dt>
              <dd className="font-medium text-slate-900 truncate mt-0.5">
                {vehicle.engine} · {vehicle.fuel}
              </dd>
            </div>
            <div className="px-2.5 py-2 border-r border-slate-200">
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">Trans / Drive</dt>
              <dd className="font-medium text-slate-900 truncate mt-0.5">
                {vehicle.transmission} · {vehicle.drive}
              </dd>
            </div>
            <div className="px-2.5 py-2">
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">Steering / Port</dt>
              <dd className="font-medium text-slate-900 truncate mt-0.5">
                {vehicle.steering} · {vehicle.transit.destinationPortLabel}
              </dd>
            </div>
          </dl>

          {isBalanceDeal && vehicle.transit.etaDate && (
            <div className="mt-2.5 text-[11px] font-mono font-semibold text-[#C81E1E]">
              ETA {formatEtaDate(vehicle.transit.etaDate)} · {vehicle.transit.vesselName}
            </div>
          )}
        </button>
      </div>

      {/* Pricing & Primary CTA Footer */}
      <div className="px-5 pb-5 pt-3.5 border-t border-slate-100 space-y-3.5">
        {isBalanceDeal && <PortTrackingProgress transit={vehicle.transit} variant="compact" />}

        {isBalanceDeal ? (
          <div className="space-y-1 text-xs">
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
              <span className="text-xs font-semibold text-slate-800">Balance Due to Clear</span>
              <span className="font-mono text-xl font-bold text-[#C81E1E] tabular-nums">
                {formatAutoPrice(vehicle.transit.balanceDueUsd, currency)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>FOB Japan</span>
              <span className="font-mono font-medium text-slate-700 tabular-nums">
                {formatAutoPrice(vehicle.fobUsd, currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-800">Estimated Total CIF</span>
              <span className="font-mono text-xl font-bold text-[#0B1F3A] tabular-nums">
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
                ? 'border-[#0B1F3A] bg-[#0B1F3A]/5 text-[#0B1F3A]'
                : 'border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A] hover:border-slate-300'
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
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Inspect</span>
          </button>

          <button
            type="button"
            onClick={() => onBookOrClaim(vehicle)}
            className="flex-1 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            {isBalanceDeal ? 'Claim Balance' : 'Book This Car'}
          </button>
        </div>
      </div>
    </article>
  );
}
