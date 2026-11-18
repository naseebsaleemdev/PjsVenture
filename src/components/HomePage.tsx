import { useState } from 'react';
import { ArrowRight, CheckCircle2, Ship } from 'lucide-react';
import { DESTINATION_PORTS, PORT_REGIONS } from '../data/seedInventory.ts';
import type {
  AutoCurrency,
  BlogPost,
  BookingRequest,
  ExportVehicle,
} from '../types/autoTrade.ts';
import { AuctionProcessSection } from './AuctionProcessSection';
import { ExportShowcaseSection } from './ExportShowcaseSection';
import { HeroSection } from './HeroSection';
import type { AppRoute } from './Navbar';
import { ResilientImage } from './ResilientImage';
import { VehicleCard } from './VehicleCard';

interface HomePageProps {
  vehicles: ExportVehicle[];
  blogs?: BlogPost[];
  currency: AutoCurrency;
  shortlistIds: string[];
  onToggleShortlist: (vehicleId: string) => void;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
  onBookOrClaimVehicle: (vehicle: ExportVehicle) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenBlogPost?: (slug: string) => void;
  onSelectPortForInventory: (portId: string) => void;
  onSubmitQuickLead: (payload: {
    vehicleId: string | null;
    vehicleTitle: string;
    chassisCode: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    destinationPortId: string;
    destinationPortName: string;
    requestType: BookingRequest['requestType'];
    shippingMethod: 'RoRo Vessel' | '20ft Container' | '40ft Shared Container';
    quotedAmountUsd: number;
    notes: string;
    leadSource?: string;
  }) => Promise<BookingRequest>;
}

const VEHICLE_CLASS_SHOWCASE = [
  {
    title: '4x4 SUVs & Cruisers',
    subtitle: 'Land Cruiser Prado, RAV4, Harrier & X-Trail',
    detail: 'Auction Grade 4.0–4.5 inspected units built for island and rugged terrain.',
    image: '/src/assets/images/auto_suv_prado_1794825333513.jpg',
    alt: 'Pearl-white Japanese 4x4 SUV staged in export lot',
  },
  {
    title: 'Fuel-Efficient Hybrids',
    subtitle: 'Toyota Aqua, Prius, Corolla & Fit e:HEV',
    detail: 'Low-emission daily commuters with verified hybrid battery health.',
    image: '/src/assets/images/auto_hybrid_aqua_1794825334004.jpg',
    alt: 'Compact metallic silver Japanese hybrid hatchback',
  },
  {
    title: '4WD Work Pickups',
    subtitle: 'Toyota Hilux Revo, D-Max & Triton 4x4',
    detail: 'Turbo-diesel commercial and crew-cab workhorses cleared for port dispatch.',
    image: '/src/assets/images/auto_pickup_hilux_1794825334855.jpg',
    alt: 'Japanese double-cab 4WD diesel pickup truck',
  },
  {
    title: 'Executive Sedans & Vans',
    subtitle: 'Toyota Crown, Mark X & HiAce Commuter',
    detail: 'Clean Grade 4.5 executive sedans and multi-passenger fleet vans.',
    image: '/src/assets/images/auto_sedan_crown_1794825335274.jpg',
    alt: 'Japanese executive sedan in Yokohama inspection lot',
  },
];

export function HomePage({
  vehicles,
  blogs = [],
  currency,
  shortlistIds,
  onToggleShortlist,
  onInspectVehicle,
  onBookOrClaimVehicle,
  onNavigate,
  onOpenBlogPost,
  onSelectPortForInventory,
  onSubmitQuickLead,
}: HomePageProps) {
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadPortId, setLeadPortId] = useState(DESTINATION_PORTS[0].id);
  const [leadMessage, setLeadMessage] = useState('');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<BookingRequest | null>(null);

  // Showcase 3 featured vehicles: prioritize 2 direct imports + 1 port balance deal
  const directSample = vehicles
    .filter((v) => v.transit.dealType === 'direct-import')
    .slice(0, 2);
  const balanceSample = vehicles
    .filter((v) => v.transit.dealType === 'balance-release')
    .slice(0, 1);
  const featured = [...directSample, ...balanceSample].slice(0, 3);

  const globalHighlightIds = ['nassau', 'mombasa', 'southampton', 'auckland'];
  const featuredGlobalPorts = globalHighlightIds
    .map((id) => DESTINATION_PORTS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim() || !leadMessage.trim()) {
      setLeadError('Please enter your name, email address, and vehicle request.');
      return;
    }
    setLeadError(null);
    setLeadSubmitting(true);
    try {
      const port = DESTINATION_PORTS.find((p) => p.id === leadPortId) ?? DESTINATION_PORTS[0];
      const created = await onSubmitQuickLead({
        vehicleId: null,
        vehicleTitle: 'Home Page Quick Inquiry',
        chassisCode: 'Custom Sourcing',
        buyerName: leadName.trim(),
        buyerEmail: leadEmail.trim(),
        buyerPhone: leadPhone.trim(),
        destinationPortId: port.id,
        destinationPortName: `${port.name}, ${port.country}`,
        requestType: 'Custom Auction Order',
        shippingMethod: 'RoRo Vessel',
        quotedAmountUsd: 0,
        notes: leadMessage.trim(),
        leadSource: 'Home Page Lead Form',
      });
      setSubmittedLead(created);
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
      setLeadMessage('');
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Unable to send inquiry right now.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <>
      <HeroSection
        onBrowseInventory={() => onNavigate('/inventory')}
        onViewBalanceDeals={() => onNavigate('/port-deals')}
      />

      {/* Featured Vehicles Preview */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">Featured Stock</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Book ready Japanese imports or claim select port-arrival units.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View All {vehicles.length} Vehicles</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featured.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                currency={currency}
                isShortlisted={shortlistIds.includes(vehicle.id)}
                onToggleShortlist={onToggleShortlist}
                onInspect={onInspectVehicle}
                onBookOrClaim={onBookOrClaimVehicle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Vehicle Classes Photography Strip */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">Browse by Vehicle Class</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
                Auction-graded Japanese models ready for global export.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Filter Full Catalog</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VEHICLE_CLASS_SHOWCASE.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => onNavigate('/inventory')}
                className="group text-left bg-slate-50 border border-slate-200 hover:border-blue-900 rounded-xl overflow-hidden transition-colors flex flex-col cursor-pointer"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <ResilientImage
                    src={category.image}
                    alt={category.alt}
                    fallbackTitle={category.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-4 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-blue-900 uppercase tracking-wide">
                      {category.subtitle}
                    </div>
                    <h3 className="font-display text-base font-semibold text-zinc-950 mt-1">
                      {category.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      {category.detail}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 inline-flex items-center gap-1.5 text-xs font-medium text-blue-900">
                    <span>Explore Units</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Two Clear Buying Options with Photography */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-medium text-blue-900 mb-2">How PJS Ventures Works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
              Two straightforward ways to buy verified Japanese vehicles worldwide.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between">
              <div>
                <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  <ResilientImage
                    src="/src/assets/images/yokohama_inspection_bay_1794999716476.jpg"
                    alt="Japanese export inspector reviewing vehicle engine bay inside Yokohama yard"
                    fallbackTitle="Book Direct Japan Imports"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-950 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-900" aria-hidden="true" />
                    <span>Primary Service · Most Inventory</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-zinc-950">
                    Book Direct Japan Imports
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    Choose any verified SUV, hybrid, sedan, or commercial unit in our Japanese yard
                    inventory. Reserve online and we handle JEVIC inspection, export deregistration,
                    and weekly RoRo or container shipping directly to your destination port.
                  </p>
                </div>
              </div>
              <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => onNavigate('/inventory')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 cursor-pointer"
                >
                  <span>Browse Direct Japan Stock</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="border border-blue-200 rounded-xl overflow-hidden bg-white flex flex-col justify-between">
              <div>
                <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-blue-200/80">
                  <ResilientImage
                    src="/src/assets/images/port_arrival_handover_1794999712812.jpg"
                    alt="Newly arrived Japanese SUV and 4WD pickup staged at coastal destination port"
                    fallbackTitle="Port Balance-Release Deals"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-900 mb-3">
                    <Ship className="w-4 h-4 text-blue-900" aria-hidden="true" />
                    <span>Select Units · Save Prior Buyer Deposit</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-zinc-950">
                    Port Balance-Release Deals
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    Occasionally an already-shipped vehicle has 40%–50% paid by an original buyer who
                    did not complete final settlement. Buyers at that destination port can step in,
                    pay only the remaining balance, and clear the vehicle immediately.
                  </p>
                </div>
              </div>
              <div className="px-6 sm:px-8 py-4 border-t border-blue-200/70 bg-blue-50/40">
                <button
                  type="button"
                  onClick={() => onNavigate('/port-deals')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 cursor-pointer"
                >
                  <span>View Current Port Balance Deals</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Worldwide Export Corridors Preview */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Global Shipping Corridors
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
                Direct sailings to Caribbean, Africa, UK &amp; Europe, Asia, and Oceania.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('/markets')}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-950 hover:text-blue-900 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Explore Global Markets</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/ports')}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>All {DESTINATION_PORTS.length} Global Ports &amp; Rates</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredGlobalPorts.map((port) => (
              <button
                key={port.id}
                type="button"
                onClick={() => {
                  onSelectPortForInventory(port.id);
                  onNavigate('/inventory');
                }}
                className="text-left p-5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-900 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-blue-900">
                    {port.country} · {port.region}
                  </div>
                  <h3 className="font-display text-base font-semibold text-zinc-950 mt-1">
                    {port.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{port.regionTag}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">RoRo from</span>
                  <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                    ${port.roroUsd.toLocaleString('en-US')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <ExportShowcaseSection onNavigate={onNavigate} surface="slate" />

      <AuctionProcessSection />

      {/* Latest Blog Articles Preview */}
      {blogs.filter((b) => b.status === 'Published').length > 0 && (
        <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Export Journal &amp; Buyer Guides
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
                  Insights on Japanese auctions, shipping routes &amp; port clearance.
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/blog')}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-950 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>View All Articles</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {blogs
                .filter((b) => b.status === 'Published')
                .slice(0, 3)
                .map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() =>
                      onOpenBlogPost
                        ? onOpenBlogPost(post.slug)
                        : onNavigate(`/blog/${encodeURIComponent(post.slug)}`)
                    }
                    className="group text-left bg-white border border-slate-200 hover:border-blue-900 rounded-xl overflow-hidden flex flex-col justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                        <ResilientImage
                          src={post.coverImage}
                          alt={post.coverImageAlt}
                          fallbackTitle={post.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-blue-900">{post.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{post.readTimeMinutes} min read</span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-semibold text-zinc-950 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 inline-flex items-center gap-1.5 text-xs font-medium text-blue-900">
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Direct Quick Lead & Quote Form Section */}
      <section className="py-16 sm:py-20 bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-medium text-blue-300">PJS Ventures Export Desk</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Need a CIF quote or looking for a specific Japanese car?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Send us the model, year, or destination port you need. Your inquiry goes directly to
              our sales desk for an instant proforma and shipping schedule.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/calculator')}
                className="px-4 py-2.5 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                Open Freight Calculator
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <span>Full Booking Form</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
            {submittedLead ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      Inquiry Received — Ref #{submittedLead.id.toUpperCase()}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Thanks, {submittedLead.buyerName}. Our export desk received your request for{' '}
                      <span className="text-white font-medium">
                        {submittedLead.destinationPortName}
                      </span>{' '}
                      and will reach out shortly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedLead(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-950 bg-white hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickLeadSubmit} noValidate className="space-y-4">
                {leadError && (
                  <p className="text-xs text-red-200 bg-red-950/60 border border-red-800 rounded-lg px-3.5 py-2.5">
                    {leadError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="home-lead-name"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Your Name *
                    </label>
                    <input
                      id="home-lead-name"
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Full name or dealership"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-lead-phone"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      WhatsApp / Phone
                    </label>
                    <input
                      id="home-lead-phone"
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="+1 242 555 0190"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="home-lead-email"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Email Address *
                    </label>
                    <input
                      id="home-lead-email"
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-lead-port"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
                      Destination Port
                    </label>
                    <select
                      id="home-lead-port"
                      value={leadPortId}
                      onChange={(e) => setLeadPortId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:border-blue-400"
                    >
                      {PORT_REGIONS.map((region) => (
                        <optgroup key={region} label={region}>
                          {DESTINATION_PORTS.filter((p) => p.region === region).map((port) => (
                            <option key={port.id} value={port.id}>
                              {port.name} ({port.country})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="home-lead-message"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Car Model / Budget or Inquiry Details *
                  </label>
                  <textarea
                    id="home-lead-message"
                    rows={2}
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                    placeholder="e.g. Looking for 2022 Toyota Hilux 4WD or CIF quote to Nassau..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-zinc-950 bg-white hover:bg-slate-100 disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer"
                >
                  {leadSubmitting ? 'Sending Inquiry...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
