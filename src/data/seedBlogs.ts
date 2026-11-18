import type { BlogPost } from '../types/autoTrade.ts';

export const BLOG_COVER_PRESETS: { label: string; src: string; alt: string }[] = [
  {
    label: 'Yokohama Inspection Bay',
    src: '/src/assets/images/yokohama_inspection_bay_1794999716476.jpg',
    alt: 'Inspector verifying a white Japanese SUV engine bay at Yokohama facility',
  },
  {
    label: '40ft Container Loading',
    src: '/src/assets/images/container_bracing_loading_1794999711542.jpg',
    alt: 'Two Japanese SUVs braced with wheel straps inside a 40ft steel shipping container',
  },
  {
    label: 'Export Docs & Keys',
    src: '/src/assets/images/export_docs_handover_1794999712204.jpg',
    alt: 'Official Export Certificate folder, Bill of Lading, and OEM smart keys on desk',
  },
  {
    label: 'Port Handover Yard',
    src: '/src/assets/images/port_arrival_handover_1794999712812.jpg',
    alt: 'Pearl-white hybrid SUV and silver 4WD pickup staged at coastal destination port',
  },
  {
    label: 'RoRo Vessel Carrier',
    src: '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
    alt: 'Global RoRo vehicle carrier vessel docked at loading berth',
  },
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-auction-sheet-guide',
    slug: 'how-to-read-a-japanese-auction-sheet',
    title: 'How to Read a Japanese Auction Sheet Before Booking Your Next Car',
    excerpt:
      'Learn what USS and TAA inspection grades (5, 4.5, 4.0, R), exterior panel codes, and odometer checks tell you before reserving an export unit.',
    content: `Every genuine vehicle sourced through Japanese auto auctions carries a one-page inspection sheet completed by an independent auction inspector before bidding starts. Understanding those grades protects buyers from hidden repainting, frame repairs, or odometer discrepancies.

## Overall Auction Grades Explained

- **Grade 5 / S**: Virtually new showroom condition with ultra-low mileage and original factory panels.
- **Grade 4.5**: The sweet spot for export buyers—original paint, clean mechanical operation, and at most minor pinpoint blemishes.
- **Grade 4.0**: Mechanically solid daily-driver condition with light bumper scuffs or minor normal wear.
- **Grade R / RA**: Indicates prior panel replacement or repaired structural damage. At PJS Ventures, our direct yard stock focuses strictly on verified Grade 4.0 to 5.0 non-accident units.

## Decoding Exterior Diagram Marks

On the vehicle outline map, inspectors mark panel blemishes with a letter and severity number from 1 (tiny, barely visible) to 3 or 4 (noticeable):

- **A1 / A2**: Light surface scratch or clear-coat mark.
- **U1 / U2**: Small parking dent or shallow dimple.
- **W1 / W2**: Slight wave indicating a clean cosmetic respray on that panel.
- **XX**: Replaced exterior bolt-on panel such as a fender or door skin.

## Interior Sub-Scores & Mileage Verification

Look in the top right box for interior grades **A** (spotless, non-smoking cabin) or **B** (clean light use). Every vehicle exported by PJS Ventures also completes a JEVIC / QISJ odometer check and calibrated radiation screening prior to Yokohama vessel boarding.`,
    category: 'Auction Tips',
    authorName: 'PJS Ventures Inspection Desk',
    readTimeMinutes: 4,
    coverImage: '/src/assets/images/yokohama_inspection_bay_1794999716476.jpg',
    coverImageAlt: 'Japanese export inspector checking engine bay inside Yokohama yard',
    status: 'Published',
    createdAt: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'blog-roro-vs-container-shipping',
    slug: 'roro-vs-container-shipping-guide',
    title: 'RoRo Vessel vs. 20ft & 40ft Container Shipping: Which Is Best for Your Port?',
    excerpt:
      'Compare freight cost, port transit schedules, and steel-braced container protection when shipping Japanese SUVs, hybrids, and pickups.',
    content: `Once you reserve a vehicle at Yokohama, Nagoya, or Kobe, the next step is choosing between Roll-on / Roll-off (RoRo) carrier vessels and steel shipping containers. Both move weekly to major global ports, but each fits different buyer needs.

## When Roll-on / Roll-off (RoRo) Makes Sense

RoRo vessels are floating multi-deck car parks designed strictly for drivable vehicles. Your car is driven smoothly onto a weather-sealed below-deck bay and lashed down for the ocean voyage.

- **Lowest per-unit freight rate**: Ideal for single passenger cars, SUVs, and pickups.
- **Faster port turnarounds**: Vehicles drive straight off at Nassau, Kingston, Mombasa, Dar es Salaam, Southampton, or Auckland without container devanning fees.

## When Container Shipping Is Better

Some island destinations or multi-unit dealership orders benefit from 20ft or 40ft high-cube containers loaded inside Yokohama port terminals.

- **Protected multi-car bundling**: A 40ft high-cube container securely carries 2 to 4 vehicles on steel loading ramps with foam door padding.
- **Parts & spare tires allowed**: Unlike RoRo (which requires completely empty cabins), sealed containers can hold loose spare tires or boxed accessories inside the vehicle.

## Use Our CIF Calculator Before Booking

Open our Freight & CIF Calculator anytime to compare instant RoRo, 20ft container, and 40ft shared container rates across all 30+ supported destination ports.`,
    category: 'Port & Customs',
    authorName: 'PJS Logistics Team',
    readTimeMinutes: 4,
    coverImage: '/src/assets/images/container_bracing_loading_1794999711542.jpg',
    coverImageAlt: 'Japanese SUVs and wagons secured with steel ramps and wheel straps inside a 40ft container',
    status: 'Published',
    createdAt: '2026-11-12T11:30:00.000Z',
  },
  {
    id: 'blog-port-balance-release-explained',
    slug: 'port-balance-release-deals-explained',
    title: 'Port Balance-Release Deals: How to Clear In-Transit Vehicles & Save Prior Deposits',
    excerpt:
      'See how buyers at destination ports claim already-shipped vehicles by settling only the remaining balance due while inheriting the original buyer deposit.',
    content: `Occasionally, a vehicle already sailing toward a destination port becomes available when the original booking party cannot complete final balance settlement before vessel arrival. Rather than shipping the car back to Japan, PJS Ventures releases the unit locally at the destination port.

## How Balance-Release Pricing Works

Suppose a 2022 Toyota Land Cruiser Prado carries a full CIF landed value of $28,500 USD and the initial buyer already settled a $12,000 USD deposit prior to sailing. When cleared for release at the port, a local buyer pays only the **$16,500 USD remaining balance**—receiving the benefit of the prior deposit.

## Immediate Customs Clearance & DHL Paperwork

Because these units are already on the water or staged at the destination terminal, there is zero 4-to-6-week ocean waiting window.

- **Bill of Lading (B/L) Re-Assignment**: Our Tokyo documentation desk re-issues or endorses the B/L directly into the new buyer name.
- **Original Export Certificate**: Dispatched immediately via tracked DHL Express alongside invoice and inspection paperwork.
- **Port Customs Inspection**: Vehicles remain sealed at port customs ready for standard duty settlement and pickup.

## Checking Current Port Arrivals

Visit the Port Deals section to filter active in-transit and port-staged balance-release vehicles by destination port, ETA date, and remaining balance due.`,
    category: 'Import Guides',
    authorName: 'PJS Trade Advisory',
    readTimeMinutes: 3,
    coverImage: '/src/assets/images/export_docs_handover_1794999712204.jpg',
    coverImageAlt: 'Stamped Export Certificate, Bill of Lading documents, and car key fobs on oak desk',
    status: 'Published',
    createdAt: '2026-11-15T14:15:00.000Z',
  },
];
