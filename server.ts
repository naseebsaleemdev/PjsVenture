import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_BLOG_POSTS } from './src/data/seedBlogs.ts';
import {
  DESTINATION_PORTS,
  EXPORT_STEPS,
  INITIAL_BOOKINGS,
  INITIAL_UNLOADING_VIDEOS,
  INITIAL_VEHICLES,
} from './src/data/seedInventory.ts';
import {
  INITIAL_PORTAL_USERS,
  PRIMARY_OWNER_EMAIL,
  ROLE_DEFAULT_PERMISSIONS,
  emailToPortalUserId,
  normalizePortalUser,
} from './src/lib/portalRoles.ts';
import type {
  BlogCategory,
  BlogPost,
  BlogStatus,
  BookingRequest,
  ExportVehicle,
  PortalUser,
  UnloadingVideo,
} from './src/types/autoTrade.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUNDLED_DATA_DIR = path.resolve(__dirname, 'data');
const BUNDLED_STORE_PATH = path.join(BUNDLED_DATA_DIR, 'store.json');

function resolveWritableDataDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/pjs-ventures-data';
  }
  try {
    if (!fs.existsSync(BUNDLED_DATA_DIR)) {
      fs.mkdirSync(BUNDLED_DATA_DIR, { recursive: true });
    }
    fs.accessSync(BUNDLED_DATA_DIR, fs.constants.W_OK);
    return BUNDLED_DATA_DIR;
  } catch {
    return '/tmp/pjs-ventures-data';
  }
}

const DATA_DIR = resolveWritableDataDir();
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const SESSION_SECRET_PATH = path.join(DATA_DIR, '.session-secret');

type StoredPortalUser = PortalUser & {
  passwordHash?: string;
};

interface StoreData {
  vehicles: ExportVehicle[];
  bookings: BookingRequest[];
  videos: UnloadingVideo[];
  blogs: BlogPost[];
  users: StoredPortalUser[];
}

type SyncScope = 'vehicles' | 'bookings' | 'videos' | 'blogs' | 'users';

function getSessionSecret(): string {
  const fromEnv = process.env.PORTAL_SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const scope =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      'pjs-ventures-vercel';
    return crypto
      .createHash('sha256')
      .update(`${scope}:pjs-ventures-portal-session-v1`)
      .digest('hex');
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SESSION_SECRET_PATH)) {
      const existing = fs.readFileSync(SESSION_SECRET_PATH, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(SESSION_SECRET_PATH, generated, 'utf-8');
    return generated;
  } catch {
    return crypto
      .createHash('sha256')
      .update(`${__dirname}:pjs-ventures-fallback-secret`)
      .digest('hex');
  }
}

const SESSION_SECRET = getSessionSecret();
const DEFAULT_OWNER_BOOTSTRAP_PASSWORD =
  process.env.PORTAL_ADMIN_PASSWORD?.trim() || 'PJS#2026';

function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(plainPassword: string, storedHash?: string): boolean {
  if (!storedHash || !plainPassword) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(plainPassword, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

interface SessionPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function signSessionToken(user: StoredPortalUser): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase(),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  try {
    const sigBuf = Buffer.from(sig, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8'),
    ) as SessionPayload;
    if (!payload.userId || !payload.email || typeof payload.exp !== 'number') {
      return null;
    }
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function toPublicUser(user: StoredPortalUser): PortalUser {
  const { password: _ignorePlain, passwordHash: _ignoreHash, ...rest } = user;
  return rest;
}

function slugifyBlogTitle(raw: string): string {
  const clean = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return clean || `article-${Date.now()}`;
}

function estimateReadTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(60, Math.max(1, Math.round(words / 180)));
}

function migrateStoredUsers(rawUsersInput: unknown): {
  users: StoredPortalUser[];
  changed: boolean;
} {
  let changed = false;
  const sourceList: Partial<StoredPortalUser>[] =
    Array.isArray(rawUsersInput) && rawUsersInput.length > 0
      ? (rawUsersInput as Partial<StoredPortalUser>[])
      : (INITIAL_PORTAL_USERS as Partial<StoredPortalUser>[]);

  if (!Array.isArray(rawUsersInput) || rawUsersInput.length === 0) {
    changed = true;
  }

  const users: StoredPortalUser[] = sourceList.map((raw) => {
    const normalized = normalizePortalUser(raw, raw.role || 'Viewer');
    let passwordHash =
      typeof raw.passwordHash === 'string' && raw.passwordHash.startsWith('scrypt:')
        ? raw.passwordHash
        : undefined;

    if (!passwordHash && typeof raw.password === 'string' && raw.password.trim().length > 0) {
      passwordHash = hashPassword(raw.password.trim());
      changed = true;
    }

    if (!passwordHash && normalized.isPrimaryOwner) {
      passwordHash = hashPassword(DEFAULT_OWNER_BOOTSTRAP_PASSWORD);
      changed = true;
    }

    if (raw.password !== undefined || raw.id !== normalized.id) {
      changed = true;
    }

    return {
      ...normalized,
      ...(passwordHash ? { passwordHash } : {}),
    };
  });

  if (!users.some((u) => u.email.toLowerCase() === PRIMARY_OWNER_EMAIL)) {
    const ownerBase = normalizePortalUser(INITIAL_PORTAL_USERS[0], 'Admin');
    users.unshift({
      ...ownerBase,
      passwordHash: hashPassword(DEFAULT_OWNER_BOOTSTRAP_PASSWORD),
    });
    changed = true;
  }

  return { users, changed };
}

function writeStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist store to disk:', err);
  }
}

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      // Seed from bundled data/store.json if running from an alternate writable path (e.g. /tmp)
      if (STORE_PATH !== BUNDLED_STORE_PATH && fs.existsSync(BUNDLED_STORE_PATH)) {
        try {
          const bundledRaw = fs.readFileSync(BUNDLED_STORE_PATH, 'utf-8');
          fs.writeFileSync(STORE_PATH, bundledRaw, 'utf-8');
        } catch {
          // Fall through to seed defaults
        }
      }
      if (!fs.existsSync(STORE_PATH)) {
        const { users } = migrateStoredUsers(INITIAL_PORTAL_USERS);
        const initial: StoreData = {
          vehicles: INITIAL_VEHICLES,
          bookings: INITIAL_BOOKINGS,
          videos: INITIAL_UNLOADING_VIDEOS,
          blogs: INITIAL_BLOG_POSTS,
          users,
        };
        writeStore(initial);
        return initial;
      }
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const { users, changed: usersChanged } = migrateStoredUsers(parsed.users);
    const blogsMissing = !Array.isArray(parsed.blogs);
    const store: StoreData = {
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : INITIAL_VEHICLES,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_BOOKINGS,
      videos: Array.isArray(parsed.videos) ? parsed.videos : INITIAL_UNLOADING_VIDEOS,
      blogs: Array.isArray(parsed.blogs) ? parsed.blogs : INITIAL_BLOG_POSTS,
      users,
    };
    if (usersChanged || blogsMissing) {
      writeStore(store);
    }
    return store;
  } catch {
    const { users } = migrateStoredUsers(INITIAL_PORTAL_USERS);
    return {
      vehicles: INITIAL_VEHICLES,
      bookings: INITIAL_BOOKINGS,
      videos: INITIAL_UNLOADING_VIDEOS,
      blogs: INITIAL_BLOG_POSTS,
      users,
    };
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function resolveAuthenticatedUser(req: Request): {
  user: StoredPortalUser | null;
  error?: { status: number; message: string };
} {
  const token = extractBearerToken(req);
  if (!token) {
    return {
      user: null,
      error: { status: 401, message: 'Authentication required. Please sign in to the Seller Portal.' },
    };
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    return {
      user: null,
      error: { status: 401, message: 'Session expired or invalid. Please sign in again.' },
    };
  }
  const store = readStore();
  const user = store.users.find(
    (u) => u.id === payload.userId || u.email.toLowerCase() === payload.email.toLowerCase(),
  );
  if (!user) {
    return {
      user: null,
      error: { status: 401, message: 'Your portal access was removed by an Admin.' },
    };
  }
  if (!user.active && !user.isPrimaryOwner) {
    return {
      user: null,
      error: {
        status: 403,
        message: 'This user account has been deactivated. Contact a Portal Admin to re-enable access.',
      },
    };
  }
  return { user };
}

interface AuthedRequest extends Request {
  portalUser?: StoredPortalUser;
}

function requirePortalAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const resolved = resolveAuthenticatedUser(req);
  if (!resolved.user) {
    res.status(resolved.error?.status || 401).json({
      error: resolved.error?.message || 'Unauthorized',
    });
    return;
  }
  req.portalUser = resolved.user;
  next();
}

function canManageBlogsForUser(user: StoredPortalUser): boolean {
  return (
    Boolean(user.isPrimaryOwner) ||
    user.permissions.inventoryWrite ||
    user.permissions.videosManage ||
    user.permissions.usersManage
  );
}

export function createApiApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  // SSE clients for real-time multi-user sync (invalidation scopes only — zero PII)
  const sseClients = new Set<Response>();

  const broadcastSync = (scope: SyncScope) => {
    const payload = `data: ${JSON.stringify({ type: 'sync', scope, ts: Date.now() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      res.write(`retry: 15000\ndata: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);

    sseClients.add(res);
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Ensure initial store migration runs cleanly on boot
  readStore();

  // --- Email & Password Portal Authentication ---
  app.post('/api/auth/login', (req, res) => {
    const body = req.body as { email?: string; password?: string };
    const cleanEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'Please enter both your email address and password.' });
      return;
    }

    const store = readStore();
    const matched = store.users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!matched) {
      res.status(401).json({
        error: 'Invalid email or password. Confirm your account exists in Team & Users.',
      });
      return;
    }

    if (!matched.active && !matched.isPrimaryOwner) {
      res.status(403).json({
        error: 'This user account has been suspended. Contact a Portal Admin to re-enable access.',
      });
      return;
    }

    if (!matched.passwordHash || !verifyPassword(password, matched.passwordHash)) {
      res.status(401).json({
        error: 'Invalid email or password. Please check your credentials and try again.',
      });
      return;
    }

    const token = signSessionToken(matched);
    res.json({ token, user: toPublicUser(matched) });
  });

  app.get('/api/auth/me', requirePortalAuth, (req: AuthedRequest, res) => {
    res.json({ user: toPublicUser(req.portalUser!) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

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
    const vehicles = [...store.vehicles].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    res.json({ vehicles });
  });

  app.post('/api/vehicles', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.inventoryWrite) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Inventory Write access in Team & Users.`,
      });
      return;
    }
    const body = req.body as Partial<ExportVehicle>;
    if (!body.makeModel || !body.chassisCode || !body.category) {
      res.status(400).json({ error: 'makeModel, chassisCode, and category are required.' });
      return;
    }
    const store = readStore();
    const gallery =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 8)
        : body.image
          ? [body.image]
          : [];
    if (gallery.length === 0) {
      res.status(400).json({ error: 'At least one vehicle photo is required.' });
      return;
    }
    const created: ExportVehicle = {
      ...(body as ExportVehicle),
      image: gallery[0],
      images: gallery,
      id: body.id && body.id.trim() ? body.id : `veh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: body.status ?? 'Available',
      createdAt: new Date().toISOString(),
    };
    store.vehicles = [created, ...store.vehicles];
    writeStore(store);
    broadcastSync('vehicles');
    res.status(201).json({ vehicle: created });
  });

  app.patch('/api/vehicles/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.inventoryWrite) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Inventory Write access in Team & Users.`,
      });
      return;
    }
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
    const nextGallery =
      Array.isArray(updates.images) && updates.images.length > 0
        ? updates.images
        : updates.image
          ? [updates.image]
          : existing.images && existing.images.length > 0
            ? existing.images
            : [existing.image];

    const updated: ExportVehicle = {
      ...existing,
      ...updates,
      image: updates.image || nextGallery[0] || existing.image,
      images: nextGallery,
      transit: mergedTransit,
      inspection: updates.inspection
        ? { ...existing.inspection, ...updates.inspection }
        : existing.inspection,
    };
    store.vehicles[index] = updated;
    writeStore(store);
    broadcastSync('vehicles');
    res.json({ vehicle: updated });
  });

  app.delete('/api/vehicles/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.inventoryDelete) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Inventory Delete access in Team & Users.`,
      });
      return;
    }
    const { id } = req.params;
    const store = readStore();
    const nextVehicles = store.vehicles.filter((v) => v.id !== id);
    if (nextVehicles.length === store.vehicles.length) {
      res.status(404).json({ error: 'Vehicle not found.' });
      return;
    }
    store.vehicles = nextVehicles;
    writeStore(store);
    broadcastSync('vehicles');
    res.json({ deletedId: id });
  });

  // Client Bookings & Portal Management API
  app.get('/api/bookings', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.bookingsRead) {
      res.status(403).json({ error: 'Permission denied: Bookings Read access required.' });
      return;
    }
    const store = readStore();
    const bookings = [...store.bookings].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    res.json({ bookings });
  });

  app.post('/api/bookings', (req, res) => {
    const body = req.body as Partial<BookingRequest>;
    if (!body.buyerName || !body.buyerEmail || !body.destinationPortName) {
      res.status(400).json({ error: 'buyerName, buyerEmail, and destinationPortName are required.' });
      return;
    }

    const authCheck = extractBearerToken(req) ? resolveAuthenticatedUser(req) : null;
    const isAuthorizedWriter = Boolean(
      authCheck?.user && (authCheck.user.isPrimaryOwner || authCheck.user.permissions.bookingsWrite),
    );

    const store = readStore();
    const booking: BookingRequest = {
      id: `bk-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).slice(-3)}`,
      vehicleId: body.vehicleId ?? null,
      vehicleTitle: body.vehicleTitle || 'Custom Japan Import Request',
      chassisCode: body.chassisCode || 'TBD',
      buyerName: body.buyerName.trim(),
      buyerEmail: body.buyerEmail.trim().toLowerCase(),
      buyerPhone: body.buyerPhone?.trim() || '',
      destinationPortId: body.destinationPortId || 'nassau',
      destinationPortName: body.destinationPortName,
      requestType: body.requestType || 'Book Direct Japan Import',
      shippingMethod: body.shippingMethod || 'RoRo Vessel',
      quotedAmountUsd: Number(body.quotedAmountUsd) || 0,
      notes: body.notes?.trim() || '',
      leadSource: body.leadSource?.trim() || 'Website Booking Form',
      crmNotes: isAuthorizedWriter ? body.crmNotes?.trim() || '' : '',
      status: isAuthorizedWriter && body.status ? body.status : 'Pending Review',
      createdAt: new Date().toISOString(),
    };
    store.bookings = [booking, ...store.bookings];
    writeStore(store);
    broadcastSync('bookings');
    res.status(201).json({ booking });
  });

  app.patch('/api/bookings/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.bookingsWrite) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Bookings Write access in Team & Users.`,
      });
      return;
    }
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
    let syncedVehicleStatus: { id: string; status: ExportVehicle['status'] } | undefined;
    if (status) {
      const linkedVehicleId = store.bookings[index].vehicleId;
      if (linkedVehicleId && (user.isPrimaryOwner || user.permissions.inventoryWrite)) {
        const vIdx = store.vehicles.findIndex((v) => v.id === linkedVehicleId);
        if (vIdx !== -1) {
          if (status === 'Deposit Confirmed') {
            store.vehicles[vIdx].status = 'Booked';
            syncedVehicleStatus = { id: linkedVehicleId, status: 'Booked' };
          } else if (status === 'Shipped / B/L Issued') {
            store.vehicles[vIdx].status = 'In Transit';
            syncedVehicleStatus = { id: linkedVehicleId, status: 'In Transit' };
          }
        }
      }
    }
    writeStore(store);
    broadcastSync('bookings');
    if (syncedVehicleStatus) broadcastSync('vehicles');
    res.json({ booking: store.bookings[index], vehicles: store.vehicles, syncedVehicleStatus });
  });

  app.delete('/api/bookings/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.bookingsDelete) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Bookings Delete access in Team & Users.`,
      });
      return;
    }
    const { id } = req.params;
    const store = readStore();
    const nextBookings = store.bookings.filter((b) => b.id !== id);
    if (nextBookings.length === store.bookings.length) {
      res.status(404).json({ error: 'Booking lead not found.' });
      return;
    }
    store.bookings = nextBookings;
    writeStore(store);
    broadcastSync('bookings');
    res.json({ deletedId: id });
  });

  // Container Unloading Videos API
  app.get('/api/videos', (_req, res) => {
    const store = readStore();
    const videos = [...store.videos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ videos });
  });

  app.post('/api/videos', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.videosManage) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Unloading Videos access in Team & Users.`,
      });
      return;
    }
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
    broadcastSync('videos');
    res.status(201).json({ video: created });
  });

  app.delete('/api/videos/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.videosManage) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Account requires Unloading Videos access in Team & Users.`,
      });
      return;
    }
    const { id } = req.params;
    const store = readStore();
    const nextVideos = store.videos.filter((v) => v.id !== id);
    if (nextVideos.length === store.videos.length) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    store.videos = nextVideos;
    writeStore(store);
    broadcastSync('videos');
    res.json({ deletedId: id });
  });

  // Blog Articles API (Public published read, Portal staff manage)
  app.get('/api/blogs', (req, res) => {
    const store = readStore();
    const authCheck = extractBearerToken(req) ? resolveAuthenticatedUser(req) : null;
    const canSeeDrafts = Boolean(authCheck?.user && canManageBlogsForUser(authCheck.user));
    const blogs = [...store.blogs]
      .filter((b) => canSeeDrafts || b.status === 'Published')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ blogs });
  });

  app.post('/api/blogs', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!canManageBlogsForUser(user)) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Publishing blog posts requires Editor or Admin write permissions.`,
      });
      return;
    }
    const body = req.body as Partial<BlogPost>;
    const cleanTitle = String(body.title || '').trim().slice(0, 180);
    const cleanExcerpt = String(body.excerpt || '').trim().slice(0, 400);
    const cleanContent = String(body.content || '').trim().slice(0, 15000);
    const cleanCover = String(body.coverImage || '').trim().slice(0, 350000);

    if (!cleanTitle || !cleanExcerpt || !cleanContent || !cleanCover) {
      res.status(400).json({ error: 'Title, excerpt, content, and cover image are required.' });
      return;
    }

    const validCategories: BlogCategory[] = [
      'Import Guides',
      'Auction Tips',
      'Port & Customs',
      'Market Updates',
    ];
    const category: BlogCategory = validCategories.includes(body.category as BlogCategory)
      ? (body.category as BlogCategory)
      : 'Import Guides';
    const status: BlogStatus = body.status === 'Draft' ? 'Draft' : 'Published';

    const store = readStore();
    const baseSlug = slugifyBlogTitle(body.slug || cleanTitle);
    const slugTaken = store.blogs.some((b) => b.slug === baseSlug);
    const finalSlug = slugTaken ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

    const created: BlogPost = {
      id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug: finalSlug,
      title: cleanTitle,
      excerpt: cleanExcerpt,
      content: cleanContent,
      category,
      authorName: String(body.authorName || user.name || 'PJS Ventures Editorial').trim().slice(0, 100),
      readTimeMinutes: Math.min(
        60,
        Math.max(1, Math.round(Number(body.readTimeMinutes) || estimateReadTimeMinutes(cleanContent))),
      ),
      coverImage: cleanCover,
      coverImageAlt: String(body.coverImageAlt || cleanTitle).trim().slice(0, 240),
      status,
      createdAt: new Date().toISOString(),
    };
    store.blogs = [created, ...store.blogs];
    writeStore(store);
    broadcastSync('blogs');
    res.status(201).json({ blog: created });
  });

  app.patch('/api/blogs/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!canManageBlogsForUser(user)) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Editing blog posts requires Editor or Admin write permissions.`,
      });
      return;
    }
    const { id } = req.params;
    const updates = req.body as Partial<BlogPost>;
    const store = readStore();
    const idx = store.blogs.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Blog post not found.' });
      return;
    }
    const existing = store.blogs[idx];
    const nextContent =
      updates.content !== undefined ? String(updates.content).trim().slice(0, 15000) : existing.content;
    const nextTitle =
      updates.title !== undefined ? String(updates.title).trim().slice(0, 180) : existing.title;
    const nextSlug =
      updates.slug !== undefined ? slugifyBlogTitle(updates.slug || nextTitle) : existing.slug;

    const updated: BlogPost = {
      ...existing,
      ...(updates.category ? { category: updates.category } : {}),
      ...(updates.status ? { status: updates.status === 'Draft' ? 'Draft' : 'Published' } : {}),
      ...(updates.authorName !== undefined
        ? { authorName: String(updates.authorName).trim().slice(0, 100) || existing.authorName }
        : {}),
      ...(updates.coverImage !== undefined
        ? { coverImage: String(updates.coverImage).trim().slice(0, 350000) || existing.coverImage }
        : {}),
      ...(updates.coverImageAlt !== undefined
        ? { coverImageAlt: String(updates.coverImageAlt).trim().slice(0, 240) || nextTitle }
        : {}),
      ...(updates.excerpt !== undefined
        ? { excerpt: String(updates.excerpt).trim().slice(0, 400) || existing.excerpt }
        : {}),
      title: nextTitle || existing.title,
      slug: nextSlug,
      content: nextContent,
      readTimeMinutes:
        updates.readTimeMinutes !== undefined
          ? Math.min(60, Math.max(1, Math.round(Number(updates.readTimeMinutes) || 1)))
          : estimateReadTimeMinutes(nextContent),
      updatedAt: new Date().toISOString(),
    };
    store.blogs[idx] = updated;
    writeStore(store);
    broadcastSync('blogs');
    res.json({ blog: updated });
  });

  app.delete('/api/blogs/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!canManageBlogsForUser(user)) {
      res.status(403).json({
        error: `Permission denied for ${user.email}. Deleting blog posts requires Editor or Admin permissions.`,
      });
      return;
    }
    const { id } = req.params;
    const store = readStore();
    const nextBlogs = store.blogs.filter((b) => b.id !== id);
    if (nextBlogs.length === store.blogs.length) {
      res.status(404).json({ error: 'Blog post not found.' });
      return;
    }
    store.blogs = nextBlogs;
    writeStore(store);
    broadcastSync('blogs');
    res.json({ deletedId: id });
  });

  // Seller Portal Team Users & RBAC API
  app.get('/api/users', requirePortalAuth, (req: AuthedRequest, res) => {
    const user = req.portalUser!;
    if (!user.isPrimaryOwner && !user.permissions.usersManage) {
      res.json({ users: [toPublicUser(user)] });
      return;
    }
    const store = readStore();
    const users = [...store.users]
      .sort((a, b) => {
        if (Boolean(a.isPrimaryOwner) !== Boolean(b.isPrimaryOwner)) {
          return a.isPrimaryOwner ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map(toPublicUser);
    res.json({ users });
  });

  app.post('/api/users', requirePortalAuth, (req: AuthedRequest, res) => {
    const actor = req.portalUser!;
    if (!actor.isPrimaryOwner && !actor.permissions.usersManage) {
      res.status(403).json({ error: 'Permission denied: Team & Users management required.' });
      return;
    }
    const body = req.body as Partial<PortalUser>;
    const email = body.email?.trim().toLowerCase() || '';
    const rawPassword = typeof body.password === 'string' ? body.password.trim() : '';
    if (!body.name?.trim() || !email) {
      res.status(400).json({ error: 'Full name and email address are required.' });
      return;
    }
    if (rawPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    const store = readStore();
    if (store.users.some((u) => u.email.trim().toLowerCase() === email)) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }
    const normalized = normalizePortalUser(
      {
        ...body,
        id: emailToPortalUserId(email),
        email,
        isPrimaryOwner: false,
        createdAt: new Date().toISOString(),
      },
      body.role || 'Viewer',
    );
    const created: StoredPortalUser = {
      ...normalized,
      passwordHash: hashPassword(rawPassword),
    };
    store.users = [...store.users, created];
    writeStore(store);
    broadcastSync('users');
    res.status(201).json({ user: toPublicUser(created) });
  });

  app.patch('/api/users/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const actor = req.portalUser!;
    if (!actor.isPrimaryOwner && !actor.permissions.usersManage) {
      res.status(403).json({ error: 'Permission denied: Team & Users management required.' });
      return;
    }
    const { id } = req.params;
    const updates = req.body as Partial<PortalUser>;
    const store = readStore();
    const index = store.users.findIndex((u) => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const existing = store.users[index];
    const nextEmail =
      !existing.isPrimaryOwner && updates.email
        ? updates.email.trim().toLowerCase()
        : existing.email;

    if (
      nextEmail !== existing.email &&
      store.users.some((u, idx) => idx !== index && u.email.trim().toLowerCase() === nextEmail)
    ) {
      res.status(409).json({ error: 'Another user already uses this email.' });
      return;
    }

    const rawNewPassword = typeof updates.password === 'string' ? updates.password.trim() : '';
    if (rawNewPassword.length > 0 && rawNewPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const normalized = normalizePortalUser(
      {
        ...existing,
        ...updates,
        email: nextEmail,
        role: existing.isPrimaryOwner ? 'Admin' : updates.role || existing.role,
        active: existing.isPrimaryOwner
          ? true
          : typeof updates.active === 'boolean'
            ? updates.active
            : existing.active,
        permissions: existing.isPrimaryOwner
          ? { ...ROLE_DEFAULT_PERMISSIONS.Admin }
          : updates.permissions
            ? { ...existing.permissions, ...updates.permissions }
            : existing.permissions,
        isPrimaryOwner: existing.isPrimaryOwner,
      },
      updates.role || existing.role,
    );

    const updated: StoredPortalUser = {
      ...normalized,
      passwordHash:
        rawNewPassword.length > 0 ? hashPassword(rawNewPassword) : existing.passwordHash,
    };

    store.users[index] = updated;
    writeStore(store);
    broadcastSync('users');
    res.json({
      user: toPublicUser(updated),
      replacedId: updated.id !== id ? id : undefined,
    });
  });

  app.delete('/api/users/:id', requirePortalAuth, (req: AuthedRequest, res) => {
    const actor = req.portalUser!;
    if (!actor.isPrimaryOwner && !actor.permissions.usersManage) {
      res.status(403).json({ error: 'Permission denied: Team & Users management required.' });
      return;
    }
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
    if (target.id === actor.id) {
      res.status(400).json({ error: 'You cannot delete the account you are currently signed in with.' });
      return;
    }
    store.users = store.users.filter((u) => u.id !== id);
    writeStore(store);
    broadcastSync('users');
    res.json({ deletedId: id });
  });

  return app;
}

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

const isDirectEntry =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectEntry && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  void startServer();
}
