import { Product, AdminSettings } from '../types';

const TOKEN_KEY = 'autoflow_admin_token';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; token: string; email: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed');
  }

  setStoredToken(data.token);
  return data;
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.valid) {
      removeStoredToken();
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
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

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to change password');
  }
  return data;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function getSettings(): Promise<AdminSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function apiAddProduct(product: Product): Promise<Product> {
  const token = getStoredToken();
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add product');
  return data;
}

export async function apiUpdateProduct(product: Product): Promise<Product> {
  const token = getStoredToken();
  const res = await fetch(`/api/products/${product.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
}

export async function apiDeleteProduct(productId: string): Promise<void> {
  const token = getStoredToken();
  const res = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete product');
}

export async function apiUpdateSettings(settings: AdminSettings): Promise<AdminSettings> {
  const token = getStoredToken();
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}

export async function apiResetDefaults(): Promise<{ products: Product[]; settings: AdminSettings }> {
  const token = getStoredToken();
  const res = await fetch('/api/admin/reset-defaults', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset data');
  return data;
}
