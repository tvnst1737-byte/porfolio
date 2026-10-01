import { Product, AdminSettings } from '../types';

import imgCrmBot from '../assets/images/auto_crm_bot_1790842967198.jpg';
import imgLeadsEngine from '../assets/images/auto_leads_engine_1790842987988.jpg';
import imgInvoiceAi from '../assets/images/auto_invoice_ai_1790843001157.jpg';
import imgSocialPoster from '../assets/images/auto_social_poster_1790843016112.jpg';

export const DEFAULT_PRESET_IMAGES = [
  { label: 'Omni CRM & Chatbot Node', url: imgCrmBot },
  { label: 'Lead Scraper & Pipeline', url: imgLeadsEngine },
  { label: 'AI Document & Invoice Parser', url: imgInvoiceAi },
  { label: 'Multi-Channel Social Queue', url: imgSocialPoster },
];

export const DEFAULT_SETTINGS: AdminSettings = {
  whatsappNumber: '15553492041',
  whatsappDisplayNumber: '+1 (555) 349-2041',
  businessName: 'AutoFlow Systems',
  currencySymbol: '$',
  customWelcomeMessage: "Hello! I want to purchase the automation tool \"{productName}\" (Product ID: {productId}). Please share payment and delivery instructions.",
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'AUT-9041',
    name: 'OmniFlow WhatsApp & CRM Bot',
    tagline: 'Autonomous client qualification and lead assignment workflow',
    description: 'Complete 24/7 AI-driven conversational agent that captures leads on WhatsApp, validates intent, syncs contact details to HubSpot/Notion, and routes hot deals to your sales reps in real time.',
    price: 189,
    currency: '$',
    category: 'CRM & Messaging',
    imageUrl: imgCrmBot,
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
    imageUrl: imgLeadsEngine,
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
    imageUrl: imgInvoiceAi,
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
    imageUrl: imgSocialPoster,
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
    imageUrl: imgLeadsEngine,
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
    imageUrl: imgCrmBot,
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
];
