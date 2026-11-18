import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  DESTINATION_PORTS,
  EXPORT_STEPS,
  INITIAL_BOOKINGS,
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
} from './src/data/seedInventory.ts';
import type {
  BookingRequest,
  ExportVehicle,
  PortalUser,
  UnloadingVideo,
} from './src/types/autoTrade.ts';
import { INITIAL_PORTAL_USERS, normalizePortalUser } from './src/lib/portalRoles.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
  users: PortalUser[];
}

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial: StoreData = {
        vehicles: INITIAL_VEHICLES,
        bookings: INITIAL_BOOKINGS,
        videos: INITIAL_UNLOADING_VIDEOS,
        users: INITIAL_PORTAL_USERS,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const rawUsers =
      Array.isArray(parsed.users) && parsed.users.length > 0
        ? parsed.users.map((u) => normalizePortalUser(u, u.role))
        : INITIAL_PORTAL_USERS;
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : INITIAL_VEHICLES,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_BOOKINGS,
      videos: Array.isArray(parsed.videos) ? parsed.videos : INITIAL_UNLOADING_VIDEOS,
      users: rawUsers,
    };
  } catch {
    return {
      vehicles: INITIAL_VEHICLES,
      bookings: INITIAL_BOOKINGS,
      videos: INITIAL_UNLOADING_VIDEOS,
      users: INITIAL_PORTAL_USERS,
    };
  }
}

function writeStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  interface ChatMessageInput {
    role: 'user' | 'model';
    text: string;
  }

  interface ChatVehicleContext {
    id: string;
    year: number;
    makeModel: string;
    trim: string;
    status: string;
    chassisCode: string;
    fobUsd: number;
    fuel: string;
    drive: string;
    steering: string;
    mileageKm: number;
    dealType: string;
    destinationPortLabel: string;
    balanceDueUsd: number;
    priorDepositUsd: number;
    overallGrade: string;
  }

  // PJS Ventures Buyer & Export Concierge Chat API (Server-Side Gemini)
  app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'Chat assistant is not configured yet (missing GEMINI_API_KEY). Add GEMINI_API_KEY in Settings > Secrets to enable live chat.',
      });
      return;
    }

    const body = req.body as {
      messages?: ChatMessageInput[];
      vehicles?: ChatVehicleContext[];
      currency?: string;
    };

    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const sanitizedMessages = rawMessages
      .filter(
        (m): m is ChatMessageInput =>
          Boolean(m) &&
          (m.role === 'user' || m.role === 'model') &&
          typeof m.text === 'string' &&
          m.text.trim().length > 0,
      )
      .slice(-16)
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text.trim().slice(0, 2000) }],
      }));

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: 'Please enter a message before sending.' });
      return;
    }

    const liveVehicles = Array.isArray(body?.vehicles) ? body.vehicles.slice(0, 40) : [];
    const vehicleCatalogSummary =
      liveVehicles.length > 0
        ? liveVehicles
            .map(
              (v) =>
                `- [${v.year} ${v.makeModel} ${v.trim}] | Chassis: ${v.chassisCode} | Status: ${v.status} | Type: ${v.dealType === 'balance-release' ? 'Port Balance-Release' : 'Direct Japan Import'} | Port: ${v.destinationPortLabel} | Grade: ${v.overallGrade} | Mileage: ${v.mileageKm.toLocaleString('en-US')} km | ${v.fuel}/${v.drive}/${v.steering} | FOB: $${v.fobUsd.toLocaleString('en-US')} USD | Listed/Balance Due: $${v.balanceDueUsd.toLocaleString('en-US')} USD${v.priorDepositUsd > 0 ? ` (Prior deposit paid: $${v.priorDepositUsd.toLocaleString('en-US')} USD)` : ''}`,
            )
            .join('\n')
        : 'No vehicles are currently listed in live stock. Recommend submitting a Custom Auction Order on the Book a Vehicle page so PJS Ventures can source a unit directly from Japanese auctions (USS, TAA, HAA, JU).';

    const portsSummary = DESTINATION_PORTS.map(
      (p) =>
        `- ${p.name}, ${p.country} (${p.region}): Transit ${p.transitDays} | RoRo $${p.roroUsd} | 20ft Container $${p.container20Usd} | 40ft Shared $${p.container40SharedUsd} | ${p.complianceNote}`,
    ).join('\n');

    const processSummary = EXPORT_STEPS.map(
      (s) => `${s.step}. ${s.title} (${s.window}): ${s.description}`,
    ).join('\n');

    const systemInstruction = `You are the official PJS Ventures Export Concierge — a helpful, knowledgeable automotive export specialist representing PJS Ventures (Yokohama, Japan).

Your job:
- Help international vehicle buyers and dealers compare stock, estimate RoRo or container shipping costs to 30+ global ports, understand Japanese auction grades, and book either Direct Japan Imports or Port Balance-Release deals.
- Always respond in clear English, or match the buyer's language if they write in Spanish, French, Arabic, or Japanese. Keep answers concise, clear, scannable, and practical (under ~180 words unless detailed specs are requested).
- Only state vehicle specs, chassis codes, prices, and port rates from the LIVE DATA below. Never invent fake inventory or unverified shipping quotes.
- If a buyer wants to reserve a unit, lock a CIF quote, or request a vehicle not yet in stock, guide them to the "Book a Vehicle" page or "CIF Calculator" on the website, or trade@pjsventures.com.
- Never mention AI models, prompts, APIs, or internal tooling. Speak purely as PJS Ventures Trade Support.

LIVE INVENTORY (${liveVehicles.length} units, buyer display currency: ${body?.currency || 'USD'}):
${vehicleCatalogSummary}

GLOBAL DESTINATION PORTS & FREIGHT MATRIX (USD base rates):
${portsSummary}

HOW PJS VENTURES EXPORT WORKS:
${processSummary}

PORT BALANCE-RELEASE DEALS EXPLAINED:
A Port Balance-Release unit is already shipped or docked after a prior buyer paid an initial deposit (often 35%–45%) and forfeited/defaulted. A new buyer only pays the remaining Balance Due to receive express Bill of Lading (B/L) re-assignment and clear the car at the specified destination port.`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: sanitizedMessages,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({
          error: 'Could not generate a response right now. Please try asking again.',
        });
        return;
      }

      res.json({ reply });
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const rawMessage = err instanceof Error ? err.message : 'Unexpected chat service error.';
      console.error('PJS Ventures /api/chat error:', err);

      if (status === 400 || status === 403 || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('PERMISSION_DENIED')) {
        res.status(status === 400 ? 400 : 403).json({
          error:
            'Chat service API key needs attention. Please check GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }
      if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Chat service is temporarily busy due to rate limits. Please try again in a moment.',
        });
        return;
      }

      res.status(500).json({
        error: rawMessage,
      });
    }
  });

  // Public & Portal Vehicle Inventory API
  app.get('/api/vehicles', (_req, res) => {
    const store = readStore();
    res.json({ vehicles: store.vehicles });
  });

  app.post('/api/vehicles', (req, res) => {
    const body = req.body as Partial<ExportVehicle>;
    if (!body.makeModel || !body.chassisCode || !body.category) {
      res.status(400).json({ error: 'makeModel, chassisCode, and category are required.' });
      return;
    }
    const store = readStore();
    const gallery = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : body.image
        ? [body.image]
        : [];
    const created: ExportVehicle = {
      ...(body as ExportVehicle),
      image: gallery[0] || body.image || '',
      images: gallery,
      id: body.id && body.id.trim() ? body.id : `veh-${Date.now()}`,
      status: body.status ?? 'Available',
      createdAt: new Date().toISOString(),
    };
    store.vehicles = [created, ...store.vehicles];
    writeStore(store);
    res.status(201).json({ vehicle: created });
  });

  app.patch('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body as Partial<ExportVehicle>;
    const store = readStore();
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }
    const existing = store.vehicles[index];
    const mergedTransit = updates.transit
      ? { ...existing.transit, ...updates.transit }
      : existing.transit;
    if (mergedTransit.dealType !== 'balance-release') {
      delete mergedTransit.etaDate;
      delete mergedTransit.trackingStage;
    }
    const updated: ExportVehicle = {
      ...existing,
      ...updates,
      transit: mergedTransit,
      inspection: updates.inspection
        ? { ...existing.inspection, ...updates.inspection }
        : existing.inspection,
    };
    store.vehicles[index] = updated;
    writeStore(store);
    res.json({ vehicle: updated });
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    const { id } = req.params;
    const store = readStore();
    const nextVehicles = store.vehicles.filter((v) => v.id !== id);
    if (nextVehicles.length === store.vehicles.length) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }
    store.vehicles = nextVehicles;
    writeStore(store);
    res.json({ deletedId: id });
  });

  // Client Bookings & Portal Management API
  app.get('/api/bookings', (_req, res) => {
    const store = readStore();
    res.json({ bookings: store.bookings });
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body as Partial<BookingRequest>;
    if (!body.buyerName || !body.buyerEmail || !body.destinationPortName) {
      res.status(400).json({ error: 'buyerName, buyerEmail, and destinationPortName are required.' });
      return;
    }
    const store = readStore();
    const booking: BookingRequest = {
      id: `bk-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: body.vehicleId ?? null,
      vehicleTitle: body.vehicleTitle || 'Custom Japan Import Request',
      chassisCode: body.chassisCode || 'TBD',
      buyerName: body.buyerName.trim(),
      buyerEmail: body.buyerEmail.trim(),
      buyerPhone: body.buyerPhone?.trim() || '',
      destinationPortId: body.destinationPortId || 'nassau',
      destinationPortName: body.destinationPortName,
      requestType: body.requestType || 'Book Direct Japan Import',
      shippingMethod: body.shippingMethod || 'RoRo Vessel',
      quotedAmountUsd: Number(body.quotedAmountUsd) || 0,
      notes: body.notes?.trim() || '',
      leadSource: body.leadSource?.trim() || 'Website Booking Form',
      crmNotes: body.crmNotes?.trim() || '',
      status: 'Pending Review',
      createdAt: new Date().toISOString(),
    };
    store.bookings = [booking, ...store.bookings];
    writeStore(store);
    res.status(201).json({ booking });
  });

  app.patch('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status, crmNotes } = req.body as {
      status?: BookingRequest['status'];
      crmNotes?: string;
    };
    const store = readStore();
    const index = store.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    store.bookings[index] = {
      ...store.bookings[index],
      ...(status !== undefined ? { status } : {}),
      ...(crmNotes !== undefined ? { crmNotes } : {}),
    };
    if (status) {
      // Sync vehicle status when seller confirms deposit or ships
      const linkedVehicleId = store.bookings[index].vehicleId;
      if (linkedVehicleId) {
        const vIdx = store.vehicles.findIndex((v) => v.id === linkedVehicleId);
        if (vIdx !== -1) {
          if (status === 'Deposit Confirmed') {
            store.vehicles[vIdx].status = 'Booked';
          } else if (status === 'Shipped / B/L Issued') {
            store.vehicles[vIdx].status = 'In Transit';
          }
        }
      }
    }
    writeStore(store);
    res.json({ booking: store.bookings[index], vehicles: store.vehicles });
  });

  app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const store = readStore();
    const nextBookings = store.bookings.filter((b) => b.id !== id);
    if (nextBookings.length === store.bookings.length) {
      res.status(404).json({ error: 'Booking lead not found.' });
      return;
    }
    store.bookings = nextBookings;
    writeStore(store);
    res.json({ deletedId: id });
  });

  // Container Unloading Videos API
  app.get('/api/videos', (_req, res) => {
    const store = readStore();
    res.json({ videos: store.videos });
  });

  app.post('/api/videos', (req, res) => {
    const body = req.body as Partial<UnloadingVideo>;
    if (!body.title || !body.videoUrl) {
      res.status(400).json({ error: 'title and videoUrl are required.' });
      return;
    }
    const store = readStore();
    const created: UnloadingVideo = {
      id: `vid-${Date.now()}`,
      title: body.title.trim(),
      portLabel: body.portLabel?.trim() || 'Caribbean Port Terminal',
      containerType: body.containerType?.trim() || '40ft Container Discharge',
      vehicleSummary: body.vehicleSummary?.trim() || 'Japanese Export Arrival',
      videoUrl: body.videoUrl.trim(),
      posterUrl:
        body.posterUrl?.trim() || '/src/assets/images/container_unload_suv_1794837300196.jpg',
      durationLabel: body.durationLabel?.trim() || 'Video',
      createdAt: new Date().toISOString(),
    };
    store.videos = [created, ...store.videos];
    writeStore(store);
    res.status(201).json({ video: created });
  });

  app.delete('/api/videos/:id', (req, res) => {
    const { id } = req.params;
    const store = readStore();
    const nextVideos = store.videos.filter((v) => v.id !== id);
    if (nextVideos.length === store.videos.length) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    store.videos = nextVideos;
    writeStore(store);
    res.json({ deletedId: id });
  });

  // Seller Portal Team Users & RBAC API
  app.get('/api/users', (_req, res) => {
    const store = readStore();
    res.json({ users: store.users });
  });

  app.post('/api/users', (req, res) => {
    const body = req.body as Partial<PortalUser>;
    const email = body.email?.trim().toLowerCase() || '';
    if (!body.name?.trim() || !email || !body.password?.trim()) {
      res.status(400).json({ error: 'name, email, and password are required.' });
      return;
    }
    const store = readStore();
    if (store.users.some((u) => u.email.trim().toLowerCase() === email)) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }
    const created = normalizePortalUser(
      {
        ...body,
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email,
        isPrimaryOwner: false,
        createdAt: new Date().toISOString(),
      },
      body.role || 'Viewer',
    );
    store.users = [...store.users, created];
    writeStore(store);
    res.status(201).json({ user: created });
  });

  app.patch('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body as Partial<PortalUser>;
    const store = readStore();
    const index = store.users.findIndex((u) => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const existing = store.users[index];
    const nextEmail = updates.email ? updates.email.trim().toLowerCase() : existing.email;
    if (
      nextEmail !== existing.email &&
      store.users.some((u, idx) => idx !== index && u.email.trim().toLowerCase() === nextEmail)
    ) {
      res.status(409).json({ error: 'Another user already uses this email.' });
      return;
    }
    const updated = normalizePortalUser(
      {
        ...existing,
        ...updates,
        email: nextEmail,
        password:
          updates.password && updates.password.trim().length > 0
            ? updates.password.trim()
            : existing.password,
        permissions: updates.permissions
          ? { ...existing.permissions, ...updates.permissions }
          : existing.permissions,
        isPrimaryOwner: existing.isPrimaryOwner,
      },
      updates.role || existing.role,
    );
    store.users[index] = updated;
    writeStore(store);
    res.json({ user: updated });
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const store = readStore();
    const target = store.users.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (target.isPrimaryOwner) {
      res.status(400).json({ error: 'Primary owner account cannot be deleted.' });
      return;
    }
    store.users = store.users.filter((u) => u.id !== id);
    writeStore(store);
    res.json({ deletedId: id });
  });

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PJS Ventures server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
