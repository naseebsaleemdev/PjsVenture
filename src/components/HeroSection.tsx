import { ArrowRight } from 'lucide-react';
import { AUTO_HERO_MEDIA, TRADE_METRICS } from '../data/seedInventory.ts';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onBrowseInventory: () => void;
  onViewBalanceDeals: () => void;
}

export function HeroSection({ onBrowseInventory, onViewBalanceDeals }: HeroSectionProps) {
  return (
    <section id="top" className="pt-10 pb-16 sm:pt-14 sm:pb-20 border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-5">
                Worldwide Auto Exports <span aria-hidden="true">·</span> Caribbean · East &amp; West
                Africa · UK &amp; Europe · Oceania · Middle East
              </p>

              <h1 className="font-display font-bold tracking-tight text-zinc-950 text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.08] max-w-xl">
                Verified Japanese &amp; global vehicles, booked online and shipped to your port.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Browse auction-inspected SUVs, hybrids, sedans, and pickups ready for RoRo or
                container shipping to 150+ countries—plus select in-transit port balance-release
                units you can clear immediately on arrival.
              </p>
            </div>

            <div className="mt-8 pt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onBrowseInventory}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
              >
                <span>Browse Available Cars</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onViewBalanceDeals}
                className="inline-flex items-center px-5 py-3 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
              >
                Port Balance-Release Deals
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src={AUTO_HERO_MEDIA.src}
                alt={AUTO_HERO_MEDIA.alt}
                fallbackTitle="PJS Ventures Japan Export Bay"
                priority
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {TRADE_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-zinc-950 tabular-nums">
                {metric.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
