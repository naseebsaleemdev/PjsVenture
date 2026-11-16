import { useEffect, useState } from 'react';
import { AuctionProcessSection } from './components/AuctionProcessSection';
import { CifCalculatorSection, LockedCifQuote } from './components/CifCalculatorSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { ImportInquiryForm } from './components/ImportInquiryForm';
import { InventorySection } from './components/InventorySection';
import { Navbar } from './components/Navbar';
import { SellerPortal } from './components/SellerPortal';
import { INITIAL_VEHICLES, formatAutoPrice } from './data/seedInventory.ts';
import type {
  AutoCurrency,
  BookingRequest,
  ExportVehicle,
  VehicleStatus,
} from './types/autoTrade.ts';

type AppView = 'storefront' | 'portal';

export default function App() {
  const [view, setView] = useState<AppView>(() =>
    window.location.hash === '#portal' ? 'portal' : 'storefront',
  );
  const [vehicles, setVehicles] = useState<ExportVehicle[]>(INITIAL_VEHICLES);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<AutoCurrency>('USD');
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] =
    useState<ExportVehicle | null>(null);
  const [lockedCif, setLockedCif] = useState<LockedCifQuote | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | null>(null);
  const [activeTabExternal, setActiveTabExternal] = useState<
    'All Vehicles' | 'Book from Japan' | 'Port Balance Deals' | null
  >(null);

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === '#portal' ? 'portal' : 'storefront');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadStore() {
      try {
        const [vehRes, bkRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/bookings'),
        ]);
        if (!cancelled && vehRes.ok) {
          const data = (await vehRes.json()) as { vehicles: ExportVehicle[] };
          setVehicles(data.vehicles);
        }
        if (!cancelled && bkRes.ok) {
          const data = (await bkRes.json()) as { bookings: BookingRequest[] };
          setBookings(data.bookings);
        }
      } catch {
        // Fallback to initial seed if network hiccups
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStore();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPortal = () => {
    window.location.hash = 'portal';
    setView('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitPortal = () => {
    window.location.hash = '';
    setView('storefront');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

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
    scrollToSection('#inquiry');
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
    scrollToSection('#inquiry');
  };

  const handleLockCifQuote = (quote: LockedCifQuote) => {
    setSelectedVehicleForBooking(null);
    setPrefillNotes(null);
    setLockedCif(quote);
    scrollToSection('#inquiry');
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
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Could not submit booking request.');
    }
    const data = (await res.json()) as { booking: BookingRequest };
    setBookings((prev) => [data.booking, ...prev]);
    return data.booking;
  };

  // Seller Portal Handlers
  const handleCreateVehicle = async (vehicleInput: Omit<ExportVehicle, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleInput),
    });
    if (!res.ok) {
      throw new Error('Failed to save vehicle.');
    }
    const data = (await res.json()) as { vehicle: ExportVehicle };
    setVehicles((prev) => [data.vehicle, ...prev]);
  };

  const handleUpdateVehicleStatus = async (id: string, status: VehicleStatus) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = (await res.json()) as { vehicle: ExportVehicle };
      setVehicles((prev) => prev.map((v) => (v.id === id ? data.vehicle : v)));
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setShortlistIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingRequest['status']) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        booking: BookingRequest;
        vehicles: ExportVehicle[];
      };
      setBookings((prev) => prev.map((b) => (b.id === id ? data.booking : b)));
      if (Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
      }
    }
  };

  if (view === 'portal') {
    return (
      <SellerPortal
        vehicles={vehicles}
        bookings={bookings}
        onCreateVehicle={handleCreateVehicle}
        onUpdateVehicleStatus={handleUpdateVehicleStatus}
        onDeleteVehicle={handleDeleteVehicle}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onExitPortal={exitPortal}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-zinc-950">
      <Navbar
        onBookVehicle={() => scrollToSection('#inventory')}
        onOpenPortal={openPortal}
      />

      <main className="flex-1">
        <HeroSection
          onBrowseInventory={() => {
            setActiveTabExternal('All Vehicles');
            scrollToSection('#inventory');
          }}
          onViewBalanceDeals={() => {
            setActiveTabExternal('Port Balance Deals');
            scrollToSection('#inventory');
          }}
        />

        <InventorySection
          vehicles={vehicles}
          loading={loading}
          currency={currency}
          onCurrencyChange={setCurrency}
          shortlistIds={shortlistIds}
          onToggleShortlist={handleToggleShortlist}
          onBookOrClaimVehicle={handleBookOrClaimVehicle}
          onRequestShortlistQuote={handleRequestShortlistQuote}
          activeTabExternal={activeTabExternal}
          onClearExternalTab={() => setActiveTabExternal(null)}
        />

        <AuctionProcessSection />

        <CifCalculatorSection
          vehicles={vehicles}
          currency={currency}
          onLockCifQuote={handleLockCifQuote}
        />

        <ImportInquiryForm
          selectedVehicleForBooking={selectedVehicleForBooking}
          lockedCif={lockedCif}
          prefillNotes={prefillNotes}
          onSubmitBooking={handleSubmitBooking}
        />
      </main>

      <Footer onOpenPortal={openPortal} />
    </div>
  );
}
