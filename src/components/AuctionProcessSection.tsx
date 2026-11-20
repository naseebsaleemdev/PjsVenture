import { EXPORT_STEPS, RORO_PORT_MEDIA } from '../data/seedInventory.ts';
import { ResilientImage } from './ResilientImage';

export function AuctionProcessSection() {
  return (
    <section id="export-process" className="py-16 sm:py-22 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch mb-14">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C81E1E] mb-2">
              <span className="w-4 h-0.5 bg-[#C81E1E]" aria-hidden="true" />
              <span>Worldwide Export Shipping &amp; Clearance</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A]">
              From Yokohama &amp; global inspection bays straight to your local port.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Most clients pick a listed vehicle online, reserve it, and let us handle export
              deregistration, JEVIC / QISJ / EAA certification, and weekly RoRo or container
              dispatch to Caribbean, African, UK, European, Asian, or Oceania ports. When an
              in-transit unit opens on balance-release, local buyers can clear it immediately.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <ResilientImage
                src={RORO_PORT_MEDIA.src}
                alt={RORO_PORT_MEDIA.alt}
                fallbackTitle="RoRo Carrier Bound for Global Ports"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPORT_STEPS.map((item) => (
            <div
              key={item.step}
              className="border border-slate-200 rounded-xl p-6 bg-[#F8FAFC] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span className="font-mono font-bold text-[#C81E1E] tabular-nums">
                    STEP {item.step}
                  </span>
                  <span>{item.window}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0B1F3A]">{item.title}</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
