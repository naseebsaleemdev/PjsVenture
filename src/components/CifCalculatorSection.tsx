import { useState } from 'react';
import { Check, Ship } from 'lucide-react';
import { DESTINATION_PORTS, formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';

export type ShippingMethod = 'RoRo Vessel' | '20ft Container' | '40ft Shared Container';

export interface LockedCifQuote {
  vehicleId: string | null;
  vehicleLabel: string;
  chassisCode: string;
  portId: string;
  portName: string;
  shippingMethod: ShippingMethod;
  totalPayableUsd: number;
  totalPayableFormatted: string;
  isBalanceDeal: boolean;
}

interface CifCalculatorSectionProps {
  vehicles: ExportVehicle[];
  currency: AutoCurrency;
  onLockCifQuote: (quote: LockedCifQuote) => void;
}

export function CifCalculatorSection({
  vehicles,
  currency,
  onLockCifQuote,
}: CifCalculatorSectionProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id ?? 'custom');
  const [customFobUsd, setCustomFobUsd] = useState<number>(15000);
  const [selectedPortId, setSelectedPortId] = useState<string>(DESTINATION_PORTS[0].id);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('RoRo Vessel');
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [includeJevic, setIncludeJevic] = useState<boolean>(true);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isBalanceDeal = selectedVehicle?.transit.dealType === 'balance-release';

  const activePort =
    DESTINATION_PORTS.find((p) => p.id === selectedPortId) ?? DESTINATION_PORTS[0];

  const baseFobUsd = selectedVehicle ? selectedVehicle.fobUsd : Math.max(2000, customFobUsd || 0);
  const freightUsd =
    shippingMethod === 'RoRo Vessel'
      ? activePort.roroUsd
      : shippingMethod === '20ft Container'
        ? activePort.container20Usd
        : activePort.container40SharedUsd;

  const insuranceUsd = includeInsurance ? Math.round(baseFobUsd * 0.015) : 0;
  const inspectionUsd = includeJevic ? 240 : 0;
  const directCifTotalUsd = baseFobUsd + freightUsd + insuranceUsd + inspectionUsd;

  const finalUsd = isBalanceDeal && selectedVehicle
    ? selectedVehicle.transit.balanceDueUsd
    : directCifTotalUsd;

  const handleBookFromCalc = () => {
    onLockCifQuote({
      vehicleId: selectedVehicle ? selectedVehicle.id : null,
      vehicleLabel: selectedVehicle
        ? `${selectedVehicle.year} ${selectedVehicle.makeModel}`
        : `Custom Auction Order (FOB ${formatAutoPrice(baseFobUsd, currency)})`,
      chassisCode: selectedVehicle ? selectedVehicle.chassisCode : 'Custom Sourcing',
      portId: isBalanceDeal && selectedVehicle
        ? selectedVehicle.transit.destinationPortId
        : activePort.id,
      portName: isBalanceDeal && selectedVehicle
        ? selectedVehicle.transit.destinationPortLabel
        : `${activePort.name}, ${activePort.country}`,
      shippingMethod,
      totalPayableUsd: finalUsd,
      totalPayableFormatted: formatAutoPrice(finalUsd, currency),
      isBalanceDeal: Boolean(isBalanceDeal),
    });
  };

  return (
    <section id="cif-calculator" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium text-blue-900 mb-2">Caribbean Freight & CIF Estimator</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
            Calculate landed CIF to Nassau, Kingston, Cayman, or your island port.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Choose any listed car (or a custom Japan auction budget) and your Caribbean discharge
            port to estimate RoRo or container shipping before placing a booking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="cif-vehicle"
                  className="block text-sm font-medium text-zinc-950 mb-1.5"
                >
                  Select Vehicle or Custom Budget
                </label>
                <select
                  id="cif-vehicle"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedVehicleId(id);
                    const match = vehicles.find((v) => v.id === id);
                    if (match) {
                      setSelectedPortId(match.transit.destinationPortId);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.makeModel} (
                      {v.transit.dealType === 'balance-release'
                        ? `Balance ${formatAutoPrice(v.transit.balanceDueUsd, currency)}`
                        : `FOB ${formatAutoPrice(v.fobUsd, currency)}`}
                      )
                    </option>
                  ))}
                  <option value="custom">Custom Auction Budget (Enter FOB USD)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="cif-port"
                  className="block text-sm font-medium text-zinc-950 mb-1.5"
                >
                  Caribbean Destination Port
                </label>
                <select
                  id="cif-port"
                  disabled={Boolean(isBalanceDeal)}
                  value={
                    isBalanceDeal && selectedVehicle
                      ? selectedVehicle.transit.destinationPortId
                      : selectedPortId
                  }
                  onChange={(e) => setSelectedPortId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                >
                  {DESTINATION_PORTS.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name} ({port.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedVehicleId === 'custom' && (
              <div>
                <label
                  htmlFor="cif-custom-fob"
                  className="block text-sm font-medium text-zinc-950 mb-1.5"
                >
                  Target Auction FOB Price (USD)
                </label>
                <input
                  id="cif-custom-fob"
                  type="number"
                  min={2500}
                  step={500}
                  value={customFobUsd}
                  onChange={(e) => setCustomFobUsd(Number(e.target.value))}
                  className="w-full sm:w-64 px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white text-zinc-950"
                />
              </div>
            )}

            {!isBalanceDeal && (
              <>
                <div>
                  <div className="text-sm font-medium text-zinc-950 mb-2">Shipping Method</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        { id: 'RoRo Vessel', price: activePort.roroUsd },
                        { id: '20ft Container', price: activePort.container20Usd },
                        { id: '40ft Shared Container', price: activePort.container40SharedUsd },
                      ] as { id: ShippingMethod; price: number }[]
                    ).map((opt) => {
                      const active = shippingMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setShippingMethod(opt.id)}
                          aria-pressed={active}
                          className={`text-left p-3.5 rounded-lg border transition-colors duration-150 cursor-pointer ${
                            active
                              ? 'border-blue-900 bg-blue-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-medium text-zinc-950">{opt.id}</div>
                          <div className="mt-1 font-mono text-sm font-semibold text-blue-900 tabular-nums">
                            {formatAutoPrice(opt.price, currency)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIncludeInsurance((prev) => !prev)}
                    aria-pressed={includeInsurance}
                    className={`text-left p-4 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer ${
                      includeInsurance
                        ? 'border-blue-900 bg-blue-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                        includeInsurance
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {includeInsurance && <Check className="w-3 h-3" />}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-zinc-950">
                        Marine Transit Insurance
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        All-risk ocean cover (1.5% of FOB)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeJevic((prev) => !prev)}
                    aria-pressed={includeJevic}
                    className={`text-left p-4 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer ${
                      includeJevic
                        ? 'border-blue-900 bg-blue-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                        includeJevic
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {includeJevic && <Check className="w-3 h-3" />}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-zinc-950">
                        JEVIC & Radiation Inspection
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Pre-export odometer & safety check
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-sm font-semibold text-zinc-950">
                  {isBalanceDeal ? 'Port Balance-Release Summary' : 'Estimated Landed CIF'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <Ship className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
                  {activePort.transitDays}
                </span>
              </div>

              {isBalanceDeal && selectedVehicle ? (
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Original Shipped CIF</dt>
                    <dd className="font-mono text-slate-400 line-through tabular-nums">
                      {formatAutoPrice(selectedVehicle.transit.fullCifUsd, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-emerald-800">Prior Buyer Deposit Paid</dt>
                    <dd className="font-mono font-medium text-emerald-800 tabular-nums">
                      -{formatAutoPrice(selectedVehicle.transit.priorDepositUsd, currency)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Vehicle FOB Japan</dt>
                    <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                      {formatAutoPrice(baseFobUsd, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Freight ({shippingMethod})</dt>
                    <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                      {formatAutoPrice(freightUsd, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Marine Insurance</dt>
                    <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                      {includeInsurance ? formatAutoPrice(insuranceUsd, currency) : 'Excluded'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">JEVIC Inspection</dt>
                    <dd className="font-mono font-medium text-zinc-950 tabular-nums">
                      {includeJevic ? formatAutoPrice(inspectionUsd, currency) : 'Excluded'}
                    </dd>
                  </div>
                </dl>
              )}

              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {isBalanceDeal
                    ? `Balance Due at ${selectedVehicle?.transit.destinationPortLabel}`
                    : `Estimated CIF to ${activePort.name}`}
                </div>
                <div className="font-mono text-3xl font-semibold text-blue-900 tabular-nums mt-1">
                  {formatAutoPrice(finalUsd, currency)}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                {activePort.complianceNote}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBookFromCalc}
              className="mt-6 w-full px-5 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              {isBalanceDeal ? 'Claim Unit at This Port' : 'Book Vehicle With This CIF'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
