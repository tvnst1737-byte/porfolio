import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Image as ImageIcon,
  Save,
  X,
  AlertTriangle,
  Upload,
  Settings,
  Eye,
  Check,
  KeyRound,
  Lock,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Product, AdminSettings } from '../types';
import { generateUniqueId, buildWhatsAppUrl, sanitizePhoneNumber } from '../utils/whatsapp';
import { DEFAULT_PRESET_IMAGES } from '../data/initialProducts';
import { changeAdminPassword } from '../utils/api';

interface AdminPortalProps {
  products: Product[];
  settings: AdminSettings;
  onAddProduct: (product: Product) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateSettings: (settings: AdminSettings) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  onViewStorefront: () => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSettings,
  onResetDefaults,
  onViewStorefront,
  onLogout,
}) => {
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('149');
  const [formCurrency, setFormCurrency] = useState('$');
  const [formCategory, setFormCategory] = useState('CRM & Messaging');
  const [formDeliveryFormat, setFormDeliveryFormat] = useState('n8n Workflow + Documentation');
  const [formFeatures, setFormFeatures] = useState<string[]>([
    'Automated webhook trigger and data sync',
    'Pre-configured error notifications',
    'Complete setup instructions included'
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [formSpecs, setFormSpecs] = useState('Compatible with Docker / Node 18+. Instant setup.');
  const [formImageUrl, setFormImageUrl] = useState(DEFAULT_PRESET_IMAGES[0].url);

  // Settings form states
  const [tempWhatsapp, setTempWhatsapp] = useState(settings.whatsappNumber);
  const [tempBusinessName, setTempBusinessName] = useState(settings.businessName);
  const [tempWelcomeMsg, setTempWelcomeMsg] = useState(settings.customWelcomeMessage || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const existingIds = products.map((p) => p.id);

  const openAddModal = () => {
    setActionError(null);
    setEditingProduct(null);
    setFormId(generateUniqueId(existingIds));
    setFormName('');
    setFormTagline('');
    setFormDescription('');
    setFormPrice('149');
    setFormCurrency('$');
    setFormCategory('CRM & Messaging');
    setFormDeliveryFormat('n8n Workflow JSON + Docker');
    setFormFeatures([
      'Automated webhook trigger and data sync',
      'Pre-configured error notifications',
      'Step-by-step setup documentation included'
    ]);
    setNewFeatureText('');
    setFormSpecs('Runs on Node.js 18+ or Docker container. Ready to deploy.');
    setFormImageUrl(DEFAULT_PRESET_IMAGES[0].url);
    setIsFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    setActionError(null);
    setEditingProduct(product);
    setFormId(product.id);
    setFormName(product.name);
    setFormTagline(product.tagline);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormCurrency(product.currency);
    setFormCategory(product.category);
    setFormDeliveryFormat(product.deliveryFormat);
    setFormFeatures([...product.features]);
    setNewFeatureText('');
    setFormSpecs(product.specs || '');
    setFormImageUrl(product.imageUrl);
    setIsFormOpen(true);
  };

  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFormFeatures([...formFeatures, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== index));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) return;

    setSubmitting(true);
    setActionError(null);

    const parsedPrice = parseFloat(formPrice) || 0;

    const productData: Product = {
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      tagline: formTagline.trim(),
      description: formDescription.trim(),
      price: parsedPrice,
      currency: formCurrency.trim() || '$',
      category: formCategory.trim() || 'General Automation',
      imageUrl: formImageUrl,
      deliveryFormat: formDeliveryFormat.trim(),
      features: formFeatures.filter(f => f.trim().length > 0),
      specs: formSpecs.trim(),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    try {
      if (editingProduct) {
        await onUpdateProduct(productData);
      } else {
        await onAddProduct(productData);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await onDeleteProduct(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = sanitizePhoneNumber(tempWhatsapp);
    try {
      await onUpdateSettings({
        ...settings,
        whatsappNumber: cleanNumber,
        whatsappDisplayNumber: tempWhatsapp,
        businessName: tempBusinessName.trim() || 'AutoFlow Systems',
        customWelcomeMessage: tempWelcomeMsg.trim(),
      });
      setSettingsSaved(true);
      setTimeout(() => {
        setSettingsSaved(false);
        setIsSettingsOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await changeAdminPassword(currentPass, newPass);
      setPassSuccess(res.message || 'Password changed successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Admin Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Admin Product Studio
            </h1>
            <span className="text-xs font-mono-code px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {products.length} Products Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Backend authenticated management portal. Add or delete tools, update WhatsApp routing, and modify credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-750 hover:text-white rounded-lg border border-neutral-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>Settings &amp; Security</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Product</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 rounded-lg transition-colors"
            title="Log out of admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs">
        <div className="flex items-center gap-2.5 text-neutral-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WhatsApp Inbound Destination:</span>
          <span className="font-mono-code text-emerald-400 font-semibold">
            {settings.whatsappDisplayNumber || settings.whatsappNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Test WhatsApp Chat</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-neutral-700" aria-hidden="true">·</span>
          <button
            onClick={onViewStorefront}
            className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-400" />
            <span>View Public Catalog</span>
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Server-Synced Automation Products
          </h2>
          <button
            onClick={onResetDefaults}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors"
            title="Reset to sample automation products on the server"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo Products</span>
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-400 text-sm mb-4">No products listed on server yet.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-950/50 text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  <th className="py-3 px-4">Unique ID</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Delivery Format</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">WhatsApp Test</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-300">
                {products.map((p) => {
                  const testUrl = buildWhatsAppUrl(p, settings);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Unique ID */}
                      <td className="py-3.5 px-4 font-mono-code">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-semibold">{p.id}</span>
                          <button
                            onClick={() => copyToClipboard(p.id, p.id)}
                            className="text-neutral-400 hover:text-white transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate max-w-xs">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-neutral-400 truncate block max-w-xs">
                              {p.tagline}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        {p.category}
                      </td>

                      {/* Delivery Format */}
                      <td className="py-3.5 px-4 font-mono-code text-[11px] text-neutral-400">
                        {p.deliveryFormat}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono-code font-semibold text-white">
                        {p.currency}{p.price}
                      </td>

                      {/* WhatsApp Test */}
                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={testUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Test Link</span>
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <h3 className="font-display text-base font-bold text-white">
                {editingProduct ? 'Edit Automation Tool' : 'Add New Automation Tool'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Product Unique ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Unique Product ID *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toUpperCase())}
                      placeholder="AUT-9041"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-emerald-400 font-mono-code font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormId(generateUniqueId(existingIds))}
                      className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                      title="Generate new unique ID"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-1">
                    Will be sent automatically in the WhatsApp message.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. WhatsApp Lead Bot & CRM Sync"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Tagline / 1-Line Hook
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="e.g. Autonomous lead qualification and CRM assignment in real time"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category & Delivery Format & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CRM & Messaging">CRM &amp; Messaging</option>
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="Finance & Invoicing">Finance &amp; Invoicing</option>
                    <option value="Content & Social">Content &amp; Social</option>
                    <option value="E-commerce Ops">E-commerce Ops</option>
                    <option value="Custom Workflow">Custom Workflow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Delivery Format
                  </label>
                  <input
                    type="text"
                    value={formDeliveryFormat}
                    onChange={(e) => setFormDeliveryFormat(e.target.value)}
                    placeholder="e.g. n8n Workflow + Docker"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Price ({formCurrency})
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-neutral-800 border border-r-0 border-neutral-700 rounded-l-lg text-neutral-400 font-mono-code">
                      {formCurrency}
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-r-lg px-3 py-2 text-white font-mono-code focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail what the automation performs, what manual tasks it replaces, and who it is built for..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Features List */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Key Capabilities / Features Included
                </label>
                <div className="space-y-1.5 mb-2">
                  {formFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-neutral-950 p-1.5 px-2.5 rounded-lg border border-neutral-800">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="flex-1 text-neutral-300">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-neutral-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add a key feature and press enter..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Product Image / Visual
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {DEFAULT_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`relative aspect-4/3 rounded-lg overflow-hidden border transition-all ${
                        formImageUrl === preset.url
                          ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                          : 'border-neutral-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[10px] text-white truncate text-center">
                        Preset {idx + 1}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Or enter custom Image URL / Data URL..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving to Server...' : editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">Delete Automation Tool?</h4>
              <p className="text-xs text-neutral-400">
                Are you sure you want to remove product{' '}
                <span className="font-mono-code text-rose-400 font-semibold">{deleteConfirmId}</span> from the server database? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS & PASSWORD CHANGE MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Settings &amp; Admin Security</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: WhatsApp Configuration */}
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                WhatsApp Business Routing
              </h4>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  WhatsApp Phone Number (with Country Code) *
                </label>
                <input
                  type="text"
                  required
                  value={tempWhatsapp}
                  onChange={(e) => setTempWhatsapp(e.target.value)}
                  placeholder="e.g. +1 555 349 2041 or 15553492041"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-emerald-400 font-mono-code focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-neutral-400 block mt-1">
                  Customers clicking "Buy on WhatsApp" will start an inquiry with this number.
                </span>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Business / Agency Name
                </label>
                <input
                  type="text"
                  value={tempBusinessName}
                  onChange={(e) => setTempBusinessName(e.target.value)}
                  placeholder="AutoFlow Systems"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  WhatsApp Order Message Format
                </label>
                <textarea
                  rows={3}
                  value={tempWelcomeMsg}
                  onChange={(e) => setTempWelcomeMsg(e.target.value)}
                  placeholder="Hello! I want to purchase '{productName}' (ID: {productId})..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 font-mono-code focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Tokens: {'{productName}'}, {'{productId}'}, {'{price}'}, {'{format}'}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save WhatsApp Settings</span>
                  )}
                </button>
              </div>
            </form>

            {/* Section 2: Change Password */}
            <div className="pt-6 border-t border-neutral-800 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Update Admin Password
                </h4>
              </div>

              {passError && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                  {passSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Current password"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono-code focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono-code focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white font-mono-code focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{passLoading ? 'Updating Hash...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
