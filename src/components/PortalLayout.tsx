import React, { useEffect, useRef, useState } from "react";
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
   PortalLayout: shared app shell for the Exhibitor and Attendee portals.
   White theme: light sidebar + sticky white header, content on the right.
   Responsive (off-canvas sidebar on mobile).
   ===================================================================== */

export type PortalNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  group?: string;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

const HELP_LINKS = [
  { icon: ExternalLink, label: "Public site", to: "/" },
  { icon: LifeBuoy, label: "Support centre", to: "/support" },
  { icon: MessageSquare, label: "Contact us", to: "/contact" },
];

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
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useStore();
  const router = useNavigate();

  // The mobile drawer is always shown expanded, whatever the desktop collapse state is.
  const compact = collapsed && !mobile;

  useEffect(() => setMobile(false), [active]);

  // Escape closes the drawer, Ctrl/Cmd+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Stop the page behind the drawer from scrolling.
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  const groups = Array.from(new Set(nav.map((n) => n.group ?? "")));
  const current = nav.find((n) => n.id === active)?.label ?? "Overview";

  const signOut = (to: string) => {
    logout();
    router(to);
  };

  const sectionLabel = "px-3 pb-2 text-xs font-semibold text-slate-400";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============================ SIDEBAR ============================ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          mobile ? "translate-x-0 shadow-2xl shadow-slate-900/10" : "-translate-x-full"
        )}
      >
        <div className="flex h-16.5 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4">
          <Link
            to="/"
            className={cn("flex items-center gap-2.5 rounded-xl", focusRing)}
            aria-label="EventSphere home"
          >
            <span className="relative grid size-9.5 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_18px_-6px_rgba(104,84,217,.55)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.42),transparent_60%)]" />
              <svg
                viewBox="0 0 24 24"
                className="relative size-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 20h18" />
                <path d="M6 20V9l6-5 6 5v11" />
                <path d="M10 20v-6h4v6" />
              </svg>
            </span>
            {!compact && (
              <span className="flex flex-col leading-none">
                <span className="font-display text-[17px] font-extrabold tracking-[-0.03em] text-slate-900">
                  Event<span className="text-brand-600">Sphere</span>
                </span>
                <span className="mt-1 text-xs font-medium text-slate-500">{roleShort}</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobile(false)}
            className={cn(
              "ml-auto grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden",
              focusRing
            )}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={`${roleLabel} navigation`}>
          {groups.map((g, gi) => {
            const items = nav.filter((n) => (n.group ?? "") === g);
            const label = g || (gi === 0 ? "Menu" : "");
            return (
              <div key={g || gi} className={cn(gi > 0 && "pt-4")}>
                {!compact && label && <p className={sectionLabel}>{label}</p>}
                <div className="space-y-0.5">
                  {items.map((n) => {
                    const isActive = active === n.id;
                    const hasBadge = n.badge !== undefined && n.badge !== 0;
                    return (
                      <button
                        key={n.id}
                        onClick={() => onNavigate(n.id)}
                        title={compact ? n.label : undefined}
                        aria-label={compact ? n.label : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                          focusRing,
                          isActive
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        {isActive && (
                          <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
                        )}
                        <n.icon
                          className={cn(
                            "size-[18px] shrink-0 transition-colors",
                            compact && "mx-auto",
                            isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                          )}
                          aria-hidden="true"
                        />
                        {!compact && <span className="truncate">{n.label}</span>}
                        {!compact && hasBadge && (
                          <span
                            className={cn(
                              "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold",
                              isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {n.badge}
                          </span>
                        )}
                        {compact && hasBadge && (
                          <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            {!compact && <p className={sectionLabel}>Help</p>}
            <div className="space-y-0.5">
              {HELP_LINKS.map((x) => (
                <Link
                  key={x.label}
                  to={x.to}
                  title={compact ? x.label : undefined}
                  aria-label={compact ? x.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
                    focusRing
                  )}
                >
                  <x.icon
                    className={cn(
                      "size-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-600",
                      compact && "mx-auto"
                    )}
                    aria-hidden="true"
                  />
                  {!compact && <span>{x.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* contextual promo card */}
        {promo && !compact && <div className="mx-3 mb-3 shrink-0">{promo}</div>}

        {/* sidebar footer */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5", compact && "justify-center")}>
            <Avatar src={user?.avatar} name={user?.name} size={36} />
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900">{user?.name ?? "Guest user"}</p>
                <p className="truncate text-xs text-slate-500">{roleLabel}</p>
              </div>
            )}
            {!compact && (
              <button
                onClick={() => signOut("/")}
                aria-label="Sign out"
                title="Sign out"
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700",
                  focusRing
                )}
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex",
              focusRing
            )}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {mobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================= MAIN ============================= */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* header */}
        <header className="sticky top-0 z-30 flex h-16.5 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobile(true)}
            className={cn(
              "grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden",
              focusRing
            )}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
            <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-slate-900">{current}</h1>
          </div>

          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              placeholder={searchPlaceholder}
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-400">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden lg:block">
              <ApiStatus compact />
            </div>
            <NotificationsMenu />
            {headerRight}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-1.5">
              <Avatar src={user?.avatar} name={user?.name} size={32} />
              <div className="hidden leading-tight lg:block">
                <p className="text-[13px] font-bold text-slate-900">{user?.name?.split(" ")[0] ?? "Guest"}</p>
                <p className="text-xs text-slate-500">{roleShort}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut("/login")}
                title="Sign out or switch role"
                aria-label="Sign out or switch role"
                className={cn(
                  "ml-1 grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700",
                  focusRing
                )}
              >
                <LogOut className="size-4" />
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
export const portalToast = (title: string, tone: "success" | "info" | "warn" | "danger" = "info") => ({
  title,
  tone,
});