import { EXPORT_STEPS, RORO_PORT_MEDIA } from '../data/seedInventory.ts';
import { ResilientImage } from './ResilientImage';

export function AuctionProcessSection() {
  return (
    <section id="export-process" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch mb-14">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Japan-to-Caribbean Shipping & Clearance
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              From Yokohama inspection bays straight to Bahamas, Jamaica, and Caribbean harbors.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Most clients pick a listed vehicle online, reserve it, and let us handle Japanese
              deregistration, JEVIC certification, and weekly RoRo or container dispatch to your
              nearest Caribbean port. When an occasional in-transit unit opens on balance-release,
              local buyers can also step in and clear it right away.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src={RORO_PORT_MEDIA.src}
                alt={RORO_PORT_MEDIA.alt}
                fallbackTitle="RoRo Carrier Bound for Caribbean Ports"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPORT_STEPS.map((item) => (
            <div
              key={item.step}
              className="border border-slate-200 rounded-xl p-6 bg-slate-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                    {item.step}.
                  </span>
                  <span>{item.window}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
