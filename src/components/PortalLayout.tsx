import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui";
import { NotificationsMenu } from "@/components/kit";
import { ApiStatus } from "@/components/ApiStatus";
import {
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  X,
} from "lucide-react";

/* =====================================================================
   PortalLayout — shared app-shell for the Exhibitor & Attendee portals.
   Mirrors the Admin dashboard: fixed left sidebar + sticky top header,
   content scrolls on the right. Fully responsive (off-canvas on mobile).
   ===================================================================== */

export type PortalNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  group?: string;
};

export function PortalLayout({
  roleLabel,
  roleShort,
  nav,
  active,
  onNavigate,
  banner,
  headerRight,
  promo,
  searchPlaceholder = "Search…",
  children,
}: {
  roleLabel: string;
  roleShort: string;
  nav: PortalNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  banner?: React.ReactNode;
  headerRight?: React.ReactNode;
  promo?: React.ReactNode;
  searchPlaceholder?: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { user, logout } = useStore();
  const router = useNavigate();

  useEffect(() => setMobile(false), [active]);

  const groups = Array.from(new Set(nav.map((n) => n.group ?? "")));
  const current = nav.find((n) => n.id === active)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-slate-100/70">
      {/* ============================ SIDEBAR ============================ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-800 bg-ink-950 transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-64",
          mobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16.5 shrink-0 items-center gap-2.5 border-b border-white/8 px-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EventSphere home">
            <span className="relative grid size-9.5 place-items-center overflow-hidden rounded-[13px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_20px_-6px_rgba(104,84,217,.85)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.42),transparent_60%)]" />
              <svg viewBox="0 0 24 24" className="relative size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 20h18" />
                <path d="M6 20V9l6-5 6 5v11" />
                <path d="M10 20v-6h4v6" />
              </svg>
            </span>
            {!collapsed && (
              <span className="flex flex-col leading-none">
                <span className="font-display text-[16px] font-extrabold tracking-[-0.03em] text-white">
                  Event<span className="text-brand-300">Sphere</span>
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">{roleShort}</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobile(false)}
            className="ml-auto grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={`${roleLabel} navigation`}>
          {groups.map((g, gi) => {
            const items = nav.filter((n) => (n.group ?? "") === g);
            return (
              <div key={g || gi} className={cn(gi > 0 && "pt-4")}>
                {!collapsed && g && (
                  <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">{g}</p>
                )}
                {!collapsed && !g && gi === 0 && (
                  <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Menu</p>
                )}
                <div className="space-y-1">
                  {items.map((n) => {
                    const isActive = active === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => onNavigate(n.id)}
                        title={collapsed ? n.label : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-brand-600/90 to-brand-500/60 text-white shadow-lg shadow-brand-900/40"
                            : "text-white/55 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
                        <n.icon className={cn("size-4.5 shrink-0", collapsed && "mx-auto")} />
                        {!collapsed && <span className="truncate">{n.label}</span>}
                        {!collapsed && n.badge !== undefined && n.badge !== 0 && (
                          <span className="ml-auto shrink-0 rounded-md bg-white/12 px-1.5 py-0.5 text-[10.5px] font-bold text-white/80">
                            {n.badge}
                          </span>
                        )}
                        {collapsed && n.badge !== undefined && n.badge !== 0 && (
                          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            {!collapsed && <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Help</p>}
            {[
              { i: ExternalLink, l: "Public site", to: "/" },
              { i: LifeBuoy, l: "Support centre", to: "/support" },
              { i: MessageSquare, l: "Contact us", to: "/contact" },
            ].map((x) => (
              <Link
                key={x.l}
                to={x.to}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-white/45 transition hover:bg-white/8 hover:text-white"
              >
                <x.i className={cn("size-4.5 shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span>{x.l}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* contextual promo card (matches admin dashboard) */}
        {promo && !collapsed && <div className="mx-3 mb-3 shrink-0">{promo}</div>}

        {/* sidebar footer */}
        <div className="shrink-0 border-t border-white/8 p-3">
          <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-white/8", collapsed && "justify-center")}>
            <Avatar src={user?.avatar} name={user?.name} size={34} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-white">{user?.name ?? "Guest user"}</p>
                <p className="truncate text-[10.5px] text-white/45">{roleLabel}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  router("/");
                }}
                aria-label="Sign out"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-[11.5px] font-semibold text-white/35 transition hover:bg-white/8 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {mobile && <div className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobile(false)} />}

      {/* ============================= MAIN ============================= */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* header */}
        <header className="sticky top-0 z-30 flex h-16.5 items-center gap-3 border-b border-slate-200 bg-white/92 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobile(true)}
            className="grid size-9.5 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{roleLabel}</p>
            <h1 className="truncate font-display text-[16px] font-bold tracking-tight text-slate-900">{current}</h1>
          </div>

          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={searchPlaceholder}
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-[13px] outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden lg:block"><ApiStatus compact /></div>
            <NotificationsMenu />
            {headerRight}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2">
              <Avatar src={user?.avatar} name={user?.name} size={30} />
              <div className="hidden leading-tight lg:block">
                <p className="text-[12px] font-bold text-slate-900">{user?.name?.split(" ")[0] ?? "Guest"}</p>
                <p className="text-[10px] text-slate-400">{roleShort}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router("/login");
                }}
                title="Sign out or switch role"
                className="ml-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* banner (hero band) */}
        {banner}

        {/* page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/* Convenience hook-free toast helper for portals */
export const portalToast = (title: string, tone: "success" | "info" | "warn" | "danger" = "info") => ({ title, tone });
