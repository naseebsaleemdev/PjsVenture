interface PageBannerProps {
  breadcrumb: string;
  title: string;
  subtitle: string;
}

export function PageBanner({ breadcrumb, title, subtitle }: PageBannerProps) {
  return (
    <section className="bg-[#0B1F3A] text-white border-b border-slate-800 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 mb-3">
          <span className="w-4 h-0.5 bg-[#C81E1E]" aria-hidden="true" />
          <span>{breadcrumb}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white max-w-3xl leading-[1.12]">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
