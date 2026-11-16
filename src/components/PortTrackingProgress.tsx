import { Check } from 'lucide-react';
import { PORT_TRACKING_STAGES, formatEtaDate, getPortTrackingStage } from '../data/seedInventory.ts';
import type { PortTrackingStage, ShippingTransitInfo } from '../types/autoTrade.ts';

interface PortTrackingProgressProps {
  transit: ShippingTransitInfo;
  variant?: 'compact' | 'full';
}

export function PortTrackingProgress({
  transit,
  variant = 'full',
}: PortTrackingProgressProps) {
  const activeStage: PortTrackingStage = getPortTrackingStage(transit);
  const activeIndex = Math.max(0, PORT_TRACKING_STAGES.indexOf(activeStage));
  const progressPercent = ((activeIndex + 1) / PORT_TRACKING_STAGES.length) * 100;
  const formattedEta = formatEtaDate(transit.etaDate);
  const isReady = activeStage === 'Ready for Pickup';

  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium text-slate-600">Shipment Tracker</span>
          <span
            className={`font-mono font-semibold ${
              isReady ? 'text-emerald-800' : 'text-blue-900'
            }`}
          >
            {activeStage}
          </span>
        </div>

        {/* 4-Step Track */}
        <div className="grid grid-cols-4 gap-1" aria-label={`Status: ${activeStage}`}>
          {PORT_TRACKING_STAGES.map((stage, idx) => {
            const done = idx <= activeIndex;
            return (
              <div
                key={stage}
                title={stage}
                className={`h-1.5 rounded-sm transition-colors ${
                  done ? (isReady ? 'bg-emerald-700' : 'bg-blue-900') : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
          <span className="truncate">{transit.destinationPortLabel}</span>
          {formattedEta && <span className="font-mono shrink-0">ETA {formattedEta}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-zinc-950">
            Live Port &amp; Pickup Tracker
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            {transit.destinationPortLabel}
            {formattedEta ? ` · ETA ${formattedEta}` : ''}
          </div>
        </div>
        <span
          className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-md border ${
            isReady
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-blue-200 text-blue-900'
          }`}
        >
          {activeStage}
        </span>
      </div>

      {/* Continuous Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isReady ? 'bg-emerald-700' : 'bg-blue-900'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 4 Milestone Nodes */}
      <div className="grid grid-cols-4 gap-2">
        {PORT_TRACKING_STAGES.map((stage, idx) => {
          const completed = idx < activeIndex;
          const current = idx === activeIndex;
          return (
            <div key={stage} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    completed || current
                      ? isReady
                        ? 'bg-emerald-700 text-white'
                        : 'bg-blue-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-400'
                  }`}
                >
                  {completed || (current && isReady) ? (
                    <Check className="w-2.5 h-2.5" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span
                  className={`text-[11px] leading-tight truncate ${
                    current
                      ? 'font-semibold text-zinc-950'
                      : completed
                        ? 'font-medium text-slate-700'
                        : 'text-slate-400'
                  }`}
                >
                  {stage}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
