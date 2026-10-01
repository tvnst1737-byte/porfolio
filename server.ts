import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'server-data.json');

// Security & Authentication Configuration
// Default admin credentials (customizable via ADMIN_EMAIL / ADMIN_PASSWORD or via in-app password change)
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tvnst1737@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@AutoFlow2026!';

// Helper: Hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// In-memory Session Store (tokens -> session data)
interface Session {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, Session>();

// Rate Limiter for Login Attempts (IP -> { count, lockedUntil })
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}
const loginRateLimiter = new Map<string, RateLimitRecord>();

// Default Store Data
function getDefaultStoreData() {
  return {
    admin: {
      email: DEFAULT_ADMIN_EMAIL,
      salt: crypto.randomBytes(16).toString('hex'),
      passwordHash: '', // populated below
    },
    settings: {
      whatsappNumber: '15553492041',
      whatsappDisplayNumber: '+1 (555) 349-2041',
      businessName: 'AutoFlow Systems',
      currencySymbol: '$',
      customWelcomeMessage: 'Hello! I want to purchase the automation tool "{productName}" (Product ID: {productId}). Please share payment and delivery instructions.',
    },
    products: [
      {
        id: 'AUT-9041',
        name: 'OmniFlow WhatsApp & CRM Bot',
        tagline: 'Autonomous client qualification and lead assignment workflow',
        description: 'Complete 24/7 AI-driven conversational agent that captures leads on WhatsApp, validates intent, syncs contact details to HubSpot/Notion, and routes hot deals to your sales reps in real time.',
        price: 189,
        currency: '$',
        category: 'CRM & Messaging',
        imageUrl: '/src/assets/images/auto_crm_bot_1790842967198.jpg',
        deliveryFormat: 'Self-Hosted n8n Workflow + Docker Setup',
        features: [
          'Pre-built WhatsApp Cloud API webhook handler',
          'Dual-sync with HubSpot, Notion & Google Sheets',
          'Smart lead qualification scoring algorithm',
          'Human handoff alert via Telegram / Slack'
        ],
        specs: 'Requires Node.js 18+ or Docker. Works with Meta WhatsApp Business Cloud API. Lifetime updates included.',
        createdAt: '2026-09-18T10:00:00Z',
      },
      {
        id: 'AUT-7723',
        name: 'AutoLeads B2B Scraper & Enricher',
        tagline: 'Autonomous B2B prospect finder with verified email enrichment',
        description: 'High-speed automated pipeline that queries Google Maps, LinkedIn company directories, and public records, extracts verified emails, and filters out bounces before exporting to your pipeline.',
        price: 249,
        currency: '$',
        category: 'Lead Generation',
        imageUrl: '/src/assets/images/auto_leads_engine_1790842987988.jpg',
        deliveryFormat: 'Python 3.12 Engine + Streamlit GUI',
        features: [
          'Multi-threaded scraping with anti-blocking proxy rotation',
          'Automated MX record & SMTP ping email verification',
          'CSV / Airtable / Webhook automated export',
          'Custom keyword and geographic radius filters'
        ],
        specs: 'Python 3.10-3.12 compatible. Dockerfile included for 1-click cloud deployment on Railway or VPS.',
        createdAt: '2026-09-21T14:30:00Z',
      },
      {
        id: 'AUT-5510',
        name: 'DocuParse Smart Invoice Extractor',
        tagline: 'Zero-touch PDF & receipt parsing directly into accounting software',
        description: 'Watches incoming emails and Google Drive folders for invoices and receipts, extracts vendor name, line items, taxes, and totals with 99.4% OCR precision, and logs directly to QuickBooks/Xero.',
        price: 169,
        currency: '$',
        category: 'Finance & Invoicing',
        imageUrl: '/src/assets/images/auto_invoice_ai_1790843001157.jpg',
        deliveryFormat: 'Make.com Scenario + Cloudflare Worker',
        features: [
          'Multi-format PDF, PNG & scanned JPG image parser',
          'Line-item tabular extraction with tax reconciliation',
          'Automated duplicate detection and fraud check',
          'Instant Google Drive archive indexing'
        ],
        specs: 'Runs on free-tier Cloudflare Workers or serverless Node. Includes step-by-step 10-minute setup video.',
        createdAt: '2026-09-24T09:15:00Z',
      },
      {
        id: 'AUT-3289',
        name: 'PulseQueue Multi-Platform Publisher',
        tagline: 'Write once, schedule and syndicate across 6 social networks',
        description: 'Centralized automation suite that auto-formats, resizes, and schedules content across X/Twitter, LinkedIn, Threads, Instagram, and Pinterest with dynamic hashtag generation and engagement monitoring.',
        price: 139,
        currency: '$',
        category: 'Content & Social',
        imageUrl: '/src/assets/images/auto_social_poster_1790843016112.jpg',
        deliveryFormat: 'TypeScript Node.js Worker + REST API',
        features: [
          'Native OAuth integrations for X, LinkedIn, Threads & Meta',
          'Automated visual aspect ratio formatting',
          'Dynamic queue calendar with optimal posting time matrix',
          'Weekly engagement summary report sent to Telegram'
        ],
        specs: 'Node.js 20+ runtime. Single SQLite/PostgreSQL storage. Zero external SaaS subscriptions required.',
        createdAt: '2026-09-28T16:45:00Z',
      },
      {
        id: 'AUT-6415',
        name: 'ShopSync Multi-Store Inventory Engine',
        tagline: 'Real-time stock synchronization across Shopify, WooCommerce & Amazon',
        description: 'Sub-second two-way stock synchronization engine that prevents overselling during flash sales. Listens to inventory webhooks and propagates quantity changes across multiple storefronts instantly.',
        price: 219,
        currency: '$',
        category: 'E-commerce Ops',
        imageUrl: '/src/assets/images/auto_leads_engine_1790842987988.jpg',
        deliveryFormat: 'Golang Microservice / Docker Container',
        features: [
          'Bi-directional webhook synchronization in under 800ms',
          'Low-stock threshold alerts via WhatsApp / SMS',
          'Automated price parity and currency conversion rule',
          'Full transaction ledger for audit and reconciliation'
        ],
        specs: 'Compiled Go binary. Low RAM footprint (<50MB). Includes pre-configured Docker Compose file.',
        createdAt: '2026-09-29T11:20:00Z',
      },
      {
        id: 'AUT-8820',
        name: 'SupportCopilot Ticket Classifier',
        tagline: 'AI triaging and automated reply drafting for Zendesk & Freshdesk',
        description: 'Analyzes incoming customer support tickets, scores urgency and sentiment, assigns the ticket to the best specialist, and prepares a verified draft response ready for 1-click agent approval.',
        price: 199,
        currency: '$',
        category: 'CRM & Messaging',
        imageUrl: '/src/assets/images/auto_crm_bot_1790842967198.jpg',
        deliveryFormat: 'Python FastAPI Webhook + Documentation',
        features: [
          'Automated ticket sentiment & urgency scoring (1-5)',
          'Smart categorization across billing, technical, and sales',
          'Draft response generation with knowledge-base grounding',
          'SLA countdown breach warning triggers'
        ],
        specs: 'FastAPI microservice. Compatible with Zendesk, Freshdesk, Intercom, and email IMAP/SMTP.',
        createdAt: '2026-09-30T08:00:00Z',
      }
    ]
  };
}

// Load or initialize store
function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading server-data.json, creating new', err);
    }
  }

  const initial = getDefaultStoreData();
  initial.admin.passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD, initial.admin.salt);
  fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

let store = loadStore();

function saveStore() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// Auth Middleware: Verifies Bearer session token
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'Unauthorized: Session expired. Please log in again.' });
    return;
  }

  // Session is valid
  next();
}

async function startServer() {
  const app = express();

  // Parse JSON bodies safely with size limits
  app.use(express.json({ limit: '10mb' }));

  // Helper: Client IP for rate limiting
  const getClientIp = (req: Request) => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  };

  /* ==========================================
     AUTHENTICATION APIS (SERVER-SIDE ONLY)
  ========================================== */

  // POST /api/admin/login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const now = Date.now();

    // Check Rate Limiter
    const rateRecord = loginRateLimiter.get(ip) || { attempts: 0, lockedUntil: 0 };
    if (rateRecord.lockedUntil > now) {
      const waitSeconds = Math.ceil((rateRecord.lockedUntil - now) / 1000);
      res.status(429).json({
        error: `Too many failed attempts. Login locked for security. Please try again in ${waitSeconds} seconds.`
      });
      return;
    }

    const { email, password } = req.body;

    // Strict input type validation to prevent type-juggling or injection payloads
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Invalid input format.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = store.admin.email.toLowerCase();

    // Support primary email or secondary fallback
    const isEmailValid = cleanEmail === adminEmail || cleanEmail === 'tvnst1737@gmail.com' || cleanEmail === 'admin@autoflow.com';

    let isPasswordValid = false;
    if (isEmailValid && password.length > 0) {
      const computedHash = hashPassword(password, store.admin.salt);
      try {
        const hashBuf = Buffer.from(computedHash, 'hex');
        const targetBuf = Buffer.from(store.admin.passwordHash, 'hex');
        if (hashBuf.length === targetBuf.length) {
          isPasswordValid = crypto.timingSafeEqual(hashBuf, targetBuf);
        }
      } catch (e) {
        isPasswordValid = false;
      }
    }

    if (!isEmailValid || !isPasswordValid) {
      rateRecord.attempts += 1;
      if (rateRecord.attempts >= 5) {
        rateRecord.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
        loginRateLimiter.set(ip, rateRecord);
        res.status(429).json({
          error: 'Maximum failed attempts exceeded. Access locked for 15 minutes.'
        });
        return;
      }
      loginRateLimiter.set(ip, rateRecord);
      res.status(401).json({
        error: `Invalid credentials. (${5 - rateRecord.attempts} attempts remaining before temporary lockout)`
      });
      return;
    }

    // Reset rate limiter on successful authentication
    loginRateLimiter.delete(ip);

    // Generate cryptographically secure session token (256-bit random)
    const token = crypto.randomBytes(32).toString('hex');
    const session: Session = {
      token,
      email: cleanEmail,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24-hour validity
    };
    activeSessions.set(token, session);

    res.json({
      success: true,
      token,
      expiresAt: session.expiresAt,
      email: store.admin.email,
    });
  });

  // POST /api/admin/verify
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ valid: false, error: 'No token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const session = activeSessions.get(token);

    if (!session || Date.now() > session.expiresAt) {
      if (session) activeSessions.delete(token);
      res.status(401).json({ valid: false, error: 'Session expired' });
      return;
    }

    res.json({ valid: true, email: session.email });
  });

  // POST /api/admin/logout
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true });
  });

  // POST /api/admin/change-password (Protected)
  app.post('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Invalid input parameters.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    // Verify current password
    const computedHash = hashPassword(currentPassword, store.admin.salt);
    const hashBuf = Buffer.from(computedHash, 'hex');
    const targetBuf = Buffer.from(store.admin.passwordHash, 'hex');
    if (hashBuf.length !== targetBuf.length || !crypto.timingSafeEqual(hashBuf, targetBuf)) {
      res.status(403).json({ error: 'Current password is incorrect.' });
      return;
    }

    // Update password with fresh salt
    const newSalt = crypto.randomBytes(16).toString('hex');
    store.admin.salt = newSalt;
    store.admin.passwordHash = hashPassword(newPassword, newSalt);
    saveStore();

    res.json({ success: true, message: 'Admin password updated successfully.' });
  });

  /* ==========================================
     PUBLIC APIS (PRODUCTS & SETTINGS)
  ========================================== */

  // GET /api/products
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json(store.products);
  });

  // GET /api/settings
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(store.settings);
  });

  /* ==========================================
     PROTECTED ADMIN CRUD APIS
  ========================================== */

  // POST /api/products (Add product)
  app.post('/api/products', requireAdminAuth, (req: Request, res: Response) => {
    const newProduct = req.body;

    if (!newProduct || !newProduct.name || !newProduct.id) {
      res.status(400).json({ error: 'Product name and unique ID are required.' });
      return;
    }

    // Check duplicate ID
    const exists = store.products.some((p: any) => p.id.toUpperCase() === newProduct.id.toUpperCase());
    if (exists) {
      res.status(409).json({ error: `Product with unique ID '${newProduct.id}' already exists.` });
      return;
    }

    const sanitizedProduct = {
      id: String(newProduct.id).toUpperCase().trim(),
      name: String(newProduct.name).trim(),
      tagline: String(newProduct.tagline || '').trim(),
      description: String(newProduct.description || '').trim(),
      price: Number(newProduct.price) || 0,
      currency: String(newProduct.currency || '$').trim(),
      category: String(newProduct.category || 'General Automation').trim(),
      imageUrl: String(newProduct.imageUrl || ''),
      deliveryFormat: String(newProduct.deliveryFormat || 'Ready-to-Deploy').trim(),
      features: Array.isArray(newProduct.features) ? newProduct.features.map(String) : [],
      specs: String(newProduct.specs || '').trim(),
      createdAt: new Date().toISOString(),
    };

    store.products.unshift(sanitizedProduct);
    saveStore();

    res.status(201).json(sanitizedProduct);
  });

  // PUT /api/products/:id (Update product)
  app.put('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const productId = req.params.id.toUpperCase();
    const updatedData = req.body;

    const index = store.products.findIndex((p: any) => p.id.toUpperCase() === productId);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    store.products[index] = {
      ...store.products[index],
      ...updatedData,
      id: productId, // prevent changing ID
    };
    saveStore();

    res.json(store.products[index]);
  });

  // DELETE /api/products/:id (Delete product)
  app.delete('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const productId = req.params.id.toUpperCase();
    const initialLen = store.products.length;
    store.products = store.products.filter((p: any) => p.id.toUpperCase() !== productId);

    if (store.products.length === initialLen) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    saveStore();
    res.json({ success: true, deletedId: productId });
  });

  // PUT /api/settings (Update WhatsApp & business settings)
  app.put('/api/settings', requireAdminAuth, (req: Request, res: Response) => {
    const newSettings = req.body;
    store.settings = {
      ...store.settings,
      ...newSettings,
    };
    saveStore();
    res.json(store.settings);
  });

  // POST /api/admin/reset-defaults (Reset showcase tools)
  app.post('/api/admin/reset-defaults', requireAdminAuth, (_req: Request, res: Response) => {
    const defaults = getDefaultStoreData();
    store.products = defaults.products;
    store.settings = defaults.settings;
    saveStore();
    res.json({ success: true, products: store.products, settings: store.settings });
  });

  /* ==========================================
     VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  ========================================== */
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoFlow Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
