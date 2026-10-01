// Web Crypto API utilities for client-side cryptographic security
export const DEFAULT_ADMIN_HASH = '4ddc48d82bdfc829e25dba6c21f675904cfe830e61abeedf5f0b65c88e8833ec';
export const DEFAULT_ADMIN_EMAIL = 'tvnst1737@gmail.com';
export const ALLOWED_ADMIN_EMAILS = [
  'tvnst1737@gmail.com',
  'admin@autoflow.com',
];

export const STORAGE_KEY_ADMIN_HASH = 'autoflow_admin_hash_v1';
export const STORAGE_KEY_ADMIN_EMAIL = 'autoflow_admin_email_v1';

export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredAdminHash(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_HASH) || DEFAULT_ADMIN_HASH;
  } catch (e) {
    return DEFAULT_ADMIN_HASH;
  }
}

export function setStoredAdminHash(newHash: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_HASH, newHash);
  } catch (e) {
    console.error('Failed to save admin hash to localStorage', e);
  }
}

export function getStoredAdminEmail(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_EMAIL) || DEFAULT_ADMIN_EMAIL;
  } catch (e) {
    return DEFAULT_ADMIN_EMAIL;
  }
}

export function setStoredAdminEmail(email: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_EMAIL, email);
  } catch (e) {
    console.error('Failed to save admin email to localStorage', e);
  }
}
