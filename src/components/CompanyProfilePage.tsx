import { ArrowRight, Building2, CheckCircle2, Globe, Landmark, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';
import { ResilientImage } from './ResilientImage';

interface CompanyProfilePageProps {
  onNavigate: (route: AppRoute) => void;
}

const EXPORT_YARDS = [
  {
    name: 'Yokohama Daikoku Export Hub',
    role: 'Primary RoRo & 40ft Container Terminal',
    address: 'Naka-ku / Daikoku Pier, Yokohama, Kanagawa 231-0002, Japan',
    services: 'JEVIC/QISJ testing, export deregistration, radiation screening & vessel loading',
  },
  {
    name: 'Nagoya & Osaka Dispatch Yards',
    role: 'Chubu & Kansai Port Consolidation',
    address: 'Minato-ku, Nagoya / Suminoe-ku, Osaka, Japan',
    services: 'Toyota/Lexus factory-zone stock staging, RoRo berth allocation & customs clearance',
  },
  {
    name: 'Jebel Ali & Global Partner Hubs',
    role: 'LHD & Multi-Origin Regional Stock',
    address: 'Dubai Free Zone · USA East Coast · Bangkok Yard',
    services: 'Left-hand drive pickups/SUVs and commercial fleet export for Africa, GCC & Americas',
  },
];

const COMPLIANCE_PARTNERS = [
  {
    name: 'JEVIC / QISJ / EAA',
    detail: 'Pre-export odometer, mechanical safety, and age-verification certificates.',
  },
  {
    name: 'Biosecurity & BMSB Wash',
    detail: 'High-pressure steam wash and seasonal heat-treatment certificates for Oceania & Pacific ports.',
  },
  {
    name: 'DHL Express Priority Docs',
    detail: 'Tracked international courier of original Export Certificates and endorsed Bills of Lading.',
  },
  {
    name: 'Direct Maritime Lines',
    detail: 'Contracted RoRo and container allocations with NYK, MOL, K-Line, Hoegh, and MSC.',
  },
];

export function CompanyProfilePage({ onNavigate }: CompanyProfilePageProps) {
  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Corporate Profile & Payment Security"
        title="Japanese Export Operations, Inspection Yards & Bank Settlement Policy"
        subtitle="Transparent corporate export credentials, Yokohama & Nagoya staging facilities, and official telegraphic transfer (TT / SWIFT) settlement verification for global vehicle buyers."
      />

      {/* Company Overview & Yards */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C81E1E]">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>About PJS Ventures</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1F3A]">
                Direct Export Desk Built For Dealerships &amp; Private Importers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                PJS Ventures connects buyers across the Caribbean, East &amp; West Africa, the UK &amp;
                Europe, Asia, and Oceania directly with Japanese auction-verified vehicles—eliminating
                middlemen markups while providing full JEVIC inspection transparency and weekly RoRo or
                container schedules.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Alongside direct Japan bookings, our Port Balance-Release program lets destination
                buyers claim already-shipped vehicles at a reduced balance after prior buyer
                forfeiture.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200">
                  <div className="font-mono text-xl font-bold text-[#0B1F3A]">150+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Countries Served</div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200">
                  <div className="font-mono text-xl font-bold text-[#0B1F3A]">30+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Active Port Hubs</div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="font-mono text-xl font-bold text-[#C81E1E]">Weekly</div>
                  <div className="text-xs text-slate-500 mt-0.5">RoRo &amp; Container Sailings</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/container_bracing_loading_1794999711542.jpg"
                  alt="Vehicles loaded and strapped inside 40ft container at Yokohama facility"
                  fallbackTitle="Yokohama Container Loading"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/export_docs_handover_1794999712204.jpg"
                  alt="Japanese Export Certificate and Bill of Lading documents prepared for DHL dispatch"
                  fallbackTitle="Export Documentation Desk"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <ResilientImage
                  src="/src/assets/images/port_arrival_handover_1794999712812.jpg"
                  alt="Destination port arrival staging yard"
                  fallbackTitle="Destination Port Handover"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Export Facilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXPORT_YARDS.map((yard) => (
              <div
                key={yard.name}
                className="p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C81E1E] mb-1.5">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{yard.role}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0B1F3A]">{yard.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">{yard.address}</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
                  {yard.services}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bank Settlement & Payment Security */}
      <section className="py-12 sm:py-16 bg-[#F3F5F8] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[#C81E1E]">
              <Landmark className="w-4 h-4" aria-hidden="true" />
              <span>Telegraphic Transfer (TT) &amp; Wire Policy</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B1F3A]">
              How Proforma Invoices &amp; Safe Payments Work
            </h2>

            <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">Step 1 — Official Proforma Invoice:</strong>{' '}
                  Once you submit a reservation on our booking page, our export desk issues a
                  stamped PDF Proforma Invoice bearing the vehicle chassis code, FOB/CIF breakdown,
                  and official wire instructions.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">Step 2 — Direct Booking / Balance Milestones:</strong>{' '}
                  Standard direct Japan bookings require a 50% booking deposit to lock export
                  deregistration &amp; vessel space, with the remaining 50% settled upon Bill of
                  Lading (B/L) copy issuance. Port Balance-Release units are cleared via direct
                  remaining-balance settlement prior to consignee B/L endorsement.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">Step 3 — SWIFT Confirmation &amp; DHL Dispatch:</strong>{' '}
                  Send your bank TT receipt copy referencing your Chassis Code or Invoice Number so
                  your original documents courier immediately via DHL Express.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-[#C81E1E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-semibold">Wire Fraud Protection Notice:</strong> Always
                verify that remittance instructions arrive from an official{' '}
                <span className="font-mono font-semibold">@pjsventures.com</span> invoice and match
                beneficiary details on your confirmed booking reference before wiring funds.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0B1F3A]">
                <ShieldCheck className="w-4 h-4 text-[#C81E1E]" aria-hidden="true" />
                <span>Inspection &amp; Logistics Partners</span>
              </div>

              <div className="space-y-3">
                {COMPLIANCE_PARTNERS.map((partner) => (
                  <div
                    key={partner.name}
                    className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200"
                  >
                    <div className="font-display text-sm font-bold text-[#0B1F3A]">
                      {partner.name}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {partner.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B1F3A] text-white rounded-xl p-6 space-y-3">
              <h3 className="font-display text-lg font-bold">Need a Proforma Invoice Today?</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Contact our Yokohama export desk at{' '}
                <span className="font-mono text-white">trade@pjsventures.com</span> or request a
                live vehicle reservation online.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('/book')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg cursor-pointer"
                >
                  <span>Request Booking / Invoice</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg cursor-pointer"
                >
                  Read Buyer FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
