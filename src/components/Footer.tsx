import React from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { AdminSettings } from '../types';

interface FooterProps {
  settings: AdminSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="w-full border-t border-neutral-800/80 bg-neutral-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-900">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-white text-base tracking-tight">
                AutoFlow Systems
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
              Curated portfolio of modular automations, scrapers, and bot workflows. Every tool is identified with a unique ID for instant WhatsApp purchase and custom onboarding.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact via WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} AutoFlow Systems</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>All automation source code &amp; workflows verified</span>
          </div>
          <div className="flex items-center gap-4 font-mono-code text-[11px] text-neutral-400">
            <span>Direct Delivery</span>
            <span aria-hidden="true">·</span>
            <span>Unique ID Routing</span>
            <span aria-hidden="true">·</span>
            <span>Zero Lock-in</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
