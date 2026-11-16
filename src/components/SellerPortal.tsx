import { useState } from 'react';
import {
  ArrowLeft,
  Car,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { DESTINATION_PORTS, formatAutoPrice } from '../data/seedInventory.ts';
import type {
  BookingRequest,
  ExportVehicle,
  ListingMode,
  VehicleCategory,
  VehicleStatus,
} from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

type PortalTab = 'inventory' | 'add-vehicle' | 'bookings';

interface SellerPortalProps {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  onCreateVehicle: (vehicle: Omit<ExportVehicle, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  onUpdateBookingStatus: (id: string, status: BookingRequest['status']) => Promise<void>;
  onExitPortal: () => void;
}

const IMAGE_PRESETS: { label: string; category: Exclude<VehicleCategory, 'All Stock'>; src: string }[] = [
  {
    label: 'Hybrid Hatchback',
    category: 'Hybrids',
    src: '/src/assets/images/auto_hybrid_aqua_1794825334004.jpg',
  },
  {
    label: '4x4 Luxury SUV',
    category: 'SUVs & 4x4',
    src: '/src/assets/images/auto_suv_prado_1794825333513.jpg',
  },
  {
    label: 'Double-Cab Pickup',
    category: 'Commercial',
    src: '/src/assets/images/auto_pickup_hilux_1794825334855.jpg',
  },
  {
    label: 'Executive Sedan',
    category: 'Sedans',
    src: '/src/assets/images/auto_sedan_crown_1794825335274.jpg',
  },
  {
    label: 'Commercial Van',
    category: 'Commercial',
    src: '/src/assets/images/auto_van_hiace_1794825335037.jpg',
  },
];

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 960;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function SellerPortal({
  vehicles,
  bookings,
  onCreateVehicle,
  onUpdateVehicleStatus,
  onDeleteVehicle,
  onUpdateBookingStatus,
  onExitPortal,
}: SellerPortalProps) {
  const [activeTab, setActiveTab] = useState<PortalTab>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | ListingMode>('all');

  // Add Vehicle Form State
  const [makeModel, setMakeModel] = useState('');
  const [trim, setTrim] = useState('');
  const [category, setCategory] = useState<Exclude<VehicleCategory, 'All Stock'>>('Hybrids');
  const [dealType, setDealType] = useState<ListingMode>('direct-import');
  const [year, setYear] = useState(2022);
  const [mileageKm, setMileageKm] = useState(32000);
  const [chassisCode, setChassisCode] = useState('');
  const [engine, setEngine] = useState('1.8L Hybrid');
  const [transmission, setTransmission] = useState('Automatic');
  const [drive, setDrive] = useState<'2WD' | '4WD' | 'AWD'>('2WD');
  const [fuel, setFuel] = useState<'Hybrid' | 'Diesel' | 'Petrol'>('Hybrid');
  const [steering, setSteering] = useState<'RHD' | 'LHD'>('RHD');
  const [color, setColor] = useState('Pearl White');
  const [destinationPortId, setDestinationPortId] = useState(DESTINATION_PORTS[0].id);
  const [vesselName, setVesselName] = useState('Next Weekly RoRo Sailing');
  const [arrivalStatus, setArrivalStatus] = useState('Ready to Book · Yokohama Yard');
  const [fobUsd, setFobUsd] = useState(16500);
  const [fullCifUsd, setFullCifUsd] = useState(18100);
  const [priorDepositUsd, setPriorDepositUsd] = useState(8500);
  const [auctionHouse, setAuctionHouse] = useState('USS Tokyo');
  const [grade, setGrade] = useState('4.5');
  const [inspectorSummary, setInspectorSummary] = useState(
    'Single-owner Japanese unit inspected in Yokohama. Clean exterior panels, verified mileage, ready for Caribbean export.',
  );
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].src);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedPort =
    DESTINATION_PORTS.find((p) => p.id === destinationPortId) ?? DESTINATION_PORTS[0];

  const effectiveDeposit = dealType === 'balance-release' ? Math.max(0, priorDepositUsd) : 0;
  const computedBalanceUsd =
    dealType === 'balance-release'
      ? Math.max(500, fullCifUsd - effectiveDeposit)
      : fullCifUsd;

  const filteredInventory = vehicles.filter((v) => {
    const matchesMode = modeFilter === 'all' || v.transit.dealType === modeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      v.makeModel.toLowerCase().includes(q) ||
      v.chassisCode.toLowerCase().includes(q) ||
      v.transit.destinationPortLabel.toLowerCase().includes(q);
    return matchesMode && matchesQuery;
  });

  const directCount = vehicles.filter((v) => v.transit.dealType === 'direct-import').length;
  const balanceCount = vehicles.filter((v) => v.transit.dealType === 'balance-release').length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending Review').length;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
      setFormError(null);
    } catch {
      setFormError('Could not process that image file. Try a JPG or PNG photo.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeModel.trim() || !chassisCode.trim()) {
      setFormError('Please enter Make & Model and Chassis Code.');
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      await onCreateVehicle({
        makeModel: makeModel.trim(),
        trim: trim.trim() || 'Export Grade',
        category,
        status: dealType === 'balance-release' ? 'In Transit' : 'Available',
        year,
        mileageKm,
        chassisCode: chassisCode.trim().toUpperCase(),
        engine: engine.trim(),
        transmission: transmission.trim(),
        drive,
        fuel,
        steering,
        color: color.trim(),
        port:
          dealType === 'balance-release'
            ? `In Transit · ${selectedPort.name}`
            : 'Yokohama Yard · Ships to Caribbean',
        fobUsd,
        image: imageUrl,
        imageAlt: `${year} ${makeModel.trim()} (${chassisCode.trim().toUpperCase()})`,
        transit: {
          dealType,
          destinationPortId: selectedPort.id,
          destinationPortLabel:
            dealType === 'balance-release'
              ? `${selectedPort.name}, ${selectedPort.country}`
              : `Ships to ${selectedPort.name} & Caribbean`,
          vesselName: vesselName.trim() || 'Weekly RoRo Sailing',
          arrivalStatus: arrivalStatus.trim() || 'Ready to Book',
          fullCifUsd,
          priorDepositUsd: effectiveDeposit,
          balanceDueUsd: computedBalanceUsd,
          blStatus:
            dealType === 'balance-release'
              ? 'Original B/L ready for local consignee re-assignment'
              : 'Bill of Lading issued directly in buyer name',
        },
        inspection: {
          auctionHouse: auctionHouse.trim() || 'USS Yokohama',
          lotNumber: String(Math.floor(10000 + Math.random() * 89999)),
          overallGrade: grade,
          exteriorGrade: 'B',
          interiorGrade: 'A',
          odometerVerified: true,
          radiationCheck: 'Cleared · 0.05 µSv/h',
          inspectorSummary: inspectorSummary.trim(),
          bodyNotes: [
            `Verified auction grade ${grade}`,
            `Prepared for ${selectedPort.name} (${selectedPort.country}) import rules`,
          ],
        },
      });

      // Reset core fields and return to inventory table
      setMakeModel('');
      setTrim('');
      setChassisCode('');
      setActiveTab('inventory');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish vehicle.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col lg:flex-row">
      {/* Left Portal Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <span className="font-display text-lg font-bold tracking-tight text-zinc-950">
              CrownWheel Portal
            </span>
          </div>

          <nav aria-label="Seller Portal Navigation" className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Inventory ({vehicles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add-vehicle')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'add-vehicle'
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Add New Car</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Client Bookings</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {bookings.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onExitPortal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Public Storefront</span>
          </button>
        </div>
      </aside>

      {/* Main Portal Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Portal Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500 truncate">
            <span>Seller Portal</span>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-zinc-950">
              {activeTab === 'inventory'
                ? 'Vehicle Inventory'
                : activeTab === 'add-vehicle'
                  ? 'Publish New Vehicle'
                  : 'Client Bookings & Claims'}
            </span>
          </div>

          {activeTab !== 'add-vehicle' && (
            <button
              type="button"
              onClick={() => setActiveTab('add-vehicle')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Vehicle</span>
            </button>
          )}
        </header>

        <div className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Total Listed Cars</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
                {vehicles.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Direct Japan Bookings</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
                {directCount}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Port Balance-Release Units</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-blue-900 tabular-nums">
                {balanceCount}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Pending Client Bookings</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
                {pendingBookingsCount}
              </div>
            </div>
          </div>

          {/* TAB 1: INVENTORY TABLE */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                  {(
                    [
                      { id: 'all', label: 'All Listed' },
                      { id: 'direct-import', label: 'Direct Import' },
                      { id: 'balance-release', label: 'Port Balance' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModeFilter(item.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        modeFilter === item.id
                          ? 'bg-white text-zinc-950 shadow-sm'
                          : 'text-slate-600 hover:text-zinc-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by model or chassis..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600">No vehicles match your current filter.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add-vehicle')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg cursor-pointer"
                  >
                    Add Your First Vehicle
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Type & Port</th>
                        <th className="py-3 px-4 text-right">CIF / Balance Due</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredInventory.map((vehicle) => {
                        const isBal = vehicle.transit.dealType === 'balance-release';
                        return (
                          <tr key={vehicle.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-10 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                  <ResilientImage
                                    src={vehicle.image}
                                    alt={vehicle.imageAlt}
                                    fallbackTitle={vehicle.makeModel}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-zinc-950 truncate">
                                    {vehicle.year} {vehicle.makeModel}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono">
                                    {vehicle.chassisCode} · Grade {vehicle.inspection.overallGrade}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-xs font-medium text-zinc-950">
                                {isBal ? 'Port Balance Deal' : 'Direct Japan Import'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {vehicle.transit.destinationPortLabel}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right font-mono tabular-nums">
                              <div className="font-semibold text-zinc-950">
                                {formatAutoPrice(vehicle.transit.balanceDueUsd, 'USD')}
                              </div>
                              {isBal && (
                                <div className="text-[11px] text-emerald-800">
                                  Paid -{formatAutoPrice(vehicle.transit.priorDepositUsd, 'USD')}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <select
                                aria-label={`Status for ${vehicle.makeModel}`}
                                value={vehicle.status}
                                onChange={(e) =>
                                  onUpdateVehicleStatus(
                                    vehicle.id,
                                    e.target.value as VehicleStatus,
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-zinc-950"
                              >
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Cleared">Cleared</option>
                              </select>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteVehicle(vehicle.id)}
                                aria-label={`Delete ${vehicle.makeModel}`}
                                className="p-2 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW CAR FORM */}
          {activeTab === 'add-vehicle' && (
            <form
              onSubmit={handleCreateSubmit}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
            >
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-display text-xl font-semibold text-zinc-950">
                  Add Vehicle to Storefront
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Publish a standard car for direct Japan-to-Caribbean booking, or list an
                  in-transit Port Balance-Release unit.
                </p>
              </div>

              {formError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}

              {/* Photo Upload + Studio Presets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <ResilientImage
                      src={imageUrl}
                      alt="Vehicle preview"
                      fallbackTitle="Vehicle Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Car Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1.5">Or choose preset photo:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.src);
                            setCategory(preset.category);
                          }}
                          className={`px-2.5 py-1 text-[11px] rounded border cursor-pointer ${
                            imageUrl === preset.src
                              ? 'border-blue-900 bg-blue-50 text-blue-900 font-medium'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Listing Mode
                      </label>
                      <select
                        value={dealType}
                        onChange={(e) => {
                          const mode = e.target.value as ListingMode;
                          setDealType(mode);
                          if (mode === 'balance-release') {
                            setArrivalStatus('At Sea · Arrives in 7 Days');
                            setVesselName('MV Hoegh Trigger');
                          } else {
                            setArrivalStatus('Ready to Book · Yokohama Yard');
                            setVesselName('Next Weekly RoRo Sailing');
                          }
                        }}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="direct-import">
                          Direct Japan Import (Client Books Online)
                        </option>
                        <option value="balance-release">
                          Port Balance-Release Deal (Prior Buyer Backed Out)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Vehicle Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as Exclude<VehicleCategory, 'All Stock'>)
                        }
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Hybrids">Hybrids</option>
                        <option value="SUVs & 4x4">SUVs & 4x4</option>
                        <option value="Sedans">Sedans</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Make & Model *
                      </label>
                      <input
                        type="text"
                        value={makeModel}
                        onChange={(e) => setMakeModel(e.target.value)}
                        placeholder="e.g. Honda Vezel Hybrid"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Trim / Grade Package
                      </label>
                      <input
                        type="text"
                        value={trim}
                        onChange={(e) => setTrim(e.target.value)}
                        placeholder="e.g. Z Play Package"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={mileageKm}
                        onChange={(e) => setMileageKm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Chassis Code *
                      </label>
                      <input
                        type="text"
                        value={chassisCode}
                        onChange={(e) => setChassisCode(e.target.value)}
                        placeholder="RV5-104921"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Auction Grade
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="5.0">5.0</option>
                        <option value="4.5">4.5</option>
                        <option value="4.0">4.0</option>
                        <option value="3.5">3.5</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">Engine</label>
                      <input
                        type="text"
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">Fuel</label>
                      <select
                        value={fuel}
                        onChange={(e) => setFuel(e.target.value as 'Hybrid' | 'Diesel' | 'Petrol')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Hybrid">Hybrid</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">Drive</label>
                      <select
                        value={drive}
                        onChange={(e) => setDrive(e.target.value as '2WD' | '4WD' | 'AWD')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="2WD">2WD</option>
                        <option value="4WD">4WD</option>
                        <option value="AWD">AWD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Steering
                      </label>
                      <select
                        value={steering}
                        onChange={(e) => setSteering(e.target.value as 'RHD' | 'LHD')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="RHD">RHD</option>
                        <option value="LHD">LHD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Primary Caribbean Port
                      </label>
                      <select
                        value={destinationPortId}
                        onChange={(e) => setDestinationPortId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        {DESTINATION_PORTS.map((port) => (
                          <option key={port.id} value={port.id}>
                            {port.name} ({port.country})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Vessel / Schedule
                      </label>
                      <input
                        type="text"
                        value={vesselName}
                        onChange={(e) => setVesselName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Availability / ETA Note
                      </label>
                      <input
                        type="text"
                        value={arrivalStatus}
                        onChange={(e) => setArrivalStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        FOB Japan (USD)
                      </label>
                      <input
                        type="number"
                        min={1000}
                        step={100}
                        value={fobUsd}
                        onChange={(e) => {
                          const nextFob = Number(e.target.value);
                          setFobUsd(nextFob);
                          setFullCifUsd(nextFob + selectedPort.roroUsd);
                        }}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Full CIF (USD)
                      </label>
                      <input
                        type="number"
                        min={1500}
                        step={100}
                        value={fullCifUsd}
                        onChange={(e) => setFullCifUsd(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>

                    {dealType === 'balance-release' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-950 mb-1">
                          Prior Paid Deposit
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={priorDepositUsd}
                          onChange={(e) => setPriorDepositUsd(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                        />
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        {dealType === 'balance-release' ? 'Balance Due' : 'Listed CIF Price'}
                      </div>
                      <div className="px-3 py-2 text-sm font-mono font-semibold text-blue-900 bg-blue-50/70 border border-blue-200 rounded-lg tabular-nums">
                        ${computedBalanceUsd.toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-950 mb-1">
                      Auction & Condition Notes
                    </label>
                    <textarea
                      rows={3}
                      value={inspectorSummary}
                      onChange={(e) => setInspectorSummary(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 rounded-lg cursor-pointer"
                    >
                      {saving ? 'Publishing...' : 'Publish Vehicle'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: CLIENT BOOKINGS QUEUE */}
          {activeTab === 'bookings' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h2 className="font-display text-lg font-semibold text-zinc-950">
                  Client Reservations & Port Claims
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirming a deposit automatically updates the vehicle status to Booked on the
                  public website.
                </p>
              </div>

              {bookings.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  No client bookings yet. Any car booked from your public website will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                        <th className="py-3 px-4">Ref & Buyer</th>
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Destination Port</th>
                        <th className="py-3 px-4 text-right">Quoted USD</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/70 align-top">
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs font-semibold text-blue-900">
                              #{booking.id.toUpperCase()}
                            </div>
                            <div className="font-medium text-zinc-950 mt-0.5">
                              {booking.buyerName}
                            </div>
                            <div className="text-xs text-slate-500">{booking.buyerEmail}</div>
                            {booking.buyerPhone && (
                              <div className="text-xs text-slate-500 font-mono">
                                {booking.buyerPhone}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-zinc-950">{booking.vehicleTitle}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {booking.chassisCode}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 max-w-xs">
                              {booking.notes}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-xs font-medium text-zinc-950">
                              {booking.destinationPortName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {booking.requestType} · {booking.shippingMethod}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-zinc-950">
                            {booking.quotedAmountUsd > 0
                              ? `$${booking.quotedAmountUsd.toLocaleString('en-US')}`
                              : 'Custom'}
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`Booking status for ${booking.id}`}
                              value={booking.status}
                              onChange={(e) =>
                                onUpdateBookingStatus(
                                  booking.id,
                                  e.target.value as BookingRequest['status'],
                                )
                              }
                              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-zinc-950"
                            >
                              <option value="Pending Review">Pending Review</option>
                              <option value="Deposit Confirmed">Deposit Confirmed</option>
                              <option value="Shipped / B/L Issued">Shipped / B/L Issued</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
