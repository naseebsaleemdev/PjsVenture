import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Calendar,
  Car,
  Check,
  Globe,
  Lock,
  MapPin,
  Package,
  Phone,
  Ship,
} from 'lucide-react';
import {
  FREIGHT_COUNTRIES,
  type CountryFreightRate,
  type FreightRegion,
  detectVehicleOrigin,
  getCountryFromPortId,
  getVehicleCbm,
} from '../data/freightRates.ts';
import { CURRENCY_RATES, formatAutoPrice, formatEtaDate } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import type { LockedCifQuote } from './CifCalculatorSection';
import type { AppRoute } from './Navbar';

type FreightMethodMode = 'roro' | 'container';

interface FreightCalculatorWidgetProps {
  /** When provided, locks the calculator to this specific vehicle listing */
  fixedVehicle?: ExportVehicle;
  /** Used on the standalone /calculator page to allow choosing any vehicle or custom order */
  vehicles?: ExportVehicle[];
  currency: AutoCurrency;
  initialPortId?: string;
  onLockCifQuote: (quote: LockedCifQuote) => void;
  onNavigate?: (route: AppRoute) => void;
}

const REGION_ORDER: FreightRegion[] = [
  'Americas & Caribbean',
  'Asia',
  'Europe',
  'Africa',
  'Oceania',
];

export function FreightCalculatorWidget({
  fixedVehicle,
  vehicles = [],
  currency,
  initialPortId,
  onLockCifQuote,
  onNavigate,
}: FreightCalculatorWidgetProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    fixedVehicle?.id ?? vehicles[0]?.id ?? 'custom',
  );
  const [customFobUsd, setCustomFobUsd] = useState<number>(15000);
  const [customCbm, setCustomCbm] = useState<number>(11.3);

  const activeVehicle =
    fixedVehicle ??
    (selectedVehicleId !== 'custom'
      ? vehicles.find((v) => v.id === selectedVehicleId)
      : undefined);

  const isBalanceDeal = activeVehicle?.transit.dealType === 'balance-release';

  const defaultCountry = getCountryFromPortId(
    isBalanceDeal && activeVehicle
      ? activeVehicle.transit.destinationPortId
      : (initialPortId ?? activeVehicle?.transit.destinationPortId),
    activeVehicle?.transit.destinationPortLabel,
  );

  const [destCountry, setDestCountry] = useState<string>(defaultCountry);
  const [method, setMethod] = useState<FreightMethodMode>('roro');
  const [calculatedState, setCalculatedState] = useState<{
    country: string;
    method: FreightMethodMode;
  } | null>(() => ({
    country: defaultCountry,
    method: 'roro',
  }));
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (fixedVehicle) {
      setSelectedVehicleId(fixedVehicle.id);
      const nextCountry = getCountryFromPortId(
        fixedVehicle.transit.destinationPortId,
        fixedVehicle.transit.destinationPortLabel,
      );
      setDestCountry(nextCountry);
      setMethod('roro');
      setCalculatedState({ country: nextCountry, method: 'roro' });
    }
  }, [
    fixedVehicle?.id,
    fixedVehicle?.transit.destinationPortId,
    fixedVehicle?.transit.destinationPortLabel,
  ]);

  useEffect(() => {
    if (initialPortId && !fixedVehicle && !isBalanceDeal) {
      const nextCountry = getCountryFromPortId(initialPortId);
      setDestCountry(nextCountry);
      setCalculatedState({ country: nextCountry, method });
    }
  }, [initialPortId, fixedVehicle, isBalanceDeal]);

  // Whenever a balance-release vehicle is selected, enforce its locked destination port
  useEffect(() => {
    if (isBalanceDeal && activeVehicle) {
      const lockedCountry = getCountryFromPortId(
        activeVehicle.transit.destinationPortId,
        activeVehicle.transit.destinationPortLabel,
      );
      setDestCountry(lockedCountry);
      setMethod('roro');
      setCalculatedState({ country: lockedCountry, method: 'roro' });
    }
  }, [
    isBalanceDeal,
    activeVehicle?.id,
    activeVehicle?.transit.destinationPortId,
    activeVehicle?.transit.destinationPortLabel,
  ]);

  const effectiveDestCountry =
    isBalanceDeal && activeVehicle
      ? getCountryFromPortId(
          activeVehicle.transit.destinationPortId,
          activeVehicle.transit.destinationPortLabel,
        )
      : destCountry;

  const { originCountry, originRaw } = detectVehicleOrigin(activeVehicle?.port);
  const { cbm, bodyClass } = activeVehicle
    ? getVehicleCbm(activeVehicle)
    : { cbm: Math.max(4, Number(customCbm) || 11.3), bodyClass: 'Custom Dimension' };

  const vehiclePriceUsd = activeVehicle
    ? isBalanceDeal
      ? activeVehicle.transit.balanceDueUsd
      : activeVehicle.fobUsd
    : Math.max(1000, Number(customFobUsd) || 15000);

  const vehicleTitle = activeVehicle
    ? `${activeVehicle.year} ${activeVehicle.makeModel}`
    : 'Custom Auction Vehicle';

  const formattedEta =
    isBalanceDeal && activeVehicle ? formatEtaDate(activeVehicle.transit.etaDate) : null;

  const handleCalculate = () => {
    if (isBalanceDeal && activeVehicle) {
      const lockedCountry = getCountryFromPortId(activeVehicle.transit.destinationPortId);
      setCalculatedState({ country: lockedCountry, method: 'roro' });
      return;
    }
    if (!destCountry) {
      setCalculatedState(null);
      return;
    }
    setIsCalculating(true);
    setTimeout(() => {
      setCalculatedState({ country: destCountry, method });
      setIsCalculating(false);
    }, 140);
  };

  const activeCalcCountry = isBalanceDeal ? effectiveDestCountry : calculatedState?.country;

  const resultCountryInfo: CountryFreightRate | undefined = activeCalcCountry
    ? FREIGHT_COUNTRIES.find((c) => c.country === activeCalcCountry)
    : undefined;

  const hasRoroRate =
    (isBalanceDeal || calculatedState?.method === 'roro') &&
    resultCountryInfo !== undefined &&
    resultCountryInfo.roroRatePerCbm !== null;

  const ratePerCbmUsd =
    hasRoroRate && resultCountryInfo?.roroRatePerCbm ? resultCountryInfo.roroRatePerCbm : 0;

  const estimatedFreightUsd = hasRoroRate ? Math.round(ratePerCbmUsd * cbm) : 0;
  const totalLandedUsd = isBalanceDeal
    ? vehiclePriceUsd
    : vehiclePriceUsd + estimatedFreightUsd;

  const currencySymbol = CURRENCY_RATES[currency].symbol;
  const currencyCode = CURRENCY_RATES[currency].label;

  const handleLockQuote = (chosenMethod: 'RoRo Vessel' | '20ft Container') => {
    const portLabel =
      isBalanceDeal && activeVehicle
        ? activeVehicle.transit.destinationPortLabel
        : resultCountryInfo?.mainPort && resultCountryInfo.country
          ? `${resultCountryInfo.mainPort}, ${resultCountryInfo.country}`
          : effectiveDestCountry || 'Caribbean Destination';

    onLockCifQuote({
      vehicleId: activeVehicle?.id ?? null,
      vehicleLabel: vehicleTitle,
      chassisCode: activeVehicle?.chassisCode ?? 'Custom Sourcing',
      portId: activeVehicle?.transit.destinationPortId ?? 'nassau',
      portName: portLabel,
      shippingMethod: isBalanceDeal ? 'RoRo Vessel' : chosenMethod,
      totalPayableUsd:
        isBalanceDeal || (chosenMethod === 'RoRo Vessel' && hasRoroRate)
          ? totalLandedUsd
          : vehiclePriceUsd,
      totalPayableFormatted: formatAutoPrice(
        isBalanceDeal || (chosenMethod === 'RoRo Vessel' && hasRoroRate)
          ? totalLandedUsd
          : vehiclePriceUsd,
        currency,
      ),
      isBalanceDeal: Boolean(isBalanceDeal),
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* CALCULATOR TOP HEADER */}
      <div className="bg-zinc-950 text-white px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-900/90 border border-blue-800 flex items-center justify-center shrink-0">
            <Ship className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-white">
              FREIGHT CALCULATOR
            </div>
            <div className="text-[11px] font-mono tracking-wider text-slate-400">
              PJS VENTURES · EXPORT LOGISTICS
            </div>
          </div>
        </div>

        {/* 3 Header Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[11px] text-slate-400">Stock From</div>
            <div className="font-display text-base font-semibold text-white mt-0.5">
              {originCountry}
            </div>
            <div className="text-[11px] text-blue-300 inline-flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" aria-hidden="true" />
              <span>Auto-detected</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[11px] text-slate-400">
              {isBalanceDeal ? 'Port Balance Price' : 'Vehicle Price'}
            </div>
            <div className="font-mono text-base font-semibold text-emerald-400 tabular-nums mt-0.5">
              {formatAutoPrice(vehiclePriceUsd, currency)}{' '}
              <span className="text-[11px] font-normal text-slate-400">{currencyCode}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isBalanceDeal ? 'Remaining balance' : 'Listing FOB price'}
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[11px] text-slate-400">Volume (CBM)</div>
            <div className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
              {cbm.toFixed(1)}{' '}
              <span className="text-[11px] font-normal text-slate-400">m³</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5">
              {bodyClass}
            </div>
          </div>
        </div>
      </div>

      {/* SHIPPING ORIGIN BANNER */}
      <div className="bg-slate-100 border-b border-slate-200 px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-500">Shipping Origin</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold text-zinc-950">
            <Globe className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
            <span>{originCountry.toUpperCase()}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{originRaw}</span>
          </span>
        </div>

        {activeVehicle && (
          <div className="font-mono text-slate-500">
            Chassis: <span className="text-zinc-950 font-medium">{activeVehicle.chassisCode}</span>
          </div>
        )}
      </div>

      {/* BODY: 2-COLUMN WORKSPACE */}
      <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start bg-slate-50/50">
        {/* LEFT PANEL: DESTINATION & METHOD */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            {isBalanceDeal ? (
              <Anchor className="w-4 h-4 text-blue-900" aria-hidden="true" />
            ) : (
              <Globe className="w-4 h-4 text-blue-900" aria-hidden="true" />
            )}
            <h3 className="font-display text-base font-semibold text-zinc-950">
              {isBalanceDeal ? 'Dispatched Destination & Arrival' : 'Destination & Shipping Method'}
            </h3>
          </div>

          {!fixedVehicle && vehicles.length > 0 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pw-vehicle-select"
                  className="block text-xs font-medium text-zinc-950 mb-1.5"
                >
                  Select Listed Vehicle or Custom Estimate
                </label>
                <select
                  id="pw-vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedVehicleId(nextId);
                    const match = vehicles.find((v) => v.id === nextId);
                    if (match) {
                      const nextCountry = getCountryFromPortId(match.transit.destinationPortId);
                      setDestCountry(nextCountry);
                      setMethod('roro');
                      setCalculatedState({ country: nextCountry, method: 'roro' });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.makeModel} (
                      {v.transit.dealType === 'balance-release'
                        ? `Port Balance · ${v.transit.destinationPortLabel}`
                        : `${getVehicleCbm(v).cbm.toFixed(1)} m³ · ${formatAutoPrice(v.fobUsd, currency)}`}
                      )
                    </option>
                  ))}
                  <option value="custom">Custom Vehicle (Enter FOB Price & CBM)</option>
                </select>
              </div>

              {selectedVehicleId === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <label
                      htmlFor="pw-custom-fob"
                      className="block text-xs font-medium text-zinc-950 mb-1"
                    >
                      Vehicle FOB (USD)
                    </label>
                    <input
                      id="pw-custom-fob"
                      type="number"
                      min={1500}
                      step={500}
                      value={customFobUsd}
                      onChange={(e) => setCustomFobUsd(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pw-custom-cbm"
                      className="block text-xs font-medium text-zinc-950 mb-1"
                    >
                      Volume CBM (m³)
                    </label>
                    <input
                      id="pw-custom-cbm"
                      type="number"
                      min={5}
                      max={35}
                      step={0.1}
                      value={customCbm}
                      onChange={(e) => setCustomCbm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {isBalanceDeal && activeVehicle ? (
            /* LOCKED DISPATCHED DESTINATION FOR PORT BALANCE CARS */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-blue-900">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Dispatched Destination Port (Locked)</span>
                  </span>
                  <span>In Transit / Port Balance</span>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600">Already Departed Japan For</div>
                  <div className="font-display text-lg font-semibold text-zinc-950 mt-0.5">
                    {activeVehicle.transit.destinationPortLabel}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-200/80 text-xs">
                  <div>
                    <div className="text-slate-500">Vessel Name</div>
                    <div className="font-medium text-zinc-950 mt-0.5">
                      {activeVehicle.transit.vesselName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Estimated Arrival Date</div>
                    <div className="font-mono font-semibold text-blue-900 mt-0.5 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{formattedEta ?? activeVehicle.transit.arrivalStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="block text-xs font-medium text-zinc-950 mb-1.5">
                  Destination Country
                </div>
                <select
                  aria-label="Locked destination country for Port Balance vehicle"
                  disabled
                  value={effectiveDestCountry}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-slate-100 text-zinc-950 cursor-not-allowed"
                >
                  {FREIGHT_COUNTRIES.map((item) => (
                    <option key={item.country} value={item.country}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Because this is a Port Balance-Release vehicle, ocean freight is already booked
                  and shipped exclusively to{' '}
                  <strong className="text-zinc-950">
                    {activeVehicle.transit.destinationPortLabel}
                  </strong>
                  .
                </p>
              </div>
            </div>
          ) : (
            /* STANDARD OPEN DESTINATION + METHOD SELECTOR FOR DIRECT IMPORTS */
            <>
              <div>
                <label htmlFor="pw-dest" className="block text-xs font-medium text-zinc-950 mb-1.5">
                  Destination Country <span className="text-red-700">*</span>
                </label>
                <select
                  id="pw-dest"
                  value={destCountry}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDestCountry(next);
                    if (next) {
                      setCalculatedState({ country: next, method });
                    } else {
                      setCalculatedState(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  <option value="">— Select Country —</option>
                  {REGION_ORDER.map((region) => (
                    <optgroup key={region} label={region}>
                      {FREIGHT_COUNTRIES.filter((c) => c.region === region).map((item) => (
                        <option key={item.country} value={item.country}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <div className="block text-xs font-medium text-zinc-950 mb-2">Shipping Method</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('roro');
                      if (destCountry) setCalculatedState({ country: destCountry, method: 'roro' });
                    }}
                    aria-pressed={method === 'roro'}
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      method === 'roro'
                        ? 'border-blue-900 bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                      <Car className="w-4 h-4 text-blue-900 shrink-0" aria-hidden="true" />
                      <span>RO-RO</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Rate calculated (Rate × CBM)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('container');
                      if (destCountry) {
                        setCalculatedState({ country: destCountry, method: 'container' });
                      }
                    }}
                    aria-pressed={method === 'container'}
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      method === 'container'
                        ? 'border-blue-900 bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                      <Package className="w-4 h-4 text-blue-900 shrink-0" aria-hidden="true" />
                      <span>CONTAINER</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Custom quote / Contact us</div>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
              >
                <span>{isCalculating ? 'CALCULATING...' : 'CALCULATE FREIGHT'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {/* RIGHT PANEL: COST ESTIMATE */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display text-base font-semibold text-zinc-950">
              {isBalanceDeal ? 'Port Balance & Arrival Summary' : 'Cost Estimate'}
            </h3>
            {isBalanceDeal && activeVehicle ? (
              <span className="text-xs font-medium text-blue-900 truncate max-w-[240px]">
                {activeVehicle.transit.destinationPortLabel}
              </span>
            ) : (
              resultCountryInfo?.mainPort && (
                <span className="text-xs text-slate-500 truncate max-w-[220px]">
                  {resultCountryInfo.mainPort}
                </span>
              )
            )}
          </div>

          {isBalanceDeal && activeVehicle ? (
            /* DEDICATED PORT BALANCE-RELEASE SUMMARY */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium">
                <div className="flex items-center gap-2 text-zinc-950">
                  <span>{originCountry.toUpperCase()}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ──▶
                  </span>
                  <span>{activeVehicle.transit.destinationPortLabel.toUpperCase()}</span>
                </div>
                <span className="font-mono font-semibold text-blue-900">PORT BALANCE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Dispatched To Port</div>
                  <div className="text-sm font-semibold text-zinc-950 mt-0.5">
                    {activeVehicle.transit.destinationPortLabel}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Expected Arrival Date</div>
                  <div className="font-mono text-sm font-semibold text-blue-900 mt-0.5">
                    {formattedEta ?? activeVehicle.transit.arrivalStatus}
                  </div>
                  {formattedEta && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {activeVehicle.transit.arrivalStatus}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-600">Original Shipped CIF</div>
                <div className="font-mono text-sm text-slate-400 line-through tabular-nums">
                  {formatAutoPrice(activeVehicle.transit.fullCifUsd, currency)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span>Prior Buyer Deposit Paid</span>
                  <span className="font-mono tabular-nums">
                    -{formatAutoPrice(activeVehicle.transit.priorDepositUsd, currency)}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Ocean freight ({cbm.toFixed(1)} m³) is already settled under vessel{' '}
                  <span className="font-medium">{activeVehicle.transit.vesselName}</span>.
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 text-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Remaining Balance Due</div>
                  <div className="text-xs text-slate-400">
                    Clear straight from {activeVehicle.transit.destinationPortLabel}
                  </div>
                </div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums whitespace-nowrap">
                  <span className="text-xs font-normal text-slate-400 mr-1">{currencyCode}</span>
                  {formatAutoPrice(activeVehicle.transit.balanceDueUsd, currency)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleLockQuote('RoRo Vessel')}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                >
                  Claim Balance at This Port
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/port-deals')}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    All Port Balance Deals
                  </button>
                )}
              </div>
            </div>
          ) : !calculatedState || !resultCountryInfo ? (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-lg bg-slate-100 flex items-center justify-center">
                <Globe className="w-6 h-6 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Select a destination country and shipping method, then click{' '}
                <strong className="text-zinc-950">Calculate Freight</strong>. The{' '}
                <strong className="text-zinc-950">Stock From</strong> origin is auto-detected from
                this vehicle&apos;s location.
              </p>
            </div>
          ) : calculatedState.method === 'container' ? (
            /* CONTAINER RESULT */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium">
                <div className="flex items-center gap-2 text-zinc-950">
                  <span>{originCountry.toUpperCase()}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ──▶
                  </span>
                  <span>{resultCountryInfo.country.toUpperCase()}</span>
                </div>
                <span className="font-mono font-semibold text-blue-900">CONTAINER</span>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-11 h-11 mx-auto rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <Phone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="font-display text-lg font-bold text-zinc-950">CONTACT US</div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Container shipments (20ft dedicated or 40ft shared consolidation) require a custom
                  carrier quote. Submit a quick request for confirmed container pricing.
                </p>
                <div className="text-xs font-mono text-zinc-950 bg-white border border-slate-200 rounded-lg px-3 py-2 inline-block">
                  {vehicleTitle} · {cbm.toFixed(1)} m³ · {resultCountryInfo.country}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLockQuote('20ft Container')}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                >
                  Request Container Quote
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/inventory')}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Inventory
                  </button>
                )}
              </div>
            </div>
          ) : !hasRoroRate ? (
            /* NO FIXED RATE RESULT */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium">
                <div className="flex items-center gap-2 text-zinc-950">
                  <span>{originCountry.toUpperCase()}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ──▶
                  </span>
                  <span>{resultCountryInfo.country.toUpperCase()}</span>
                </div>
                <span className="font-mono text-slate-500">CUSTOM ROUTE</span>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-11 h-11 mx-auto rounded-lg bg-zinc-950 text-white flex items-center justify-center">
                  <Phone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="font-display text-lg font-bold text-zinc-950">CONTACT US</div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  No fixed online Ro-Ro tariff for {resultCountryInfo.country}. Request a custom
                  inland or transshipment quote directly from our dispatch team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLockQuote('RoRo Vessel')}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                >
                  Request Custom Quote
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/inventory')}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Inventory
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* RO-RO CALCULATED RESULT */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium">
                <div className="flex items-center gap-2 text-zinc-950">
                  <span>{originCountry.toUpperCase()}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ──▶
                  </span>
                  <span>{resultCountryInfo.country.toUpperCase()}</span>
                </div>
                <span className="font-mono font-semibold text-blue-900">RO-RO</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Rate per m³</div>
                  <div className="font-mono text-lg font-semibold text-zinc-950 tabular-nums mt-0.5">
                    {formatAutoPrice(ratePerCbmUsd, currency)}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Vehicle CBM</div>
                  <div className="font-mono text-lg font-semibold text-zinc-950 tabular-nums mt-0.5">
                    {cbm.toFixed(1)} m³
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Vehicle Price</div>
                  <div className="text-sm font-medium text-zinc-950 truncate">{vehicleTitle}</div>
                </div>
                <div className="font-mono text-base font-semibold text-zinc-950 tabular-nums whitespace-nowrap shrink-0">
                  <span className="text-xs text-slate-500 mr-1">{currencyCode}</span>
                  {formatAutoPrice(vehiclePriceUsd, currency).replace(currencySymbol, '')}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-xs font-medium text-blue-900">
                  Estimated Freight Cost (RO-RO)
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-blue-900 tabular-nums">
                  <span className="text-xs font-semibold mr-1.5">{currencyCode}</span>
                  {formatAutoPrice(estimatedFreightUsd, currency)}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Rate ({formatAutoPrice(ratePerCbmUsd, currency)}/m³) × {cbm.toFixed(1)} m³ ·
                  Contact us for final booking confirmation
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 text-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Total Landed Cost</div>
                  <div className="text-xs text-slate-400">Vehicle Price + Freight</div>
                </div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums whitespace-nowrap">
                  <span className="text-xs font-normal text-slate-400 mr-1">{currencyCode}</span>
                  {formatAutoPrice(totalLandedUsd, currency)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Est. Transit Time</div>
                  <div className="text-sm font-semibold text-emerald-800 mt-0.5 tabular-nums">
                    {resultCountryInfo.transitDays || '25–35 days'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Stock Origin</div>
                  <div className="text-sm font-semibold text-zinc-950 mt-0.5">{originCountry}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed pt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Rates are per m³ from PJS Ventures&apos; official rate sheet. Local import duty,
                  VAT, port clearing, and inland transport are not included.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleLockQuote('RoRo Vessel')}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                >
                  Lock Quote & Book Car
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/inventory')}
                    className="px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Inventory
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CALCULATOR FOOTER BAR */}
      <div className="bg-white border-t border-slate-200 px-5 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-display font-bold tracking-tight text-zinc-950">
          PJS <span className="text-blue-900">VENTURES</span>
        </div>
        <div className="text-slate-500">
          Origin auto-detected · 190+ countries · RO-RO: Rate × CBM · Port Balance units lock to
          dispatched port
        </div>
      </div>
    </div>
  );
}
