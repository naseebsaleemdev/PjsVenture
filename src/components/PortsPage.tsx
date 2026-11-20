import { useEffect, useState } from 'react';
import { ArrowRight, Ship } from 'lucide-react';
import { DESTINATION_PORTS, PORT_REGIONS } from '../data/seedInventory.ts';
import type { GlobalPortRegion } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

interface PortsPageProps {
  initialRegion?: GlobalPortRegion | 'all';
  onNavigate: (route: AppRoute) => void;
  onSelectPortForCalculator: (portId: string) => void;
  onSelectPortForInventory: (portId: string) => void;
}

export function PortsPage({
  initialRegion = 'all',
  onNavigate,
  onSelectPortForCalculator,
  onSelectPortForInventory,
}: PortsPageProps) {
  const [activeRegion, setActiveRegion] = useState<GlobalPortRegion | 'all'>(initialRegion);

  useEffect(() => {
    setActiveRegion(initialRegion);
  }, [initialRegion]);

  const visiblePorts =
    activeRegion === 'all'
      ? DESTINATION_PORTS
      : DESTINATION_PORTS.filter((port) => port.region === activeRegion);

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Global Maritime Network"
        title="Worldwide Destination Ports & Shipping Rates"
        subtitle="Weekly RoRo and container sailings from Yokohama, Nagoya, Osaka, and Dubai to major terminals across the Caribbean & Americas, Africa, Europe & UK, Asia, and Oceania."
      />

      <section className="py-12 sm:py-16 bg-[#F3F5F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Region Filter Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRegion('all')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  activeRegion === 'all'
                    ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-zinc-950'
                }`}
              >
                All Regions ({DESTINATION_PORTS.length})
              </button>
              {PORT_REGIONS.map((region) => {
                const active = activeRegion === region;
                const count = DESTINATION_PORTS.filter((p) => p.region === region).length;
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setActiveRegion(region)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-zinc-950'
                    }`}
                  >
                    {region} ({count})
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {visiblePorts.length}
              </span>{' '}
              active terminal(s)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visiblePorts.map((port) => (
              <article
                key={port.id}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-[#C81E1E]">
                      {port.country} · {port.region}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                      <Ship className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {port.transitDays}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-semibold text-zinc-950">{port.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{port.regionTag}</p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{port.complianceNote}</p>

                  <dl className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-500">RoRo Freight</dt>
                      <dd className="font-mono font-semibold text-zinc-950 tabular-nums mt-0.5">
                        ${port.roroUsd.toLocaleString('en-US')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">20ft Container</dt>
                      <dd className="font-mono font-semibold text-zinc-950 tabular-nums mt-0.5">
                        ${port.container20Usd.toLocaleString('en-US')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">40ft Shared</dt>
                      <dd className="font-mono font-semibold text-zinc-950 tabular-nums mt-0.5">
                        ${port.container40SharedUsd.toLocaleString('en-US')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPortForInventory(port.id);
                      onNavigate('/inventory');
                    }}
                    className="px-4 py-2 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    View Port Cars
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPortForCalculator(port.id);
                      onNavigate('/calculator');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Calculate Landed CIF</span>
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
