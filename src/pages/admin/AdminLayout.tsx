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
  { to: "/admin/analytics", label: "Analytics & Reports", icon: BarChart3 },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare, badge: "5" },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const { user, logout, toast } = useStore();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => setMobile(false), [loc.pathname]);

  const current = NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-slate-100/70">
      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-800 bg-ink-950 transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-64",
          mobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16.5 shrink-0 items-center gap-2.5 border-b border-white/8 px-4">
          <Logo light compact={collapsed} />
          <button onClick={() => setMobile(false)} className="ml-auto text-white/50 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Manage</p>
          )}
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-200",
                  isActive ? "bg-brand-500 text-white shadow-[0_1px_2px_rgba(11,14,29,.25)]" : "text-white/55 hover:bg-white/[0.07] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
                  <n.icon className={cn("size-4.5 shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                  {!collapsed && n.badge && (
                    <span className="ml-auto shrink-0 rounded-md bg-white/12 px-1.5 py-0.5 text-[10.5px] font-bold text-white/80">{n.badge}</span>
                  )}
                  {collapsed && n.badge && (
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {!collapsed && <p className="px-2.5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Account</p>}
          {[
            { i: ExternalLink, l: "Public site", onClick: () => nav("/") },
            { i: LifeBuoy, l: "Help & support", onClick: () => nav("/support") },
            { i: CircleHelp, l: "Guide", onClick: () => toast({ title: "Onboarding guide", body: "Opens the interactive walkthrough.", tone: "info" }) },
          ].map((x) => (
            <button
              key={x.l}
              onClick={x.onClick}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-white/45 transition hover:bg-white/8 hover:text-white"
            >
              <x.i className={cn("size-4.5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{x.l}</span>}
            </button>
          ))}
        </nav>

      

        <div className="shrink-0 border-t border-white/8 p-3">
          <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-white/8", collapsed && "justify-center")}>
            <Avatar src={user?.avatar} name={user?.name} size={34} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-white">{user?.name}</p>
                <p className="truncate text-[10.5px] text-white/45">{user?.company || "Organizer"}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => { logout(); nav("/"); }}
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

      {/* main */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16.5 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMobile(true)} className="grid size-9.5 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Admin / Organizer
              </span>
            </div>
            <h1 className="truncate font-display text-[16px] font-bold tracking-tight text-slate-900">{current}</h1>
          </div>
          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search expos, exhibitors, booths…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-[13px] outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden sm:block"><ApiStatus compact /></div>
            <button
              onClick={() => toast({ title: "4 unread notifications", body: "Open the bell in the top-right of the public site.", tone: "info" })}
              className="relative grid size-9.5 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2">
              <Avatar src={user?.avatar} name={user?.name} size={30} />
              <div className="hidden leading-tight lg:block">
                <p className="text-[12px] font-bold text-slate-900">{user?.name?.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-400">{(user?.role === "organizer" || user?.role === "admin") ? "Admin / Organizer" : user?.role || "Organizer"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  nav("/login?role=organizer");
                }}
                title="Switch account or sign out"
                className="ml-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="size-3.5" />
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
