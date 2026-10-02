import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLogin } from './components/AdminLogin';
import { Footer } from './components/Footer';
import { Product, AdminSettings } from './types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './data/initialProducts';
import {
  verifyAdminSession,
  logoutAdmin,
  apiAddProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiUpdateSettings,
  apiResetDefaults,
} from './utils/api';
import {
  subscribeToCloudProducts,
  subscribeToCloudSettings,
} from './firebase/db';
import { Search, Layers, Loader2 } from 'lucide-react';

function checkIsAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path === '/admin-portal' ||
    path.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash === '#/admin-portal' ||
    hash.includes('admin')
  );
}

export default function App() {
  // State for products and settings synced with Cloud Firestore
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Routing and Authentication states
  const [isAdminRoute, setIsAdminRoute] = useState(checkIsAdminPath);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifyingAuth, setVerifyingAuth] = useState(true);

  // Client view states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Real-time Cloud Synchronization (Works worldwide across all devices)
  useEffect(() => {
    const unsubProducts = subscribeToCloudProducts(
      (cloudProducts) => {
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }
        setDataLoaded(true);
      },
      (err) => {
        console.warn('Using local fallback while cloud connects:', err);
        setDataLoaded(true);
      }
    );

    const unsubSettings = subscribeToCloudSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Check and verify session
  const checkAuth = useCallback(async () => {
    setVerifyingAuth(true);
    try {
      const isValid = await verifyAdminSession();
      setIsAuthenticated(isValid);
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setVerifyingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen to browser navigation (back/forward, URL hash change)
  useEffect(() => {
    const handleLocationChange = () => {
      const isAdmin = checkIsAdminPath();
      setIsAdminRoute(isAdmin);
      if (isAdmin) {
        checkAuth();
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Discrete keyboard shortcut for admin: Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkAuth]);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin-portal');
    setIsAdminRoute(true);
    checkAuth();
  };

  const navigateToStorefront = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    navigateToStorefront();
  };

  // Admin CRUD Handlers communicating with Cloud Firestore
  const handleAddProduct = async (newProduct: Product) => {
    await apiAddProduct(newProduct);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    await apiUpdateProduct(updatedProduct);
  };

  const handleDeleteProduct = async (productId: string) => {
    await apiDeleteProduct(productId);
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
  };

  const handleUpdateSettings = async (newSettings: AdminSettings) => {
    await apiUpdateSettings(newSettings);
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all automation products in the Cloud Database to initial showcase items?')) {
      await apiResetDefaults();
    }
  };

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products for client grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.deliveryFormat.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar: Never exposes admin buttons to normal visitors */}
      <Navbar
        isAdminRoute={isAdminRoute}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onExitAdmin={navigateToStorefront}
        productCount={products.length}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {isAdminRoute ? (
          /* ================= HIDDEN ADMIN ROUTE (/admin or /admin-portal) ================= */
          verifyingAuth ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono-code text-neutral-400">
                Verifying administrative authorization...
              </span>
            </div>
          ) : isAuthenticated ? (
            <AdminPortal
              products={products}
              settings={settings}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateSettings={handleUpdateSettings}
              onResetDefaults={handleResetDefaults}
              onViewStorefront={navigateToStorefront}
              onLogout={handleLogout}
            />
          ) : (
            <AdminLogin
              onSuccess={() => setIsAuthenticated(true)}
              onBackToStorefront={navigateToStorefront}
            />
          )
        ) : (
          /* ================= PUBLIC STOREFRONT / CATALOG (BODY: PRODUCT BOXES ONLY) ================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8" id="catalog">
            {/* Header: Pure focus on products */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-800/80">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2 font-mono-code">
                  <span>Direct WhatsApp Inquiries</span>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <span>Unique Product Tracking</span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Automation Tools &amp; Systems
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                  Browse production-grade automation workflows. Every tool is identified with an automated unique ID so you can order directly on WhatsApp.
                </p>
              </div>

              {/* Quick Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID or name..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-1 hidden sm:inline">
                  Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* In the body: ONLY Product Boxes Grid */}
            {!dataLoaded ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-mono-code text-neutral-400">Loading catalog from cloud database...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
                <Layers className="w-10 h-10 text-neutral-400 mx-auto" />
                <h3 className="text-base font-semibold text-white">No matching automation tools found</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Try adjusting your search query or filter to view other available systems.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-neutral-800 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    settings={settings}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Universal Footer: Free of any admin links */}
      <Footer settings={settings} />

      {/* Product Quick Specs / WhatsApp Inspector Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          settings={settings}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
