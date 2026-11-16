interface PageBannerProps {
  breadcrumb: string;
  title: string;
  subtitle: string;
}

export function PageBanner({ breadcrumb, title, subtitle }: PageBannerProps) {
  return (
    <section className="bg-white border-b border-slate-200 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">{breadcrumb}</p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 max-w-3xl">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
