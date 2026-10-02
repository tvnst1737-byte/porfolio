import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Product, AdminSettings } from '../types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from '../data/initialProducts';
import {
  computeSHA256,
  DEFAULT_ADMIN_HASH,
  DEFAULT_ADMIN_EMAIL,
  ALLOWED_ADMIN_EMAILS,
} from '../utils/crypto';

const PRODUCTS_COLLECTION = 'products';
const SETTINGS_DOC = 'settings/general';
const ADMIN_AUTH_DOC = 'admin_auth/credentials';

/**
 * Initializes default cloud data if collections are empty.
 */
export async function seedInitialCloudDataIfNeeded(): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (productsSnap.empty) {
      console.log('Seeding initial products into Firestore Cloud Database...');
      const batch = writeBatch(db);
      for (const prod of INITIAL_PRODUCTS) {
        const ref = doc(db, PRODUCTS_COLLECTION, prod.id);
        batch.set(ref, prod);
      }
      await batch.commit();
    }

    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
    }

    const authSnap = await getDoc(doc(db, 'admin_auth', 'credentials'));
    if (!authSnap.exists()) {
      await setDoc(doc(db, 'admin_auth', 'credentials'), {
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: DEFAULT_ADMIN_HASH,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Initial cloud seed notice:', error);
  }
}

/**
 * Real-time listener for Products worldwide.
 */
export function subscribeToCloudProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If empty on first load, seed and return initial
        seedInitialCloudDataIfNeeded();
        onUpdate(INITIAL_PRODUCTS);
        return;
      }

      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push(docSnap.data() as Product);
      });

      // Sort by creation date descending
      products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(products);
    },
    (error) => {
      console.error('Firestore products onSnapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );
}

/**
 * Real-time listener for Settings worldwide.
 */
export function subscribeToCloudSettings(
  onUpdate: (settings: AdminSettings) => void
): () => void {
  const docRef = doc(db, 'settings', 'general');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AdminSettings);
      } else {
        seedInitialCloudDataIfNeeded();
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      console.error('Firestore settings onSnapshot error:', error);
      handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
    }
  );
}

/**
 * Add or update product in Firestore Cloud
 */
export async function saveCloudProduct(product: Product): Promise<void> {
  const docPath = `${PRODUCTS_COLLECTION}/${product.id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete product in Firestore Cloud
 */
export async function deleteCloudProduct(productId: string): Promise<void> {
  const docPath = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Update global settings in Firestore Cloud
 */
export async function updateCloudSettings(settings: AdminSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'general');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC);
  }
}

/**
 * Reset all cloud products to default showcase tools
 */
export async function resetCloudProductsToDefaults(): Promise<void> {
  try {
    // Delete existing
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const deleteBatch = writeBatch(db);
    snapshot.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    // Re-seed
    const seedBatch = writeBatch(db);
    for (const prod of INITIAL_PRODUCTS) {
      seedBatch.set(doc(db, PRODUCTS_COLLECTION, prod.id), prod);
    }
    await seedBatch.commit();

    await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
  }
}

/**
 * Cloud Admin Authentication: Verifies credentials across all laptops and devices
 */
export async function verifyCloudAdminCredentials(
  email: string,
  enteredPassword: string
): Promise<{ success: boolean; email: string }> {
  const cleanEmail = email.trim().toLowerCase();

  let targetHash = DEFAULT_ADMIN_HASH;
  let targetEmail = DEFAULT_ADMIN_EMAIL;

  try {
    const authSnap = await getDoc(doc(db, 'admin_auth', 'credentials'));
    if (authSnap.exists()) {
      const data = authSnap.data();
      targetHash = data.passwordHash || DEFAULT_ADMIN_HASH;
      targetEmail = (data.email || DEFAULT_ADMIN_EMAIL).toLowerCase();
    } else {
      await seedInitialCloudDataIfNeeded();
    }
  } catch (e) {
    // If offline or network issue, fallback to default hash
  }

  const isEmailValid =
    cleanEmail === targetEmail ||
    ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(cleanEmail);

  if (!isEmailValid) {
    throw new Error('Invalid email or password.');
  }

  const enteredHash = await computeSHA256(enteredPassword);
  if (enteredHash !== targetHash) {
    throw new Error('Invalid email or password.');
  }

  return { success: true, email: cleanEmail };
}

/**
 * Update Admin Password on Cloud so it works on all devices worldwide
 */
export async function updateCloudAdminPassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  // First verify current
  let currentHash = DEFAULT_ADMIN_HASH;
  try {
    const authSnap = await getDoc(doc(db, 'admin_auth', 'credentials'));
    if (authSnap.exists()) {
      currentHash = authSnap.data().passwordHash || DEFAULT_ADMIN_HASH;
    }
  } catch (e) {
    // fallback
  }

  const enteredCurrentHash = await computeSHA256(currentPass);
  if (enteredCurrentHash !== currentHash) {
    throw new Error('Current password is incorrect.');
  }

  const newHash = await computeSHA256(newPass);
  try {
    await setDoc(doc(db, 'admin_auth', 'credentials'), {
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ADMIN_AUTH_DOC);
  }

  return { success: true, message: 'Password updated worldwide across all devices.' };
}
