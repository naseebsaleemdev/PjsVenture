import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import { AuctionProcessSection } from './AuctionProcessSection';
import { ExportShowcaseSection } from './ExportShowcaseSection';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

interface HowToBuyPageProps {
  onNavigate: (route: AppRoute) => void;
}

const AUCTION_GRADES = [
  {
    grade: 'Grade 5.0 / S',
    title: 'Showroom / Near-New Condition',
    detail:
      'Ultra-low mileage, original factory paint with virtually zero blemishes, verified dealer history.',
  },
  {
    grade: 'Grade 4.5',
    title: 'Premium Clean Export Standard',
    detail:
      'Original body panels with at most minor pin-sized A1/U1 marks. Our primary yard buying tier.',
  },
  {
    grade: 'Grade 4.0',
    title: 'Verified Commercial & Daily Driver',
    detail:
      'Mechanically solid with minor bumper scuffs or light wear consistent with age; zero frame damage.',
  },
  {
    grade: 'Grade A / B',
    title: 'Interior & Exterior Sub-Scores',
    detail:
      'Grade A indicates spotless non-smoking cabins and crisp paint; Grade B shows normal light use.',
  },
];

const PRE_EXPORT_CHECKS = [
  {
    name: 'JEVIC / QISJ / EAA Inspections',
    note: 'Mandatory pre-export roadworthiness, odometer verification, and emission checks arranged at Yokohama, Nagoya, and Kobe prior to loading.',
  },
  {
    name: 'Radiation Clearance Certificate',
    note: 'Every Japanese vehicle receives calibrated radiation screening (typically 0.04–0.06 µSv/h) attached to your shipping file.',
  },
  {
    name: 'Biosecurity & BMSB Seasonal Wash',
    note: 'High-pressure steam underbody cleaning and heat-treatment certificates for New Zealand, Australia, and Pacific customs compliance.',
  },
  {
    name: 'DHL Express Original Documents',
    note: 'Original Export Certificate, Bill of Lading (B/L), and Commercial Invoice dispatched via tracked courier well ahead of vessel arrival.',
  },
];

export function HowToBuyPage({ onNavigate }: HowToBuyPageProps) {
  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Buying & Export Guide"
        title="How Global Vehicle Purchasing, Inspection & Shipping Works"
        subtitle="From Japanese auction verification and multi-point yard checks to RoRo vessel dispatch, container unloading, and DHL B/L document delivery—everything is transparent."
      />

      <AuctionProcessSection />

      {/* Auction Sheet & Grade Legend */}
      <section className="py-16 bg-[#F3F5F8] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <p className="text-xs font-medium text-[#0B1F3A] mb-2">Auction Sheet Transparency</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
              Understanding Japanese Auction Grades
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Every direct import unit includes the original Japanese auction inspection sheet and
              verified odometer reading before deposit settlement.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {AUCTION_GRADES.map((item) => (
                <div
                  key={item.grade}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="font-mono text-base font-semibold text-[#0B1F3A]">
                      {item.grade}
                    </div>
                    <h3 className="font-display text-base font-semibold text-zinc-950 mt-1">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-export certification grid */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#0B1F3A] mb-2">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Export Compliance &amp; Documentation</span>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 mb-6">
              Pre-Export Checks Included Before Vessel Sailing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PRE_EXPORT_CHECKS.map((check) => (
                <div
                  key={check.name}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5"
                >
                  <FileCheck2
                    className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-base font-semibold text-zinc-950">
                      {check.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {check.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Inspection, Container Loading & Port Delivery Gallery */}
      <ExportShowcaseSection onNavigate={onNavigate} />

      {/* Bottom Quick Action Band */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 mb-1">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Ready to Reserve or Request a Custom Auction Unit</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-zinc-950">
              Calculate Freight or Book Your Next Vehicle Online
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/calculator')}
              className="px-5 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Open Freight Calculator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
            >
              <span>Browse Inventory</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
