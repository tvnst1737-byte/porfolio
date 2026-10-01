import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, ShieldCheck, Terminal, Cpu, ArrowUpRight } from 'lucide-react';
import { Product, AdminSettings } from '../types';
import { buildWhatsAppUrl, generateWhatsAppMessage } from '../utils/whatsapp';

interface ProductDetailModalProps {
  product: Product | null;
  settings: AdminSettings;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!product) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const whatsAppUrl = buildWhatsAppUrl(product, settings);
  const previewMessage = generateWhatsAppMessage(product, settings);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono-code font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {product.id}
            </span>
            <span className="text-xs text-neutral-400">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Hero Media Preview */}
          <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400">
                <Cpu className="w-12 h-12 text-emerald-500/40 mb-2" />
                <span className="text-xs font-mono-code">{product.id}</span>
              </div>
            )}
            <div className="absolute top-3 right-3 bg-neutral-950/85 backdrop-blur-sm px-3 py-1 rounded-md border border-neutral-700/80 font-mono-code text-sm font-bold text-white">
              {product.currency}{product.price}
            </div>
          </div>

          {/* Title & Tagline */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display mb-1.5">
              {product.name}
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {product.tagline}
            </p>
          </div>

          {/* Description */}
          <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/80">
            {product.description}
          </div>

          {/* Features Checklist */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
                Included Capabilities &amp; Workflows
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/60">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Delivery Specifications */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Delivery Format &amp; Deployment</span>
            </div>
            <p className="text-xs text-neutral-400">
              {product.deliveryFormat}
            </p>
            {product.specs && (
              <p className="text-xs text-neutral-400 border-t border-neutral-850 pt-1.5 mt-1.5">
                {product.specs}
              </p>
            )}
          </div>

          {/* WhatsApp Direct Routing Preview */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Order Message (Sent to Seller)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedMsg ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono-code text-neutral-300 bg-neutral-950/90 p-3 rounded-lg border border-neutral-800 whitespace-pre-wrap leading-relaxed">
              {previewMessage}
            </pre>
            <p className="text-[11px] text-neutral-400">
              Contains the exact unique product ID <span className="text-emerald-400 font-mono-code">{product.id}</span> so the admin instantly knows your requested automation tool.
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-neutral-400">Product ID:</span>
            <span className="font-mono-code text-xs text-emerald-400 font-semibold">{product.id}</span>
            <button
              onClick={handleCopyId}
              className="text-xs text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800 transition-colors"
            >
              {copiedId ? 'Copied!' : 'Copy ID'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Connect on WhatsApp Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
