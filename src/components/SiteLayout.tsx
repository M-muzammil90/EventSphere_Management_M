import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useStore, ROLE_LABEL } from "@/lib/store";
import { Button } from "@/components/ui";
import { NotificationsMenu } from "@/components/kit";
import { ABOUT } from "@/lib/mock";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */
export function Logo({ light, compact }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5 rounded-lg", focusRing)} aria-label="EventSphere home">
      <span className="relative grid size-9.5 place-items-center overflow-hidden rounded-[13px] bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 shadow-[0_6px_20px_-6px_rgba(104,84,217,.85)] transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.42),transparent_60%)]" />
        <svg viewBox="0 0 24 24" className="relative size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 20h18" />
          <path d="M6 20V9l6-5 6 5v11" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[18px] font-extrabold tracking-[-0.03em]", light ? "text-white" : "text-slate-900")}>
            Event<span className={light ? "text-brand-300" : "text-brand-500"}>Sphere</span>
          </span>
          <span className={cn("mt-1 text-[11px] font-medium tracking-wide", light ? "text-white/55" : "text-slate-500")}>
            Expo platform
          </span>
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
const NAV: { to: string; label: string }[] = [
  { to: "/expos", label: "Explore Expos" },
  { to: "/exhibitors", label: "Exhibitors" },
  { to: "/schedule", label: "Schedule" },
  { to: "/speakers", label: "Speakers" },
  { to: "/floor-plan", label: "Floor Plan" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const MOBILE_NAV = NAV.concat([
  { to: "/pricing", label: "Pricing" },
  { to: "/support", label: "Support" },
]);

function UserMenu({ onDark, home }: { onDark: boolean; home: string }) {
  const { user, logout } = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full p-1 pr-2.5 transition",
          onDark ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100",
          focusRing
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-[13px] font-bold text-white">{initial}</span>
        <span className="hidden max-w-[110px] truncate text-[13.5px] font-semibold sm:block">{user.name?.split(" ")[0]}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-10 mt-2 w-64 animate-[popIn_.2s_cubic-bezier(.22,1,.36,1)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(23,28,53,.35)]">
          <div className="px-3 py-2.5">
            <p className="truncate text-[14px] font-bold text-slate-900">{user.name}</p>
            <p className="text-[12.5px] text-slate-500">{ROLE_LABEL[user.role]}</p>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); nav(home); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard className="size-4 text-slate-400" /> Dashboard
          </button>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); logout(); nav("/"); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="size-4 text-slate-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useStore();
  const loc = useLocation();
  const nav = useNavigate();

  /* only pages that still open with a full dark hero get the transparent bar */
  const overDark = loc.pathname.startsWith("/expos/");
  const onDark = overDark && !scrolled && !open;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => setOpen(false), [loc.pathname]);

  /* mobile menu: lock page scroll, close on Escape */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const home = user ? (user.role === "organizer" ? "/admin" : user.role === "exhibitor" ? "/portal" : "/attendee") : "/login";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border-color] duration-300",
          onDark
            ? "border-b border-transparent bg-transparent"
            : cn("border-b bg-white/90 backdrop-blur-xl", scrolled ? "border-slate-200 shadow-[0_8px_30px_-18px_rgba(23,28,53,.25)]" : "border-slate-200/60")
        )}
      >
        <div className="mx-auto flex h-16.5 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Logo light={onDark} />

          <nav className="ml-6 hidden items-center gap-1 xl:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors",
                    focusRing,
                    onDark
                      ? isActive ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                      : isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {user ? (
              <>
                <NotificationsMenu onDark={onDark} />
                <UserMenu onDark={onDark} home={home} />
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className={cn(
                    "hidden rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors lg:block",
                    focusRing,
                    onDark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  Pricing
                </Link>
                <Link
                  to="/login"
                  className={cn(
                    "hidden rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors sm:block",
                    focusRing,
                    onDark ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
                  )}
                >
                  Sign in
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "grid size-10 place-items-center rounded-xl transition xl:hidden",
                onDark ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100",
                focusRing
              )}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- mobile menu ---------------- */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16.5 z-40 overflow-y-auto bg-white xl:hidden animate-[popIn_.2s_ease-out]">
          <nav className="mx-auto max-w-xl px-4 pb-10 pt-4" aria-label="Mobile">
            <ul className="divide-y divide-slate-100">
              {MOBILE_NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between py-4 text-[18px] font-semibold",
                        isActive ? "text-brand-600" : "text-slate-800"
                      )
                    }
                  >
                    {n.label}
                    <ArrowRight className="size-4 text-slate-300" aria-hidden />
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-2.5">
              {!user ? (
                <>
                  <Link to="/register"><Button full size="lg">Get started free</Button></Link>
                  <Link to="/login"><Button full size="lg" variant="secondary">Sign in</Button></Link>
                </>
              ) : (
                <>
                  <Button full size="lg" variant="dark" onClick={() => nav(home)}>Go to dashboard</Button>
                  <Button full size="lg" variant="ghost" onClick={() => { logout(); nav("/"); }}>Sign out</Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <div className={cn("h-16.5", overDark && "bg-ink-950")} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Social icons                                                       */
/* ------------------------------------------------------------------ */
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
            "grid size-10 place-items-center rounded-full transition",
            focusRing,
            light
              ? "border border-white/15 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white"
              : "border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
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

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
const FOOTER_GROUPS: { title: string; links: [string, string][] }[] = [
  { title: "Product", links: [["Explore Expos", "/expos"], ["Exhibitors", "/exhibitors"], ["Schedule", "/schedule"], ["Speakers", "/speakers"], ["Floor plans", "/floor-plan"], ["Pricing", "/pricing"]] },
  { title: "Support", links: [["Help center & FAQs", "/faq"], ["Contact support", "/contact"], ["System status", "/support"]] },
  { title: "Company", links: [["About us", "/about"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy policy", "/privacy"], ["Terms of service", "/terms"]] },
];

export function Footer() {
  const { user } = useStore();

  return (
    <footer className="bg-ink-950 text-slate-300">
      <div className="content-wrap pb-8 pt-14 sm:pt-16">
        {/* closing call to action — hidden once someone is signed in */}
        {!user && (
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-700/60 via-brand-800/40 to-transparent p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-500/25 blur-[90px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.025em] text-white sm:text-[32px]">
                  Ready to run your next expo?
                </h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-300">
                  Start free for 14 days. No credit card needed.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto" iconRight={<ArrowRight className="size-4" />}>Get started free</Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full border-white/30 bg-white/5 sm:w-auto">Book a live demo</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={cn("grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-8", !user && "mt-14")}>
          <div>
            <Logo light />
            <p className="mt-4 max-w-[260px] text-[14px] leading-relaxed text-slate-400">
              One platform for organizers, exhibitors and attendees.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-[14px] font-semibold text-white">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className={cn("rounded text-[14px] text-slate-400 transition hover:text-white", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60")}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-slate-500">© 2026 EventSphere Management. All rights reserved.</p>
          <SocialLinks light />
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast host                                                         */
/* ------------------------------------------------------------------ */
export function ToastHost() {
  const { toasts, dismiss } = useStore();
  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-500" />,
    info: <Info className="size-5 text-brand-500" />,
    warn: <TriangleAlert className="size-5 text-amber-500" />,
    danger: <TriangleAlert className="size-5 text-rose-500" />,
  };
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,360px)] flex-col gap-2.5"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-16px_rgba(23,28,53,.35)] animate-[popIn_.3s_cubic-bezier(.22,1,.36,1)]"
        >
          <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-slate-900">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{t.body}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className={cn("shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-700", focusRing)}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll-to-top on route change                                      */
/* ------------------------------------------------------------------ */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Page shell                                                         */
/* ------------------------------------------------------------------ */
export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-white", className)}>
      <a
        href="#main"
        className="sr-only z-[300] rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-slate-900 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small shared pieces                                                */
/* ------------------------------------------------------------------ */
export const SearchPill = ({ onClick, placeholder = "Search expos, exhibitors, sessions…" }: { onClick?: () => void; placeholder?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md",
      focusRing
    )}
  >
    <Search className="size-[18px] shrink-0 text-slate-400" aria-hidden />
    <span className="flex-1 truncate text-[14.5px] text-slate-500">{placeholder}</span>
    <kbd className="hidden shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-sans text-[12px] font-semibold text-slate-500 sm:block">⌘K</kbd>
  </button>
);

export const DateChip = ({ date }: { date: string }) => {
  const d = new Date(date);
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white leading-none">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{d.toLocaleDateString("en-US", { month: "short" })}</span>
      <span className="mt-1 font-display text-[20px] font-bold text-slate-900">{d.getDate()}</span>
    </div>
  );
};

export { CalendarDays };