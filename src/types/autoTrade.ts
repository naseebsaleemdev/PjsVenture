export type VehicleCategory =
  | 'All Stock'
  | 'SUVs & 4x4'
  | 'Hybrids'
  | 'Sedans'
  | 'Commercial';

export type ListingMode = 'direct-import' | 'balance-release';
export type VehicleStatus = 'Available' | 'Booked' | 'In Transit' | 'Cleared';
export type AutoCurrency = 'USD' | 'BSD' | 'XCD' | 'GBP';

export interface AuctionInspection {
  auctionHouse: string;
  lotNumber: string;
  overallGrade: string;
  exteriorGrade: string;
  interiorGrade: string;
  odometerVerified: boolean;
  radiationCheck: string;
  inspectorSummary: string;
  bodyNotes: string[];
}

export interface ShippingTransitInfo {
  dealType: ListingMode;
  destinationPortId: string;
  destinationPortLabel: string;
  vesselName: string;
  arrivalStatus: string;
  etaDate?: string;
  fullCifUsd: number;
  priorDepositUsd: number;
  balanceDueUsd: number;
  blStatus: string;
}

export interface ExportVehicle {
  id: string;
  makeModel: string;
  trim: string;
  category: Exclude<VehicleCategory, 'All Stock'>;
  status: VehicleStatus;
  year: number;
  mileageKm: number;
  chassisCode: string;
  engine: string;
  transmission: string;
  drive: '4WD' | '2WD' | 'AWD';
  fuel: 'Hybrid' | 'Diesel' | 'Petrol';
  steering: 'RHD' | 'LHD';
  color: string;
  port: string;
  fobUsd: number;
  cbm?: number;
  image: string;
  images?: string[];
  imageAlt: string;
  createdAt: string;
  transit: ShippingTransitInfo;
  inspection: AuctionInspection;
}

export interface BookingRequest {
  id: string;
  vehicleId: string | null;
  vehicleTitle: string;
  chassisCode: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  destinationPortId: string;
  destinationPortName: string;
  requestType:
    | 'Book Direct Japan Import'
    | 'Claim Port Balance Unit'
    | 'Custom Auction Order';
  shippingMethod: 'RoRo Vessel' | '20ft Container' | '40ft Shared Container';
  quotedAmountUsd: number;
  notes: string;
  leadSource?: string;
  crmNotes?: string;
  status: 'Pending Review' | 'Contacted' | 'Deposit Confirmed' | 'Shipped / B/L Issued' | 'Cancelled';
  createdAt: string;
}

export type GlobalPortRegion =
  | 'Caribbean & Americas'
  | 'Africa'
  | 'Europe & UK'
  | 'Asia & Middle East'
  | 'Oceania & Pacific';

export interface DestinationPort {
  id: string;
  name: string;
  country: string;
  freightCountry: string;
  region: GlobalPortRegion;
  regionTag: string;
  transitDays: string;
  roroUsd: number;
  container20Usd: number;
  container40SharedUsd: number;
  complianceNote: string;
}

export interface ExportStep {
  step: string;
  title: string;
  window: string;
  description: string;
}

export interface UnloadingVideo {
  id: string;
  title: string;
  portLabel: string;
  containerType: string;
  vehicleSummary: string;
  videoUrl: string;
  posterUrl: string;
  durationLabel: string;
  createdAt: string;
}

