import { Product, AdminSettings } from '../types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from '../data/initialProducts';
import {
  computeSHA256,
  getStoredAdminHash,
  setStoredAdminHash,
  getStoredAdminEmail,
  setStoredAdminEmail,
  ALLOWED_ADMIN_EMAILS,
} from './crypto';

const TOKEN_KEY = 'autoflow_admin_token';
const EXPIRY_KEY = 'autoflow_admin_expiry';
const STORAGE_KEY_PRODUCTS = 'autoflow_products_v2';
const STORAGE_KEY_SETTINGS = 'autoflow_settings_v2';

export function getStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (!token) return null;
  if (expiry && Date.now() > Number(expiry)) {
    removeStoredToken();
    return null;
  }
  return token;
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  // Default session 24 hours
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
}

export function removeStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}

// Helper to safely parse JSON response or detect static/405/HTML
async function safeJsonFetch(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Non-JSON response (status: ${res.status})`);
  }
  return res.json();
}

/* =========================================================
   LOGIN & AUTHENTICATION (HYBRID BACKEND + WEB CRYPTO API)
========================================================= */

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; token: string; email: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Step 1: Try backend Express server if available
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    // If server responded with JSON
    if (res.status !== 404 && res.status !== 405) {
      const data = await safeJsonFetch(res);
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      setStoredToken(data.token);
      return data;
    }
  } catch (err: any) {
    // If backend gave an explicit authentication error (e.g. rate limit or invalid password on backend)
    if (err.message && !err.message.includes('Non-JSON') && !err.message.includes('Failed to fetch') && !err.message.includes('405')) {
      throw err;
    }
    // Otherwise fallback to client-side Web Crypto API below (e.g. Vercel static deployment)
  }

  // Step 2: Client-side cryptographic verification (for Vercel / static hosting where backend /api returns 405)
  const currentAdminEmail = getStoredAdminEmail().toLowerCase();
  const isEmailMatch =
    cleanEmail === currentAdminEmail ||
    ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(cleanEmail);

  if (!isEmailMatch) {
    throw new Error('Invalid email or password.');
  }

  const enteredHash = await computeSHA256(password);
  const targetHash = getStoredAdminHash();

  if (enteredHash !== targetHash) {
    throw new Error('Invalid email or password.');
  }

  // Generate secure random session token
  const randomBytes = new Uint8Array(24);
  window.crypto.getRandomValues(randomBytes);
  const generatedToken = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  setStoredToken(generatedToken);
  return {
    success: true,
    token: generatedToken,
    email: cleanEmail,
  };
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  // Try backend verification if running
  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await safeJsonFetch(res);
      return !!data.valid;
    }
  } catch (e) {
    // Fallback: If on static host (Vercel) where /api/admin/verify gives 405,
    // trust client-side verified session token as long as it's not expired
  }

  return true;
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      // Ignore
    }
  }
  removeStoredToken();
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Try backend first
  const token = getStoredToken();
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.status !== 404 && res.status !== 405) {
      const data = await safeJsonFetch(res);
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      return data;
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Non-JSON') && !err.message.includes('Failed to fetch') && !err.message.includes('405')) {
      throw err;
    }
  }

  // Client-side Web Crypto fallback for static Vercel
  const currentHash = getStoredAdminHash();
  const enteredCurrentHash = await computeSHA256(currentPassword);

  if (enteredCurrentHash !== currentHash) {
    throw new Error('Current password is incorrect.');
  }

  const newHash = await computeSHA256(newPassword);
  setStoredAdminHash(newHash);

  return { success: true, message: 'Admin password updated successfully in secure storage.' };
}

/* =========================================================
   PRODUCTS API (HYBRID BACKEND + LOCAL STORAGE CACHE)
========================================================= */

function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // Ignore
  }
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products to localStorage', e);
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await safeJsonFetch(res);
      if (Array.isArray(data)) {
        saveLocalProducts(data);
        return data;
      }
    }
  } catch (e) {
    // Fallback to local storage
  }

  return getLocalProducts();
}

export async function apiAddProduct(product: Product): Promise<Product> {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });

    if (res.ok) {
      const data = await safeJsonFetch(res);
      const current = getLocalProducts();
      saveLocalProducts([data, ...current]);
      return data;
    }
  } catch (e) {
    // Fallback for static hosting
  }

  const current = getLocalProducts();
  const updated = [product, ...current];
  saveLocalProducts(updated);
  return product;
}

export async function apiUpdateProduct(product: Product): Promise<Product> {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });

    if (res.ok) {
      const data = await safeJsonFetch(res);
      const current = getLocalProducts();
      saveLocalProducts(current.map((p) => (p.id === data.id ? data : p)));
      return data;
    }
  } catch (e) {
    // Fallback
  }

  const current = getLocalProducts();
  const updated = current.map((p) => (p.id === product.id ? product : p));
  saveLocalProducts(updated);
  return product;
}

export async function apiDeleteProduct(productId: string): Promise<void> {
  const token = getStoredToken();
  try {
    await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (e) {
    // Fallback
  }

  const current = getLocalProducts();
  const updated = current.filter((p) => p.id.toUpperCase() !== productId.toUpperCase());
  saveLocalProducts(updated);
}

/* =========================================================
   SETTINGS API
========================================================= */

function getLocalSettings(): AdminSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

function saveLocalSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export async function getSettings(): Promise<AdminSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await safeJsonFetch(res);
      saveLocalSettings(data);
      return data;
    }
  } catch (e) {
    // Fallback
  }
  return getLocalSettings();
}

export async function apiUpdateSettings(settings: AdminSettings): Promise<AdminSettings> {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      const data = await safeJsonFetch(res);
      saveLocalSettings(data);
      return data;
    }
  } catch (e) {
    // Fallback
  }

  saveLocalSettings(settings);
  return settings;
}

export async function apiResetDefaults(): Promise<{ products: Product[]; settings: AdminSettings }> {
  saveLocalProducts(INITIAL_PRODUCTS);
  saveLocalSettings(DEFAULT_SETTINGS);
  return { products: INITIAL_PRODUCTS, settings: DEFAULT_SETTINGS };
}
