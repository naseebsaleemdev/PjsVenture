import { ArrowRight, CheckCircle2, Globe, ShieldCheck, Ship } from 'lucide-react';
import { DESTINATION_PORTS } from '../data/seedInventory.ts';
import type { GlobalPortRegion } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

interface GlobalMarketsPageProps {
  onNavigate: (route: AppRoute) => void;
  onSelectPortForCalculator: (portId: string) => void;
  onSelectPortForInventory: (portId: string) => void;
  onSelectPortsRegion: (region: GlobalPortRegion) => void;
}

interface MarketCorridor {
  id: string;
  regionKey: GlobalPortRegion;
  title: string;
  countriesSummary: string;
  anchorPortId: string;
  anchorPortLabel: string;
  transitWindow: string;
  roroFromUsd: number;
  inspectionStandard: string;
  popularModels: string;
  highlights: string[];
}

const GLOBAL_CORRIDORS: MarketCorridor[] = [
  {
    id: 'east-south-africa',
    regionKey: 'Africa',
    title: 'East, Central & Southern Africa',
    countriesSummary: 'Kenya · Tanzania · Uganda · Zambia · Zimbabwe · South Africa · Namibia · Mozambique',
    anchorPortId: 'mombasa',
    anchorPortLabel: 'Mombasa, Dar es Salaam & Durban',
    transitWindow: '22–30 days',
    roroFromUsd: 1380,
    inspectionStandard: 'QISJ / EAA / JEVIC Certified',
    popularModels: 'Toyota Hilux, Land Cruiser Prado, Harrier, Vitz, HiAce Van',
    highlights: [
      'KEBS / TBS PVoC roadworthiness & 8-year age compliance handled in Japan prior to sailing.',
      'Overland transit clearance guidance for landlocked buyers in Uganda, Zambia, Malawi, and Zimbabwe.',
    ],
  },
  {
    id: 'caribbean-americas',
    regionKey: 'Caribbean & Americas',
    title: 'Caribbean, South & North America',
    countriesSummary: 'Bahamas · Jamaica · Cayman · Barbados · Trinidad · Guyana · Chile · Canada · USA',
    anchorPortId: 'nassau',
    anchorPortLabel: 'Nassau, Kingston, Georgetown & Iquique',
    transitWindow: '16–38 days',
    roroFromUsd: 1380,
    inspectionStandard: 'JEVIC Odometer & Export Deregistration',
    popularModels: 'Toyota Corolla Sport, Lexus LX/RX, Honda Vezel Hybrid, Hilux 4WD',
    highlights: [
      'Weekly RoRo and 20ft/40ft container departures from Yokohama, Nagoya, and Kobe.',
      'ZOFRI free-zone transshipment via Iquique for Chile, Bolivia, and Paraguay.',
    ],
  },
  {
    id: 'uk-europe',
    regionKey: 'Europe & UK',
    title: 'United Kingdom & Continental Europe',
    countriesSummary: 'United Kingdom · Ireland · Cyprus · Georgia · Netherlands · Germany',
    anchorPortId: 'southampton',
    anchorPortLabel: 'Southampton, Dublin, Limassol & Poti',
    transitWindow: '26–40 days',
    roroFromUsd: 1420,
    inspectionStandard: 'NOVA / IVA & EU Type-Approval Docs',
    popularModels: 'Low-Mileage JDM Hybrids, Toyota Alphard/Vellfire, Lexus LS, Classic JDM',
    highlights: [
      'Direct RoRo discharge at Southampton & Dublin plus container service into Poti for Caucasus buyers.',
      'Verified paint-depth & auction grade 4.5–5.0 collector and family MPVs.',
    ],
  },
  {
    id: 'asia-middle-east',
    regionKey: 'Asia & Middle East',
    title: 'Middle East (GCC) & South / SE Asia',
    countriesSummary: 'UAE (Dubai) · Oman · Sri Lanka · Bangladesh · Malaysia · Singapore',
    anchorPortId: 'jebel-ali',
    anchorPortLabel: 'Port Jebel Ali, Hambantota & Port Klang',
    transitWindow: '10–26 days',
    roroFromUsd: 1090,
    inspectionStandard: 'JEVIC / JAAI & GCC Export Standards',
    popularModels: 'Toyota Land Cruiser 300, Lexus LX, Premio, Axio, Alphard Executive',
    highlights: [
      'Fast 10–22 day Asian sailings plus Jebel Ali free-zone stock for LHD & GCC re-export.',
      'Full AP & commercial dealer fleet support with verified Japan auction sheets.',
    ],
  },
  {
    id: 'oceania-pacific',
    regionKey: 'Oceania & Pacific',
    title: 'New Zealand, Australia & Pacific Islands',
    countriesSummary: 'New Zealand · Australia · Fiji · Papua New Guinea · Samoa · Tonga',
    anchorPortId: 'auckland',
    anchorPortLabel: 'Auckland, Brisbane, Suva & Port Moresby',
    transitWindow: '15–24 days',
    roroFromUsd: 1290,
    inspectionStandard: 'MPI Biosecurity & BMSB Heat Treatment',
    popularModels: 'Toyota Aqua, Prius, Corolla Hybrid, Hilux 4x4, HiAce Commuter',
    highlights: [
      'Pre-export BMSB seasonal fumigation, underbody steam wash, and NZTA/ROVER document checks.',
      'Frequent Pacific feeder and RoRo routes into Suva, Apia, Honiara, and Port Moresby.',
    ],
  },
  {
    id: 'west-africa-lhd',
    regionKey: 'Africa',
    title: 'West Africa (LHD Sourcing Desk)',
    countriesSummary: 'Nigeria · Ghana · Côte d’Ivoire · Senegal · Cameroon',
    anchorPortId: 'lagos',
    anchorPortLabel: 'Tin Can Island (Lagos) & Port of Tema',
    transitWindow: '31–38 days',
    roroFromUsd: 1520,
    inspectionStandard: 'Form M / PAAR & LHD Specification Check',
    popularModels: 'Left-Hand Drive SUVs, Pickups, Sedans & Commercial Vans (UAE/USA/Korea)',
    highlights: [
      'Multi-origin LHD vehicle sourcing from our UAE, USA, and South Korea yards alongside Japan stock.',
      'Secured 20ft/40ft container loading and consolidated dealer shipments.',
    ],
  },
];

export function GlobalMarketsPage({
  onNavigate,
  onSelectPortForCalculator,
  onSelectPortForInventory,
  onSelectPortsRegion,
}: GlobalMarketsPageProps) {
  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Worldwide Export Markets"
        title="Shipping Japanese & International Vehicles Across 5 Continents"
        subtitle="Beyond the Caribbean, PJS Ventures actively supplies dealers and private buyers across East & West Africa, the UK & Europe, Middle East, Asia, and Oceania with verified stock and live Freight Calculator rates."
      />

      {/* Global Coverage Strip */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">150+</div>
            <div className="text-xs text-slate-600 mt-0.5">Countries in Freight Calculator</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
              {DESTINATION_PORTS.length}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">Direct Maritime Hub Terminals</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">4 Hubs</div>
            <div className="text-xs text-slate-600 mt-0.5">Japan · UAE · USA · Thailand Yards</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-[#C81E1E] tabular-nums">RHD &amp; LHD</div>
            <div className="text-xs text-slate-600 mt-0.5">Country-Specific Compliance</div>
          </div>
        </div>
      </section>

      {/* Regional Corridors */}
      <section className="py-16 bg-[#F3F5F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-[#C81E1E] mb-2">Active Trade Corridors</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
              Select your destination region for freight rates, inspection rules, and live inventory.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GLOBAL_CORRIDORS.map((corridor) => (
              <article
                key={corridor.id}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#C81E1E]">
                      <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                      {corridor.regionKey}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Ship className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {corridor.transitWindow} · RoRo from ${corridor.roroFromUsd.toLocaleString('en-US')}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-zinc-950">
                    {corridor.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{corridor.countriesSummary}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Key Ports</div>
                      <div className="font-medium text-zinc-950 mt-0.5">
                        {corridor.anchorPortLabel}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Inspection Standard</div>
                      <div className="font-medium text-zinc-950 mt-0.5 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                        <span>{corridor.inspectionStandard}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <span className="text-slate-500">Top Imported Units: </span>
                    <span className="text-zinc-950 font-medium">{corridor.popularModels}</span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {corridor.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                      >
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#C81E1E] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPortsRegion(corridor.regionKey);
                      onNavigate('/ports');
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Regional Ports
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPortForInventory(corridor.anchorPortId);
                      onNavigate('/inventory');
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-zinc-950 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Browse Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPortForCalculator(corridor.anchorPortId);
                      onNavigate('/calculator');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Calculate CIF</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
