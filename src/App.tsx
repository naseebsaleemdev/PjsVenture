import { useCallback, useEffect, useState } from 'react';
import { CifCalculatorSection, type LockedCifQuote } from './components/CifCalculatorSection';
import { Footer } from './components/Footer';
import { GlobalMarketsPage } from './components/GlobalMarketsPage';
import { HomePage } from './components/HomePage';
import { HowToBuyPage } from './components/HowToBuyPage';
import { ImportInquiryForm } from './components/ImportInquiryForm';
import { InventorySection } from './components/InventorySection';
import { Navbar, type AppRoute } from './components/Navbar';
import { PortDealsPage } from './components/PortDealsPage';
import { PortsPage } from './components/PortsPage';
import { SellerPortal } from './components/SellerPortal';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import {
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
  formatAutoPrice,
} from './data/seedInventory.ts';
import {
  createBookingRecord,
  createPortalUserRecord,
  createVehicleRecord,
  createVideoRecord,
  deleteBookingRecord,
  deletePortalUserRecord,
  deleteVehicleRecord,
  deleteVideoRecord,
  loadInitialData,
  updateBookingRecord,
  updatePortalUserRecord,
  updateVehicleRecord,
  updateVehicleStatusRecord,
} from './lib/storeClient.ts';
import { INITIAL_PORTAL_USERS } from './lib/portalRoles.ts';
import type {
  AutoCurrency,
  BookingRequest,
  ExportVehicle,
  GlobalPortRegion,
  PortalUser,
  UnloadingVideo,
  VehicleStatus,
} from './types/autoTrade.ts';

const STATIC_ROUTES: AppRoute[] = [
  '/',
  '/inventory',
  '/port-deals',
  '/markets',
  '/ports',
  '/calculator',
  '/how-to-buy',
  '/book',
  '/portal',
];

const ROUTE_TITLES: Record<string, string> = {
  '/': 'PJS Ventures — Global Japanese Auto Exports & Port Balance Deals',
  '/inventory': 'Global Export Inventory — PJS Ventures',
  '/port-deals': 'Port Balance-Release Deals — PJS Ventures',
  '/markets': 'Global Export Markets — PJS Ventures',
  '/ports': 'Global Destination Ports — PJS Ventures',
  '/calculator': 'Global Freight & CIF Landed Calculator — PJS Ventures',
  '/how-to-buy': 'How to Buy & Export Guide — PJS Ventures',
  '/book': 'Book a Vehicle or Claim Port Balance — PJS Ventures',
  '/portal': 'Seller Portal — PJS Ventures',
};

function resolveInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash === '#portal') return '/portal';
  const path = window.location.pathname;
  if (path.startsWith('/listing/') && path.length > '/listing/'.length) {
    return path as AppRoute;
  }
  return STATIC_ROUTES.includes(path as AppRoute) ? (path as AppRoute) : '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(resolveInitialRoute);
  const [vehicles, setVehicles] = useState<ExportVehicle[]>(INITIAL_VEHICLES);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [videos, setVideos] = useState<UnloadingVideo[]>(INITIAL_UNLOADING_VIDEOS);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>(INITIAL_PORTAL_USERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<AutoCurrency>('USD');
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] =
    useState<ExportVehicle | null>(null);
  const [lockedCif, setLockedCif] = useState<LockedCifQuote | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | null>(null);
  const [inventoryPortFilter, setInventoryPortFilter] = useState<string>('all');
  const [calculatorPortId, setCalculatorPortId] = useState<string | undefined>(undefined);
  const [portsRegionFilter, setPortsRegionFilter] = useState<GlobalPortRegion | 'all'>('all');

  const activeListingId = route.startsWith('/listing/')
    ? decodeURIComponent(route.replace('/listing/', ''))
    : null;
  const activeListingVehicle = activeListingId
    ? vehicles.find((v) => v.id === activeListingId)
    : undefined;

  useEffect(() => {
    if (activeListingId) {
      document.title = activeListingVehicle
        ? `${activeListingVehicle.year} ${activeListingVehicle.makeModel} — PJS Ventures`
        : 'Vehicle Listing — PJS Ventures';
      return;
    }
    document.title = ROUTE_TITLES[route] || 'PJS Ventures';
  }, [route, activeListingId, activeListingVehicle]);

  useEffect(() => {
    const onRouteChange = () => {
      setRoute(resolveInitialRoute());
    };
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const data = await loadInitialData();
        if (!cancelled) {
          setVehicles(data.vehicles);
          setBookings(data.bookings);
          setVideos(data.videos);
          setPortalUsers(data.users);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (window.location.pathname !== nextRoute || window.location.hash) {
      window.history.pushState({}, '', nextRoute);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleOpenVehiclePage = useCallback(
    (vehicle: ExportVehicle) => {
      navigate(`/listing/${encodeURIComponent(vehicle.id)}`);
    },
    [navigate],
  );

  const handleToggleShortlist = (vehicleId: string) => {
    setShortlistIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId],
    );
  };

  const handleBookOrClaimVehicle = (vehicle: ExportVehicle) => {
    setLockedCif(null);
    setPrefillNotes(null);
    setSelectedVehicleForBooking(vehicle);
    navigate('/book');
  };

  const handleRequestShortlistQuote = () => {
    const selected = vehicles.filter((v) => shortlistIds.includes(v.id));
    if (selected.length === 0) return;
    const summaryList = selected
      .map(
        (v) =>
          `${v.year} ${v.makeModel} [${v.chassisCode}] (${formatAutoPrice(v.transit.balanceDueUsd, currency)})`,
      )
      .join('; ');
    setSelectedVehicleForBooking(null);
    setLockedCif(null);
    setPrefillNotes(`Booking & Caribbean CIF quote for shortlisted vehicles: ${summaryList}.`);
    navigate('/book');
  };

  const handleLockCifQuote = (quote: LockedCifQuote) => {
    setSelectedVehicleForBooking(null);
    setPrefillNotes(null);
    setLockedCif(quote);
    navigate('/book');
  };

  const handleSelectPortForInventory = (portId: string) => {
    setInventoryPortFilter(portId);
  };

  const handleSelectPortForCalculator = (portId: string) => {
    setCalculatorPortId(portId);
  };

  const handleSubmitBooking = async (payload: {
    vehicleId: string | null;
    vehicleTitle: string;
    chassisCode: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    destinationPortId: string;
    destinationPortName: string;
    requestType: BookingRequest['requestType'];
    shippingMethod: 'RoRo Vessel' | '20ft Container' | '40ft Shared Container';
    quotedAmountUsd: number;
    notes: string;
    leadSource?: string;
    crmNotes?: string;
  }): Promise<BookingRequest> => {
    const created = await createBookingRecord(payload);
    setBookings((prev) => [created, ...prev]);
    return created;
  };

  const handleCreateVehicle = async (vehicleInput: Omit<ExportVehicle, 'id' | 'createdAt'>) => {
    const created = await createVehicleRecord(vehicleInput);
    setVehicles((prev) => [created, ...prev]);
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<ExportVehicle>) => {
    const updated = await updateVehicleRecord(id, updates);
    if (updated) {
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    }
  };

  const handleUpdateVehicleStatus = async (id: string, status: VehicleStatus) => {
    const updated = await updateVehicleStatusRecord(id, status);
    if (updated) {
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    await deleteVehicleRecord(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setShortlistIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleUpdateBooking = async (
    id: string,
    updates: { status?: BookingRequest['status']; crmNotes?: string },
  ) => {
    const res = await updateBookingRecord(id, updates);
    if (res.booking) {
      setBookings((prev) => prev.map((b) => (b.id === id ? res.booking! : b)));
    }
    if (Array.isArray(res.vehicles)) {
      setVehicles(res.vehicles);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBookingRecord(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCreateVideo = async (videoInput: Omit<UnloadingVideo, 'id' | 'createdAt'>) => {
    const created = await createVideoRecord(videoInput);
    setVideos((prev) => [created, ...prev]);
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteVideoRecord(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleCreateUser = async (userInput: Omit<PortalUser, 'id' | 'createdAt'>) => {
    const created = await createPortalUserRecord(userInput);
    setPortalUsers((prev) => [...prev, created]);
  };

  const handleUpdateUser = async (id: string, updates: Partial<PortalUser>) => {
    const updated = await updatePortalUserRecord(id, updates);
    if (updated) {
      setPortalUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    }
  };

  const handleDeleteUser = async (id: string) => {
    await deletePortalUserRecord(id);
    setPortalUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (route === '/portal') {
    return (
      <SellerPortal
        vehicles={vehicles}
        bookings={bookings}
        videos={videos}
        users={portalUsers}
        onCreateVehicle={handleCreateVehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onUpdateVehicleStatus={handleUpdateVehicleStatus}
        onDeleteVehicle={handleDeleteVehicle}
        onUpdateBooking={handleUpdateBooking}
        onCreateManualLead={handleSubmitBooking}
        onDeleteBooking={handleDeleteBooking}
        onCreateVideo={handleCreateVideo}
        onDeleteVideo={handleDeleteVideo}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onExitPortal={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-zinc-950">
      <Navbar currentRoute={route} onNavigate={navigate} />

      <main className="flex-1">
        {route === '/' && (
          <HomePage
            vehicles={vehicles}
            videos={videos}
            currency={currency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onInspectVehicle={handleOpenVehiclePage}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onNavigate={navigate}
            onSelectPortForInventory={handleSelectPortForInventory}
            onSubmitQuickLead={handleSubmitBooking}
          />
        )}

        {route === '/inventory' && (
          <InventorySection
            vehicles={vehicles}
            loading={loading}
            currency={currency}
            onCurrencyChange={setCurrency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onInspectVehicle={handleOpenVehiclePage}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onRequestShortlistQuote={handleRequestShortlistQuote}
            initialPortId={inventoryPortFilter}
          />
        )}

        {route === '/port-deals' && (
          <PortDealsPage
            vehicles={vehicles}
            currency={currency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onInspectVehicle={handleOpenVehiclePage}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onNavigate={navigate}
          />
        )}

        {route.startsWith('/listing/') && (
          <VehicleDetailPage
            vehicle={activeListingVehicle}
            allVehicles={vehicles}
            currency={currency}
            onCurrencyChange={setCurrency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onLockCifQuote={handleLockCifQuote}
            onNavigate={navigate}
            onInspectVehicle={handleOpenVehiclePage}
          />
        )}

        {route === '/markets' && (
          <GlobalMarketsPage
            onNavigate={navigate}
            onSelectPortForCalculator={handleSelectPortForCalculator}
            onSelectPortForInventory={handleSelectPortForInventory}
            onSelectPortsRegion={(region) => setPortsRegionFilter(region)}
          />
        )}

        {route === '/ports' && (
          <PortsPage
            initialRegion={portsRegionFilter}
            onNavigate={navigate}
            onSelectPortForCalculator={handleSelectPortForCalculator}
            onSelectPortForInventory={handleSelectPortForInventory}
          />
        )}

        {route === '/calculator' && (
          <CifCalculatorSection
            vehicles={vehicles}
            currency={currency}
            initialPortId={calculatorPortId}
            onLockCifQuote={handleLockCifQuote}
            onNavigate={navigate}
          />
        )}

        {route === '/how-to-buy' && (
          <HowToBuyPage videos={videos} onNavigate={navigate} />
        )}

        {route === '/book' && (
          <ImportInquiryForm
            selectedVehicleForBooking={selectedVehicleForBooking}
            lockedCif={lockedCif}
            prefillNotes={prefillNotes}
            onSubmitBooking={handleSubmitBooking}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
