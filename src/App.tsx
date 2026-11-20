import { onAuthStateChanged } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlogListPage } from './components/BlogListPage';
import { BlogPostPage } from './components/BlogPostPage';
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
import { TradeChatbot } from './components/TradeChatbot';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { INITIAL_BLOG_POSTS } from './data/seedBlogs.ts';
import { formatAutoPrice } from './data/seedInventory.ts';
import { auth } from './lib/firebase.ts';
import { signInPortalWithGoogle, signOutPortal } from './lib/portalAuth.ts';
import { INITIAL_PORTAL_USERS } from './lib/portalRoles.ts';
import {
  createBlogRecord,
  createBookingRecord,
  createPortalUserRecord,
  createVehicleRecord,
  createVideoRecord,
  deleteBlogRecord,
  deleteBookingRecord,
  deletePortalUserRecord,
  deleteVehicleRecord,
  deleteVideoRecord,
  formatPortalErrorMessage,
  resolveAuthorizedPortalUser,
  seedInitialCatalogIfEmpty,
  seedStarterBlogsOnce,
  subscribePortalPrivateData,
  subscribePublicCatalog,
  updateBlogRecord,
  updateBookingRecord,
  updatePortalUserRecord,
  updateVehicleRecord,
  updateVehicleStatusRecord,
} from './lib/storeClient.ts';
import type {
  AutoCurrency,
  BlogPost,
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
  '/blog',
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
  '/blog': 'Export Journal & Buyer Guides — PJS Ventures Blog',
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
  if (path.startsWith('/blog/') && path.length > '/blog/'.length) {
    return path as AppRoute;
  }
  return STATIC_ROUTES.includes(path as AppRoute) ? (path as AppRoute) : '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(resolveInitialRoute);
  const [vehicles, setVehicles] = useState<ExportVehicle[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [videos, setVideos] = useState<UnloadingVideo[]>([]);
  const [cloudBlogs, setCloudBlogs] = useState<BlogPost[]>([]);
  const [blogsSeededInCloud, setBlogsSeededInCloud] = useState<boolean>(false);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>(INITIAL_PORTAL_USERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePortalUser, setActivePortalUser] = useState<PortalUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currency, setCurrency] = useState<AutoCurrency>('USD');
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] =
    useState<ExportVehicle | null>(null);
  const [lockedCif, setLockedCif] = useState<LockedCifQuote | null>(null);
  const [prefillNotes, setPrefillNotes] = useState<string | null>(null);
  const [inventoryPortFilter, setInventoryPortFilter] = useState<string>('all');
  const [calculatorPortId, setCalculatorPortId] = useState<string | undefined>(undefined);
  const [portsRegionFilter, setPortsRegionFilter] = useState<GlobalPortRegion | 'all'>('all');

  const blogs = useMemo(() => {
    if (cloudBlogs.length > 0 || blogsSeededInCloud) {
      return cloudBlogs;
    }
    return INITIAL_BLOG_POSTS;
  }, [cloudBlogs, blogsSeededInCloud]);

  const activeListingId = route.startsWith('/listing/')
    ? decodeURIComponent(route.replace('/listing/', ''))
    : null;
  const activeListingVehicle = activeListingId
    ? vehicles.find((v) => v.id === activeListingId)
    : undefined;

  const activeBlogSlug = route.startsWith('/blog/')
    ? decodeURIComponent(route.replace('/blog/', ''))
    : null;
  const activeBlogPost = activeBlogSlug
    ? blogs.find((b) => b.slug === activeBlogSlug || b.id === activeBlogSlug)
    : undefined;

  useEffect(() => {
    if (activeListingId) {
      document.title = activeListingVehicle
        ? `${activeListingVehicle.year} ${activeListingVehicle.makeModel} — PJS Ventures`
        : 'Vehicle Listing — PJS Ventures';
      return;
    }
    if (activeBlogSlug) {
      document.title = activeBlogPost
        ? `${activeBlogPost.title} — PJS Ventures Blog`
        : 'Article — PJS Ventures Blog';
      return;
    }
    document.title = ROUTE_TITLES[route] || 'PJS Ventures';
  }, [route, activeListingId, activeListingVehicle, activeBlogSlug, activeBlogPost]);

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

  // Subscribe to public catalog (vehicles + unloading videos + blogs) in Cloud Firestore
  useEffect(() => {
    const unsubscribe = subscribePublicCatalog(
      (nextVehicles) => setVehicles(nextVehicles),
      (nextVideos) => setVideos(nextVideos),
      () => setLoading(false),
      (nextBlogs, isSeededInCloud) => {
        setCloudBlogs(nextBlogs);
        setBlogsSeededInCloud(isSeededInCloud);
      },
    );
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Auth state & resolve Cloud RBAC user profile
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) {
          setActivePortalUser(null);
          setBookings([]);
          setPortalUsers(INITIAL_PORTAL_USERS);
          setAuthLoading(false);
        }
        return;
      }

      setAuthLoading(true);
      try {
        const resolution = await resolveAuthorizedPortalUser(firebaseUser);
        if (cancelled) return;

        if (!resolution.ok) {
          setActivePortalUser(null);
          setAuthError(resolution.error);
          await signOutPortal();
          return;
        }

        setAuthError(null);
        setActivePortalUser(resolution.user);
        void seedInitialCatalogIfEmpty(resolution.user, resolution.isFirstBootstrap).catch(
          (seedErr) => console.warn('Initial catalog seed skipped:', seedErr),
        );
        void seedStarterBlogsOnce(resolution.user);
      } catch (err) {
        if (!cancelled) {
          setActivePortalUser(null);
          setAuthError(
            formatPortalErrorMessage(
              err,
              'Could not verify portal permissions in Firestore.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Real-time multi-user sync for current user permissions, CRM bookings, and team directory
  const activePortalUserId = activePortalUser?.id ?? null;
  useEffect(() => {
    if (!activePortalUserId || !activePortalUser) return;

    const unsubscribe = subscribePortalPrivateData(activePortalUser, {
      onSelfUserChange: (nextUser, revokedMessage) => {
        if (!nextUser) {
          setActivePortalUser(null);
          setBookings([]);
          setPortalUsers(INITIAL_PORTAL_USERS);
          if (revokedMessage) {
            setAuthError(revokedMessage);
          }
          void signOutPortal();
          return;
        }
        setActivePortalUser((prev) => {
          if (!prev) return nextUser;
          const same =
            prev.id === nextUser.id &&
            prev.name === nextUser.name &&
            prev.role === nextUser.role &&
            prev.active === nextUser.active &&
            prev.permissions.inventoryRead === nextUser.permissions.inventoryRead &&
            prev.permissions.inventoryWrite === nextUser.permissions.inventoryWrite &&
            prev.permissions.inventoryDelete === nextUser.permissions.inventoryDelete &&
            prev.permissions.bookingsRead === nextUser.permissions.bookingsRead &&
            prev.permissions.bookingsWrite === nextUser.permissions.bookingsWrite &&
            prev.permissions.bookingsDelete === nextUser.permissions.bookingsDelete &&
            prev.permissions.videosManage === nextUser.permissions.videosManage &&
            prev.permissions.usersManage === nextUser.permissions.usersManage;
          return same ? prev : nextUser;
        });
      },
      onBookings: (nextBookings) => setBookings(nextBookings),
      onUsers: (nextUsers) => setPortalUsers(nextUsers),
    });

    return () => unsubscribe();
    // Subscribe/rebind only when signed-in user identity changes; self-doc listener dynamically starts/stops sub-listeners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePortalUserId]);

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

  const handleOpenBlogPost = useCallback(
    (slug: string) => {
      navigate(`/blog/${encodeURIComponent(slug)}`);
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
    if (activePortalUser?.permissions.bookingsRead) {
      setBookings((prev) => [created, ...prev]);
    }
    return created;
  };

  const handleCreateVehicle = async (vehicleInput: Omit<ExportVehicle, 'id' | 'createdAt'>) => {
    const created = await createVehicleRecord(vehicleInput);
    setVehicles((prev) => (prev.some((v) => v.id === created.id) ? prev : [created, ...prev]));
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<ExportVehicle>) => {
    const current = vehicles.find((v) => v.id === id);
    const updated = await updateVehicleRecord(id, updates, current);
    if (updated) {
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    }
  };

  const handleUpdateVehicleStatus = async (id: string, status: VehicleStatus) => {
    const current = vehicles.find((v) => v.id === id);
    const updated = await updateVehicleStatusRecord(id, status, current);
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
    const current = bookings.find((b) => b.id === id);
    const canSyncVeh = Boolean(activePortalUser?.permissions.inventoryWrite);
    const res = await updateBookingRecord(id, updates, current, canSyncVeh);
    if (res.booking) {
      setBookings((prev) => prev.map((b) => (b.id === id ? res.booking! : b)));
    }
    if (res.syncedVehicleStatus) {
      const { id: vehId, status: vehStatus } = res.syncedVehicleStatus;
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehId ? { ...v, status: vehStatus } : v)),
      );
    }
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBookingRecord(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCreateVideo = async (videoInput: Omit<UnloadingVideo, 'id' | 'createdAt'>) => {
    const created = await createVideoRecord(videoInput);
    setVideos((prev) => (prev.some((v) => v.id === created.id) ? prev : [created, ...prev]));
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteVideoRecord(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleCreateBlog = async (blogInput: Omit<BlogPost, 'id' | 'createdAt'>) => {
    const created = await createBlogRecord(blogInput);
    setBlogsSeededInCloud(true);
    setCloudBlogs((prev) => (prev.some((b) => b.id === created.id) ? prev : [created, ...prev]));
  };

  const handleUpdateBlog = async (id: string, updates: Partial<BlogPost>) => {
    const current = cloudBlogs.find((b) => b.id === id);
    const updated = await updateBlogRecord(id, updates, current);
    if (updated) {
      setCloudBlogs((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
  };

  const handleDeleteBlog = async (id: string) => {
    await deleteBlogRecord(id);
    setBlogsSeededInCloud(true);
    setCloudBlogs((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCreateUser = async (userInput: Omit<PortalUser, 'id' | 'createdAt'>) => {
    const created = await createPortalUserRecord(userInput);
    setPortalUsers((prev) => [...prev, created]);
  };

  const handleUpdateUser = async (id: string, updates: Partial<PortalUser>) => {
    const current = portalUsers.find((u) => u.id === id);
    const res = await updatePortalUserRecord(id, updates, current);
    if (res.user) {
      setPortalUsers((prev) => {
        if (res.replacedId) {
          return prev.map((u) => (u.id === res.replacedId ? res.user! : u));
        }
        return prev.map((u) => (u.id === id ? res.user! : u));
      });
      if (activePortalUser?.id === id) {
        setActivePortalUser(res.user);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    await deletePortalUserRecord(id);
    setPortalUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSignOut = async () => {
    await signOutPortal();
    setActivePortalUser(null);
    setAuthError(null);
  };

  const handleSwitchAccount = async () => {
    setAuthError(null);
    try {
      await signInPortalWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setAuthError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not switch Google account. Please try again.',
      );
    }
  };

  if (route === '/portal') {
    return (
      <SellerPortal
        activeUser={activePortalUser}
        authLoading={authLoading}
        authError={authError}
        onClearAuthError={() => setAuthError(null)}
        onSignOut={handleSignOut}
        onSwitchAccount={handleSwitchAccount}
        vehicles={vehicles}
        bookings={bookings}
        videos={videos}
        blogs={blogs}
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
        onCreateBlog={handleCreateBlog}
        onUpdateBlog={handleUpdateBlog}
        onDeleteBlog={handleDeleteBlog}
        onViewBlogPost={handleOpenBlogPost}
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
            blogs={blogs}
            currency={currency}
            shortlistIds={shortlistIds}
            onToggleShortlist={handleToggleShortlist}
            onInspectVehicle={handleOpenVehiclePage}
            onBookOrClaimVehicle={handleBookOrClaimVehicle}
            onNavigate={navigate}
            onOpenBlogPost={handleOpenBlogPost}
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
          <HowToBuyPage onNavigate={navigate} />
        )}

        {route === '/blog' && (
          <BlogListPage
            posts={blogs}
            loading={loading}
            onOpenPost={handleOpenBlogPost}
            onNavigate={navigate}
          />
        )}

        {route.startsWith('/blog/') && (
          <BlogPostPage
            post={activeBlogPost}
            allPosts={blogs}
            loading={loading}
            onBackToBlog={() => navigate('/blog')}
            onOpenPost={handleOpenBlogPost}
            onNavigate={navigate}
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

      <TradeChatbot
        vehicles={vehicles}
        currency={currency}
        onInspectVehicle={handleOpenVehiclePage}
        onBookVehicle={handleBookOrClaimVehicle}
        onNavigate={navigate}
      />
    </div>
  );
}
