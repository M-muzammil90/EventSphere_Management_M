import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui";
import { ApiStatus } from "@/components/ApiStatus";
import { Logo } from "@/components/SiteLayout";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  MessageSquareHeart,
  MessageSquare,
  Menu,
  Search,
  Settings,
  Users,
  Sparkles,
  Banknote,
  Tag,
  X,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/expos", label: "Expo Management", icon: CalendarClock, badge: "8" },
  { to: "/admin/exhibitors", label: "Exhibitors", icon: Building2, badge: "3" },
  { to: "/admin/attendees", label: "Attendees", icon: Users },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart, badge: "9" },
  { to: "/admin/schedule", label: "Schedule", icon: Sparkles },
  { to: "/admin/floor-plan", label: "Floor Plan & Booths", icon: Map },
  { to: "/admin/pricing", label: "Pricing & Tickets", icon: Tag },
  { to: "/admin/payments", label: "Payments & Invoices", icon: Banknote },
  { to: "/admin/analytics", label: "Analytics & Reports", icon: BarChart3 },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare, badge: "5" },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { user, logout, toast } = useStore();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => setMobile(false), [loc.pathname]);

  const current = NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))?.label ?? "Overview";
  const roleLabel = user?.role === "organizer" || user?.role === "admin" ? "Organizer" : user?.role || "Organizer";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-64",
          mobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-16.5 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
          <Logo compact={collapsed} />
          <button onClick={() => setMobile(false)} className={cn("ml-auto rounded-lg p-1 text-slate-400 hover:text-slate-700 lg:hidden", focusRing)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {!collapsed && <p className="px-3 pb-2 text-xs font-semibold text-slate-400">Manage</p>}
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  focusRing,
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                  <n.icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      collapsed && "mx-auto",
                      isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                  {!collapsed && n.badge && (
                    <span
                      className={cn(
                        "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                        isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {n.badge}
                    </span>
                  )}
                  {collapsed && n.badge && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" />}
                </>
              )}
            </NavLink>
          ))}

          {!collapsed && <p className="px-3 pb-2 pt-6 text-xs font-semibold text-slate-400">Account</p>}
          {collapsed && <div className="mx-3 my-3 border-t border-slate-100" />}
          {[
            { i: ExternalLink, l: "Public site", onClick: () => nav("/") },
            { i: LifeBuoy, l: "Help & support", onClick: () => nav("/support") },
            { i: CircleHelp, l: "Guide", onClick: () => toast({ title: "Onboarding guide", body: "Opens the interactive walkthrough.", tone: "info" }) },
          ].map((x) => (
            <button
              key={x.l}
              onClick={x.onClick}
              title={collapsed ? x.l : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900",
                focusRing
              )}
            >
              <x.i className={cn("size-[18px] shrink-0 text-slate-400", collapsed && "mx-auto")} />
              {!collapsed && <span>{x.l}</span>}
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5", collapsed && "justify-center")}>
            <Avatar src={user?.avatar} name={user?.name} size={36} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.company || "Organizer"}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  nav("/");
                }}
                aria-label="Sign out"
                className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700", focusRing)}
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:flex",
              focusRing
            )}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {mobile && <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden" onClick={() => setMobile(false)} />}

      {/* main */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16.5 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobile(true)}
            className={cn("grid size-9.5 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden", focusRing)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-medium text-slate-500">Organizer dashboard</p>
            <h1 className="truncate font-display text-lg font-bold tracking-tight text-slate-900">{current}</h1>
          </div>

          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search expos, exhibitors, booths…"
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden sm:block"><ApiStatus compact /></div>
            <button
              onClick={() => toast({ title: "4 unread notifications", body: "Open the bell in the top-right of the public site.", tone: "info" })}
              className={cn("relative grid size-9.5 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100", focusRing)}
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2 shadow-[0_1px_2px_rgba(23,28,53,.04)]">
              <Avatar src={user?.avatar} name={user?.name} size={30} />
              <div className="hidden leading-tight lg:block">
                <p className="text-[13px] font-semibold text-slate-900">{user?.name?.split(" ")[0]}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  nav("/login?role=organizer");
                }}
                title="Switch account or sign out"
                aria-label="Switch account or sign out"
                className={cn("ml-0.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700", focusRing)}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}