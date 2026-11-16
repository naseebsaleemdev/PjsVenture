import { useCallback, useEffect, useState } from 'react';
import { CifCalculatorSection, type LockedCifQuote } from './components/CifCalculatorSection';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { ImportInquiryForm } from './components/ImportInquiryForm';
import { InventorySection } from './components/InventorySection';
import { Navbar, type AppRoute } from './components/Navbar';
import { PortDealsPage } from './components/PortDealsPage';
import { PortsPage } from './components/PortsPage';
import { SellerPortal } from './components/SellerPortal';
import { VehicleModal } from './components/VehicleModal';
import { INITIAL_VEHICLES, formatAutoPrice } from './data/seedInventory.ts';
import {
  createBookingRecord,
  createVehicleRecord,
  deleteVehicleRecord,
  loadInitialData,
  updateBookingStatusRecord,
  updateVehicleStatusRecord,
} from './lib/storeClient.ts';
import type {
  AutoCurrency,
  BookingRequest,
  ExportVehicle,
  VehicleStatus,
} from './types/autoTrade.ts';

const VALID_ROUTES: AppRoute[] = [
  '/',
  '/inventory',
  '/port-deals',
  '/ports',
  '/calculator',
  '/book',
  '/portal',
];

const ROUTE_TITLES: Record<AppRoute, string> = {
  '/': 'CrownWheel Auto Trade — Japan-to-Caribbean Direct Imports & Port Balance Deals',
  '/inventory': 'Export Inventory — CrownWheel Auto Trade',
  '/port-deals': 'Port Balance-Release Deals — CrownWheel Auto Trade',
  '/ports': 'Caribbean Destination Ports — CrownWheel Auto Trade',
  '/calculator': 'Caribbean CIF Landed Calculator — CrownWheel Auto Trade',
  '/book': 'Book a Vehicle or Claim Port Balance — CrownWheel Auto Trade',
  '/portal': 'Seller Portal — CrownWheel Auto Trade',
};

function resolveInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash === '#portal') return '/portal';
  const path = window.location.pathname as AppRoute;
  return VALID_ROUTES.includes(path) ? path : '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(resolveInitialRoute);
  const [vehicles, setVehicles] = useState<ExportVehicle[]>(INITIAL_VEHICLES);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<AutoCurrency>('USD');
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [inspectedVehicle, setInspectedVehicle] = useState<ExportVehicle | null>(null);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] =
    useState<ExportVehicle | null>(null);
  const [lockedCif, setLockedCif] = useState<LockedCifQuote | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | null>(null);
  const [inventoryPortFilter, setInventoryPortFilter] = useState<string>('all');
  const [calculatorPortId, setCalculatorPortId] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = ROUTE_TITLES[route];
  }, [route]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveInitialRoute());
      setInspectedVehicle(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const data = await loadInitialData();
        if (!cancelled) {
          setVehicles(data.vehicles);
          setBookings(data.bookings);
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
    setInspectedVehicle(null);
    if (window.location.pathname !== nextRoute || window.location.hash) {
      window.history.pushState({}, '', nextRoute);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleToggleShortlist = (vehicleId: string) => {
    setShortlistIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId],
    );
  };

  const handleBookOrClaimVehicle = (vehicle: ExportVehicle) => {
    setInspectedVehicle(null);
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
  }): Promise<BookingRequest> => {
    const created = await createBookingRecord(payload);
    setBookings((prev) => [created, ...prev]);
    return created;
  };

  const handleCreateVehicle = async (vehicleInput: Omit<ExportVehicle, 'id' | 'createdAt'>) => {
    const created = await createVehicleRecord(vehicleInput);
    setVehicles((prev) => [created, ...prev]);
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

  const handleUpdateBookingStatus = async (id: string, status: BookingRequest['status']) => {
    const res = await updateBookingStatusRecord(id, status);
    if (res.booking) {
      setBookings((prev) => prev.map((b) => (b.id === id ? res.booking! : b)));
    }
    if (Array.isArray(res.vehicles)) {
      setVehicles(res.vehicles);
    }
  };

  if (route === '/portal') {
    return (
      <SellerPortal
        vehicles={vehicles}
        bookings={bookings}
        onCreateVehicle={handleCreateVehicle}
        onUpdateVehicleStatus={handleUpdateVehicleStatus}
        onDeleteVehicle={handleDeleteVehicle}
        onUpdateBookingStatus={handleUpdateBookingStatus}
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
            currency={currency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onInspectVehicle={setInspectedVehicle}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onNavigate={navigate}
            onSelectPortForInventory={handleSelectPortForInventory}
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
            onInspectVehicle={setInspectedVehicle}
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
            onInspectVehicle={setInspectedVehicle}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onNavigate={navigate}
          />
        )}

        {route === '/ports' && (
          <PortsPage
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
          />
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

      {inspectedVehicle && (
        <VehicleModal
          vehicle={inspectedVehicle}
          currency={currency}
          isShortlisted={shortlistIds.includes(inspectedVehicle.id)}
          onToggleShortlist={() => handleToggleShortlist(inspectedVehicle.id)}
          onBookOrClaim={() => handleBookOrClaimVehicle(inspectedVehicle)}
          onClose={() => setInspectedVehicle(null)}
        />
      )}
    </div>
  );
}
