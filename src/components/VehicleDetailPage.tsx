import { useEffect, useState } from 'react';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ship,
} from 'lucide-react';
import { formatAutoPrice, formatEtaDate, getVehicleImages } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import type { LockedCifQuote } from './CifCalculatorSection';
import { FreightCalculatorWidget } from './FreightCalculatorWidget';
import type { AppRoute } from './Navbar';
import { PortTrackingProgress } from './PortTrackingProgress';
import { ResilientImage } from './ResilientImage';
import { VehicleCard } from './VehicleCard';

interface VehicleDetailPageProps {
  vehicle: ExportVehicle | undefined;
  allVehicles: ExportVehicle[];
  currency: AutoCurrency;
  onCurrencyChange: (currency: AutoCurrency) => void;
  shortlistIds: string[];
  onToggleShortlist: (vehicleId: string) => void;
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onLockCifQuote: (quote: LockedCifQuote) => void;
  onNavigate: (route: AppRoute) => void;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
}

const CURRENCIES: AutoCurrency[] = ['USD', 'BSD', 'XCD', 'GBP'];

export function VehicleDetailPage({
  vehicle,
  allVehicles,
  currency,
  onCurrencyChange,
  shortlistIds,
  onToggleShortlist,
  onBookOrClaimVehicle,
  onLockCifQuote,
  onNavigate,
  onInspectVehicle,
}: VehicleDetailPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [vehicle?.id]);

  const gallery = vehicle ? getVehicleImages(vehicle) : [];

  useEffect(() => {
    if (gallery.length <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % gallery.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gallery.length]);

  if (!vehicle) {
    return (
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-white border border-slate-200 rounded-xl p-10">
          <h1 className="font-display text-2xl font-semibold text-zinc-950">
            Vehicle listing not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This unit may have been cleared or removed from active stock.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/inventory')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to All Inventory</span>
          </button>
        </div>
      </section>
    );
  }

  const safeIndex = activeIndex < gallery.length ? activeIndex : 0;
  const isBalanceDeal = vehicle.transit.dealType === 'balance-release';
  const isShortlisted = shortlistIds.includes(vehicle.id);

  const relatedVehicles = allVehicles.filter((v) => v.id !== vehicle.id).slice(0, 3);

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <div className="bg-[#F3F5F8]">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-zinc-950 cursor-pointer"
            >
              Home
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="hover:text-zinc-950 cursor-pointer"
            >
              Inventory
            </button>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-zinc-950">
              {vehicle.year} {vehicle.makeModel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-zinc-950 cursor-pointer"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-zinc-950 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All Cars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Single Listing Content */}
      <section className="py-10 sm:py-12 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left 7 Columns: Carousel + Specifications + Auction Inspection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Multi-Image Carousel */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                <ResilientImage
                  src={gallery[safeIndex]}
                  alt={`${vehicle.imageAlt} (Photo ${safeIndex + 1} of ${gallery.length})`}
                  fallbackTitle={vehicle.makeModel}
                  priority
                  className="w-full h-full object-cover"
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
                      }
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg bg-zinc-950/75 text-white hover:bg-zinc-950 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => (prev + 1) % gallery.length)}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg bg-zinc-950/75 text-white hover:bg-zinc-950 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-zinc-950/75 text-white font-mono text-xs tabular-nums">
                      {safeIndex + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {gallery.map((imgSrc, idx) => (
                    <button
                      key={`${imgSrc}-${idx}`}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`View photo ${idx + 1}`}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        idx === safeIndex
                          ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/25'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={imgSrc}
                        alt={`${vehicle.makeModel} angle ${idx + 1}`}
                        fallbackTitle={vehicle.makeModel}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold text-zinc-950 mb-4">
                Vehicle Specifications
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Year</dt>
                  <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                    {vehicle.year}
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Mileage</dt>
                  <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                    {vehicle.mileageKm.toLocaleString('en-US')} km
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Chassis Code</dt>
                  <dd className="font-mono font-medium text-zinc-950">{vehicle.chassisCode}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Engine</dt>
                  <dd className="font-medium text-zinc-950">{vehicle.engine}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Transmission</dt>
                  <dd className="font-medium text-zinc-950">{vehicle.transmission}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Fuel / Drive</dt>
                  <dd className="font-medium text-zinc-950">
                    {vehicle.fuel} · {vehicle.drive}
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Steering</dt>
                  <dd className="font-medium text-zinc-950">{vehicle.steering}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <dt className="text-slate-500">Exterior Color</dt>
                  <dd className="font-medium text-zinc-950">{vehicle.color}</dd>
                </div>
              </dl>
            </div>

            {/* Auction Inspection Report */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-zinc-950">
                  Japanese Auction Inspection
                </h2>
                <span className="font-mono text-xs text-slate-500">
                  {vehicle.inspection.auctionHouse} · Lot #{vehicle.inspection.lotNumber}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Overall Grade</div>
                  <div className="font-mono text-xl font-semibold text-zinc-950 mt-0.5">
                    {vehicle.inspection.overallGrade}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Exterior</div>
                  <div className="font-mono text-xl font-semibold text-zinc-950 mt-0.5">
                    {vehicle.inspection.exteriorGrade}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Interior</div>
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

          {/* Right 5 Columns: Sticky Summary, Price & Booking CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isBalanceDeal ? 'text-[#C81E1E]' : 'text-[#0B1F3A]'
                      }`}
                    >
                      {isBalanceDeal ? 'Port Balance-Release Deal' : 'Direct Japan Import'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{vehicle.status}</span>
                  </div>

                  {/* Currency Switcher */}
                  <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
                    {CURRENCIES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => onCurrencyChange(code)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer ${
                          currency === code
                            ? 'bg-[#0B1F3A] text-white'
                            : 'text-slate-600 hover:text-[#0B1F3A]'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                  {vehicle.year} {vehicle.makeModel}
                </h1>
                <p className="text-sm text-slate-600 mt-1">{vehicle.trim}</p>
                <p className="text-xs font-mono text-slate-500 mt-1.5">
                  Chassis: {vehicle.chassisCode}
                </p>
              </div>

              {/* Financial Breakdown Box */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 space-y-3">
                {isBalanceDeal ? (
                  <>
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-slate-600">Original Shipped CIF</span>
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
                      <span className="font-mono text-2xl font-bold text-[#C81E1E] tabular-nums">
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
                        Estimated CIF Price
                      </span>
                      <span className="font-mono text-2xl font-bold text-[#0B1F3A] tabular-nums">
                        {formatAutoPrice(vehicle.transit.fullCifUsd, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Live Visual Port Balance Tracker */}
              {isBalanceDeal && (
                <PortTrackingProgress transit={vehicle.transit} variant="full" />
              )}

              {/* Dispatch Details */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold text-zinc-950">
                  <Anchor className="w-4 h-4 text-blue-900" aria-hidden="true" />
                  <span>Shipping &amp; Port Dispatch</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    {isBalanceDeal ? 'Dispatched To Port' : 'Destination'}
                  </span>
                  <span className="font-medium text-zinc-950 text-right">
                    {vehicle.transit.destinationPortLabel}
                  </span>
                </div>
                {isBalanceDeal && vehicle.transit.etaDate && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Expected Arrival Date</span>
                    <span className="font-mono font-semibold text-blue-900 text-right">
                      {formatEtaDate(vehicle.transit.etaDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Vessel / Sailing</span>
                  <span className="font-medium text-zinc-950 text-right">
                    {vehicle.transit.vesselName}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-blue-900 text-right">
                    {vehicle.transit.arrivalStatus}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Bill of Lading</span>
                  <span className="font-medium text-zinc-950 text-right">
                    {vehicle.transit.blStatus}
                  </span>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onBookOrClaimVehicle(vehicle)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
                >
                  <span>
                    {isBalanceDeal ? 'Claim & Pay Remaining Balance' : 'Book This Car for Import'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="#listing-freight-calculator"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#0B1F3A] transition-colors"
                  >
                    <Ship className="w-3.5 h-3.5 text-[#0B1F3A]" aria-hidden="true" />
                    <span>Freight Calculator ↓</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onToggleShortlist(vehicle.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isShortlisted
                        ? 'border-[#0B1F3A] bg-[#0B1F3A]/5 text-[#0B1F3A]'
                        : 'border-slate-200 bg-white text-zinc-950 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${isShortlisted ? 'fill-current text-[#C81E1E]' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isShortlisted ? 'Shortlisted' : 'Save Unit'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Freight Calculator Below the Vehicle */}
      <section
        id="listing-freight-calculator"
        className="py-12 sm:py-16 bg-[#F3F5F8] border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C81E1E] mb-1.5">
              Vehicle Freight &amp; CBM Estimator
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1F3A]">
              Calculate shipping &amp; landed cost for this {vehicle.year} {vehicle.makeModel}
            </h2>
          </div>

          <FreightCalculatorWidget
            fixedVehicle={vehicle}
            currency={currency}
            onLockCifQuote={onLockCifQuote}
            onNavigate={onNavigate}
          />
        </div>
      </section>

      {/* More Vehicles Strip */}
      {relatedVehicles.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-[#0B1F3A]">
                More Vehicles from PJS Ventures
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('/inventory')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C81E1E] hover:underline cursor-pointer"
              >
                <span>View All Inventory</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedVehicles.map((rel) => (
                <VehicleCard
                  key={rel.id}
                  vehicle={rel}
                  currency={currency}
                  isShortlisted={shortlistIds.includes(rel.id)}
                  onToggleShortlist={onToggleShortlist}
                  onInspect={onInspectVehicle}
                  onBookOrClaim={onBookOrClaimVehicle}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
