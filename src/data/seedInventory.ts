import type {
  AutoCurrency,
  BookingRequest,
  DestinationPort,
  ExportStep,
  ExportVehicle,
  PortTrackingStage,
  ShippingTransitInfo,
  UnloadingVideo,
} from '../types/autoTrade.ts';

export const AUTO_HERO_MEDIA = {
  src: '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
  alt: 'PJS Ventures export inspection facility in Yokohama preparing Japanese vehicles for Caribbean shipment.',
};

export const RORO_PORT_MEDIA = {
  src: '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
  alt: 'RoRo vehicle carrier vessel at Yokohama terminal loading passenger cars and 4x4 pickups bound for the Caribbean.',
};

export const TRADE_METRICS = [
  { label: 'Global Destination Ports', value: '30+ Ports' },
  { label: 'Japan / UAE Export Sailings', value: 'Weekly RoRo' },
  { label: 'Verified Auction Grades', value: '4.0–5.0' },
  { label: 'Port-Balance Savings (Select Units)', value: 'Up to 45%' },
];

export const PORT_REGIONS: (
  | 'Caribbean & Americas'
  | 'Africa'
  | 'Europe & UK'
  | 'Asia & Middle East'
  | 'Oceania & Pacific'
)[] = [
  'Caribbean & Americas',
  'Africa',
  'Europe & UK',
  'Asia & Middle East',
  'Oceania & Pacific',
];

export const DESTINATION_PORTS: DestinationPort[] = [
  // Caribbean & Americas
  {
    id: 'nassau',
    name: 'Port of Nassau (Arawak Cay)',
    country: 'Bahamas',
    freightCountry: 'Bahamas',
    region: 'Caribbean & Americas',
    regionTag: 'Near US · 180 mi from Miami',
    transitDays: '26–32 days',
    roroUsd: 1490,
    container20Usd: 2680,
    container40SharedUsd: 1320,
    complianceNote:
      'Popular RHD & LHD Japanese imports for New Providence & Family Islands; clear customs with Japanese Export Certificate.',
  },
  {
    id: 'freeport',
    name: 'Freeport Container Port',
    country: 'Grand Bahama, Bahamas',
    freightCountry: 'Bahamas',
    region: 'Caribbean & Americas',
    regionTag: 'Near US · 85 mi from Florida',
    transitDays: '25–31 days',
    roroUsd: 1450,
    container20Usd: 2620,
    container40SharedUsd: 1290,
    complianceNote:
      'Direct Bahamas customs clearance or duty-free bonded transshipment hub.',
  },
  {
    id: 'kingston',
    name: 'Port of Kingston',
    country: 'Jamaica',
    freightCountry: 'Jamaica',
    region: 'Caribbean & Americas',
    regionTag: 'Western Caribbean Hub',
    transitDays: '28–34 days',
    roroUsd: 1560,
    container20Usd: 2840,
    container40SharedUsd: 1390,
    complianceNote:
      'JEVIC pre-export inspection cleared in Yokohama; Trade Board import license ready.',
  },
  {
    id: 'george-town',
    name: 'George Town Port',
    country: 'Cayman Islands',
    freightCountry: 'Cayman Islands',
    region: 'Caribbean & Americas',
    regionTag: 'Near US · South of Cuba',
    transitDays: '29–35 days',
    roroUsd: 1640,
    container20Usd: 2980,
    container40SharedUsd: 1480,
    complianceNote:
      'DVDV & Cayman customs ready with verified odometer and deregistration certificate.',
  },
  {
    id: 'providenciales',
    name: 'South Dock Port (Providenciales)',
    country: 'Turks & Caicos',
    freightCountry: 'Turks and Caicos Islands',
    region: 'Caribbean & Americas',
    regionTag: 'Near US · Southeast Bahamas Corridor',
    transitDays: '28–34 days',
    roroUsd: 1620,
    container20Usd: 2940,
    container40SharedUsd: 1460,
    complianceNote:
      'RHD Japanese SUVs, hybrids, and commercial vans compliant with TCI Road Safety standards.',
  },
  {
    id: 'castries',
    name: 'Port Castries',
    country: 'St. Lucia',
    freightCountry: 'Saint Lucia',
    region: 'Caribbean & Americas',
    regionTag: 'Eastern Caribbean',
    transitDays: '33–39 days',
    roroUsd: 1680,
    container20Usd: 3080,
    container40SharedUsd: 1520,
    complianceNote:
      'Includes JEVIC odometer certificate; B/L re-assignment accepted at Castries Customs.',
  },
  {
    id: 'bridgetown',
    name: 'Port of Bridgetown',
    country: 'Barbados',
    freightCountry: 'Barbados',
    region: 'Caribbean & Americas',
    regionTag: 'Eastern Caribbean',
    transitDays: '32–38 days',
    roroUsd: 1620,
    container20Usd: 2960,
    container40SharedUsd: 1470,
    complianceNote:
      'Meets Barbados import regulations with full Japanese Export Certificate.',
  },
  {
    id: 'port-of-spain',
    name: 'Port of Spain',
    country: 'Trinidad & Tobago',
    freightCountry: 'Trinidad and Tobago',
    region: 'Caribbean & Americas',
    regionTag: 'Southern Caribbean',
    transitDays: '34–40 days',
    roroUsd: 1690,
    container20Usd: 3120,
    container40SharedUsd: 1540,
    complianceNote:
      'Hybrid & CNG-ready Japanese imports compliant with Trinidad Ministry of Trade rules.',
  },
  {
    id: 'georgetown-guyana',
    name: 'Port of Georgetown',
    country: 'Guyana',
    freightCountry: 'Guyana',
    region: 'Caribbean & Americas',
    regionTag: 'South America · CARICOM Hub',
    transitDays: '35–42 days',
    roroUsd: 1660,
    container20Usd: 3050,
    container40SharedUsd: 1510,
    complianceNote:
      'RHD SUVs, Hilux pickups, and commercial vans prepared for GRA Guyana customs clearance.',
  },
  {
    id: 'iquique',
    name: 'Port of Iquique (ZOFRI)',
    country: 'Chile',
    freightCountry: 'Chile',
    region: 'Caribbean & Americas',
    regionTag: 'South America · Free Zone Hub',
    transitDays: '30–36 days',
    roroUsd: 1520,
    container20Usd: 2790,
    container40SharedUsd: 1380,
    complianceNote:
      'High-volume South American import gateway with ZOFRI free-zone transshipment to Bolivia & Paraguay.',
  },
  {
    id: 'vancouver',
    name: 'Port of Vancouver / Halifax',
    country: 'Canada',
    freightCountry: 'Canada',
    region: 'Caribbean & Americas',
    regionTag: 'North America · 15-Yr JDM',
    transitDays: '16–22 days',
    roroUsd: 1380,
    container20Usd: 2540,
    container40SharedUsd: 1260,
    complianceNote:
      'Soil-washed & Export Certificate verified for CBSA & Transport Canada 15-year import rules.',
  },
  {
    id: 'tacoma-miami',
    name: 'Port of Tacoma / Jacksonville / Miami',
    country: 'United States',
    freightCountry: 'United States',
    region: 'Caribbean & Americas',
    regionTag: 'North America · 25-Yr & Export',
    transitDays: '18–25 days',
    roroUsd: 1420,
    container20Usd: 2590,
    container40SharedUsd: 1280,
    complianceNote:
      'Supports 25-year EPA/DOT exempt JDM classics and bonded re-export transshipment.',
  },

  // Africa
  {
    id: 'mombasa',
    name: 'Port of Mombasa',
    country: 'Kenya',
    freightCountry: 'Kenya',
    region: 'Africa',
    regionTag: 'East Africa Gateway · Transit to Uganda/Rwanda',
    transitDays: '22–28 days',
    roroUsd: 1390,
    container20Usd: 2490,
    container40SharedUsd: 1240,
    complianceNote:
      'Includes QISJ/KEBS pre-export roadworthiness inspection and 8-year Kenya age-limit verification.',
  },
  {
    id: 'dar-es-salaam',
    name: 'Port of Dar es Salaam',
    country: 'Tanzania',
    freightCountry: 'Tanzania',
    region: 'Africa',
    regionTag: 'East & Central Africa · Zambia/DRC Corridor',
    transitDays: '23–29 days',
    roroUsd: 1420,
    container20Usd: 2560,
    container40SharedUsd: 1270,
    complianceNote:
      'EAA/TBS PVoC inspection arranged in Japan; serves Tanzania, Zambia, Malawi, and DR Congo.',
  },
  {
    id: 'durban',
    name: 'Port of Durban',
    country: 'South Africa',
    freightCountry: 'South Africa',
    region: 'Africa',
    regionTag: 'Southern Africa · Botswana/Zimbabwe Hub',
    transitDays: '24–30 days',
    roroUsd: 1380,
    container20Usd: 2480,
    container40SharedUsd: 1220,
    complianceNote:
      'Direct RoRo carrier terminal with bonded inland rail/carrier transit to Zimbabwe, Botswana & Zambia.',
  },
  {
    id: 'walvis-bay',
    name: 'Port of Walvis Bay',
    country: 'Namibia',
    freightCountry: 'Namibia',
    region: 'Africa',
    regionTag: 'Southwest Africa · SADC Corridor',
    transitDays: '27–33 days',
    roroUsd: 1460,
    container20Usd: 2640,
    container40SharedUsd: 1310,
    complianceNote:
      'Fast customs release for Namibia, Angola, Botswana, and Southern Africa overland delivery.',
  },
  {
    id: 'maputo',
    name: 'Port of Maputo',
    country: 'Mozambique',
    freightCountry: 'Mozambique',
    region: 'Africa',
    regionTag: 'Southeast Africa · RHD Corridor',
    transitDays: '24–30 days',
    roroUsd: 1440,
    container20Usd: 2590,
    container40SharedUsd: 1290,
    complianceNote:
      'Intertek / JEVIC pre-shipment inspected for Mozambique and Zimbabwe overland buyers.',
  },
  {
    id: 'tema',
    name: 'Port of Tema',
    country: 'Ghana',
    freightCountry: 'Ghana',
    region: 'Africa',
    regionTag: 'West Africa · LHD Hub',
    transitDays: '31–37 days',
    roroUsd: 1520,
    container20Usd: 2740,
    container40SharedUsd: 1360,
    complianceNote:
      'Supports LHD sourced stock from UAE/USA/Korea alongside container-loaded commercial shipments.',
  },
  {
    id: 'lagos',
    name: 'Tin Can Island Port, Lagos',
    country: 'Nigeria',
    freightCountry: 'Nigeria',
    region: 'Africa',
    regionTag: 'West Africa · LHD Hub',
    transitDays: '31–38 days',
    roroUsd: 1540,
    container20Usd: 2780,
    container40SharedUsd: 1380,
    complianceNote:
      'Pre-cleared Form M / PAAR documentation support for LHD sedans, SUVs, and pickups.',
  },

  // Europe & UK
  {
    id: 'southampton',
    name: 'Port of Southampton',
    country: 'United Kingdom',
    freightCountry: 'United Kingdom',
    region: 'Europe & UK',
    regionTag: 'UK · Weekly JDM & Hybrid Arrivals',
    transitDays: '32–38 days',
    roroUsd: 1440,
    container20Usd: 2620,
    container40SharedUsd: 1290,
    complianceNote:
      'Full Japanese Export Certificate & NOVA customs agent handover for UK IVA/MOT registration.',
  },
  {
    id: 'dublin',
    name: 'Port of Dublin',
    country: 'Ireland',
    freightCountry: 'Ireland',
    region: 'Europe & UK',
    regionTag: 'EU / RHD · Hybrid & MPV Hub',
    transitDays: '34–40 days',
    roroUsd: 1480,
    container20Usd: 2690,
    container40SharedUsd: 1330,
    complianceNote:
      'Ideal for low-mileage Japanese hybrids, Fit/Corolla/Vezel & family MPVs ready for NCT/VRT clearance.',
  },
  {
    id: 'limassol',
    name: 'Port of Limassol',
    country: 'Cyprus',
    freightCountry: 'Cyprus',
    region: 'Europe & UK',
    regionTag: 'Eastern Mediterranean · EU RHD',
    transitDays: '26–32 days',
    roroUsd: 1450,
    container20Usd: 2640,
    container40SharedUsd: 1300,
    complianceNote:
      'Under-5-year EU RHD import documentation & SVA type-approval records prepared.',
  },
  {
    id: 'poti',
    name: 'Port of Poti',
    country: 'Georgia',
    freightCountry: 'Georgia',
    region: 'Europe & UK',
    regionTag: 'Black Sea · Caucasus & CIS Hub',
    transitDays: '32–39 days',
    roroUsd: 1560,
    container20Usd: 2820,
    container40SharedUsd: 1390,
    complianceNote:
      'Containerized shipments serving Georgia, Armenia, Azerbaijan, and Kazakhstan dealers.',
  },
  {
    id: 'rotterdam',
    name: 'Port of Rotterdam',
    country: 'Netherlands',
    freightCountry: 'Netherlands',
    region: 'Europe & UK',
    regionTag: 'Continental EU Gateway',
    transitDays: '32–38 days',
    roroUsd: 1420,
    container20Usd: 2580,
    container40SharedUsd: 1270,
    complianceNote:
      'Main continental Europe RoRo and container consolidation port for classic JDM & commercial vans.',
  },

  // Asia & Middle East
  {
    id: 'jebel-ali',
    name: 'Port Jebel Ali, Dubai',
    country: 'United Arab Emirates',
    freightCountry: 'United Arab Emirates',
    region: 'Asia & Middle East',
    regionTag: 'GCC · Re-Export Free Zone',
    transitDays: '20–26 days',
    roroUsd: 1180,
    container20Usd: 2150,
    container40SharedUsd: 1090,
    complianceNote:
      'Dual-direction hub for GCC dealers, LHD sourcing, and DUCAMZ re-export yards.',
  },
  {
    id: 'hambantota',
    name: 'Port of Hambantota / Colombo',
    country: 'Sri Lanka',
    freightCountry: 'Sri Lanka',
    region: 'Asia & Middle East',
    regionTag: 'South Asia · JEVIC Certified',
    transitDays: '16–22 days',
    roroUsd: 1210,
    container20Usd: 2220,
    container40SharedUsd: 1120,
    complianceNote:
      'JEVIC roadworthiness & odometer check completed prior to vessel loading.',
  },
  {
    id: 'chattogram',
    name: 'Port of Chattogram / Mongla',
    country: 'Bangladesh',
    freightCountry: 'Bangladesh',
    region: 'Asia & Middle East',
    regionTag: 'South Asia · Hybrid & MPV Hub',
    transitDays: '16–22 days',
    roroUsd: 1220,
    container20Usd: 2240,
    container40SharedUsd: 1140,
    complianceNote:
      'JAAI inspection and 5-year age rule verified for Toyota Premio, Axio, Noah, and Harrier.',
  },
  {
    id: 'port-klang',
    name: 'Port Klang',
    country: 'Malaysia',
    freightCountry: 'Malaysia',
    region: 'Asia & Middle East',
    regionTag: 'Southeast Asia · AP Dealer Hub',
    transitDays: '10–14 days',
    roroUsd: 1090,
    container20Usd: 1980,
    container40SharedUsd: 990,
    complianceNote:
      'High-grade 4.5–5.0 Alphard, Vellfire, Civic & Porsche/SUV units prepared for AP clearance.',
  },

  // Oceania & Pacific
  {
    id: 'auckland',
    name: 'Ports of Auckland / Tauranga',
    country: 'New Zealand',
    freightCountry: 'New Zealand',
    region: 'Oceania & Pacific',
    regionTag: 'Oceania · MPI Biosecurity Ready',
    transitDays: '15–21 days',
    roroUsd: 1290,
    container20Usd: 2340,
    container40SharedUsd: 1180,
    complianceNote:
      'JEVIC biosecurity heat-treatment, BMSB fumigation, and NZTA ESC compliance handled in Japan.',
  },
  {
    id: 'brisbane-sydney',
    name: 'Port of Brisbane / Sydney',
    country: 'Australia',
    freightCountry: 'Australia',
    region: 'Oceania & Pacific',
    regionTag: 'Oceania · SEVS / ROVER Ready',
    transitDays: '16–22 days',
    roroUsd: 1340,
    container20Usd: 2420,
    container40SharedUsd: 1210,
    complianceNote:
      'Prepared for Australian ROVER import approvals with strict BMSB seasonal treatment.',
  },
  {
    id: 'suva',
    name: 'Port of Suva',
    country: 'Fiji',
    freightCountry: 'Fiji',
    region: 'Oceania & Pacific',
    regionTag: 'Pacific Islands · Hybrid & 4WD Hub',
    transitDays: '18–24 days',
    roroUsd: 1440,
    container20Usd: 2590,
    container40SharedUsd: 1290,
    complianceNote:
      'Meets Fiji Euro-4 / Euro-5 and 5-year hybrid/8-year petrol compliance with FRCS docs.',
  },
  {
    id: 'port-moresby',
    name: 'Port Moresby / Lae',
    country: 'Papua New Guinea',
    freightCountry: 'Papua New Guinea',
    region: 'Oceania & Pacific',
    regionTag: 'Melanesia · 4WD & Commercial',
    transitDays: '16–22 days',
    roroUsd: 1410,
    container20Usd: 2540,
    container40SharedUsd: 1260,
    complianceNote:
      'Heavy-duty Land Cruiser, Hilux 4WD & Coaster units inspected for PNG customs.',
  },
];

export const INITIAL_VEHICLES: ExportVehicle[] = [
  {
    id: 'corolla-sport-2022',
    makeModel: 'Toyota Corolla Sport',
    trim: 'GZ 1.8L Hybrid',
    category: 'Hybrids',
    status: 'Available',
    year: 2022,
    mileageKm: 31800,
    chassisCode: 'ZWE213H-109842',
    engine: '1.8L E-CVT Hybrid',
    transmission: 'E-CVT Automatic',
    drive: '2WD',
    fuel: 'Hybrid',
    steering: 'RHD',
    color: 'Precious Silver Metallic',
    port: 'Yokohama Yard · Ships to Caribbean',
    fobUsd: 16400,
    cbm: 11.6,
    image: '/src/assets/images/auto_hybrid_aqua_1794825334004.jpg',
    images: [
      '/src/assets/images/auto_hybrid_aqua_1794825334004.jpg',
      '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
      '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
    ],
    imageAlt: '2022 Silver Toyota Corolla Sport Hybrid ready for Caribbean import booking.',
    createdAt: '2026-11-10T09:00:00.000Z',
    transit: {
      dealType: 'direct-import',
      destinationPortId: 'nassau',
      destinationPortLabel: 'Ships to Nassau, Kingston & Caribbean',
      vesselName: 'Next Weekly RoRo Sailing',
      arrivalStatus: 'Ready to Book · Yokohama Yard',
      fullCifUsd: 17890,
      priorDepositUsd: 0,
      balanceDueUsd: 17890,
      blStatus: 'Bill of Lading issued directly in your name upon booking',
    },
    inspection: {
      auctionHouse: 'TAA Yokohama',
      lotNumber: '11904',
      overallGrade: '4.5',
      exteriorGrade: 'B',
      interiorGrade: 'A',
      odometerVerified: true,
      radiationCheck: 'Cleared · 0.05 µSv/h',
      inspectorSummary:
        'Clean single-owner Japanese hybrid with Toyota Safety Sense, 94% hybrid battery health, and non-smoking cabin. Ready to book for immediate Caribbean dispatch.',
      bodyNotes: [
        'U1 micro-dimple on passenger rear door (no paint break)',
        '18-inch factory alloy wheels and LED headlamps intact',
        'Eligible for Nassau, Freeport, Kingston, Cayman & OECS ports',
      ],
    },
  },
  {
    id: 'lx600-executive-2023',
    makeModel: 'Lexus LX / Land Cruiser',
    trim: '300 Series Executive 4x4',
    category: 'SUVs & 4x4',
    status: 'Available',
    year: 2023,
    mileageKm: 18400,
    chassisCode: 'VJA310W-004192',
    engine: '3.5L V6 Twin-Turbo',
    transmission: '10-Speed Automatic',
    drive: '4WD',
    fuel: 'Petrol',
    steering: 'RHD',
    color: 'Sonic Quartz White',
    port: 'Yokohama Yard · Ships to Caribbean',
    fobUsd: 68500,
    cbm: 16.4,
    image: '/src/assets/images/auto_suv_prado_1794825333513.jpg',
    images: [
      '/src/assets/images/auto_suv_prado_1794825333513.jpg',
      '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
      '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
    ],
    imageAlt: '2023 Pearl White Japanese 4x4 luxury SUV ready for Caribbean booking.',
    createdAt: '2026-11-11T09:00:00.000Z',
    transit: {
      dealType: 'direct-import',
      destinationPortId: 'george-town',
      destinationPortLabel: 'Ships to Cayman, Bahamas & Barbados',
      vesselName: 'Weekly RoRo or 20ft Container',
      arrivalStatus: 'Ready to Book · Yokohama Yard',
      fullCifUsd: 70140,
      priorDepositUsd: 0,
      balanceDueUsd: 70140,
      blStatus: 'Original Export Certificate & B/L issued to buyer',
    },
    inspection: {
      auctionHouse: 'USS Tokyo',
      lotNumber: '48219',
      overallGrade: '4.5',
      exteriorGrade: 'A',
      interiorGrade: 'A',
      odometerVerified: true,
      radiationCheck: 'Cleared · 0.06 µSv/h',
      inspectorSummary:
        'Flagship 4x4 SUV sourced from Tokyo corporate lease. Original factory paint across all panels, zero underbody corrosion, both smart keys included.',
      bodyNotes: [
        'A1 hairline scuff on rear bumper corner',
        '360-degree camera, adaptive suspension, and cool box verified',
        'Recommended 20ft enclosed container shipping available to Cayman & Bahamas',
      ],
    },
  },
  {
    id: 'lexus-ls500h-2021',
    makeModel: 'Lexus LS 500h',
    trim: 'Version L Multi-Stage Hybrid',
    category: 'Sedans',
    status: 'Available',
    year: 2021,
    mileageKm: 29500,
    chassisCode: 'GVF50-003811',
    engine: '3.5L V6 Multi-Stage Hybrid',
    transmission: '10-Speed Multi-Stage',
    drive: '2WD',
    fuel: 'Hybrid',
    steering: 'RHD',
    color: 'Obsidian Graphite Black',
    port: 'Kobe Yard · Ships to Caribbean',
    fobUsd: 41200,
    cbm: 12.8,
    image: '/src/assets/images/auto_sedan_crown_1794825335274.jpg',
    images: [
      '/src/assets/images/auto_sedan_crown_1794825335274.jpg',
      '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
      '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
    ],
    imageAlt: '2021 Obsidian Black Lexus LS 500h executive sedan available to book.',
    createdAt: '2026-11-12T09:00:00.000Z',
    transit: {
      dealType: 'direct-import',
      destinationPortId: 'bridgetown',
      destinationPortLabel: 'Ships to Barbados, Trinidad & Nassau',
      vesselName: 'Weekly RoRo Sailing',
      arrivalStatus: 'Ready to Book · Kobe Yard',
      fullCifUsd: 42820,
      priorDepositUsd: 0,
      balanceDueUsd: 42820,
      blStatus: 'Direct B/L & Export Certificate upon booking',
    },
    inspection: {
      auctionHouse: 'HAA Kobe',
      lotNumber: '30517',
      overallGrade: '4.5',
      exteriorGrade: 'A',
      interiorGrade: 'A',
      odometerVerified: true,
      radiationCheck: 'Cleared · 0.04 µSv/h',
      inspectorSummary:
        'Chauffeur-maintained executive hybrid with semi-aniline leather, rear ottoman seating, and full dealer service records.',
      bodyNotes: [
        'Zero panel repaints confirmed by paint-depth gauge',
        'Mark Levinson audio, soft-close doors, and HUD verified',
        'Ready for immediate export deregistration',
      ],
    },
  },
  {
    id: 'hilux-revo-kingston-balance',
    makeModel: 'Toyota Hilux Revo',
    trim: 'Z GR-Sport Double Cab 4WD',
    category: 'Commercial',
    status: 'In Transit',
    year: 2022,
    mileageKm: 42100,
    chassisCode: 'GUN125-772019',
    engine: '2.4L 2GD-FTV Turbo Diesel',
    transmission: '6-Speed Automatic',
    drive: '4WD',
    fuel: 'Diesel',
    steering: 'RHD',
    color: 'Attitude Graphite Grey',
    port: 'Arrived · Port of Kingston',
    fobUsd: 29800,
    cbm: 16.8,
    image: '/src/assets/images/auto_pickup_hilux_1794825334855.jpg',
    images: [
      '/src/assets/images/auto_pickup_hilux_1794825334855.jpg',
      '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
      '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
    ],
    imageAlt: '2022 Graphite Grey Toyota Hilux 4WD Double Cab available on balance release at Kingston.',
    createdAt: '2026-11-13T09:00:00.000Z',
    transit: {
      dealType: 'balance-release',
      destinationPortId: 'kingston',
      destinationPortLabel: 'Port of Kingston, Jamaica',
      vesselName: 'MV Morning Lily',
      arrivalStatus: 'Docked at Port of Kingston · Ready for Clearance',
      trackingStage: 'At Port',
      etaDate: '2026-11-18',
      fullCifUsd: 31360,
      priorDepositUsd: 14160,
      balanceDueUsd: 17200,
      blStatus: 'Express B/L re-assignment within 24 hours of balance payment',
    },
    inspection: {
      auctionHouse: 'USS Nagoya',
      lotNumber: '62038',
      overallGrade: '4.0',
      exteriorGrade: 'B',
      interiorGrade: 'B',
      odometerVerified: true,
      radiationCheck: 'Cleared · 0.05 µSv/h',
      inspectorSummary:
        'Special Port Balance-Release unit: prior buyer paid $14,160 deposit before defaulting on final payment. Already landed in Kingston—settle remaining $17,200 to clear and drive.',
      bodyNotes: [
        'Clean frame rails with zero corrosion',
        'BFGoodrich all-terrain tires fitted at 34,000 km',
        'Available exclusively for immediate Jamaica Customs clearance',
      ],
    },
  },
  {
    id: 'hiace-nassau-balance',
    makeModel: 'Toyota HiAce Van',
    trim: 'DX GL Long High-Roof 4WD',
    category: 'Commercial',
    status: 'In Transit',
    year: 2021,
    mileageKm: 56900,
    chassisCode: 'GDH206V-801442',
    engine: '2.8L 1GD-FTV Clean Diesel',
    transmission: '6-Speed Automatic',
    drive: '4WD',
    fuel: 'Diesel',
    steering: 'RHD',
    color: 'Arctic Solid White',
    port: 'At Sea · Port of Nassau',
    fobUsd: 21900,
    cbm: 19.6,
    image: '/src/assets/images/auto_van_hiace_1794825335037.jpg',
    images: [
      '/src/assets/images/auto_van_hiace_1794825335037.jpg',
      '/src/assets/images/auto_roro_shipping_1794825335205.jpg',
      '/src/assets/images/auto_hero_showroom_1794825334875.jpg',
    ],
    imageAlt: '2021 White Toyota HiAce commercial van sailing toward Nassau, Bahamas.',
    createdAt: '2026-11-14T09:00:00.000Z',
    transit: {
      dealType: 'balance-release',
      destinationPortId: 'nassau',
      destinationPortLabel: 'Port of Nassau, Bahamas',
      vesselName: 'MV Hoegh Trigger',
      arrivalStatus: 'Sailed from Yokohama · En Route to Nassau',
      trackingStage: 'In Transit',
      etaDate: '2026-11-24',
      fullCifUsd: 23390,
      priorDepositUsd: 10500,
      balanceDueUsd: 12890,
      blStatus: 'Consignee amendment ready before Nassau discharge',
    },
    inspection: {
      auctionHouse: 'JU Osaka',
      lotNumber: '20891',
      overallGrade: '4.0',
      exteriorGrade: 'B',
      interiorGrade: 'B',
      odometerVerified: true,
      radiationCheck: 'Cleared · 0.05 µSv/h',
      inspectorSummary:
        'Special Port Balance-Release unit: original buyer paid $10,500 deposit before cancelling mid-transit. Pay only the remaining $12,890 and clear straight from Arawak Cay, Nassau.',
      bodyNotes: [
        'Strong 2.8L clean diesel compression and rear AC blower',
        'Light loading scuff on rear sill trim',
        'Ideal for Bahamas island shuttle, hotel transfer, or cargo fleet',
      ],
    },
  },
];

export const INITIAL_BOOKINGS: BookingRequest[] = [
  {
    id: 'bk-1042',
    vehicleId: 'corolla-sport-2022',
    vehicleTitle: '2022 Toyota Corolla Sport',
    chassisCode: 'ZWE213H-109842',
    buyerName: 'Marcus Rolle',
    buyerEmail: 'm.rolle@bahamasmobility.bs',
    buyerPhone: '+1 242 555 0183',
    destinationPortId: 'nassau',
    destinationPortName: 'Port of Nassau (Arawak Cay), Bahamas',
    requestType: 'Book Direct Japan Import',
    shippingMethod: 'RoRo Vessel',
    quotedAmountUsd: 17890,
    notes: 'Requesting proforma invoice for RoRo dispatch to Nassau next Tuesday sailing.',
    status: 'Pending Review',
    createdAt: '2026-11-15T14:20:00.000Z',
  },
];

export const EXPORT_STEPS: ExportStep[] = [
  {
    step: '01',
    title: 'Select & Book Online',
    window: 'Day 1',
    description:
      'Browse verified Japanese yard stock or special port balance-release units. Select your destination port, shipping mode, and submit a booking request.',
  },
  {
    step: '02',
    title: 'Proforma & Auction Verification',
    window: 'Day 2–3',
    description:
      'Receive the translated Japanese auction sheet, 30+ inspection photos, and official CIF proforma invoice for bank TT or deposit settlement.',
  },
  {
    step: '03',
    title: 'Export Prep & RoRo Dispatch',
    window: 'Day 5–10',
    description:
      'We complete Japanese customs deregistration, JEVIC/QISJ/radiation certification, and load your vehicle onto weekly RoRo or container vessels.',
  },
  {
    step: '04',
    title: 'DHL Documents & Port Clearance',
    window: 'Arrival',
    description:
      'Original Bill of Lading, Export Certificate, and Invoice arrive via DHL ahead of the ship so your local broker clears customs smoothly.',
  },
];

export const CURRENCY_RATES: Record<
  AutoCurrency,
  { symbol: string; rate: number; label: string }
> = {
  USD: { symbol: '$', rate: 1, label: 'USD' },
  BSD: { symbol: 'B$', rate: 1, label: 'BSD' },
  XCD: { symbol: 'EC$', rate: 2.7, label: 'XCD' },
  GBP: { symbol: '£', rate: 0.79, label: 'GBP' },
};

export function formatAutoPrice(usdAmount: number, currency: AutoCurrency): string {
  const { symbol, rate } = CURRENCY_RATES[currency];
  const converted = usdAmount * rate;
  const rounded = Math.round(converted / 10) * 10;
  return `${symbol}${rounded.toLocaleString('en-US')}`;
}

export const PORT_TRACKING_STAGES: PortTrackingStage[] = [
  'In Transit',
  'At Port',
  'Customs Clearing',
  'Ready for Pickup',
];

export function getPortTrackingStage(
  transit: Pick<ShippingTransitInfo, 'trackingStage' | 'arrivalStatus'>,
): PortTrackingStage {
  if (transit.trackingStage && PORT_TRACKING_STAGES.includes(transit.trackingStage)) {
    return transit.trackingStage;
  }
  const lower = (transit.arrivalStatus || '').toLowerCase();
  if (lower.includes('pickup') || lower.includes('ready to collect') || lower.includes('cleared')) {
    return 'Ready for Pickup';
  }
  if (lower.includes('customs') || lower.includes('clearing')) {
    return 'Customs Clearing';
  }
  if (lower.includes('docked') || lower.includes('arrived') || lower.includes('at port')) {
    return 'At Port';
  }
  return 'In Transit';
}

export function formatEtaDate(isoDate?: string): string | null {
  if (!isoDate || !isoDate.trim()) return null;
  const parsed = new Date(`${isoDate.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function getVehicleImages(vehicle: Pick<ExportVehicle, 'image' | 'images'>): string[] {
  const list = [
    ...(Array.isArray(vehicle.images) ? vehicle.images : []),
    vehicle.image,
  ].filter((src): src is string => typeof src === 'string' && src.trim().length > 0);
  return Array.from(new Set(list));
}

export const INITIAL_UNLOADING_VIDEOS: UnloadingVideo[] = [
  {
    id: 'vid-nassau-suv',
    title: '4x4 SUV Unloading from 40ft Container',
    portLabel: 'Port of Nassau, Bahamas',
    containerType: '40ft Container · Ramp Discharge',
    vehicleSummary: 'Japanese 4WD Land Cruiser / Prado Export',
    videoUrl: '/src/assets/videos/unloading_suv_nassau.mp4',
    posterUrl: '/src/assets/images/container_unload_suv_1794837300196.jpg',
    durationLabel: '0:06',
    createdAt: '2026-11-12T10:00:00.000Z',
  },
  {
    id: 'vid-kingston-hybrid',
    title: 'Hybrid Hatchback Container Roll-Out',
    portLabel: 'Port of Kingston, Jamaica',
    containerType: '20ft Container · Foam-Braced Transit',
    vehicleSummary: 'Toyota Hybrid Hatchback Arrival',
    videoUrl: '/src/assets/videos/unloading_hybrid_kingston.mp4',
    posterUrl: '/src/assets/images/container_unload_hybrid_1794837300796.jpg',
    durationLabel: '0:06',
    createdAt: '2026-11-13T10:00:00.000Z',
  },
  {
    id: 'vid-cayman-pickup',
    title: '4WD Double-Cab & Van Container Devanned',
    portLabel: 'George Town Port, Cayman Islands',
    containerType: '40ft High-Cube · Dual Steel Ramps',
    vehicleSummary: 'Toyota Hilux 4WD & Commercial Fleet',
    videoUrl: '/src/assets/videos/unloading_pickup_cayman.mp4',
    posterUrl: '/src/assets/images/container_unload_pickup_1794837300966.jpg',
    durationLabel: '0:06',
    createdAt: '2026-11-14T10:00:00.000Z',
  },
];


