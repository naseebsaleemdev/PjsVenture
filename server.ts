import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_BOOKINGS,
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
} from './src/data/seedInventory.ts';
import type {
  BookingRequest,
  ExportVehicle,
  UnloadingVideo,
} from './src/types/autoTrade.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
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
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : INITIAL_VEHICLES,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_BOOKINGS,
      videos: Array.isArray(parsed.videos) ? parsed.videos : INITIAL_UNLOADING_VIDEOS,
    };
  } catch {
    return {
      vehicles: INITIAL_VEHICLES,
      bookings: INITIAL_BOOKINGS,
      videos: INITIAL_UNLOADING_VIDEOS,
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
