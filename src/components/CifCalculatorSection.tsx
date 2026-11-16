import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import { FreightCalculatorWidget } from './FreightCalculatorWidget';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

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
  initialPortId?: string;
  onLockCifQuote: (quote: LockedCifQuote) => void;
  onNavigate?: (route: AppRoute) => void;
}

export function CifCalculatorSection({
  vehicles,
  currency,
  initialPortId,
  onLockCifQuote,
  onNavigate,
}: CifCalculatorSectionProps) {
  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Global & Caribbean Freight Calculator"
        title="Calculate landed RO-RO freight & total vehicle cost by CBM."
        subtitle="Select any PJS Ventures unit or custom budget, pick your destination country across 190+ ports, and estimate RO-RO freight (Rate × CBM) or request container shipping."
      />
      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FreightCalculatorWidget
            vehicles={vehicles}
            currency={currency}
            initialPortId={initialPortId}
            onLockCifQuote={onLockCifQuote}
            onNavigate={onNavigate}
          />
        </div>
      </section>
    </div>
  );
}
