import { Product, AdminSettings } from '../types';
import {
  saveCloudProduct,
  deleteCloudProduct,
  updateCloudSettings,
  resetCloudProductsToDefaults,
  verifyCloudAdminCredentials,
  updateCloudAdminPassword,
} from '../firebase/db';

const TOKEN_KEY = 'autoflow_admin_token';
const EXPIRY_KEY = 'autoflow_admin_expiry';

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

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; token: string; email: string }> {
  // Verifies against Cloud Firestore (shared worldwide)
  const result = await verifyCloudAdminCredentials(email, password);

  // Generate secure random session token
  const randomBytes = new Uint8Array(24);
  window.crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  setStoredToken(token);
  return {
    success: true,
    token,
    email: result.email,
  };
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  return !!token;
}

export async function logoutAdmin(): Promise<void> {
  removeStoredToken();
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return await updateCloudAdminPassword(currentPassword, newPassword);
}

export async function apiAddProduct(product: Product): Promise<Product> {
  await saveCloudProduct(product);
  return product;
}

export async function apiUpdateProduct(product: Product): Promise<Product> {
  await saveCloudProduct(product);
  return product;
}

export async function apiDeleteProduct(productId: string): Promise<void> {
  await deleteCloudProduct(productId);
}

export async function apiUpdateSettings(settings: AdminSettings): Promise<AdminSettings> {
  await updateCloudSettings(settings);
  return settings;
}

export async function apiResetDefaults(): Promise<void> {
  await resetCloudProductsToDefaults();
}
