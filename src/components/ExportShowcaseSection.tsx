import { useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, MapPin } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import type { AppRoute } from './Navbar';

interface ExportShowcaseSectionProps {
  onNavigate?: (route: AppRoute) => void;
  surface?: 'white' | 'slate';
}

interface ExportPhotoHighlight {
  id: string;
  stepTag: string;
  title: string;
  facility: string;
  summary: string;
  image: string;
  alt: string;
  ctaLabel: string;
  ctaRoute: AppRoute;
}

const EXPORT_PHOTO_HIGHLIGHTS: ExportPhotoHighlight[] = [
  {
    id: 'yokohama-inspection',
    stepTag: 'Stage 01 · Pre-Export Verification',
    title: 'Multi-Point Yokohama Yard & Engine Inspection',
    facility: 'Yokohama Inspection Bay, Japan',
    summary:
      'Every direct import vehicle undergoes mechanical, underbody, fluid, and true-mileage auction sheet verification before export booking is finalized.',
    image: '/src/assets/images/yokohama_inspection_bay_1794999716476.jpg',
    alt: 'Inspector verifying a pearl-white Toyota SUV engine bay inside Yokohama export facility',
    ctaLabel: 'Browse Inspected Vehicles',
    ctaRoute: '/inventory',
  },
  {
    id: 'container-bracing',
    stepTag: 'Stage 02 · Containerized Dispatch',
    title: 'Steel-Ramped 20ft & 40ft Container Loading',
    facility: 'Yokohama Container Terminal Gate 4',
    summary:
      'For shared or dedicated container orders, vehicles are positioned on steel ramps with heavy-duty wheel chocks, tension straps, and side-panel foam guards.',
    image: '/src/assets/images/container_bracing_loading_1794999711542.jpg',
    alt: 'Two Japanese SUVs and wagons secured with yellow wheel straps inside a 40ft container',
    ctaLabel: 'Calculate Container Freight',
    ctaRoute: '/calculator',
  },
  {
    id: 'export-docs-dhl',
    stepTag: 'Stage 03 · Compliance & Courier',
    title: 'Export Certificate, Bill of Lading & OEM Keys',
    facility: 'Tokyo Export Documentation Desk',
    summary:
      'Original Japanese Export Certificates, stamped Bills of Lading, JEVIC/radiation certificates, and spare smart keys are dispatched via DHL Express ahead of ship arrival.',
    image: '/src/assets/images/export_docs_handover_1794999712204.jpg',
    alt: 'Stamped Export Certificate folder, Bill of Lading documents, and car key fobs on oak desk',
    ctaLabel: 'Read Full Buying Guide',
    ctaRoute: '/how-to-buy',
  },
  {
    id: 'port-handover',
    stepTag: 'Stage 04 · Destination Port Arrival',
    title: 'Customs Clearance & Port Balance-Release Handover',
    facility: 'Coastal Destination Port Handover Yard',
    summary:
      'Once vessels dock at your local port, cleared direct bookings and select balance-release units are staged at the terminal ready for immediate pickup.',
    image: '/src/assets/images/port_arrival_handover_1794999712812.jpg',
    alt: 'Pearl-white hybrid SUV and silver 4WD pickup staged at coastal destination port terminal',
    ctaLabel: 'View Port Balance Deals',
    ctaRoute: '/port-deals',
  },
];

const PORT_UNLOADING_GALLERY = [
  {
    id: 'unload-suv',
    title: '4x4 SUV Ramp Devanned',
    port: 'Port of Nassau, Bahamas · 40ft High-Cube',
    image: '/src/assets/images/container_unload_suv_1794837300196.jpg',
    alt: 'Japanese 4x4 SUV rolling cleanly out of a shipping container at Nassau port',
  },
  {
    id: 'unload-hybrid',
    title: 'Hybrid Fleet Container Arrival',
    port: 'Port of Kingston, Jamaica · Foam-Braced 20ft',
    image: '/src/assets/images/container_unload_hybrid_1794837300796.jpg',
    alt: 'Toyota hybrid hatchback unloaded cleanly at Kingston container terminal',
  },
  {
    id: 'unload-pickup',
    title: '4WD Pickup & Commercial Van Roll-Out',
    port: 'George Town Port · Dual Steel Ramp Discharge',
    image: '/src/assets/images/container_unload_pickup_1794837300966.jpg',
    alt: 'Double-cab 4WD pickup truck and commercial van unloaded from export container',
  },
];

export function ExportShowcaseSection({
  onNavigate,
  surface = 'white',
}: ExportShowcaseSectionProps) {
  const [activeId, setActiveId] = useState<string>(EXPORT_PHOTO_HIGHLIGHTS[0].id);
  const activeSlide =
    EXPORT_PHOTO_HIGHLIGHTS.find((item) => item.id === activeId) ?? EXPORT_PHOTO_HIGHLIGHTS[0];

  return (
    <section
      id="export-operations-gallery"
      className={`py-16 sm:py-20 border-b border-slate-200 ${
        surface === 'slate' ? 'bg-[#F3F5F8]' : 'bg-white'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-sm font-medium text-[#0B1F3A] mb-2">
            Yard Inspection &amp; Port Logistics Gallery
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
            Real photo proof from Japanese inspection bays to port handover.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Every vehicle goes through documented mechanical checks, steel-braced container or RoRo
            loading, and verified courier paperwork before reaching your destination terminal.
          </p>
        </div>

        {/* Interactive Feature Stage + Stage Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
              <ResilientImage
                src={activeSlide.image}
                alt={activeSlide.alt}
                fallbackTitle={activeSlide.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5 sm:p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-mono font-semibold text-[#0B1F3A]">
                    {activeSlide.stepTag}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    |
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0B1F3A]" aria-hidden="true" />
                    {activeSlide.facility}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-zinc-950">
                  {activeSlide.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{activeSlide.summary}</p>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(activeSlide.ctaRoute)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{activeSlide.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* 4-Stage Photo Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
              <span className="inline-flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0B1F3A]" aria-hidden="true" />
                <span>Export Photo Stages (4)</span>
              </span>
              <span>Select to inspect</span>
            </div>

            <div className="space-y-3">
              {EXPORT_PHOTO_HIGHLIGHTS.map((item) => {
                const isActive = item.id === activeSlide.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    aria-pressed={isActive}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex gap-3.5 items-center cursor-pointer ${
                      isActive
                        ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-24 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <ResilientImage
                        src={item.image}
                        alt={item.alt}
                        fallbackTitle={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-medium text-[#0B1F3A] truncate">
                        {item.stepTag}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-zinc-950 line-clamp-2 leading-snug">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 truncate">{item.facility}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Container Unloading Photo Strip */}
        <div className="mt-10 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 mb-1">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Verified Destination Port Discharges</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-zinc-950">
                Recent Container Arrivals &amp; Ramp Unloading
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              High-resolution port arrival photography from recent PJS Ventures shipments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORT_UNLOADING_GALLERY.map((photo) => (
              <article
                key={photo.id}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <ResilientImage
                    src={photo.image}
                    alt={photo.alt}
                    fallbackTitle={photo.title}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-4 bg-white border-t border-slate-200 flex-1">
                  <h4 className="font-display text-base font-semibold text-zinc-950">
                    {photo.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600">{photo.port}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
