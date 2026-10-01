import React from 'react';
import { Bot, MessageSquare, LogOut, ShieldAlert } from 'lucide-react';
import { AdminSettings } from '../types';

interface NavbarProps {
  isAdminRoute: boolean;
  isAuthenticated: boolean;
  onLogout: () => void;
  onExitAdmin: () => void;
  productCount: number;
  settings: AdminSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminRoute,
  isAuthenticated,
  onLogout,
  onExitAdmin,
  productCount,
  settings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              if (isAdminRoute) {
                e.preventDefault();
                onExitAdmin();
              }
            }}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-all">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white block leading-none">
                AutoFlow
              </span>
              <span className="text-[11px] text-neutral-400 tracking-wider uppercase font-medium">
                {isAdminRoute ? 'Admin Control' : 'Automation Showcase'}
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          {!isAdminRoute ? (
            <>
              <a href="#catalog" className="text-white hover:text-emerald-400 transition-colors">
                Available Tools
              </a>
              <span className="text-neutral-700" aria-hidden="true">·</span>
              <span className="text-xs text-neutral-400">
                {productCount} Verified Systems
              </span>
              <span className="text-neutral-700" aria-hidden="true">·</span>
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Inquiries</span>
              </a>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono-code text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Administrative Session Protected</span>
            </div>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          {isAdminRoute ? (
            /* Admin Route Actions (Only visible when user navigates to /admin or /admin-portal) */
            <div className="flex items-center gap-2">
              <button
                onClick={onExitAdmin}
                className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Storefront
              </button>
              {isAuthenticated && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          ) : (
            /* Public Client View: Clean WhatsApp Action (NO Admin buttons visible here!) */
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Direct</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
