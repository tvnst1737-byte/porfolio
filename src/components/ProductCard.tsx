import React, { useState } from 'react';
import { MessageSquare, ArrowUpRight, Copy, Check, Terminal, Cpu } from 'lucide-react';
import { Product, AdminSettings } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
  settings: AdminSettings;
  onSelect: (product: Product) => void;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onSelect,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildWhatsAppUrl(product, settings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <article
      onClick={() => onSelect(product)}
      className="group relative flex flex-col bg-neutral-900/90 rounded-xl border border-neutral-800 hover:border-neutral-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 cursor-pointer overflow-hidden"
    >
      {/* Visual Asset Container (4:3 aspect ratio) */}
      <div className="relative w-full aspect-4/3 bg-neutral-950 overflow-hidden border-b border-neutral-800/80">
        {!imageError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-900 to-neutral-950">
            <Cpu className="w-10 h-10 text-emerald-500/50 mb-2" />
            <span className="text-xs font-mono-code text-neutral-400">{product.id}</span>
            <span className="text-xs text-neutral-400 mt-1">{product.name}</span>
          </div>
        )}

        {/* Subtle Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Floating Unique Product ID Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 rounded-md px-2.5 py-1">
          <span className="font-mono-code text-[11px] font-semibold text-emerald-400 tracking-wider">
            {product.id}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy Unique Product ID"
            aria-label={`Copy product ID ${product.id}`}
            className="text-neutral-400 hover:text-white transition-colors ml-0.5"
          >
            {copiedId ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Delivery format kicker at bottom corner of image */}
        <div className="absolute bottom-2.5 right-3 z-10">
          <span className="text-[11px] font-mono-code text-neutral-300 bg-neutral-950/70 backdrop-blur-sm px-2 py-0.5 rounded border border-neutral-800">
            {product.deliveryFormat}
          </span>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata (NO PILLS) */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2 font-medium">
            <span className="text-emerald-400/90">{product.category}</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span className="font-mono-code text-neutral-400">Unique Item</span>
          </div>

          {/* Product Title */}
          <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 mb-1.5">
            {product.name}
          </h3>

          {/* Tagline / Brief Description */}
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
            {product.tagline || product.description}
          </p>

          {/* Key Features List */}
          {product.features && product.features.length > 0 && (
            <ul className="space-y-1.5 mb-4 text-xs text-neutral-400">
              {product.features.slice(0, 2).map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 line-clamp-1">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom Module: Price & Direct WhatsApp CTA */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              One-Time License
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono-code text-lg font-bold text-white tabular-nums">
                {product.currency}{product.price}
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Action Button */}
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition-colors shadow-sm shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Buy on WhatsApp</span>
          </button>
        </div>

        {/* Admin Quick Action Bar if rendered in Admin view */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-dashed border-neutral-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400">Admin Options</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(product);
                }}
                className="text-xs text-neutral-300 hover:text-white px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(product.id);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
