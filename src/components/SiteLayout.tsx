import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";
import { NotificationsMenu } from "@/components/kit";
import { ABOUT } from "@/lib/mock";
import {
  CalendarDays,
  CheckCircle2,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

export function Logo({ light, compact }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="EventSphere home">
      <span className="relative grid size-9.5 place-items-center overflow-hidden rounded-[13px] bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 shadow-[0_6px_20px_-6px_rgba(104,84,217,.85)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.42),transparent_60%)]" />
        <svg viewBox="0 0 24 24" className="relative size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 20h18" />
          <path d="M6 20V9l6-5 6 5v11" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[17px] font-extrabold tracking-[-0.03em]", light ? "text-white" : "text-slate-900")}>
            Event<span className={light ? "text-brand-300" : "text-brand-500"}>Sphere</span>
          </span>
          <span className={cn("mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.22em]", light ? "text-white/45" : "text-slate-400")}>
            Expo Platform
          </span>
        </span>
      )}
    </Link>
  );
}

const NAV: { to: string; label: string }[] = [
  { to: "/expos", label: "Explore Expos" },
  { to: "/exhibitors", label: "Exhibitors" },
  { to: "/schedule", label: "Schedule" },
  { to: "/floor-plan", label: "Floor Plan" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const overDark = loc.pathname === "/" || loc.pathname.startsWith("/expos/");
  const onDark = overDark && !scrolled;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => setOpen(false), [loc.pathname]);

  const home = user ? (user.role === "organizer" ? "/admin" : user.role === "exhibitor" ? "/portal" : "/attendee") : "/login";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          onDark ? "bg-transparent" : "border-b border-slate-200/70 bg-white/85 backdrop-blur-xl"
        )}
      >
        <div className="mx-auto flex h-16.5 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Logo light={onDark} />

          <nav className="ml-6 hidden items-center gap-0.5 xl:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                    onDark
                      ? isActive
                        ? "text-white"
                        : "text-white/65 hover:text-white"
                      : isActive
                        ? "text-brand-700"
                        : "text-slate-600 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <span className={cn("absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full", onDark ? "bg-white" : "bg-brand-500")} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <NotificationsMenu onDark={onDark} />
                <Button
                  size="sm"
                  variant={onDark ? "outline" : "dark"}
                  icon={<LayoutDashboard className="size-4" />}
                  onClick={() => nav(home)}
                >
                  Dashboard
                </Button>
                <button
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                  aria-label="Sign out"
                  className={cn(
                    "hidden size-9.5 place-items-center rounded-xl transition sm:grid",
                    onDark ? "text-white/80 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <LogOut className="size-4.5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/pricing" className="hidden lg:block">
                  <Button variant={onDark ? "ghost" : "ghost"} size="sm" className={onDark ? "text-white/80 hover:bg-white/10 hover:text-white" : ""}>
                    Pricing
                  </Button>
                </Link>
                <Link to="/login" className="hidden sm:block">
                  <Button variant={onDark ? "outline" : "ghost"} size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" icon={<Sparkles className="size-4" />} className="hidden sm:inline-flex">
                    Get started
                  </Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className={cn(
                "grid size-9.5 place-items-center rounded-xl transition xl:hidden",
                onDark ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 xl:hidden">
            <div className="grid gap-1">
              {NAV.concat([{ to: "/pricing", label: "Pricing" }, { to: "/support", label: "Support" }]).map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn("rounded-xl px-4 py-3 text-[14px] font-semibold", isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {!user ? (
                <>
                  <Link to="/login">
                    <Button variant="secondary" full>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button full>Get started free</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button full variant="dark" onClick={() => nav(home)}>
                    Go to dashboard
                  </Button>
                  <Button full variant="ghost" onClick={() => { logout(); nav("/"); }}>
                    Sign out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <div className={cn("h-16.5", overDark && "bg-ink-950")} />
    </>
  );
}

/* --------------------------- Social icons --------------------------- */
const SOCIAL_PATHS: Record<string, string> = {
  "X (Twitter)": "M18.9 2H22l-6.8 7.8L22.6 22h-6.3l-4.4-6.1L6.6 22H3.4l7.2-8.2L2.9 2h6.4l4.1 5.7L18.9 2Zm-1.1 18h1.7L7.4 3.8H5.6L17.8 20Z",
  LinkedIn: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21H9V9Z",
  Instagram: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.96.24 2.65.51.72.28 1.33.65 1.94 1.26.61.61.98 1.22 1.26 1.94.27.69.46 1.48.51 2.65.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.96-.51 2.65-.28.72-.65 1.33-1.26 1.94-.61.61-1.22.98-1.94 1.26-.69.27-1.48.46-2.65.51-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.96-.24-2.65-.51a5.36 5.36 0 0 1-1.94-1.26 5.36 5.36 0 0 1-1.26-1.94c-.27-.69-.46-1.48-.51-2.65C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.24-1.96.51-2.65.28-.72.65-1.33 1.26-1.94A5.36 5.36 0 0 1 5.98 1.3c.69-.27 1.48-.46 2.65-.51C9.9 2.21 10.28 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.73.07-.94.04-1.45.2-1.79.33-.45.17-.77.38-1.11.72-.34.34-.55.66-.72 1.11-.13.34-.29.85-.33 1.79C3.26 9.25 3.25 9.6 3.25 12s.01 2.75.07 3.98c.04.94.2 1.45.33 1.79.17.45.38.77.72 1.11.34.34.66.55 1.11.72.34.13.85.29 1.79.33 1.23.06 1.58.07 4.73.07s3.5-.01 4.73-.07c.94-.04 1.45-.2 1.79-.33.45-.17.77-.38 1.11-.72.34-.34.55-.66.72-1.11.13-.34.29-.85.33-1.79.06-1.23.07-1.58.07-3.98s-.01-2.75-.07-3.98c-.04-.94-.2-1.45-.33-1.79a2.98 2.98 0 0 0-.72-1.11 2.98 2.98 0 0 0-1.11-.72c-.34-.13-.85-.29-1.79-.33C15.5 4.01 15.15 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2.4a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z",
  YouTube: "M22.5 7.2a2.75 2.75 0 0 0-1.93-1.95C18.85 4.8 12 4.8 12 4.8s-6.85 0-8.57.45A2.75 2.75 0 0 0 1.5 7.2C1.05 8.94 1.05 12 1.05 12s0 3.06.45 4.8a2.75 2.75 0 0 0 1.93 1.95C5.15 19.2 12 19.2 12 19.2s6.85 0 8.57-.45a2.75 2.75 0 0 0 1.93-1.95c.45-1.74.45-4.8.45-4.8s0-3.06-.45-4.8ZM9.75 15.05v-6.1L15.8 12l-6.05 3.05Z",
  Facebook: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.53-1.5h1.64V3.6c-.28-.04-1.26-.12-2.4-.12-2.38 0-4 1.45-4 4.11V9.9H7.4V13h2.37v8h3.73Z",
};

export function SocialLinks({ light }: { light?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ABOUT.socials.map((s) => (
        <a
          key={s.name}
          href={s.href}
          aria-label={s.name}
          title={s.name}
          className={cn(
            "grid size-9 place-items-center rounded-xl transition",
            light ? "border border-white/10 bg-white/5 text-white/60 hover:bg-white/12 hover:text-white" : "border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
          )}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
            <path d={SOCIAL_PATHS[s.name]} />
          </svg>
        </a>
      ))}
    </div>
  );
}

/* -------------------------------- Footer ------------------------------- */
export function Footer() {
  const groups = [
    { title: "Product", links: [["Features", "/#features"], ["Pricing", "/pricing"], ["Floor plans", "/floor-plan"], ["Analytics", "/admin/analytics"]] },
    { title: "Resources", links: [["Help center", "/support"], ["Expo guide", "/about"], ["Contact support", "/contact"], ["System status", "/support"]] },
    { title: "Company", links: [["About us", "/about"], ["Our team", "/about"], ["Contact", "/contact"], ["Book a demo", "/contact"]] },
    { title: "Legal", links: [["Privacy policy", "/support"], ["Terms of service", "/support"], ["Accessibility", "/support"], ["Cookie settings", "/support"]] },
  ];

  return (
    <footer className="bg-ink-950 text-slate-400">
      <div className="content-wrap py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Logo light />
            <p className="mt-4 max-w-[220px] text-[12px] leading-relaxed text-slate-500">Expos that move industries forward.</p>
            <div className="mt-5"><SocialLinks light /></div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[.12em] text-white">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-[11.5px] transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10.5px] sm:flex-row">
          <p>© 2026 EventSphere Management. All rights reserved.</p>
          <p className="text-slate-500">Built for organizers, exhibitors and attendees.</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ Toast host ----------------------------- */
export function ToastHost() {
  const { toasts, dismiss } = useStore();
  const icons = {
    success: <CheckCircle2 className="size-4.5 text-emerald-500" />,
    info: <Info className="size-4.5 text-brand-500" />,
    warn: <TriangleAlert className="size-4.5 text-amber-500" />,
    danger: <TriangleAlert className="size-4.5 text-rose-500" />,
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,352px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-[0_20px_50px_-16px_rgba(23,28,53,.35)] backdrop-blur-xl animate-[popIn_.3s_cubic-bezier(.22,1,.36,1)]"
        >
          <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-slate-900">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 text-slate-300 hover:text-slate-600">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Scroll-to-top ----------------------------- */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-white", className)}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export const SearchPill = ({ onClick, placeholder = "Search expos, exhibitors, sessions…" }: { onClick?: () => void; placeholder?: string }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
  >
    <Search className="size-4.5 shrink-0 text-slate-400" />
    <span className="flex-1 truncate text-[14px] text-slate-400">{placeholder}</span>
    <span className="hidden shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 sm:block">⌘K</span>
  </button>
);

export const DateChip = ({ date }: { date: string }) => {
  const d = new Date(date);
  return (
    <div className="flex size-13 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white leading-none">
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-brand-600">{d.toLocaleDateString("en-US", { month: "short" })}</span>
      <span className="mt-0.5 font-display text-[19px] font-bold text-slate-900">{d.getDate()}</span>
    </div>
  );
};

export { CalendarDays };
