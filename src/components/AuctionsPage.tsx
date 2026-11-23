import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, FileSpreadsheet, Gavel, ShieldCheck } from 'lucide-react';
import type { AppRoute } from './Navbar';
import { PageBanner } from './PageBanner';
import { ResilientImage } from './ResilientImage';

interface AuctionsPageProps {
  onNavigate: (route: AppRoute) => void;
}

type AuctionDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

interface AuctionVenue {
  day: AuctionDay;
  name: string;
  region: string;
  avgLots: string;
  specialty: string;
}

const AUCTION_DAYS: AuctionDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const AUCTION_SCHEDULE: AuctionVenue[] = [
  {
    day: 'Monday',
    name: 'AUCNET Live Bidding',
    region: 'Nationwide Japan',
    avgLots: '12,000+ lots',
    specialty: 'Certified direct-dealer SUVs, hybrids & low-km sedans',
  },
  {
    day: 'Monday',
    name: 'Honda AA Kansai / Tokyo',
    region: 'Kanto & Kansai',
    avgLots: '4,200+ lots',
    specialty: 'Honda Fit e:HEV, Vezel, CR-V, Stepwgn & Freed',
  },
  {
    day: 'Tuesday',
    name: 'TAA Yokohama & Kinki',
    region: 'Toyota Auto Auction',
    avgLots: '9,500+ lots',
    specialty: 'Toyota Prado, Corolla, Hilux, Crown & Lexus stock',
  },
  {
    day: 'Tuesday',
    name: 'USS Yokohama',
    region: 'Kanagawa Export Zone',
    avgLots: '7,800+ lots',
    specialty: 'Grade 4.0–4.5 export units minutes from Yokohama port',
  },
  {
    day: 'Wednesday',
    name: 'USS Kobe & BCN',
    region: 'Kansai / Kanto',
    avgLots: '11,000+ lots',
    specialty: 'Clean coastal stock, compact hatchbacks & commercial vans',
  },
  {
    day: 'Wednesday',
    name: 'CAA Chubu (Nagoya)',
    region: 'Aichi Prefecture',
    avgLots: '6,400+ lots',
    specialty: 'Toyota factory region SUVs, hybrids & pickups',
  },
  {
    day: 'Thursday',
    name: 'USS Tokyo (Noda)',
    region: 'Largest Auction in Japan',
    avgLots: '18,000+ lots',
    specialty: 'Every Japanese & European export class across 16 lanes',
  },
  {
    day: 'Thursday',
    name: 'TAA Hiroshima & Kyushu',
    region: 'Western Japan',
    avgLots: '4,600+ lots',
    specialty: 'Rust-free warm-climate SUVs, pickups & kei trucks',
  },
  {
    day: 'Friday',
    name: 'USS Nagoya',
    region: 'Chubu Export Hub',
    avgLots: '11,500+ lots',
    specialty: 'High-grade Toyota/Lexus fleet & 4x4 commercial units',
  },
  {
    day: 'Friday',
    name: 'JU Saitama / Aichi',
    region: 'Dealer Federation',
    avgLots: '4,800+ lots',
    specialty: 'One-owner trade-in hybrids, sedans & family MPVs',
  },
  {
    day: 'Saturday',
    name: 'HAA Kobe (Hyogo)',
    region: 'Kansai Port Hub',
    avgLots: '10,200+ lots',
    specialty: 'High-grade luxury SUVs, executive sedans & JDM performance',
  },
  {
    day: 'Saturday',
    name: 'USS Kyushu & Gunma',
    region: 'Regional Hubs',
    avgLots: '5,900+ lots',
    specialty: 'Work pickups, HiAce commuters & compact commuter hybrids',
  },
];

const AUCTION_MARKS = [
  { code: 'A1 / A2 / A3', meaning: 'Light to noticeable exterior paint scratch (A1 barely visible)' },
  { code: 'U1 / U2 / U3', meaning: 'Small pin dent to moderate panel dent (U1 minor dimple)' },
  { code: 'W1 / W2 / W3', meaning: 'Panel wave or prior repair repaint (inspected for finish)' },
  { code: 'S1 / S2', meaning: 'Light underbody or surface rust notation (monitored for island export)' },
  { code: 'X / XX', meaning: 'Panel replaced with factory or OEM part (X minor, XX replaced)' },
  { code: 'Grade 4.5 / 5', meaning: 'Top-tier clean auction rating with verified genuine mileage' },
];

export function AuctionsPage({ onNavigate }: AuctionsPageProps) {
  const [selectedDay, setSelectedDay] = useState<'All' | AuctionDay>('All');

  const filteredSchedule = useMemo(() => {
    if (selectedDay === 'All') return AUCTION_SCHEDULE;
    return AUCTION_SCHEDULE.filter((item) => item.day === selectedDay);
  }, [selectedDay]);

  return (
    <div>
      <PageBanner
        breadcrumb="PJS Ventures · Japan Live Auction Access"
        title="Direct Japanese Auto Auction Bidding — USS, TAA, HAA & JU"
        subtitle="Beyond our ready yard inventory, bid directly across 120+ live Japanese auction halls every Monday to Saturday with verified sheet translation and transparent FOB + freight bidding limits."
      />

      {/* Bidding Workflow & Photo Highlight */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C81E1E]">
              <span className="w-4 h-0.5 bg-[#C81E1E]" aria-hidden="true" />
              <span>Custom Auction Proxy Desk</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1F3A]">
              How Our Yokohama Auction Buyers Bid On Your Exact Budget
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every week over 100,000 vehicles cross Japanese dealer-only lanes. Our licensed buyers
              in Yokohama, Nagoya, and Kobe translate the inspection sheet, check live underbody
              condition before bidding, and cap your hammer price strictly at your pre-approved
              budget.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#C81E1E] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">Full Auction Sheet Translation:</strong> Receive
                  an English breakdown of inspector notes, paint depth, and genuine odometer check
                  prior to bidding.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#C81E1E] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">100% Refundable Bidding Security:</strong> If
                  your target lot sells above your max bid, your deposit stays open for another unit
                  or refunds in full.
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#C81E1E] shrink-0 mt-1" aria-hidden="true" />
                <span>
                  <strong className="text-[#0B1F3A]">Direct Yard Staging:</strong> Won vehicles are
                  transported within 48 hours to our Yokohama or Kobe yard for JEVIC &amp; RoRo
                  loading.
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/book')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg transition-colors cursor-pointer"
              >
                <Gavel className="w-4 h-4" aria-hidden="true" />
                <span>Request Custom Auction Bid</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/inventory')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Browse Ready Yard Stock</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <div className="aspect-[16/10] w-full">
                <ResilientImage
                  src="/src/assets/images/yokohama_inspection_bay_1794999716476.jpg"
                  alt="Licensed Yokohama auction buyer inspecting vehicle underhood and chassis plate"
                  fallbackTitle="Yokohama Auction Inspection Bay"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 bg-[#0B1F3A] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium">USS · TAA · HAA · JU · CAA Auction Member</span>
                <span className="font-mono text-slate-300">Mon–Sat Live Bidding</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Japanese Auction Calendar */}
      <section className="py-12 sm:py-16 bg-[#F3F5F8] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C81E1E] mb-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Weekly Auction Schedule</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1F3A]">
                Major Japanese Auction Houses by Day
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDay('All')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  selectedDay === 'All'
                    ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                All Days
              </button>
              {AUCTION_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    selectedDay === day
                      ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0B1F3A] text-white text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Day</th>
                    <th className="py-3.5 px-4 font-semibold">Auction House</th>
                    <th className="py-3.5 px-4 font-semibold">Location / Network</th>
                    <th className="py-3.5 px-4 font-semibold">Weekly Volume</th>
                    <th className="py-3.5 px-4 font-semibold">Primary Export Models</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSchedule.map((venue) => (
                    <tr key={`${venue.day}-${venue.name}`} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#C81E1E] whitespace-nowrap">
                        {venue.day}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0B1F3A] whitespace-nowrap">
                        {venue.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{venue.region}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {venue.avgLots}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{venue.specialty}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate('/book')}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded cursor-pointer"
                        >
                          Request Bid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Auction Sheet Inspection Marks Guide */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C81E1E] mb-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Inspection Sheet Decoder</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1F3A]">
                Common Japanese Auction Sheet Codes Explained
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/how-to-buy')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A] hover:text-[#C81E1E] hover:underline underline-offset-4 cursor-pointer"
            >
              <span>Full Grade &amp; Export Guide</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUCTION_MARKS.map((mark) => (
              <div
                key={mark.code}
                className="p-5 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-1.5"
              >
                <div className="font-mono text-base font-bold text-[#0B1F3A]">{mark.code}</div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{mark.meaning}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-xl bg-[#0B1F3A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display text-base font-bold">
                  Looking for a specific chassis, mileage, or auction grade?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Send your target vehicle &amp; port to receive upcoming USS &amp; TAA lot options
                  within hours.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/book')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Submit Auction Order
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
