import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BOOKINGS, INITIAL_VEHICLES } from './src/data/seedInventory.ts';
import type { BookingRequest, ExportVehicle } from './src/types/autoTrade.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
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
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : INITIAL_VEHICLES,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_BOOKINGS,
    };
  } catch {
    return {
      vehicles: INITIAL_VEHICLES,
      bookings: INITIAL_BOOKINGS,
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

  app.use(express.json({ limit: '6mb' }));

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
    const created: ExportVehicle = {
      ...(body as ExportVehicle),
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
    const updated: ExportVehicle = {
      ...existing,
      ...updates,
      transit: updates.transit ? { ...existing.transit, ...updates.transit } : existing.transit,
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
      status: 'Pending Review',
      createdAt: new Date().toISOString(),
    };
    store.bookings = [booking, ...store.bookings];
    writeStore(store);
    res.status(201).json({ booking });
  });

  app.patch('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: BookingRequest['status'] };
    const store = readStore();
    const index = store.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (status) {
      store.bookings[index] = { ...store.bookings[index], status };
      // Sync vehicle status when seller confirms deposit or cancels
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
      writeStore(store);
    }
    res.json({ booking: store.bookings[index], vehicles: store.vehicles });
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
    console.log(`CrownWheel Auto Trade server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
