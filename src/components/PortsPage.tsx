import { ArrowRight, Ship } from 'lucide-react';
import { DESTINATION_PORTS } from '../data/seedInventory.ts';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

interface PortsPageProps {
  onNavigate: (route: AppRoute) => void;
  onSelectPortForCalculator: (portId: string) => void;
  onSelectPortForInventory: (portId: string) => void;
}

export function PortsPage({
  onNavigate,
  onSelectPortForCalculator,
  onSelectPortForInventory,
}: PortsPageProps) {
  return (
    <div>
      <PageBanner
        breadcrumb="CrownWheel · Caribbean Shipping Network"
        title="Caribbean & Near-US Destination Ports"
        subtitle="Weekly RoRo and container sailings from Yokohama, Nagoya, and Osaka to island harbors across the Bahamas, Greater Antilles, Cayman Islands, and Eastern Caribbean."
      />

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {DESTINATION_PORTS.map((port) => (
            <article
              key={port.id}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-2">
                  <span className="font-medium text-blue-900">{port.country}</span>
                  <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Calculate Landed CIF</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
