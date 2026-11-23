import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, HelpCircle, Search } from 'lucide-react';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';

interface FaqPageProps {
  onNavigate: (route: AppRoute) => void;
}

type FaqCategory =
  | 'All Topics'
  | 'Buying & Auctions'
  | 'Payments & Invoices'
  | 'Shipping & RoRo'
  | 'Port Balance Deals';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All Topics'>;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: FaqCategory[] = [
  'All Topics',
  'Buying & Auctions',
  'Payments & Invoices',
  'Shipping & RoRo',
  'Port Balance Deals',
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Buying & Auctions',
    question: 'Are all Japanese vehicles verified with genuine mileage and auction sheets?',
    answer:
      'Yes. Every direct Japan vehicle includes its original auction sheet (USS, TAA, HAA, JU, or CAA) or dealer inspection certificate, along with mandatory pre-export JEVIC / QISJ / EAA odometer verification prior to sailing.',
  },
  {
    id: 'faq-2',
    category: 'Buying & Auctions',
    question: 'Can I request a specific car model directly from live Japan auctions?',
    answer:
      'Yes. Use our Auctions Access desk or Booking Form to submit your target model, year, max mileage, minimum grade, and budget. Our licensed buyers translate upcoming auction lots and bid strictly up to your approved limit.',
  },
  {
    id: 'faq-3',
    category: 'Payments & Invoices',
    question: 'What are the standard payment terms for Direct Japan Imports?',
    answer:
      'Once you receive an official Proforma Invoice, a 50% booking deposit locks the vehicle and secures vessel space + export deregistration. The remaining 50% balance is due once the ship sails and you receive your Bill of Lading (B/L) copy.',
  },
  {
    id: 'faq-4',
    category: 'Payments & Invoices',
    question: 'How do I verify bank wire instructions before sending payment?',
    answer:
      'Official Proforma Invoices are sent strictly from @pjsventures.com and display your exact Chassis Code and Booking Reference. Always verify beneficiary details directly on your confirmed PJS Ventures invoice prior to initiating a SWIFT/TT transfer.',
  },
  {
    id: 'faq-5',
    category: 'Port Balance Deals',
    question: 'How do Port Balance-Release Deals save 40%–50% on landed cost?',
    answer:
      'When an original buyer pays a 40%–50% deposit prior to sailing but fails to settle the remaining balance before vessel arrival, we release the unit to local buyers at that destination port. You pay only the remaining unpaid balance and clear immediately upon arrival.',
  },
  {
    id: 'faq-6',
    category: 'Port Balance Deals',
    question: 'Can a Port Balance-Release vehicle be rerouted to a different port?',
    answer:
      'No. Because ocean freight and Bill of Lading manifests are already issued for that vessel, Port Balance-Release units are strictly available for pickup/clearance at their assigned destination port.',
  },
  {
    id: 'faq-7',
    category: 'Shipping & RoRo',
    question: 'What is the difference between RoRo and Container shipping?',
    answer:
      'RoRo (Roll-on/Roll-off) ships drive the vehicle cleanly inside enclosed car-carrier decks and is the fastest, lowest-cost option for most ports. 20ft dedicated or 40ft shared containers protect multi-unit orders, collector cars, or ports without direct RoRo calls using steel ramps and wheel chocks.',
  },
  {
    id: 'faq-8',
    category: 'Shipping & RoRo',
    question: 'How do I receive my original Japanese Export Certificate & Bill of Lading?',
    answer:
      'Once balance settlement clears, we dispatch your original stamped Japanese Export Certificate, Bill of Lading (B/L), Commercial Invoice, and JEVIC/radiation certificates via tracked DHL Express courier well ahead of ship docking.',
  },
  {
    id: 'faq-9',
    category: 'Shipping & RoRo',
    question: 'Do you export Left-Hand Drive (LHD) vehicles as well as Right-Hand Drive (RHD)?',
    answer:
      'Yes. While our primary Yokohama yard specializes in RHD Japanese domestic stock for the Caribbean, East & Southern Africa, UK, Asia, and Oceania, we also source verified LHD pickups, SUVs, and sedans from UAE, USA, and Korea for West Africa, Latin America, and GCC buyers.',
  },
];

export function FaqPage({ onNavigate }: FaqPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('All Topics');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string>(FAQ_ITEMS[0].id);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== 'All Topics' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, query]);

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Buyer Help Center"
        title="Frequently Asked Export, Payment & Shipping Questions"
        subtitle="Everything importers need to know about Japanese auction bidding, JEVIC inspections, Telegraphic Transfer safety, RoRo vs. container freight, and Port Balance-Release claims."
      />

      <section className="py-12 sm:py-16 bg-[#F3F5F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Search & Topic Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search FAQ topics (e.g. balance release, JEVIC, DHL, container, LHD)..."
                aria-label="Search buyer FAQ"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion Questions */}
          {visibleItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-[#0B1F3A] mx-auto" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                No FAQ entries matched your search
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Topics');
                  setQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? '' : item.id)}
                      aria-expanded={isOpen}
                      className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#C81E1E]">
                          {item.category}
                        </div>
                        <h3 className="font-display text-base font-bold text-[#0B1F3A]">
                          {item.question}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-[#C81E1E]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct Support CTA */}
          <div className="bg-[#0B1F3A] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h3 className="font-display text-xl font-bold">Still have a port or customs question?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Calculate landed ocean freight or send an inquiry directly to our Yokohama export
                specialists.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/calculator')}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg cursor-pointer"
              >
                CIF Calculator
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg cursor-pointer"
              >
                <span>Ask Export Desk</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
