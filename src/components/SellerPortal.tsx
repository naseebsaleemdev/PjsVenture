import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Car,
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sun,
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
import { readPortalDarkMode, writePortalDarkMode } from '../lib/portalTheme.ts';
import type {
  BlogPost,
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
import { PortalBlogsPanel } from './PortalBlogsPanel';
import { PortalLoginGate } from './PortalLoginGate';
import { PortalUsersPanel } from './PortalUsersPanel';
import { ResilientImage } from './ResilientImage';

type PortalTab = 'inventory' | 'add-vehicle' | 'bookings' | 'blogs' | 'users';

type DeleteTarget =
  | { kind: 'vehicle'; id: string; title: string; subtitle: string }
  | { kind: 'booking'; id: string; title: string; subtitle: string }
  | { kind: 'video'; id: string; title: string; subtitle: string }
  | { kind: 'blog'; id: string; title: string; subtitle: string }
  | { kind: 'user'; id: string; title: string; subtitle: string }
  | null;

interface SellerPortalProps {
  activeUser: PortalUser | null;
  authLoading: boolean;
  authError: string | null;
  onClearAuthError: () => void;
  onSignOut: () => Promise<void>;
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
  blogs: BlogPost[];
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
  onCreateBlog: (blog: Omit<BlogPost, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateBlog: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  onDeleteBlog: (id: string) => Promise<void>;
  onViewBlogPost: (slug: string) => void;
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
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function SellerPortal({
  activeUser,
  authLoading,
  authError,
  onClearAuthError,
  onSignOut,
  vehicles,
  bookings,
  videos,
  blogs,
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
  onCreateBlog,
  onUpdateBlog,
  onDeleteBlog,
  onViewBlogPost,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onExitPortal,
}: SellerPortalProps) {

  const [activeTab, setActiveTab] = useState<PortalTab>('inventory');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => readPortalDarkMode());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | ListingMode>('all');

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      writePortalDarkMode(next);
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === 'vehicle') {
        await onDeleteVehicle(deleteTarget.id);
      } else if (deleteTarget.kind === 'booking') {
        await onDeleteBooking(deleteTarget.id);
      } else if (deleteTarget.kind === 'video') {
        await onDeleteVideo(deleteTarget.id);
      } else if (deleteTarget.kind === 'blog') {
        await onDeleteBlog(deleteTarget.id);
      } else if (deleteTarget.kind === 'user') {
        await onDeleteUser(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not complete deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const remainingSlots = Math.max(0, 8 - galleryImages.length);
      if (remainingSlots === 0) {
        setFormError('Maximum 8 photos per vehicle listing.');
        return;
      }
      const compressedList = await Promise.all(
        files.slice(0, remainingSlots).map((file) => compressImageFile(file)),
      );
      setGalleryImages((prev) => {
        const next = [...prev, ...compressedList].slice(0, 8);
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
    if (galleryImages.length >= 8) {
      setFormError('Maximum 8 photos per vehicle listing.');
      return;
    }
    setGalleryImages((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed].slice(0, 8);
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
    const matchedPort =
      DESTINATION_PORTS.find((p) => p.id === vehicle.transit.destinationPortId) ??
      DESTINATION_PORTS[0];
    setDestinationPortId(matchedPort.id);
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
          destinationPortId: dealType === 'balance-release' ? selectedPort.id : 'worldwide',
          destinationPortLabel:
            dealType === 'balance-release'
              ? dispatchedPortText.trim() || `${selectedPort.name}, ${selectedPort.country}`
              : 'Ships Worldwide · Buyer Chooses Port',
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
            dealType === 'balance-release'
              ? `Prepared for ${dispatchedPortText.trim() || selectedPort.name} import rules`
              : 'Ships worldwide via RoRo or container to buyer-selected port',
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
    if (file.size > 500 * 1024) {
      setVideoFormError(
        'Direct video uploads must be under 500 KB for cloud storage. For larger clips, paste an MP4 or YouTube URL below.',
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (reader.result.length > 740000) {
          setVideoFormError(
            'Encoded clip exceeds cloud document limit. Please paste an MP4 or YouTube URL instead.',
          );
          return;
        }
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
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        authLoading={authLoading}
        authError={authError}
        onClearAuthError={onClearAuthError}
        onExitPortal={onExitPortal}
      />
    );
  }

  const perms = activeUser.permissions;
  const canManageBlogs =
    Boolean(activeUser.isPrimaryOwner) ||
    perms.inventoryWrite ||
    perms.videosManage ||
    perms.usersManage;

  const isTabAllowed = (tab: PortalTab): boolean => {
    if (tab === 'inventory') return perms.inventoryRead;
    if (tab === 'add-vehicle') return perms.inventoryWrite;
    if (tab === 'bookings') return perms.bookingsRead;
    if (tab === 'blogs') return canManageBlogs;
    if (tab === 'users') return perms.usersManage;
    return false;
  };

  const fallbackAllowedTab: PortalTab = perms.inventoryRead
    ? 'inventory'
    : perms.bookingsRead
      ? 'bookings'
      : canManageBlogs
        ? 'blogs'
        : perms.usersManage
          ? 'users'
          : 'inventory';

  const effectiveTab: PortalTab = isTabAllowed(activeTab) ? activeTab : fallbackAllowedTab;

  const safePreviewIndex = previewIndex < galleryImages.length ? previewIndex : 0;

  return (
    <div
      className={`${isDarkMode ? 'dark [color-scheme:dark]' : ''} min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 flex flex-col lg:flex-row transition-colors`}
    >
      {/* Left Portal Sidebar */}
      <aside className="w-full lg:w-64 bg-white dark:bg-zinc-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
                alt="PJS Ventures"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-zinc-950 dark:text-white truncate">
              Seller Portal
            </span>
          </div>

          <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                {activeUser.name}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                {activeUser.role}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5">
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
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white'
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
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white'
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
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Leads &amp; CRM</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                  {bookings.length}
                </span>
              </button>
            )}

            {canManageBlogs && (
              <button
                type="button"
                onClick={() => setActiveTab('blogs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'blogs'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Blog Posts</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                  {blogs.length}
                </span>
              </button>
            )}

            {perms.usersManage && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  effectiveTab === 'users'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Team &amp; Users</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                  {users.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={onExitPortal}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Public Storefront</span>
          </button>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Portal Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Portal Bar */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500 dark:text-zinc-400 truncate">
            <span>Seller Portal</span>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-zinc-950 dark:text-white">
              {effectiveTab === 'inventory'
                ? 'Vehicle Inventory'
                : effectiveTab === 'add-vehicle'
                  ? editingVehicleId
                    ? 'Edit Vehicle'
                    : 'Publish New Vehicle'
                  : effectiveTab === 'blogs'
                    ? 'Blog Posts & Articles'
                    : effectiveTab === 'users'
                      ? 'Team Users & Permissions'
                      : 'Form Leads & Client CRM'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleDarkMode}
              aria-label={isDarkMode ? 'Switch CRM to Light Mode' : 'Switch CRM to Dark Mode'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {effectiveTab !== 'add-vehicle' && perms.inventoryWrite && (
              <button
                type="button"
                onClick={() => {
                  resetFormForNew();
                  setActiveTab('add-vehicle');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Vehicle</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-zinc-400">Total Listed Cars</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 dark:text-white tabular-nums">
                {vehicles.length}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-zinc-400">Direct Japan Bookings</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 dark:text-white tabular-nums">
                {directCount}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                Port Balance-Release Units
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold text-blue-900 dark:text-blue-400 tabular-nums">
                {balanceCount}
              </div>
            </div>
            {perms.bookingsRead ? (
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-900 dark:hover:border-blue-500 rounded-xl p-5 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  Form Leads CRM ({bookings.length})
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 dark:text-white tabular-nums">
                  {pendingBookingsCount}{' '}
                  <span className="text-xs font-sans font-normal text-blue-900 dark:text-blue-400">
                    pending review
                  </span>
                </div>
              </button>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
                <div className="text-xs text-slate-500 dark:text-zinc-400">Your Access Role</div>
                <div className="mt-1 font-display text-xl font-semibold text-zinc-950 dark:text-white">
                  {activeUser.role}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: INVENTORY TABLE */}
          {effectiveTab === 'inventory' && perms.inventoryRead && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg self-start">
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
                          ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search
                    className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by model or chassis..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    {vehicles.length === 0
                      ? 'No vehicles in inventory yet.'
                      : 'No vehicles match your current filter.'}
                  </p>
                  {perms.inventoryWrite && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormForNew();
                        setActiveTab('add-vehicle');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-900 dark:bg-blue-700 rounded-lg cursor-pointer"
                    >
                      {vehicles.length === 0 ? 'Add Your First Vehicle' : 'Add Vehicle'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs font-medium text-slate-500 dark:text-zinc-400">
                        <th className="py-3 px-4">Vehicle</th>
                        <th className="py-3 px-4">Type &amp; Port</th>
                        <th className="py-3 px-4 text-right">CIF / Balance Due</th>
                        <th className="py-3 px-4">Status</th>
                        {(perms.inventoryWrite || perms.inventoryDelete) && (
                          <th className="py-3 px-4 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                      {filteredInventory.map((vehicle) => {
                        const isBal = vehicle.transit.dealType === 'balance-release';
                        return (
                          <tr
                            key={vehicle.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-10 rounded overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0">
                                  <ResilientImage
                                    src={vehicle.image}
                                    alt={vehicle.imageAlt}
                                    fallbackTitle={vehicle.makeModel}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-zinc-950 dark:text-zinc-100 truncate">
                                    {vehicle.year} {vehicle.makeModel}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                                    {vehicle.chassisCode} · Grade {vehicle.inspection.overallGrade} ·{' '}
                                    {getVehicleImages(vehicle).length} photos
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 min-w-[240px]">
                              <div className="text-xs font-medium text-zinc-950 dark:text-zinc-100">
                                {isBal ? 'Port Balance Deal' : 'Direct Japan Import'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-zinc-400">
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
                                      className="w-full px-2 py-1 text-[11px] font-medium rounded border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 cursor-pointer"
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
                              <div className="font-semibold text-zinc-950 dark:text-white">
                                {formatAutoPrice(vehicle.transit.balanceDueUsd, 'USD')}
                              </div>
                              {isBal && (
                                <div className="text-[11px] text-emerald-800 dark:text-emerald-400">
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
                                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                                >
                                  <option value="Available">Available</option>
                                  <option value="Booked">Booked</option>
                                  <option value="In Transit">In Transit</option>
                                  <option value="Cleared">Cleared</option>
                                </select>
                              ) : (
                                <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300">
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
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                  {perms.inventoryDelete && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeleteError(null);
                                        setDeleteTarget({
                                          kind: 'vehicle',
                                          id: vehicle.id,
                                          title: `${vehicle.year} ${vehicle.makeModel}`,
                                          subtitle: `${vehicle.chassisCode} · ${vehicle.transit.destinationPortLabel}`,
                                        });
                                      }}
                                      aria-label={`Delete ${vehicle.makeModel}`}
                                      className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6"
            >
              <div className="border-b border-slate-200 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-zinc-950 dark:text-white">
                    {editingVehicleId
                      ? `Edit Vehicle — ${year} ${makeModel}`
                      : 'Add Vehicle to Storefront'}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
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
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg self-start cursor-pointer"
                  >
                    Exit Edit Mode
                  </button>
                )}
              </div>

              {formError && (
                <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg px-4 py-3">
                  {formError}
                </p>
              )}

              {/* Multi-Photo Upload, Carousel Preview & Gallery Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-3">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950">
                    {galleryImages.length > 0 ? (
                      <ResilientImage
                        src={galleryImages[safePreviewIndex]}
                        alt={`Vehicle preview ${safePreviewIndex + 1}`}
                        fallbackTitle="Vehicle Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-zinc-400 space-y-2">
                        <Upload className="w-7 h-7 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
                        <div className="text-xs font-medium text-zinc-950 dark:text-zinc-100">
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
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5">
                        <span>Carousel Gallery ({galleryImages.length} photos)</span>
                        <span>Click any photo to make Feature</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((imgSrc, idx) => (
                          <div
                            key={`${imgSrc}-${idx}`}
                            className={`relative aspect-[4/3] rounded-lg overflow-hidden border ${
                              idx === 0
                                ? 'border-blue-900 dark:border-blue-500 ring-2 ring-blue-900/20 dark:ring-blue-500/30'
                                : 'border-slate-200 dark:border-zinc-700'
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
                                  ? 'bg-blue-900 dark:bg-blue-700 text-white'
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

                  <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-950 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors">
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
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-950 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
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
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
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
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Vehicle Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as Exclude<VehicleCategory, 'All Stock'>)
                        }
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="Hybrids">Hybrids</option>
                        <option value="SUVs & 4x4">SUVs & 4x4</option>
                        <option value="Sedans">Sedans</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Availability Status
                      </label>
                      <select
                        value={vehicleStatus}
                        onChange={(e) => setVehicleStatus(e.target.value as VehicleStatus)}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
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
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Make & Model *
                      </label>
                      <input
                        type="text"
                        value={makeModel}
                        onChange={(e) => setMakeModel(e.target.value)}
                        placeholder="e.g. Honda Vezel Hybrid"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Trim / Grade Package
                      </label>
                      <input
                        type="text"
                        value={trim}
                        onChange={(e) => setTrim(e.target.value)}
                        placeholder="e.g. Z Play Package"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={mileageKm}
                        onChange={(e) => setMileageKm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Chassis Code *
                      </label>
                      <input
                        type="text"
                        value={chassisCode}
                        onChange={(e) => setChassisCode(e.target.value)}
                        placeholder="RV5-104921"
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Auction Grade
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
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
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Engine
                      </label>
                      <input
                        type="text"
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Fuel
                      </label>
                      <select
                        value={fuel}
                        onChange={(e) => setFuel(e.target.value as 'Hybrid' | 'Diesel' | 'Petrol')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="Hybrid">Hybrid</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Drive
                      </label>
                      <select
                        value={drive}
                        onChange={(e) => setDrive(e.target.value as '2WD' | '4WD' | 'AWD')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="2WD">2WD</option>
                        <option value="4WD">4WD</option>
                        <option value="AWD">AWD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Steering
                      </label>
                      <select
                        value={steering}
                        onChange={(e) => setSteering(e.target.value as 'RHD' | 'LHD')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      >
                        <option value="RHD">RHD</option>
                        <option value="LHD">LHD</option>
                      </select>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-1 ${dealType === 'direct-import' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}
                  >
                    {dealType === 'direct-import' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                          Destination Port Coverage
                        </label>
                        <div className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/70 text-slate-700 dark:text-zinc-300">
                          Ships Worldwide (Buyer chooses port)
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Vessel / Schedule
                      </label>
                      <input
                        type="text"
                        value={vesselName}
                        onChange={(e) => setVesselName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Availability / ETA Note
                      </label>
                      <input
                        type="text"
                        value={arrivalStatus}
                        onChange={(e) => setArrivalStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {dealType === 'balance-release' && (
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                          Port Balance Dispatch &amp; Port Arrival Date
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                          Locks this vehicle&apos;s Freight Calculator to this port
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
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
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
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
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                            Expected Port Arrival Date (ETA)
                          </label>
                          <input
                            type="date"
                            value={etaDate}
                            onChange={(e) => setEtaDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      {/* Visual Location & Status Tracking Bar Selector */}
                      <div className="pt-3 border-t border-blue-200/80 dark:border-blue-900/60 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-medium text-zinc-950 dark:text-zinc-200">
                            Customer Tracking Stage (Visual Progress Bar)
                          </label>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
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
                                    ? 'border-blue-900 bg-blue-900 dark:border-blue-600 dark:bg-blue-700 text-white'
                                    : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500'
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

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
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
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
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
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    {dealType === 'balance-release' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
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
                          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                        />
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                        {dealType === 'balance-release' ? 'Balance Due' : 'Listed CIF Price'}
                      </div>
                      <div className="px-3 py-2 text-sm font-mono font-semibold text-blue-900 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg tabular-nums">
                        ${computedBalanceUsd.toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Exterior Color
                      </label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Pearl White"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Volume CBM (m³)
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={40}
                        step={0.1}
                        value={cbm}
                        onChange={(e) => setCbm(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                        Auction House
                      </label>
                      <input
                        type="text"
                        value={auctionHouse}
                        onChange={(e) => setAuctionHouse(e.target.value)}
                        placeholder="e.g. USS Tokyo"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-950 dark:text-zinc-200 mb-1">
                      Auction & Condition Notes
                    </label>
                    <textarea
                      rows={3}
                      value={inspectorSummary}
                      onChange={(e) => setInspectorSummary(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetFormForNew();
                        setActiveTab('inventory');
                      }}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-zinc-700 rounded-lg cursor-pointer"
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
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                      Form Leads &amp; Client CRM ({bookings.length})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{showManualLeadForm ? 'Close Lead Form' : 'Add Manual Lead'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportLeadsCsv}
                      disabled={filteredLeads.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-950 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {showManualLeadForm && perms.bookingsWrite && (
                  <form
                    onSubmit={handleCreateManualLeadSubmit}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3"
                  >
                    <div className="text-xs font-semibold text-zinc-950 dark:text-white">
                      Log New WhatsApp / Phone / Walk-In Lead
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Buyer Name *"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <input
                        type="email"
                        required
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Buyer Email *"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="WhatsApp / Phone"
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={manualPortId}
                        onChange={(e) => setManualPortId(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100"
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
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <input
                        type="text"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="Lead notes or budget..."
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={manualLeadSaving}
                        className="px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg cursor-pointer"
                      >
                        {manualLeadSaving ? 'Saving Lead...' : 'Save Lead to CRM'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
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
                            ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full lg:w-64">
                    <Search
                      className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Search leads by name, phone..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-10 text-center text-sm text-slate-500 dark:text-zinc-400">
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
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Lead Identity & Contact Info */}
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                              <span className="font-mono font-semibold text-blue-900 dark:text-blue-400">
                                #{lead.id.toUpperCase()}
                              </span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">
                                ·
                              </span>
                              <span className="text-slate-500 dark:text-zinc-400">
                                {lead.leadSource || 'Website Booking Form'}
                              </span>
                              {submittedLabel && (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="text-slate-300 dark:text-zinc-600"
                                  >
                                    ·
                                  </span>
                                  <span className="text-slate-500 dark:text-zinc-400">
                                    {submittedLabel}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                              <h3 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                                {lead.buyerName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <a
                                  href={`mailto:${lead.buyerEmail}`}
                                  className="inline-flex items-center gap-1 text-blue-900 dark:text-blue-400 hover:underline"
                                >
                                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{lead.buyerEmail}</span>
                                </a>
                                {lead.buyerPhone && (
                                  <>
                                    <a
                                      href={`tel:${lead.buyerPhone}`}
                                      className="inline-flex items-center gap-1 font-mono text-zinc-950 dark:text-zinc-200 hover:underline"
                                    >
                                      <Phone
                                        className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400"
                                        aria-hidden="true"
                                      />
                                      <span>{lead.buyerPhone}</span>
                                    </a>
                                    {phoneDigits.length >= 7 && (
                                      <a
                                        href={`https://wa.me/${phoneDigits}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-medium hover:underline"
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
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                <div className="text-slate-500 dark:text-zinc-400">
                                  Vehicle / Inquiry
                                </div>
                                <div className="font-medium text-zinc-950 dark:text-zinc-100 mt-0.5">
                                  {lead.vehicleTitle}
                                </div>
                                <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                                  {lead.chassisCode}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                <div className="text-slate-500 dark:text-zinc-400">
                                  Destination &amp; Mode
                                </div>
                                <div className="font-medium text-zinc-950 dark:text-zinc-100 mt-0.5">
                                  {lead.destinationPortName}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                  {lead.requestType} · {lead.shippingMethod}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                <div className="text-slate-500 dark:text-zinc-400">
                                  Quoted Value
                                </div>
                                <div className="font-mono text-sm font-semibold text-zinc-950 dark:text-white mt-0.5 tabular-nums">
                                  {lead.quotedAmountUsd > 0
                                    ? `$${lead.quotedAmountUsd.toLocaleString('en-US')} USD`
                                    : 'Custom Quote'}
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 leading-relaxed">
                              <span className="font-medium text-zinc-950 dark:text-white">
                                Buyer Message:{' '}
                              </span>
                              {lead.notes}
                            </div>
                          </div>

                          {/* Stage Selector & Delete */}
                          <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0">
                            <div className="w-full sm:w-52">
                              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
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
                                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100"
                                >
                                  <option value="Pending Review">Pending Review</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Deposit Confirmed">Deposit Confirmed</option>
                                  <option value="Shipped / B/L Issued">Shipped / B/L Issued</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              ) : (
                                <div className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300">
                                  {lead.status}
                                </div>
                              )}
                            </div>

                            {perms.bookingsDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget({
                                    kind: 'booking',
                                    id: lead.id,
                                    title: lead.buyerName,
                                    subtitle: `#${lead.id.toUpperCase()} · ${lead.vehicleTitle}`,
                                  });
                                }}
                                aria-label={`Delete lead ${lead.buyerName}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Delete Lead</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Internal Seller Follow-Up Notes */}
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5">
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
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:border-blue-900 dark:focus:border-blue-500"
                          />
                          {perms.bookingsWrite && (
                            <button
                              type="button"
                              disabled={!hasNoteChanges || savingNoteId === lead.id}
                              onClick={() => handleSaveCrmNote(lead.id, lead.crmNotes || '')}
                              className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-950 dark:bg-blue-700 text-white hover:bg-zinc-800 dark:hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-500 transition-colors cursor-pointer shrink-0"
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

          {/* TAB 4: BLOG POSTS MANAGER */}
          {effectiveTab === 'blogs' && canManageBlogs && (
            <PortalBlogsPanel
              blogs={blogs}
              defaultAuthorName={activeUser.name}
              onCreateBlog={onCreateBlog}
              onUpdateBlog={onUpdateBlog}
              onRequestDeleteBlog={(post) => {
                setDeleteError(null);
                setDeleteTarget({
                  kind: 'blog',
                  id: post.id,
                  title: post.title,
                  subtitle: `/blog/${post.slug} · ${post.category}`,
                });
              }}
              onViewLivePost={onViewBlogPost}
            />
          )}

          {/* TAB 5: TEAM USERS & RBAC PERMISSIONS */}
          {effectiveTab === 'users' && perms.usersManage && (
            <PortalUsersPanel
              users={users}
              currentUserId={activeUser.id}
              onCreateUser={onCreateUser}
              onUpdateUser={onUpdateUser}
              onRequestDeleteUser={(user) => {
                setDeleteError(null);
                setDeleteTarget({
                  kind: 'user',
                  id: user.id,
                  title: user.name,
                  subtitle: `${user.email} (${user.role})`,
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Unified Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Deletion"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
          onClick={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
                  <AlertTriangle
                    className="w-5 h-5 text-red-700 dark:text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
                    {deleteTarget.kind === 'vehicle'
                      ? 'Delete Vehicle?'
                      : deleteTarget.kind === 'booking'
                        ? 'Delete Lead?'
                        : deleteTarget.kind === 'video'
                          ? 'Delete Unloading Clip?'
                          : deleteTarget.kind === 'blog'
                            ? 'Delete Blog Article?'
                            : 'Delete Team User?'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete this record? This action cannot be
                    undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                aria-label="Close delete confirmation"
                className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
              <div className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                {deleteTarget.title}
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {deleteTarget.subtitle}
              </div>
            </div>

            {deleteError && (
              <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
