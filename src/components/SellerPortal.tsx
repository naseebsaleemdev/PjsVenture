import { useState } from 'react';
import {
  ArrowLeft,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  KeyRound,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  DESTINATION_PORTS,
  PORT_REGIONS,
  PORT_TRACKING_STAGES,
  formatAutoPrice,
  formatEtaDate,
  getPortTrackingStage,
  getVehicleImages,
} from '../data/seedInventory.ts';
import {
  clearPortalSession,
  isValidPortalPassword,
  readPortalSession,
  savePortalPassword,
  writePortalSession,
} from '../lib/portalAuth.ts';
import type {
  BookingRequest,
  ExportVehicle,
  ListingMode,
  PortTrackingStage,
  PortalUser,
  UnloadingVideo,
  VehicleCategory,
  VehicleStatus,
} from '../types/autoTrade.ts';
import { PortTrackingProgress } from './PortTrackingProgress';
import { PortalLoginGate } from './PortalLoginGate';
import { PortalUsersPanel } from './PortalUsersPanel';
import { ResilientImage } from './ResilientImage';

type PortalTab = 'inventory' | 'add-vehicle' | 'bookings' | 'videos' | 'users';

interface SellerPortalProps {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
  users: PortalUser[];
  onCreateVehicle: (vehicle: Omit<ExportVehicle, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateVehicle: (id: string, updates: Partial<ExportVehicle>) => Promise<void>;
  onUpdateVehicleStatus: (id: string, status: VehicleStatus) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  onUpdateBooking: (
    id: string,
    updates: { status?: BookingRequest['status']; crmNotes?: string },
  ) => Promise<void>;
  onCreateManualLead: (
    payload: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>,
  ) => Promise<BookingRequest>;
  onDeleteBooking: (id: string) => Promise<void>;
  onCreateVideo: (video: Omit<UnloadingVideo, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteVideo: (id: string) => Promise<void>;
  onCreateUser: (user: Omit<PortalUser, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<PortalUser>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onExitPortal: () => void;
}

const CONTAINER_POSTER_PRESETS: { label: string; src: string }[] = [
  {
    label: '4x4 SUV Unloading',
    src: '/src/assets/images/container_unload_suv_1794837300196.jpg',
  },
  {
    label: 'Hybrid Container Ramp',
    src: '/src/assets/images/container_unload_hybrid_1794837300796.jpg',
  },
  {
    label: '40ft Dual Unit Unload',
    src: '/src/assets/images/container_unload_pickup_1794837300966.jpg',
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
  videos,
  users,
  onCreateVehicle,
  onUpdateVehicle,
  onUpdateVehicleStatus,
  onDeleteVehicle,
  onUpdateBooking,
  onCreateManualLead,
  onDeleteBooking,
  onCreateVideo,
  onDeleteVideo,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onExitPortal,
}: SellerPortalProps) {
  const [sessionIdentity, setSessionIdentity] = useState<{ id: string; email: string } | null>(
    () => {
      const existing = readPortalSession(users);
      return existing ? { id: existing.id, email: existing.email } : null;
    },
  );
  const currentUser: PortalUser | null = sessionIdentity
    ? users.find((u) => u.id === sessionIdentity.id) ||
      users.find(
        (u) => u.email.trim().toLowerCase() === sessionIdentity.email.trim().toLowerCase(),
      ) ||
      readPortalSession(users)
    : null;
  const activeUser = currentUser && (currentUser.active || currentUser.isPrimaryOwner) ? currentUser : null;

  const [activeTab, setActiveTab] = useState<PortalTab>('inventory');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | ListingMode>('all');

  // Leads & CRM State
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStageFilter, setCrmStageFilter] = useState<'all' | BookingRequest['status']>('all');
  const [crmNotesDrafts, setCrmNotesDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [showManualLeadForm, setShowManualLeadForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPortId, setManualPortId] = useState(DESTINATION_PORTS[0].id);
  const [manualVehicleTitle, setManualVehicleTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualLeadSaving, setManualLeadSaving] = useState(false);

  // Add / Edit Vehicle Form State
  const [makeModel, setMakeModel] = useState('');
  const [trim, setTrim] = useState('');
  const [category, setCategory] = useState<Exclude<VehicleCategory, 'All Stock'>>('Hybrids');
  const [dealType, setDealType] = useState<ListingMode>('direct-import');
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>('Available');
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
  const [dispatchedPortText, setDispatchedPortText] = useState(
    `${DESTINATION_PORTS[0].name}, ${DESTINATION_PORTS[0].country}`,
  );
  const [customBalancePortMode, setCustomBalancePortMode] = useState(false);
  const [trackingStage, setTrackingStage] = useState<PortTrackingStage>('In Transit');
  const [etaDate, setEtaDate] = useState('2026-11-28');
  const [vesselName, setVesselName] = useState('Next Weekly RoRo Sailing');
  const [arrivalStatus, setArrivalStatus] = useState('Ready to Book · Yokohama Yard');

  // Change CRM Password Modal State
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [fobUsd, setFobUsd] = useState(16500);
  const [cbm, setCbm] = useState(11.6);
  const [fullCifUsd, setFullCifUsd] = useState(18100);
  const [priorDepositUsd, setPriorDepositUsd] = useState(8500);
  const [auctionHouse, setAuctionHouse] = useState('USS Tokyo');
  const [grade, setGrade] = useState('4.5');
  const [inspectorSummary, setInspectorSummary] = useState(
    'Single-owner Japanese unit inspected in Yokohama. Clean exterior panels, verified mileage, ready for worldwide export.',
  );
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Unloading Videos Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPortLabel, setVideoPortLabel] = useState('Port of Nassau, Bahamas');
  const [videoContainerType, setVideoContainerType] = useState('40ft High-Cube Container');
  const [videoVehicleSummary, setVideoVehicleSummary] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPosterUrl, setVideoPosterUrl] = useState(CONTAINER_POSTER_PRESETS[0].src);
  const [videoDurationLabel, setVideoDurationLabel] = useState('0:10');
  const [videoFormError, setVideoFormError] = useState<string | null>(null);
  const [videoSaving, setVideoSaving] = useState(false);

  const selectedPort =
    DESTINATION_PORTS.find((p) => p.id === destinationPortId) ?? DESTINATION_PORTS[0];

  const effectiveDeposit = dealType === 'balance-release' ? Math.max(0, priorDepositUsd) : 0;
  const computedBalanceUsd =
    dealType === 'balance-release'
      ? Math.max(0, fullCifUsd - effectiveDeposit)
      : Math.max(0, fullCifUsd);

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

  const filteredLeads = bookings.filter((lead) => {
    const matchesStage = crmStageFilter === 'all' || lead.status === crmStageFilter;
    const q = crmSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      lead.buyerName.toLowerCase().includes(q) ||
      lead.buyerEmail.toLowerCase().includes(q) ||
      lead.buyerPhone.toLowerCase().includes(q) ||
      lead.vehicleTitle.toLowerCase().includes(q) ||
      lead.destinationPortName.toLowerCase().includes(q) ||
      lead.notes.toLowerCase().includes(q);
    return matchesStage && matchesSearch;
  });

  const handleSaveCrmNote = async (leadId: string, fallbackNote: string) => {
    const draft = crmNotesDrafts[leadId] ?? fallbackNote;
    setSavingNoteId(leadId);
    try {
      await onUpdateBooking(leadId, { crmNotes: draft.trim() });
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleCreateManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;
    setManualLeadSaving(true);
    try {
      const port = DESTINATION_PORTS.find((p) => p.id === manualPortId) ?? DESTINATION_PORTS[0];
      await onCreateManualLead({
        vehicleId: null,
        vehicleTitle: manualVehicleTitle.trim() || 'Direct Buyer Inquiry',
        chassisCode: 'CRM Entry',
        buyerName: manualName.trim(),
        buyerEmail: manualEmail.trim(),
        buyerPhone: manualPhone.trim(),
        destinationPortId: port.id,
        destinationPortName: `${port.name}, ${port.country}`,
        requestType: 'Custom Auction Order',
        shippingMethod: 'RoRo Vessel',
        quotedAmountUsd: 0,
        notes: manualNotes.trim() || 'Logged directly in PJS Ventures CRM.',
        leadSource: 'Manual CRM Entry',
      });
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualVehicleTitle('');
      setManualNotes('');
      setShowManualLeadForm(false);
    } finally {
      setManualLeadSaving(false);
    }
  };

  const handleExportLeadsCsv = () => {
    const headers = [
      'Lead Ref',
      'Date',
      'Status',
      'Lead Source',
      'Buyer Name',
      'Email',
      'Phone / WhatsApp',
      'Vehicle',
      'Destination Port',
      'Quoted USD',
      'Form Message',
      'CRM Notes',
    ];
    const escapeCsv = (val: string | number) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLeads.map((l) =>
      [
        l.id.toUpperCase(),
        l.createdAt.slice(0, 10),
        l.status,
        l.leadSource || 'Website Booking Form',
        l.buyerName,
        l.buyerEmail,
        l.buyerPhone,
        l.vehicleTitle,
        l.destinationPortName,
        l.quotedAmountUsd,
        l.notes,
        l.crmNotes || '',
      ]
        .map(escapeCsv)
        .join(','),
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pjs-ventures-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAuthenticated = (user: PortalUser) => {
    writePortalSession(user);
    setSessionIdentity({ id: user.id, email: user.email });
  };

  const handleSignOut = () => {
    clearPortalSession();
    setSessionIdentity(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const compressedList = await Promise.all(files.map((file) => compressImageFile(file)));
      setGalleryImages((prev) => {
        const next = [...prev, ...compressedList];
        setPreviewIndex(prev.length === 0 ? 0 : next.length - 1);
        return next;
      });
      setFormError(null);
    } catch {
      setFormError('Could not process one of the selected image files. Try JPG or PNG photos.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    setGalleryImages((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      setPreviewIndex(prev.length === 0 ? 0 : next.length - 1);
      return next;
    });
    setCustomImageUrl('');
  };

  const handleSetCover = (idx: number) => {
    setGalleryImages((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const chosen = prev[idx];
      const next = [chosen, ...prev.filter((_, i) => i !== idx)];
      setPreviewIndex(0);
      return next;
    });
  };

  const handleRemoveImage = (idx: number) => {
    setGalleryImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPreviewIndex((curr) => (next.length === 0 ? 0 : curr >= next.length ? next.length - 1 : curr));
      return next;
    });
  };

  const resetFormForNew = () => {
    setEditingVehicleId(null);
    setMakeModel('');
    setTrim('');
    setCategory('Hybrids');
    setDealType('direct-import');
    setVehicleStatus('Available');
    setYear(2022);
    setMileageKm(32000);
    setChassisCode('');
    setEngine('1.8L Hybrid');
    setTransmission('Automatic');
    setDrive('2WD');
    setFuel('Hybrid');
    setSteering('RHD');
    setColor('Pearl White');
    setDestinationPortId(DESTINATION_PORTS[0].id);
    setDispatchedPortText(`${DESTINATION_PORTS[0].name}, ${DESTINATION_PORTS[0].country}`);
    setCustomBalancePortMode(false);
    setTrackingStage('In Transit');
    setEtaDate('2026-11-28');
    setVesselName('Next Weekly RoRo Sailing');
    setArrivalStatus('Ready to Book · Yokohama Yard');
    setFobUsd(16500);
    setCbm(11.6);
    setFullCifUsd(18100);
    setPriorDepositUsd(8000);
    setAuctionHouse('USS Tokyo');
    setGrade('4.5');
    setInspectorSummary(
      'Single-owner Japanese unit inspected in Yokohama. Clean exterior panels, verified mileage, ready for worldwide export.',
    );
    setGalleryImages([]);
    setPreviewIndex(0);
    setCustomImageUrl('');
    setFormError(null);
  };

  const startEditVehicle = (vehicle: ExportVehicle) => {
    setEditingVehicleId(vehicle.id);
    setMakeModel(vehicle.makeModel);
    setTrim(vehicle.trim);
    setCategory(vehicle.category);
    setDealType(vehicle.transit.dealType);
    setVehicleStatus(vehicle.status);
    setYear(vehicle.year);
    setMileageKm(vehicle.mileageKm);
    setChassisCode(vehicle.chassisCode);
    setEngine(vehicle.engine);
    setTransmission(vehicle.transmission);
    setDrive(vehicle.drive);
    setFuel(vehicle.fuel);
    setSteering(vehicle.steering);
    setColor(vehicle.color);
    const editPortId = vehicle.transit.destinationPortId || DESTINATION_PORTS[0].id;
    const matchedPort = DESTINATION_PORTS.find((p) => p.id === editPortId) ?? DESTINATION_PORTS[0];
    setDestinationPortId(editPortId);
    setDispatchedPortText(
      vehicle.transit.dealType === 'balance-release'
        ? vehicle.transit.destinationPortLabel
        : `${matchedPort.name}, ${matchedPort.country}`,
    );
    setCustomBalancePortMode(false);
    setTrackingStage(getPortTrackingStage(vehicle.transit));
    setEtaDate(vehicle.transit.etaDate || '2026-11-28');
    setVesselName(vehicle.transit.vesselName);
    setArrivalStatus(vehicle.transit.arrivalStatus);
    setFobUsd(vehicle.fobUsd);
    setCbm(vehicle.cbm ?? 12.5);
    setFullCifUsd(vehicle.transit.fullCifUsd);
    setPriorDepositUsd(
      vehicle.transit.priorDepositUsd > 0
        ? vehicle.transit.priorDepositUsd
        : Math.round(vehicle.transit.fullCifUsd * 0.45),
    );
    setAuctionHouse(vehicle.inspection.auctionHouse);
    setGrade(vehicle.inspection.overallGrade);
    setInspectorSummary(vehicle.inspection.inspectorSummary);
    setGalleryImages(getVehicleImages(vehicle));
    setPreviewIndex(0);
    setCustomImageUrl('');
    setFormError(null);
    setActiveTab('add-vehicle');
  };

  const handleSaveVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeModel.trim() || !chassisCode.trim()) {
      setFormError('Please enter Make & Model and Chassis Code.');
      return;
    }
    if (galleryImages.length === 0) {
      setFormError('Please upload at least one vehicle photo or paste an image URL.');
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const existingVehicle = editingVehicleId
        ? vehicles.find((v) => v.id === editingVehicleId)
        : undefined;

      const sharedPayload: Omit<ExportVehicle, 'id' | 'createdAt'> = {
        makeModel: makeModel.trim(),
        trim: trim.trim() || 'Export Grade',
        category,
        status: vehicleStatus,
        year,
        mileageKm,
        chassisCode: chassisCode.trim().toUpperCase(),
        engine: engine.trim(),
        transmission: transmission.trim(),
        drive,
        fuel,
        steering,
        color: color.trim() || 'Pearl White',
        port:
          dealType === 'balance-release'
            ? `In Transit · ${selectedPort.name}`
            : 'Yokohama Yard · Ships Worldwide',
        fobUsd,
        cbm: Math.max(4, Number(cbm) || 11.6),
        image: galleryImages[0],
        images: galleryImages,
        imageAlt: `${year} ${makeModel.trim()} (${chassisCode.trim().toUpperCase()})`,
        transit: {
          dealType,
          destinationPortId: selectedPort.id,
          destinationPortLabel:
            dealType === 'balance-release'
              ? dispatchedPortText.trim() || `${selectedPort.name}, ${selectedPort.country}`
              : `Ships to ${selectedPort.name} & Worldwide`,
          vesselName: vesselName.trim() || 'Weekly RoRo Sailing',
          arrivalStatus: arrivalStatus.trim() || 'Ready to Book',
          ...(dealType === 'balance-release' ? { trackingStage } : {}),
          ...(dealType === 'balance-release' && etaDate.trim()
            ? { etaDate: etaDate.trim() }
            : {}),
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
          lotNumber:
            existingVehicle?.inspection.lotNumber ||
            String(Math.floor(10000 + Math.random() * 89999)),
          overallGrade: grade,
          exteriorGrade: existingVehicle?.inspection.exteriorGrade || 'B',
          interiorGrade: existingVehicle?.inspection.interiorGrade || 'A',
          odometerVerified: true,
          radiationCheck: existingVehicle?.inspection.radiationCheck || 'Cleared · 0.05 µSv/h',
          inspectorSummary: inspectorSummary.trim(),
          bodyNotes: [
            `Verified auction grade ${grade}`,
            `Prepared for ${selectedPort.name} (${selectedPort.country}) import rules`,
          ],
        },
      };

      if (editingVehicleId) {
        await onUpdateVehicle(editingVehicleId, sharedPayload);
      } else {
        await onCreateVehicle(sharedPayload);
      }

      resetFormForNew();
      setActiveTab('inventory');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setVideoFormError(
        'Uploaded video files must be under 8 MB. For larger clips, paste an MP4 or YouTube URL below.',
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVideoUrl(reader.result);
        setVideoFormError(null);
      }
    };
    reader.onerror = () => {
      setVideoFormError('Could not read the selected video file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoUrl.trim()) {
      setVideoFormError('Please enter a clip title and either upload a video or paste a video URL.');
      return;
    }

    setVideoFormError(null);
    setVideoSaving(true);
    try {
      await onCreateVideo({
        title: videoTitle.trim(),
        portLabel: videoPortLabel.trim() || 'Caribbean Port Terminal',
        containerType: videoContainerType,
        vehicleSummary: videoVehicleSummary.trim() || 'Japanese Export Unit',
        videoUrl: videoUrl.trim(),
        posterUrl: videoPosterUrl,
        durationLabel: videoDurationLabel.trim() || '0:10',
      });
      setVideoTitle('');
      setVideoVehicleSummary('');
      setVideoUrl('');
    } catch (err) {
      setVideoFormError(err instanceof Error ? err.message : 'Failed to publish unloading video.');
    } finally {
      setVideoSaving(false);
    }
  };

  if (!activeUser) {
    return (
      <PortalLoginGate
        users={users}
        onAuthenticated={handleAuthenticated}
        onSyncOwnerPassword={async (userId, nextPw) => {
          await onUpdateUser(userId, { password: nextPw });
        }}
        onExitPortal={onExitPortal}
      />
    );
  }

  const perms = activeUser.permissions;

  const isTabAllowed = (tab: PortalTab): boolean => {
    if (tab === 'inventory') return perms.inventoryRead;
    if (tab === 'add-vehicle') return perms.inventoryWrite;
    if (tab === 'bookings') return perms.bookingsRead;
    if (tab === 'videos') return perms.videosManage;
    if (tab === 'users') return perms.usersManage;
    return false;
  };

  const fallbackAllowedTab: PortalTab = perms.inventoryRead
    ? 'inventory'
    : perms.bookingsRead
      ? 'bookings'
      : perms.videosManage
        ? 'videos'
        : perms.usersManage
          ? 'users'
          : 'inventory';

  const effectiveTab: PortalTab = isTabAllowed(activeTab) ? activeTab : fallbackAllowedTab;

  const safePreviewIndex = previewIndex < galleryImages.length ? previewIndex : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-950 flex flex-col lg:flex-row">
      {/* Left Portal Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <span className="font-display text-lg font-bold tracking-tight text-zinc-950">
              PJS Ventures Portal
            </span>
          </div>

          <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-950 truncate">
                {activeUser.name}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                {activeUser.role}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
              {activeUser.email}
            </div>
          </div>

          <nav aria-label="Seller Portal Navigation" className="p-4 space-y-1">
            {perms.inventoryRead && (
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'inventory'
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
                }`}
              >
                <Car className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Inventory ({vehicles.length})</span>
              </button>
            )}

            {perms.inventoryWrite && (
              <button
                type="button"
                onClick={() => {
                  resetFormForNew();
                  setActiveTab('add-vehicle');
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'add-vehicle'
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{editingVehicleId ? 'Edit Vehicle' : 'Add New Car'}</span>
              </button>
            )}

            {perms.bookingsRead && (
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'bookings'
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Leads &amp; CRM</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {bookings.length}
                </span>
              </button>
            )}

            {perms.videosManage && (
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'videos'
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Film className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Unloading Videos</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {videos.length}
                </span>
              </button>
            )}

            {perms.usersManage && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'users'
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-zinc-950'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Team &amp; Users</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {users.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={onExitPortal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Public Storefront</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPwError(null);
              setPwSaved(false);
              setPwCurrent('');
              setPwNext('');
              setPwConfirm('');
              setPwModalOpen(true);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
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
              {effectiveTab === 'inventory'
                ? 'Vehicle Inventory'
                : effectiveTab === 'add-vehicle'
                  ? editingVehicleId
                    ? 'Edit Vehicle'
                    : 'Publish New Vehicle'
                  : effectiveTab === 'videos'
                    ? 'Container Unloading Videos'
                    : effectiveTab === 'users'
                      ? 'Team Users & Permissions'
                      : 'Form Leads & Client CRM'}
            </span>
          </div>

          {effectiveTab !== 'add-vehicle' && perms.inventoryWrite && (
            <button
              type="button"
              onClick={() => {
                resetFormForNew();
                setActiveTab('add-vehicle');
              }}
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
            {perms.bookingsRead ? (
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="bg-white border border-slate-200 hover:border-blue-900 rounded-xl p-5 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-500">Form Leads CRM ({bookings.length})</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
                  {pendingBookingsCount}{' '}
                  <span className="text-xs font-sans font-normal text-blue-900">pending review</span>
                </div>
              </button>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Your Access Role</div>
                <div className="mt-1 font-display text-xl font-semibold text-zinc-950">
                  {activeUser.role}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: INVENTORY TABLE */}
          {effectiveTab === 'inventory' && perms.inventoryRead && (
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
                  {perms.inventoryWrite && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('add-vehicle')}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg cursor-pointer"
                    >
                      Add Your First Vehicle
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Type &amp; Port</th>
                        <th className="py-3 px-4 text-right">CIF / Balance Due</th>
                        <th className="py-3 px-4">Status</th>
                        {(perms.inventoryWrite || perms.inventoryDelete) && (
                          <th className="py-3 px-4 text-right">Actions</th>
                        )}
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
                                    {vehicle.chassisCode} · Grade {vehicle.inspection.overallGrade} ·{' '}
                                    {getVehicleImages(vehicle).length} photos
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 min-w-[240px]">
                              <div className="text-xs font-medium text-zinc-950">
                                {isBal ? 'Port Balance Deal' : 'Direct Japan Import'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {vehicle.transit.destinationPortLabel}
                              </div>
                              {isBal && (
                                <div className="mt-2 space-y-2">
                                  <PortTrackingProgress transit={vehicle.transit} variant="compact" />
                                  {perms.inventoryWrite && (
                                    <select
                                      aria-label={`Tracking stage for ${vehicle.makeModel}`}
                                      value={getPortTrackingStage(vehicle.transit)}
                                      onChange={(e) => {
                                        const nextStage = e.target.value as PortTrackingStage;
                                        const portShort = vehicle.transit.destinationPortLabel;
                                        const stageNote =
                                          nextStage === 'In Transit'
                                            ? `En Route to ${portShort}`
                                            : nextStage === 'At Port'
                                              ? `Arrived & Docked at ${portShort}`
                                              : nextStage === 'Customs Clearing'
                                                ? `B/L Endorsed · Customs Clearing at ${portShort}`
                                                : `Cleared · Ready for Pickup at ${portShort}`;
                                        onUpdateVehicle(vehicle.id, {
                                          status:
                                            nextStage === 'Ready for Pickup'
                                              ? 'Available'
                                              : nextStage === 'In Transit'
                                                ? 'In Transit'
                                                : vehicle.status,
                                          transit: {
                                            ...vehicle.transit,
                                            trackingStage: nextStage,
                                            arrivalStatus: stageNote,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-[11px] font-medium rounded border border-blue-200 bg-blue-50/70 text-blue-900 cursor-pointer"
                                    >
                                      {PORT_TRACKING_STAGES.map((stage) => (
                                        <option key={stage} value={stage}>
                                          Tracker: {stage}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )}
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
                              {perms.inventoryWrite ? (
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
                              ) : (
                                <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                                  {vehicle.status}
                                </span>
                              )}
                            </td>

                            {(perms.inventoryWrite || perms.inventoryDelete) && (
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center justify-end gap-1">
                                  {perms.inventoryWrite && (
                                    <button
                                      type="button"
                                      onClick={() => startEditVehicle(vehicle)}
                                      aria-label={`Edit ${vehicle.makeModel}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                  {perms.inventoryDelete && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteVehicle(vehicle.id)}
                                      aria-label={`Delete ${vehicle.makeModel}`}
                                      className="p-2 text-slate-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / EDIT CAR FORM */}
          {effectiveTab === 'add-vehicle' && perms.inventoryWrite && (
            <form
              onSubmit={handleSaveVehicleSubmit}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
            >
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-zinc-950">
                    {editingVehicleId
                      ? `Edit Vehicle — ${year} ${makeModel}`
                      : 'Add Vehicle to Storefront'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {editingVehicleId
                      ? 'Update any specs, photos, price, or switch this car between Direct Japan Import and Port Balance-Release.'
                      : 'Publish a standard car for direct Japan-to-worldwide booking, or list an in-transit Port Balance-Release unit.'}
                  </p>
                </div>
                {editingVehicleId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetFormForNew();
                      setActiveTab('inventory');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg self-start cursor-pointer"
                  >
                    Exit Edit Mode
                  </button>
                )}
              </div>

              {formError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}

              {/* Multi-Photo Upload, Carousel Preview & Gallery Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-3">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    {galleryImages.length > 0 ? (
                      <ResilientImage
                        src={galleryImages[safePreviewIndex]}
                        alt={`Vehicle preview ${safePreviewIndex + 1}`}
                        fallbackTitle="Vehicle Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                        <Upload className="w-7 h-7 text-slate-400" aria-hidden="true" />
                        <div className="text-xs font-medium text-zinc-950">
                          No photos selected yet
                        </div>
                        <p className="text-[11px] leading-relaxed max-w-[240px]">
                          Upload your own photos or paste an image URL below. Your chosen cover
                          becomes the Feature image.
                        </p>
                      </div>
                    )}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewIndex(
                              (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
                            )
                          }
                          aria-label="Previous preview photo"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg bg-zinc-950/75 text-white hover:bg-zinc-950 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewIndex((prev) => (prev + 1) % galleryImages.length)
                          }
                          aria-label="Next preview photo"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg bg-zinc-950/75 text-white hover:bg-zinc-950 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-zinc-950/75 text-white font-mono text-[11px] tabular-nums">
                          {safePreviewIndex + 1}/{galleryImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Gallery Thumbnails */}
                  {galleryImages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>Carousel Gallery ({galleryImages.length} photos)</span>
                        <span>Click any photo to make Feature</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((imgSrc, idx) => (
                          <div
                            key={`${imgSrc}-${idx}`}
                            className={`relative aspect-[4/3] rounded-lg overflow-hidden border ${
                              idx === 0 ? 'border-blue-900 ring-2 ring-blue-900/20' : 'border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCover(idx)}
                              title={idx === 0 ? 'Primary Feature Image' : 'Click to make Feature Image'}
                              className="w-full h-full block cursor-pointer"
                            >
                              <ResilientImage
                                src={imgSrc}
                                alt={`Gallery item ${idx + 1}`}
                                fallbackTitle="Photo"
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <span
                              className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium pointer-events-none ${
                                idx === 0
                                  ? 'bg-blue-900 text-white'
                                  : 'bg-zinc-950/70 text-white'
                              }`}
                            >
                              {idx === 0 ? 'Feature' : 'Set Feature'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              aria-label={`Remove photo ${idx + 1}`}
                              className="absolute top-1 right-1 w-5 h-5 inline-flex items-center justify-center rounded bg-zinc-950/75 text-white hover:bg-red-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Multiple Car Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Paste extra photo URL..."
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            setVehicleStatus('In Transit');
                            setArrivalStatus('Special Balance Deal · Arrives in 7 Days');
                            setVesselName((prev) =>
                              prev === 'Next Weekly RoRo Sailing' ? 'MV Hoegh Trigger' : prev,
                            );
                            if (priorDepositUsd <= 0) {
                              setPriorDepositUsd(Math.round(fullCifUsd * 0.45));
                            }
                          } else {
                            setVehicleStatus('Available');
                            setArrivalStatus('Ready to Book · Yokohama Yard');
                            setVesselName('Next Weekly RoRo Sailing');
                          }
                        }}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="direct-import">
                          Direct Japan Import
                        </option>
                        <option value="balance-release">
                          Port Balance-Release Deal
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

                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Availability Status
                      </label>
                      <select
                        value={vehicleStatus}
                        onChange={(e) => setVehicleStatus(e.target.value as VehicleStatus)}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Available">Available</option>
                        <option value="Booked">Booked</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Cleared">Cleared</option>
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
                        {dealType === 'balance-release'
                          ? 'Dispatched Port (Where It Sailed)'
                          : 'Primary Destination Port'}
                      </label>
                      <select
                        value={destinationPortId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setDestinationPortId(nextId);
                          const matched = DESTINATION_PORTS.find((p) => p.id === nextId);
                          if (matched) {
                            setCustomBalancePortMode(false);
                            setDispatchedPortText(`${matched.name}, ${matched.country}`);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        {PORT_REGIONS.map((region) => (
                          <optgroup key={region} label={region}>
                            {DESTINATION_PORTS.filter((p) => p.region === region).map((port) => (
                              <option key={port.id} value={port.id}>
                                {port.name} ({port.country})
                              </option>
                            ))}
                          </optgroup>
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

                  {dealType === 'balance-release' && (
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-blue-900">
                          Port Balance Dispatch &amp; Port Arrival Date
                        </div>
                        <span className="text-[11px] text-slate-600">
                          Locks this vehicle&apos;s Freight Calculator to this port
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-950 mb-1">
                            Dispatched Destination Port
                          </label>
                          <select
                            value={customBalancePortMode ? '__custom__' : destinationPortId}
                            onChange={(e) => {
                              const nextId = e.target.value;
                              if (nextId === '__custom__') {
                                setCustomBalancePortMode(true);
                                return;
                              }
                              setCustomBalancePortMode(false);
                              setDestinationPortId(nextId);
                              const matched = DESTINATION_PORTS.find((p) => p.id === nextId);
                              if (matched) {
                                setDispatchedPortText(`${matched.name}, ${matched.country}`);
                              }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                          >
                            {PORT_REGIONS.map((region) => (
                              <optgroup key={region} label={region}>
                                {DESTINATION_PORTS.filter((p) => p.region === region).map((port) => (
                                  <option key={port.id} value={port.id}>
                                    {port.name} ({port.country})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            <option value="__custom__">Other / Custom Port Name...</option>
                          </select>

                          {customBalancePortMode && (
                            <input
                              type="text"
                              value={dispatchedPortText}
                              onChange={(e) => setDispatchedPortText(e.target.value)}
                              placeholder="Enter custom port & country..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-950 mb-1">
                            Expected Port Arrival Date (ETA)
                          </label>
                          <input
                            type="date"
                            value={etaDate}
                            onChange={(e) => setEtaDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      {/* Visual Location & Status Tracking Bar Selector */}
                      <div className="pt-3 border-t border-blue-200/80 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-medium text-zinc-950">
                            Customer Tracking Stage (Visual Progress Bar)
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Displayed live on storefront car card &amp; detail page
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PORT_TRACKING_STAGES.map((stage) => {
                            const active = trackingStage === stage;
                            return (
                              <button
                                key={stage}
                                type="button"
                                onClick={() => {
                                  setTrackingStage(stage);
                                  const portLabel =
                                    dispatchedPortText.trim() || selectedPort.name;
                                  setArrivalStatus(
                                    stage === 'In Transit'
                                      ? `En Route to ${portLabel}`
                                      : stage === 'At Port'
                                        ? `Arrived & Docked at ${portLabel}`
                                        : stage === 'Customs Clearing'
                                          ? `Customs Clearing at ${portLabel}`
                                          : `Ready for Pickup at ${portLabel}`,
                                  );
                                  if (stage === 'In Transit') setVehicleStatus('In Transit');
                                  if (stage === 'Ready for Pickup') setVehicleStatus('Available');
                                }}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                                  active
                                    ? 'border-blue-900 bg-blue-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                                }`}
                              >
                                {stage}
                              </button>
                            );
                          })}
                        </div>

                        <PortTrackingProgress
                          variant="full"
                          transit={{
                            dealType: 'balance-release',
                            destinationPortId,
                            destinationPortLabel:
                              dispatchedPortText.trim() ||
                              `${selectedPort.name}, ${selectedPort.country}`,
                            vesselName,
                            arrivalStatus,
                            trackingStage,
                            etaDate,
                            fullCifUsd,
                            priorDepositUsd: effectiveDeposit,
                            balanceDueUsd: computedBalanceUsd,
                            blStatus: 'Express B/L ready',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        FOB Japan (USD)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={fobUsd === 0 ? '' : fobUsd}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const nextFob = raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0));
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
                        min={0}
                        step={1}
                        value={fullCifUsd === 0 ? '' : fullCifUsd}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setFullCifUsd(raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0)));
                        }}
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
                          step={1}
                          value={priorDepositUsd === 0 ? '' : priorDepositUsd}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setPriorDepositUsd(
                              raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0)),
                            );
                          }}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Exterior Color
                      </label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Pearl White"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Volume CBM (m³)
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={40}
                        step={0.1}
                        value={cbm}
                        onChange={(e) => setCbm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 mb-1">
                        Auction House
                      </label>
                      <input
                        type="text"
                        value={auctionHouse}
                        onChange={(e) => setAuctionHouse(e.target.value)}
                        placeholder="e.g. USS Tokyo"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                      />
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
                      onClick={() => {
                        resetFormForNew();
                        setActiveTab('inventory');
                      }}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 rounded-lg cursor-pointer"
                    >
                      {saving
                        ? editingVehicleId
                          ? 'Saving...'
                          : 'Publishing...'
                        : editingVehicleId
                          ? 'Save Changes'
                          : 'Publish Vehicle'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: FORM LEADS & CLIENT CRM */}
          {effectiveTab === 'bookings' && perms.bookingsRead && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-zinc-950">
                      Form Leads &amp; Client CRM ({bookings.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Every inquiry from your Home Page form, Booking page, and Freight Calculator
                      lands here for follow-up. Confirming a deposit automatically marks linked
                      cars as Booked.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {perms.bookingsWrite && (
                      <button
                        type="button"
                        onClick={() => setShowManualLeadForm((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{showManualLeadForm ? 'Close Lead Form' : 'Add Manual Lead'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportLeadsCsv}
                      disabled={filteredLeads.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {showManualLeadForm && perms.bookingsWrite && (
                  <form
                    onSubmit={handleCreateManualLeadSubmit}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="text-xs font-semibold text-zinc-950">
                      Log New WhatsApp / Phone / Walk-In Lead
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Buyer Name *"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="email"
                        required
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Buyer Email *"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="WhatsApp / Phone"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={manualPortId}
                        onChange={(e) => setManualPortId(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        {PORT_REGIONS.map((region) => (
                          <optgroup key={region} label={region}>
                            {DESTINATION_PORTS.filter((p) => p.region === region).map((port) => (
                              <option key={port.id} value={port.id}>
                                {port.name} ({port.country})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={manualVehicleTitle}
                        onChange={(e) => setManualVehicleTitle(e.target.value)}
                        placeholder="Vehicle Interested In (e.g. 2022 Hilux)"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Lead notes or budget..."
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={manualLeadSaving}
                        className="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                      >
                        {manualLeadSaving ? 'Saving Lead...' : 'Save Lead to CRM'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        { id: 'all', label: 'All Leads' },
                        { id: 'Pending Review', label: 'New / Pending' },
                        { id: 'Contacted', label: 'Contacted' },
                        { id: 'Deposit Confirmed', label: 'Deposit Paid' },
                        { id: 'Shipped / B/L Issued', label: 'Shipped' },
                        { id: 'Cancelled', label: 'Cancelled' },
                      ] as const
                    ).map((stage) => (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setCrmStageFilter(stage.id)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          crmStageFilter === stage.id
                            ? 'bg-white text-zinc-950 shadow-sm'
                            : 'text-slate-600 hover:text-zinc-950'
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full lg:w-64">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Search leads by name, phone..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                  No leads match this stage or search query. Any form submission on the site appears
                  here automatically.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => {
                    const phoneDigits = lead.buyerPhone.replace(/[^\d]/g, '');
                    const currentNoteDraft = crmNotesDrafts[lead.id] ?? (lead.crmNotes || '');
                    const hasNoteChanges =
                      crmNotesDrafts[lead.id] !== undefined &&
                      crmNotesDrafts[lead.id] !== (lead.crmNotes || '');
                    const submittedLabel = formatEtaDate(lead.createdAt.slice(0, 10));

                    return (
                      <div
                        key={lead.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Lead Identity & Contact Info */}
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                              <span className="font-mono font-semibold text-blue-900">
                                #{lead.id.toUpperCase()}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="text-slate-500">
                                {lead.leadSource || 'Website Booking Form'}
                              </span>
                              {submittedLabel && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="text-slate-500">{submittedLabel}</span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                              <h3 className="font-display text-lg font-semibold text-zinc-950">
                                {lead.buyerName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <a
                                  href={`mailto:${lead.buyerEmail}`}
                                  className="inline-flex items-center gap-1 text-blue-900 hover:underline"
                                >
                                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{lead.buyerEmail}</span>
                                </a>
                                {lead.buyerPhone && (
                                  <>
                                    <a
                                      href={`tel:${lead.buyerPhone}`}
                                      className="inline-flex items-center gap-1 font-mono text-zinc-950 hover:underline"
                                    >
                                      <Phone className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                                      <span>{lead.buyerPhone}</span>
                                    </a>
                                    {phoneDigits.length >= 7 && (
                                      <a
                                        href={`https://wa.me/${phoneDigits}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-800 font-medium hover:underline"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>WhatsApp</span>
                                      </a>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="text-slate-500">Vehicle / Inquiry</div>
                                <div className="font-medium text-zinc-950 mt-0.5">
                                  {lead.vehicleTitle}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {lead.chassisCode}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="text-slate-500">Destination &amp; Mode</div>
                                <div className="font-medium text-zinc-950 mt-0.5">
                                  {lead.destinationPortName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {lead.requestType} · {lead.shippingMethod}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="text-slate-500">Quoted Value</div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 mt-0.5 tabular-nums">
                                  {lead.quotedAmountUsd > 0
                                    ? `$${lead.quotedAmountUsd.toLocaleString('en-US')} USD`
                                    : 'Custom Quote'}
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 leading-relaxed">
                              <span className="font-medium text-zinc-950">Buyer Message: </span>
                              {lead.notes}
                            </div>
                          </div>

                          {/* Stage Selector & Delete */}
                          <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0">
                            <div className="w-full sm:w-52">
                              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                Pipeline Stage
                              </label>
                              {perms.bookingsWrite ? (
                                <select
                                  aria-label={`CRM stage for ${lead.buyerName}`}
                                  value={lead.status}
                                  onChange={(e) =>
                                    onUpdateBooking(lead.id, {
                                      status: e.target.value as BookingRequest['status'],
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-zinc-950"
                                >
                                  <option value="Pending Review">Pending Review</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Deposit Confirmed">Deposit Confirmed</option>
                                  <option value="Shipped / B/L Issued">Shipped / B/L Issued</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              ) : (
                                <div className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                  {lead.status}
                                </div>
                              )}
                            </div>

                            {perms.bookingsDelete && (
                              <button
                                type="button"
                                onClick={() => onDeleteBooking(lead.id)}
                                aria-label={`Delete lead ${lead.buyerName}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Delete Lead</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Internal Seller Follow-Up Notes */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="text"
                            aria-label={`Follow-up note for ${lead.buyerName}`}
                            readOnly={!perms.bookingsWrite}
                            value={currentNoteDraft}
                            onChange={(e) =>
                              setCrmNotesDrafts((prev) => ({
                                ...prev,
                                [lead.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              perms.bookingsWrite
                                ? 'Add private CRM follow-up note (e.g. Sent proforma invoice on WhatsApp, waiting TT copy...)'
                                : 'No internal follow-up notes'
                            }
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-900"
                          />
                          {perms.bookingsWrite && (
                            <button
                              type="button"
                              disabled={!hasNoteChanges || savingNoteId === lead.id}
                              onClick={() => handleSaveCrmNote(lead.id, lead.crmNotes || '')}
                              className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-slate-200 disabled:text-slate-500 transition-colors cursor-pointer shrink-0"
                            >
                              {savingNoteId === lead.id ? 'Saving...' : 'Save CRM Note'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTAINER UNLOADING VIDEOS */}
          {effectiveTab === 'videos' && perms.videosManage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveVideoSubmit}
                className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="font-display text-lg font-semibold text-zinc-950">
                    Add Container Unloading Clip
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Publish a new video reel to the home page container unloading showcase.
                  </p>
                </div>

                {videoFormError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    {videoFormError}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-950 mb-1">
                    Clip Title *
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Toyota Prado 4x4 Rolling Off 40ft Ramp"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-950 mb-1">
                      Destination Port
                    </label>
                    <input
                      type="text"
                      value={videoPortLabel}
                      onChange={(e) => setVideoPortLabel(e.target.value)}
                      placeholder="Port of Nassau, Bahamas"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-950 mb-1">
                      Container Type
                    </label>
                    <select
                      value={videoContainerType}
                      onChange={(e) => setVideoContainerType(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="40ft High-Cube Container">40ft High-Cube Container</option>
                      <option value="20ft Dedicated Container">20ft Dedicated Container</option>
                      <option value="40ft Shared Container">40ft Shared Container</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-950 mb-1">
                      Vehicle Summary
                    </label>
                    <input
                      type="text"
                      value={videoVehicleSummary}
                      onChange={(e) => setVideoVehicleSummary(e.target.value)}
                      placeholder="e.g. 2021 Land Cruiser Prado TX"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-950 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={videoDurationLabel}
                      onChange={(e) => setVideoDurationLabel(e.target.value)}
                      placeholder="0:12"
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-950">
                    Video Source (Upload MP4/WebM or Paste URL) *
                  </label>
                  <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload MP4 / WebM Clip (max 8 MB)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <input
                    type="text"
                    value={videoUrl.startsWith('data:') ? 'Uploaded video clip attached' : videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://...mp4 or YouTube URL"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <div className="text-xs font-medium text-zinc-950 mb-1.5">
                    Thumbnail Poster Scene
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CONTAINER_POSTER_PRESETS.map((preset) => (
                      <button
                        key={preset.src}
                        type="button"
                        onClick={() => setVideoPosterUrl(preset.src)}
                        className={`rounded-lg overflow-hidden border text-left cursor-pointer ${
                          videoPosterUrl === preset.src
                            ? 'border-blue-900 ring-2 ring-blue-900/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-video bg-slate-100">
                          <ResilientImage
                            src={preset.src}
                            alt={preset.label}
                            fallbackTitle={preset.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-1.5 py-1 text-[10px] font-medium text-zinc-950 truncate">
                          {preset.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={videoSaving}
                  className="w-full py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 rounded-lg cursor-pointer"
                >
                  {videoSaving ? 'Publishing Clip...' : 'Publish Unloading Video'}
                </button>
              </form>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-zinc-950">
                      Published Unloading Clips
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live in the Container Arrival & Unloading section on your Home Page.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {videos.length} reels
                  </span>
                </div>

                {videos.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No unloading videos published yet. Use the form on the left to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {videos.map((clip) => (
                      <div
                        key={clip.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-28 aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <ResilientImage
                              src={clip.posterUrl}
                              alt={clip.title}
                              fallbackTitle={clip.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-950 truncate">
                              {clip.title}
                            </div>
                            <div className="text-xs text-blue-900 font-medium truncate mt-0.5">
                              {clip.portLabel}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                              {clip.vehicleSummary} ·{' '}
                              <span className="font-mono tabular-nums">{clip.durationLabel}</span> ·{' '}
                              {clip.containerType}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteVideo(clip.id)}
                          aria-label={`Delete ${clip.title}`}
                          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* TAB 5: TEAM USERS & RBAC PERMISSIONS */}
          {effectiveTab === 'users' && perms.usersManage && (
            <PortalUsersPanel
              users={users}
              currentUserId={activeUser.id}
              onCreateUser={onCreateUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
            />
          )}
        </div>
      </div>

      {/* Change CRM / Portal Password Modal */}
      {pwModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Change Seller Portal Password"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
          onClick={() => setPwModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-blue-900" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-zinc-950">
                  Change Your Password
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPwModalOpen(false)}
                aria-label="Close password modal"
                className="p-1.5 text-slate-400 hover:text-zinc-950 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {pwError}
              </p>
            )}
            {pwSaved && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Password updated successfully. Use your new password next time you sign in.
              </p>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const currentOk = activeUser.isPrimaryOwner
                  ? isValidPortalPassword(pwCurrent) || pwCurrent === activeUser.password
                  : pwCurrent === activeUser.password;
                if (!currentOk) {
                  setPwError('Current password is incorrect.');
                  return;
                }
                if (pwNext.trim().length < 6) {
                  setPwError('New password must be at least 6 characters.');
                  return;
                }
                if (pwNext !== pwConfirm) {
                  setPwError('New password and confirmation do not match.');
                  return;
                }
                try {
                  await onUpdateUser(activeUser.id, { password: pwNext });
                  if (activeUser.isPrimaryOwner) {
                    savePortalPassword(pwNext);
                  }
                  setPwError(null);
                  setPwSaved(true);
                  setPwCurrent('');
                  setPwNext('');
                  setPwConfirm('');
                } catch (err) {
                  setPwError(err instanceof Error ? err.message : 'Could not update password.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-950 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-950 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwNext}
                  onChange={(e) => setPwNext(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-950 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
