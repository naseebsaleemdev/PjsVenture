import type { ExportVehicle } from '../types/autoTrade.ts';

export type FreightRegion =
  | 'Americas & Caribbean'
  | 'Asia'
  | 'Europe'
  | 'Africa'
  | 'Oceania';

export interface CountryFreightRate {
  country: string;
  label: string;
  region: FreightRegion;
  roroRatePerCbm: number | null;
  transitDays: string | null;
  mainPort: string | null;
}

export function detectVehicleOrigin(portString?: string): {
  originCountry: string;
  originRaw: string;
} {
  const raw = (portString || 'Yokohama Yard · Japan').trim();
  const lower = raw.toLowerCase();
  if (lower.includes('uae') || lower.includes('dubai') || lower.includes('jebel ali')) {
    return { originCountry: 'UAE', originRaw: raw };
  }
  if (lower.includes('usa') || lower.includes('miami') || lower.includes('los angeles')) {
    return { originCountry: 'USA', originRaw: raw };
  }
  if (lower.includes('thailand') || lower.includes('bangkok') || lower.includes('laem chabang')) {
    return { originCountry: 'Thailand', originRaw: raw };
  }
  return { originCountry: 'Japan', originRaw: raw };
}

export function getVehicleCbm(vehicle: Pick<ExportVehicle, 'category' | 'makeModel' | 'cbm'>): {
  cbm: number;
  bodyClass: string;
} {
  if (typeof vehicle.cbm === 'number' && vehicle.cbm > 0) {
    return { cbm: vehicle.cbm, bodyClass: vehicle.category };
  }
  const name = vehicle.makeModel.toLowerCase();
  if (name.includes('hiace') || name.includes('van')) {
    return { cbm: 19.6, bodyClass: 'High-Roof Commercial Van' };
  }
  if (name.includes('hilux') || name.includes('pickup') || name.includes('triton')) {
    return { cbm: 16.8, bodyClass: 'Double-Cab 4WD Pickup' };
  }
  if (vehicle.category === 'SUVs & 4x4') {
    return { cbm: 15.2, bodyClass: 'Full-Size 4x4 SUV' };
  }
  if (vehicle.category === 'Commercial') {
    return { cbm: 17.4, bodyClass: 'Commercial Utility' };
  }
  if (vehicle.category === 'Hybrids') {
    return { cbm: 11.6, bodyClass: 'Hybrid Hatchback / Wagon' };
  }
  return { cbm: 11.3, bodyClass: 'Station Wagon / Saloon' };
}

export function getCountryFromPortId(portId?: string, portLabel?: string): string {
  const map: Record<string, string> = {
    nassau: 'Bahamas',
    freeport: 'Bahamas',
    kingston: 'Jamaica',
    'george-town': 'Cayman Islands',
    providenciales: 'Turks and Caicos Islands',
    castries: 'Saint Lucia',
    bridgetown: 'Barbados',
    'port-of-spain': 'Trinidad and Tobago',
    'georgetown-guyana': 'Guyana',
    iquique: 'Chile',
    vancouver: 'Canada',
    'tacoma-miami': 'United States',
    mombasa: 'Kenya',
    'dar-es-salaam': 'Tanzania',
    durban: 'South Africa',
    'walvis-bay': 'Namibia',
    maputo: 'Mozambique',
    tema: 'Ghana',
    lagos: 'Nigeria',
    southampton: 'United Kingdom',
    dublin: 'Ireland',
    limassol: 'Cyprus',
    poti: 'Georgia',
    rotterdam: 'Netherlands',
    'jebel-ali': 'United Arab Emirates',
    hambantota: 'Sri Lanka',
    chattogram: 'Bangladesh',
    'port-klang': 'Malaysia',
    auckland: 'New Zealand',
    'brisbane-sydney': 'Australia',
    suva: 'Fiji',
    'port-moresby': 'Papua New Guinea',
  };

  if (portId && map[portId]) {
    return map[portId];
  }

  if (portLabel) {
    const lower = portLabel.toLowerCase();
    const matched = FREIGHT_COUNTRIES.find(
      (c) =>
        lower.includes(c.country.toLowerCase()) ||
        lower.includes(c.label.toLowerCase()) ||
        (c.mainPort && lower.includes(c.mainPort.toLowerCase())),
    );
    if (matched) return matched.country;
  }

  return 'Bahamas';
}

export const FREIGHT_COUNTRIES: CountryFreightRate[] = [
  // Americas & Caribbean
  { country: 'Antigua and Barbuda', label: 'Antigua & Barbuda', region: 'Americas & Caribbean', roroRatePerCbm: 132, transitDays: '32–38 days', mainPort: "St. John's Port" },
  { country: 'Argentina', label: 'Argentina', region: 'Americas & Caribbean', roroRatePerCbm: 135, transitDays: '38–45 days', mainPort: 'Port of Zarate' },
  { country: 'Bahamas', label: 'Bahamas', region: 'Americas & Caribbean', roroRatePerCbm: 118, transitDays: '26–32 days', mainPort: 'Port of Nassau / Freeport' },
  { country: 'Barbados', label: 'Barbados', region: 'Americas & Caribbean', roroRatePerCbm: 126, transitDays: '32–38 days', mainPort: 'Port of Bridgetown' },
  { country: 'Belize', label: 'Belize', region: 'Americas & Caribbean', roroRatePerCbm: 134, transitDays: '31–37 days', mainPort: 'Port of Belize City' },
  { country: 'Bolivia', label: 'Bolivia', region: 'Americas & Caribbean', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Brazil', label: 'Brazil', region: 'Americas & Caribbean', roroRatePerCbm: 138, transitDays: '36–44 days', mainPort: 'Port of Santos' },
  { country: 'Canada', label: 'Canada', region: 'Americas & Caribbean', roroRatePerCbm: 112, transitDays: '16–22 days', mainPort: 'Port of Vancouver / Halifax' },
  { country: 'Cayman Islands', label: 'Cayman Islands', region: 'Americas & Caribbean', roroRatePerCbm: 128, transitDays: '29–35 days', mainPort: 'George Town Port' },
  { country: 'Chile', label: 'Chile', region: 'Americas & Caribbean', roroRatePerCbm: 124, transitDays: '30–36 days', mainPort: 'Port of Iquique / San Antonio' },
  { country: 'Colombia', label: 'Colombia', region: 'Americas & Caribbean', roroRatePerCbm: 128, transitDays: '28–35 days', mainPort: 'Port of Cartagena' },
  { country: 'Costa Rica', label: 'Costa Rica', region: 'Americas & Caribbean', roroRatePerCbm: 126, transitDays: '27–33 days', mainPort: 'Port of Caldera' },
  { country: 'Cuba', label: 'Cuba', region: 'Americas & Caribbean', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Dominica', label: 'Dominica', region: 'Americas & Caribbean', roroRatePerCbm: 134, transitDays: '34–40 days', mainPort: 'Port of Roseau' },
  { country: 'Dominican Republic', label: 'Dominican Republic', region: 'Americas & Caribbean', roroRatePerCbm: 122, transitDays: '27–33 days', mainPort: 'Port of Caucedo' },
  { country: 'Ecuador', label: 'Ecuador', region: 'Americas & Caribbean', roroRatePerCbm: 128, transitDays: '28–34 days', mainPort: 'Port of Guayaquil' },
  { country: 'El Salvador', label: 'El Salvador', region: 'Americas & Caribbean', roroRatePerCbm: 129, transitDays: '26–32 days', mainPort: 'Port of Acajutla' },
  { country: 'Grenada', label: 'Grenada', region: 'Americas & Caribbean', roroRatePerCbm: 132, transitDays: '33–39 days', mainPort: "Port of St. George's" },
  { country: 'Guatemala', label: 'Guatemala', region: 'Americas & Caribbean', roroRatePerCbm: 127, transitDays: '26–32 days', mainPort: 'Puerto Quetzal' },
  { country: 'Guyana', label: 'Guyana', region: 'Americas & Caribbean', roroRatePerCbm: 135, transitDays: '35–42 days', mainPort: 'Port of Georgetown' },
  { country: 'Haiti', label: 'Haiti', region: 'Americas & Caribbean', roroRatePerCbm: 131, transitDays: '30–36 days', mainPort: 'Port-au-Prince' },
  { country: 'Honduras', label: 'Honduras', region: 'Americas & Caribbean', roroRatePerCbm: 129, transitDays: '29–35 days', mainPort: 'Puerto Cortes' },
  { country: 'Jamaica', label: 'Jamaica', region: 'Americas & Caribbean', roroRatePerCbm: 122, transitDays: '28–34 days', mainPort: 'Port of Kingston' },
  { country: 'Mexico', label: 'Mexico', region: 'Americas & Caribbean', roroRatePerCbm: 116, transitDays: '20–26 days', mainPort: 'Port of Manzanillo' },
  { country: 'Nicaragua', label: 'Nicaragua', region: 'Americas & Caribbean', roroRatePerCbm: 130, transitDays: '28–34 days', mainPort: 'Port of Corinto' },
  { country: 'Panama', label: 'Panama', region: 'Americas & Caribbean', roroRatePerCbm: 119, transitDays: '24–30 days', mainPort: 'Port of Manzanillo (MIT)' },
  { country: 'Paraguay', label: 'Paraguay', region: 'Americas & Caribbean', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Peru', label: 'Peru', region: 'Americas & Caribbean', roroRatePerCbm: 125, transitDays: '27–33 days', mainPort: 'Port of Callao' },
  { country: 'Saint Kitts and Nevis', label: 'Saint Kitts & Nevis', region: 'Americas & Caribbean', roroRatePerCbm: 133, transitDays: '33–39 days', mainPort: 'Port Zante, Basseterre' },
  { country: 'Saint Lucia', label: 'Saint Lucia', region: 'Americas & Caribbean', roroRatePerCbm: 129, transitDays: '33–39 days', mainPort: 'Port Castries' },
  { country: 'Saint Vincent and the Grenadines', label: 'St. Vincent & Grenadines', region: 'Americas & Caribbean', roroRatePerCbm: 133, transitDays: '34–40 days', mainPort: 'Port Kingstown' },
  { country: 'Suriname', label: 'Suriname', region: 'Americas & Caribbean', roroRatePerCbm: 136, transitDays: '36–43 days', mainPort: 'Port of Paramaribo' },
  { country: 'Trinidad and Tobago', label: 'Trinidad & Tobago', region: 'Americas & Caribbean', roroRatePerCbm: 130, transitDays: '34–40 days', mainPort: 'Port of Spain' },
  { country: 'Turks and Caicos Islands', label: 'Turks & Caicos', region: 'Americas & Caribbean', roroRatePerCbm: 127, transitDays: '28–34 days', mainPort: 'South Dock, Providenciales' },
  { country: 'United States', label: 'United States', region: 'Americas & Caribbean', roroRatePerCbm: 114, transitDays: '18–25 days', mainPort: 'Tacoma / Jacksonville / Miami' },
  { country: 'Uruguay', label: 'Uruguay', region: 'Americas & Caribbean', roroRatePerCbm: 136, transitDays: '38–45 days', mainPort: 'Port of Montevideo' },
  { country: 'Venezuela', label: 'Venezuela', region: 'Americas & Caribbean', roroRatePerCbm: null, transitDays: null, mainPort: null },

  // Asia
  { country: 'Afghanistan', label: 'Afghanistan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Armenia', label: 'Armenia', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Azerbaijan', label: 'Azerbaijan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Bahrain', label: 'Bahrain', region: 'Asia', roroRatePerCbm: 102, transitDays: '22–28 days', mainPort: 'Khalifa Bin Salman Port' },
  { country: 'Bangladesh', label: 'Bangladesh', region: 'Asia', roroRatePerCbm: 98, transitDays: '16–22 days', mainPort: 'Port of Chattogram / Mongla' },
  { country: 'Bhutan', label: 'Bhutan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Brunei Darussalam', label: 'Brunei', region: 'Asia', roroRatePerCbm: 96, transitDays: '12–17 days', mainPort: 'Muara Port' },
  { country: 'Cambodia', label: 'Cambodia', region: 'Asia', roroRatePerCbm: 94, transitDays: '12–16 days', mainPort: 'Sihanoukville Port' },
  { country: 'China', label: 'China', region: 'Asia', roroRatePerCbm: 78, transitDays: '5–9 days', mainPort: 'Port of Shanghai / Tianjin' },
  { country: 'India', label: 'India', region: 'Asia', roroRatePerCbm: 104, transitDays: '18–24 days', mainPort: 'Port of Chennai / Nhava Sheva' },
  { country: 'Indonesia', label: 'Indonesia', region: 'Asia', roroRatePerCbm: 92, transitDays: '12–16 days', mainPort: 'Tanjung Priok, Jakarta' },
  { country: 'Iran', label: 'Iran', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Iraq', label: 'Iraq', region: 'Asia', roroRatePerCbm: 110, transitDays: '24–30 days', mainPort: 'Umm Qasr Port' },
  { country: 'Japan', label: 'Japan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Jordan', label: 'Jordan', region: 'Asia', roroRatePerCbm: 108, transitDays: '24–30 days', mainPort: 'Port of Aqaba' },
  { country: 'Kazakhstan', label: 'Kazakhstan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Kuwait', label: 'Kuwait', region: 'Asia', roroRatePerCbm: 104, transitDays: '23–29 days', mainPort: 'Shuwaikh Port' },
  { country: 'Kyrgyzstan', label: 'Kyrgyzstan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Laos', label: 'Laos', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Lebanon', label: 'Lebanon', region: 'Asia', roroRatePerCbm: 118, transitDays: '28–35 days', mainPort: 'Port of Beirut' },
  { country: 'Malaysia', label: 'Malaysia', region: 'Asia', roroRatePerCbm: 89, transitDays: '10–14 days', mainPort: 'Port Klang' },
  { country: 'Maldives', label: 'Maldives', region: 'Asia', roroRatePerCbm: 112, transitDays: '18–24 days', mainPort: 'Male Commercial Harbor' },
  { country: 'Mongolia', label: 'Mongolia', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Myanmar', label: 'Myanmar', region: 'Asia', roroRatePerCbm: 99, transitDays: '15–20 days', mainPort: 'Yangon Thilawa Port' },
  { country: 'Nepal', label: 'Nepal', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Oman', label: 'Oman', region: 'Asia', roroRatePerCbm: 101, transitDays: '21–27 days', mainPort: 'Port Sultan Qaboos / Sohar' },
  { country: 'Palestine', label: 'Palestine', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Philippines', label: 'Philippines', region: 'Asia', roroRatePerCbm: 85, transitDays: '8–12 days', mainPort: 'Port of Batangas / Manila' },
  { country: 'Qatar', label: 'Qatar', region: 'Asia', roroRatePerCbm: 103, transitDays: '22–28 days', mainPort: 'Hamad Port' },
  { country: 'Saudi Arabia', label: 'Saudi Arabia', region: 'Asia', roroRatePerCbm: 104, transitDays: '22–28 days', mainPort: 'Jeddah Islamic Port' },
  { country: 'Singapore', label: 'Singapore', region: 'Asia', roroRatePerCbm: 84, transitDays: '9–13 days', mainPort: 'PSA Singapore' },
  { country: 'South Korea', label: 'South Korea', region: 'Asia', roroRatePerCbm: 74, transitDays: '3–6 days', mainPort: 'Port of Busan' },
  { country: 'Sri Lanka', label: 'Sri Lanka', region: 'Asia', roroRatePerCbm: 98, transitDays: '16–22 days', mainPort: 'Port of Hambantota / Colombo' },
  { country: 'Syria', label: 'Syria', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Tajikistan', label: 'Tajikistan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Thailand', label: 'Thailand', region: 'Asia', roroRatePerCbm: 88, transitDays: '10–14 days', mainPort: 'Laem Chabang Port' },
  { country: 'Timor-Leste', label: 'Timor-Leste', region: 'Asia', roroRatePerCbm: 108, transitDays: '16–22 days', mainPort: 'Port of Dili' },
  { country: 'Turkey', label: 'Turkey', region: 'Asia', roroRatePerCbm: 118, transitDays: '28–35 days', mainPort: 'Derince / Izmir Port' },
  { country: 'Turkmenistan', label: 'Turkmenistan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'United Arab Emirates', label: 'UAE', region: 'Asia', roroRatePerCbm: 96, transitDays: '20–26 days', mainPort: 'Port Jebel Ali, Dubai' },
  { country: 'Uzbekistan', label: 'Uzbekistan', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Vietnam', label: 'Vietnam', region: 'Asia', roroRatePerCbm: 86, transitDays: '8–12 days', mainPort: 'Cat Lai / Hai Phong Port' },
  { country: 'Yemen', label: 'Yemen', region: 'Asia', roroRatePerCbm: null, transitDays: null, mainPort: null },

  // Europe
  { country: 'Albania', label: 'Albania', region: 'Europe', roroRatePerCbm: 124, transitDays: '31–38 days', mainPort: 'Port of Durres' },
  { country: 'Andorra', label: 'Andorra', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Austria', label: 'Austria', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Belarus', label: 'Belarus', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Belgium', label: 'Belgium', region: 'Europe', roroRatePerCbm: 114, transitDays: '32–38 days', mainPort: 'Port of Zeebrugge / Antwerp' },
  { country: 'Bosnia and Herzegovina', label: 'Bosnia & Herzegovina', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Bulgaria', label: 'Bulgaria', region: 'Europe', roroRatePerCbm: 124, transitDays: '32–39 days', mainPort: 'Port of Varna' },
  { country: 'Croatia', label: 'Croatia', region: 'Europe', roroRatePerCbm: 121, transitDays: '30–36 days', mainPort: 'Port of Rijeka' },
  { country: 'Cyprus', label: 'Cyprus', region: 'Europe', roroRatePerCbm: 116, transitDays: '26–32 days', mainPort: 'Port of Limassol' },
  { country: 'Czech Republic', label: 'Czech Republic', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Denmark', label: 'Denmark', region: 'Europe', roroRatePerCbm: 119, transitDays: '34–40 days', mainPort: 'Port of Aarhus' },
  { country: 'Estonia', label: 'Estonia', region: 'Europe', roroRatePerCbm: 124, transitDays: '36–42 days', mainPort: 'Port of Paldiski' },
  { country: 'Finland', label: 'Finland', region: 'Europe', roroRatePerCbm: 122, transitDays: '35–42 days', mainPort: 'Port of Hanko / Kotka' },
  { country: 'France', label: 'France', region: 'Europe', roroRatePerCbm: 116, transitDays: '31–37 days', mainPort: 'Port of Le Havre' },
  { country: 'Georgia', label: 'Georgia', region: 'Europe', roroRatePerCbm: 126, transitDays: '32–39 days', mainPort: 'Port of Poti / Batumi' },
  { country: 'Germany', label: 'Germany', region: 'Europe', roroRatePerCbm: 114, transitDays: '32–38 days', mainPort: 'Port of Bremerhaven' },
  { country: 'Greece', label: 'Greece', region: 'Europe', roroRatePerCbm: 117, transitDays: '28–34 days', mainPort: 'Port of Piraeus' },
  { country: 'Hungary', label: 'Hungary', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Iceland', label: 'Iceland', region: 'Europe', roroRatePerCbm: 132, transitDays: '38–45 days', mainPort: 'Port of Reykjavik' },
  { country: 'Ireland', label: 'Ireland', region: 'Europe', roroRatePerCbm: 118, transitDays: '34–40 days', mainPort: 'Port of Dublin' },
  { country: 'Italy', label: 'Italy', region: 'Europe', roroRatePerCbm: 117, transitDays: '29–35 days', mainPort: 'Port of Livorno' },
  { country: 'Latvia', label: 'Latvia', region: 'Europe', roroRatePerCbm: 124, transitDays: '36–42 days', mainPort: 'Port of Riga' },
  { country: 'Liechtenstein', label: 'Liechtenstein', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Lithuania', label: 'Lithuania', region: 'Europe', roroRatePerCbm: 123, transitDays: '36–42 days', mainPort: 'Port of Klaipeda' },
  { country: 'Luxembourg', label: 'Luxembourg', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Malta', label: 'Malta', region: 'Europe', roroRatePerCbm: 119, transitDays: '29–35 days', mainPort: 'Port of Valletta' },
  { country: 'Moldova', label: 'Moldova', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Monaco', label: 'Monaco', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Montenegro', label: 'Montenegro', region: 'Europe', roroRatePerCbm: 123, transitDays: '31–37 days', mainPort: 'Port of Bar' },
  { country: 'Netherlands', label: 'Netherlands', region: 'Europe', roroRatePerCbm: 114, transitDays: '32–38 days', mainPort: 'Port of Rotterdam / Amsterdam' },
  { country: 'North Macedonia', label: 'North Macedonia', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Norway', label: 'Norway', region: 'Europe', roroRatePerCbm: 122, transitDays: '35–41 days', mainPort: 'Port of Drammen' },
  { country: 'Poland', label: 'Poland', region: 'Europe', roroRatePerCbm: 120, transitDays: '34–40 days', mainPort: 'Port of Gdansk' },
  { country: 'Portugal', label: 'Portugal', region: 'Europe', roroRatePerCbm: 118, transitDays: '31–37 days', mainPort: 'Port of Setubal' },
  { country: 'Romania', label: 'Romania', region: 'Europe', roroRatePerCbm: 124, transitDays: '32–39 days', mainPort: 'Port of Constanta' },
  { country: 'Russia', label: 'Russia', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'San Marino', label: 'San Marino', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Serbia', label: 'Serbia', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Slovakia', label: 'Slovakia', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Slovenia', label: 'Slovenia', region: 'Europe', roroRatePerCbm: 119, transitDays: '30–36 days', mainPort: 'Port of Koper' },
  { country: 'Spain', label: 'Spain', region: 'Europe', roroRatePerCbm: 116, transitDays: '30–36 days', mainPort: 'Port of Barcelona / Vigo' },
  { country: 'Sweden', label: 'Sweden', region: 'Europe', roroRatePerCbm: 121, transitDays: '35–41 days', mainPort: 'Port of Gothenburg' },
  { country: 'Switzerland', label: 'Switzerland', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Ukraine', label: 'Ukraine', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'United Kingdom', label: 'United Kingdom', region: 'Europe', roroRatePerCbm: 115, transitDays: '32–38 days', mainPort: 'Port of Southampton / Bristol' },
  { country: 'Vatican City', label: 'Vatican City', region: 'Europe', roroRatePerCbm: null, transitDays: null, mainPort: null },

  // Africa
  { country: 'Algeria', label: 'Algeria', region: 'Africa', roroRatePerCbm: 121, transitDays: '29–36 days', mainPort: 'Port of Algiers' },
  { country: 'Angola', label: 'Angola', region: 'Africa', roroRatePerCbm: 124, transitDays: '30–36 days', mainPort: 'Port of Luanda' },
  { country: 'Benin', label: 'Benin', region: 'Africa', roroRatePerCbm: 120, transitDays: '32–38 days', mainPort: 'Port of Cotonou' },
  { country: 'Botswana', label: 'Botswana', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Burkina Faso', label: 'Burkina Faso', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Burundi', label: 'Burundi', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Cameroon', label: 'Cameroon', region: 'Africa', roroRatePerCbm: 124, transitDays: '33–40 days', mainPort: 'Port of Douala' },
  { country: 'Cape Verde (Cabo Verde)', label: 'Cape Verde', region: 'Africa', roroRatePerCbm: 128, transitDays: '32–38 days', mainPort: 'Port of Praia' },
  { country: 'Central African Republic', label: 'Central African Republic', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Chad', label: 'Chad', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Comoros', label: 'Comoros', region: 'Africa', roroRatePerCbm: 126, transitDays: '28–34 days', mainPort: 'Port of Moroni' },
  { country: 'Congo (Brazzaville)', label: 'Congo (Brazzaville)', region: 'Africa', roroRatePerCbm: 125, transitDays: '33–39 days', mainPort: 'Port of Pointe-Noire' },
  { country: 'Democratic Republic of the Congo (Kinshasa)', label: 'DR Congo', region: 'Africa', roroRatePerCbm: 128, transitDays: '34–41 days', mainPort: 'Port of Matadi' },
  { country: "Côte d'Ivoire (Ivory Coast)", label: "Côte d'Ivoire", region: 'Africa', roroRatePerCbm: 122, transitDays: '32–38 days', mainPort: 'Port of Abidjan' },
  { country: 'Djibouti', label: 'Djibouti', region: 'Africa', roroRatePerCbm: 115, transitDays: '23–29 days', mainPort: 'Port of Djibouti' },
  { country: 'Egypt', label: 'Egypt', region: 'Africa', roroRatePerCbm: 112, transitDays: '25–31 days', mainPort: 'Port Said / Alexandria' },
  { country: 'Equatorial Guinea', label: 'Equatorial Guinea', region: 'Africa', roroRatePerCbm: 128, transitDays: '34–40 days', mainPort: 'Port of Malabo' },
  { country: 'Eritrea', label: 'Eritrea', region: 'Africa', roroRatePerCbm: 120, transitDays: '25–31 days', mainPort: 'Port of Massawa' },
  { country: 'Eswatini (Swaziland)', label: 'Eswatini', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Ethiopia', label: 'Ethiopia', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Gabon', label: 'Gabon', region: 'Africa', roroRatePerCbm: 126, transitDays: '34–40 days', mainPort: 'Port of Libreville' },
  { country: 'Gambia', label: 'Gambia', region: 'Africa', roroRatePerCbm: 125, transitDays: '33–39 days', mainPort: 'Port of Banjul' },
  { country: 'Ghana', label: 'Ghana', region: 'Africa', roroRatePerCbm: 121, transitDays: '31–37 days', mainPort: 'Port of Tema' },
  { country: 'Guinea', label: 'Guinea', region: 'Africa', roroRatePerCbm: 125, transitDays: '33–39 days', mainPort: 'Port of Conakry' },
  { country: 'Guinea-Bissau', label: 'Guinea-Bissau', region: 'Africa', roroRatePerCbm: 127, transitDays: '34–40 days', mainPort: 'Port of Bissau' },
  { country: 'Kenya', label: 'Kenya', region: 'Africa', roroRatePerCbm: 112, transitDays: '22–28 days', mainPort: 'Port of Mombasa' },
  { country: 'Lesotho', label: 'Lesotho', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Liberia', label: 'Liberia', region: 'Africa', roroRatePerCbm: 126, transitDays: '33–39 days', mainPort: 'Port of Monrovia' },
  { country: 'Libya', label: 'Libya', region: 'Africa', roroRatePerCbm: 120, transitDays: '28–34 days', mainPort: 'Port of Misrata' },
  { country: 'Madagascar', label: 'Madagascar', region: 'Africa', roroRatePerCbm: 118, transitDays: '25–31 days', mainPort: 'Port of Toamasina' },
  { country: 'Malawi', label: 'Malawi', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Mali', label: 'Mali', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Mauritania', label: 'Mauritania', region: 'Africa', roroRatePerCbm: 125, transitDays: '33–39 days', mainPort: 'Port of Nouakchott' },
  { country: 'Mauritius', label: 'Mauritius', region: 'Africa', roroRatePerCbm: 114, transitDays: '22–28 days', mainPort: 'Port Louis' },
  { country: 'Morocco', label: 'Morocco', region: 'Africa', roroRatePerCbm: 118, transitDays: '29–35 days', mainPort: 'Port of Casablanca' },
  { country: 'Mozambique', label: 'Mozambique', region: 'Africa', roroRatePerCbm: 115, transitDays: '24–30 days', mainPort: 'Port of Maputo' },
  { country: 'Namibia', label: 'Namibia', region: 'Africa', roroRatePerCbm: 116, transitDays: '27–33 days', mainPort: 'Port of Walvis Bay' },
  { country: 'Niger', label: 'Niger', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Nigeria', label: 'Nigeria', region: 'Africa', roroRatePerCbm: 122, transitDays: '31–38 days', mainPort: 'Tin Can Island, Lagos' },
  { country: 'Rwanda', label: 'Rwanda', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Sao Tome and Principe', label: 'Sao Tome & Principe', region: 'Africa', roroRatePerCbm: 129, transitDays: '34–40 days', mainPort: 'Port of Sao Tome' },
  { country: 'Senegal', label: 'Senegal', region: 'Africa', roroRatePerCbm: 123, transitDays: '32–38 days', mainPort: 'Port of Dakar' },
  { country: 'Seychelles', label: 'Seychelles', region: 'Africa', roroRatePerCbm: 121, transitDays: '25–31 days', mainPort: 'Port Victoria' },
  { country: 'Sierra Leone', label: 'Sierra Leone', region: 'Africa', roroRatePerCbm: 125, transitDays: '33–39 days', mainPort: 'Port of Freetown' },
  { country: 'Somalia', label: 'Somalia', region: 'Africa', roroRatePerCbm: 119, transitDays: '24–30 days', mainPort: 'Port of Mogadishu' },
  { country: 'South Africa', label: 'South Africa', region: 'Africa', roroRatePerCbm: 112, transitDays: '24–30 days', mainPort: 'Port of Durban' },
  { country: 'South Sudan', label: 'South Sudan', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Sudan', label: 'Sudan', region: 'Africa', roroRatePerCbm: 118, transitDays: '25–31 days', mainPort: 'Port Sudan' },
  { country: 'Tanzania', label: 'Tanzania', region: 'Africa', roroRatePerCbm: 114, transitDays: '23–29 days', mainPort: 'Port of Dar es Salaam' },
  { country: 'Togo', label: 'Togo', region: 'Africa', roroRatePerCbm: 121, transitDays: '31–37 days', mainPort: 'Port of Lome' },
  { country: 'Tunisia', label: 'Tunisia', region: 'Africa', roroRatePerCbm: 119, transitDays: '28–34 days', mainPort: 'Port of La Goulette' },
  { country: 'Uganda', label: 'Uganda', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Zambia', label: 'Zambia', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },
  { country: 'Zimbabwe', label: 'Zimbabwe', region: 'Africa', roroRatePerCbm: null, transitDays: null, mainPort: null },

  // Oceania
  { country: 'Australia', label: 'Australia', region: 'Oceania', roroRatePerCbm: 108, transitDays: '16–22 days', mainPort: 'Brisbane / Sydney / Melbourne' },
  { country: 'Fiji', label: 'Fiji', region: 'Oceania', roroRatePerCbm: 116, transitDays: '18–24 days', mainPort: 'Port of Suva' },
  { country: 'Kiribati', label: 'Kiribati', region: 'Oceania', roroRatePerCbm: 126, transitDays: '22–28 days', mainPort: 'Betio Port, Tarawa' },
  { country: 'Marshall Islands', label: 'Marshall Islands', region: 'Oceania', roroRatePerCbm: 124, transitDays: '20–26 days', mainPort: 'Port of Majuro' },
  { country: 'Micronesia', label: 'Micronesia', region: 'Oceania', roroRatePerCbm: 124, transitDays: '20–26 days', mainPort: 'Port of Pohnpei' },
  { country: 'Nauru', label: 'Nauru', region: 'Oceania', roroRatePerCbm: 128, transitDays: '22–28 days', mainPort: 'Aiwo Harbor' },
  { country: 'New Zealand', label: 'New Zealand', region: 'Oceania', roroRatePerCbm: 105, transitDays: '15–21 days', mainPort: 'Auckland / Tauranga' },
  { country: 'Palau', label: 'Palau', region: 'Oceania', roroRatePerCbm: 120, transitDays: '16–22 days', mainPort: 'Malakal Port' },
  { country: 'Papua New Guinea', label: 'Papua New Guinea', region: 'Oceania', roroRatePerCbm: 114, transitDays: '16–22 days', mainPort: 'Port of Lae / Moresby' },
  { country: 'Samoa', label: 'Samoa', region: 'Oceania', roroRatePerCbm: 121, transitDays: '20–26 days', mainPort: 'Port of Apia' },
  { country: 'Solomon Islands', label: 'Solomon Islands', region: 'Oceania', roroRatePerCbm: 119, transitDays: '18–24 days', mainPort: 'Port of Honiara' },
  { country: 'Tonga', label: 'Tonga', region: 'Oceania', roroRatePerCbm: 122, transitDays: '20–26 days', mainPort: "Nuku'alofa Port" },
  { country: 'Tuvalu', label: 'Tuvalu', region: 'Oceania', roroRatePerCbm: 128, transitDays: '22–28 days', mainPort: 'Funafuti Port' },
  { country: 'Vanuatu', label: 'Vanuatu', region: 'Oceania', roroRatePerCbm: 120, transitDays: '19–25 days', mainPort: 'Port Vila' },
];
