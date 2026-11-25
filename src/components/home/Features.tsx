import { useId, useState, type ElementType, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FEATURES } from "@/lib/data";
import { Button, Reveal } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  ArrowUpRight, BarChart3, CalendarClock, Check, LayoutDashboard, Map, MessagesSquare, ShieldCheck,
} from "lucide-react";

const ICONS: Record<string, ElementType> = {
  LayoutDashboard, Map, ShieldCheck, BarChart3, MessagesSquare, CalendarClock,
};

const TRUST = ["GDPR ready", "WCAG 2.1 AA", "99.9% uptime", "Daily backups"];

/* ------------------------------------------------------------------ */
/*  Product previews — one small, believable screen per feature.       */
/*  Numbers and names are sample data.                                 */
/* ------------------------------------------------------------------ */
function Dashboard() {
  const bars = [42, 58, 48, 76, 66, 84, 72, 92, 81, 96];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[["$48.2K", "Booth revenue"], ["18.4K", "Check-ins"], ["93%", "Booths booked"]].map(([v, l]) => (
          <div key={l} className="rounded-xl bg-white/[0.06] p-3.5">
            <p className="font-display text-[22px] font-bold tracking-tight text-white">{v}</p>
            <p className="mt-0.5 text-[12px] text-white/55">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex h-36 items-end gap-2 rounded-xl bg-white/[0.04] p-4">
        {bars.map((h, i) => (
          <div key={i} className={cn("flex-1 rounded-t-md", i === 7 ? "bg-flame-400" : "bg-brand-400/70")} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function FloorPlan() {
  const booked = new Set([1, 4, 5, 9, 11, 14, 18, 20, 23, 26, 29, 31, 34, 37]);
  const mine = 16;
  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-[4/3] rounded-md",
              i === mine ? "bg-flame-400 ring-2 ring-white/70" : booked.has(i) ? "bg-brand-400/80" : "bg-white/10"
            )}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-5 text-[12px] text-white/60">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-white/20" /> Open</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-brand-400" /> Booked</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-flame-400" /> Selected</span>
      </div>
    </div>
  );
}

function Approvals() {
  const rows = [
    ["Nexora Cloud", "Approved", "bg-emerald-400/15 text-emerald-300"],
    ["Brightline Media", "Pending", "bg-amber-400/15 text-amber-300"],
    ["Orbit Labs", "Approved", "bg-emerald-400/15 text-emerald-300"],
    ["Kite Studio", "Needs documents", "bg-rose-400/15 text-rose-300"],
  ];
  return (
    <ul className="space-y-2.5">
      {rows.map(([name, status, tone]) => (
        <li key={name} className="flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3.5">
          <span className="flex items-center gap-3 text-[14px] font-medium text-white">
            <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-[12px] font-bold">{name[0]}</span>
            {name}
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold", tone)}>{status}</span>
        </li>
      ))}
    </ul>
  );
}

function Analytics() {
  const d = [20, 32, 28, 46, 42, 60, 58, 78, 72, 90];
  const W = 400, H = 150;
  const pts = d.map((v, i) => [(i * W) / (d.length - 1), H - (v / 100) * (H - 16) - 6]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[12px] text-white/55">Leads captured</p>
          <p className="font-display text-[30px] font-bold leading-tight tracking-tight text-white">2,846</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[12px] font-semibold text-emerald-300">+24% vs last show</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Leads rising over the event">
        <defs>
          <linearGradient id="an-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".4" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.3, 0.6, 0.9].map((g) => <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="stroke-white/10" strokeDasharray="3 4" />)}
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#an-fill)" className="text-brand-400" />
        <path d={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-brand-300" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" className="fill-flame-400 stroke-white" strokeWidth="2" />
      </svg>
    </div>
  );
}

function Messages() {
  return (
    <div className="space-y-3 text-[14px]">
      <p className="max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-white/90">
        Is booth B-12 still available for the March show?
      </p>
      <p className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-3 text-white">
        Yes. We just held it for you. Confirm and it's yours.
      </p>
      <p className="max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-white/90">Confirmed. Can we add two more staff passes?</p>
      <p className="text-[12px] text-white/40">Organizer is typing…</p>
    </div>
  );
}

function Schedule() {
  const rows = [
    ["09:00", "Opening keynote", "bg-brand-400"],
    ["11:30", "Product showcase · Hall A", "bg-flame-400"],
    ["13:00", "Networking lunch", "bg-emerald-400"],
    ["15:00", "Panel: The future of expos", "bg-brand-400"],
  ];
  return (
    <ul className="space-y-2.5">
      {rows.map(([t, title, c]) => (
        <li key={t} className="flex items-center gap-4 rounded-xl bg-white/[0.06] px-4 py-3.5">
          <span className="w-12 text-[13px] font-semibold tabular-nums text-white/60">{t}</span>
          <span className={cn("h-8 w-1 rounded-full", c)} />
          <span className="text-[14px] font-medium text-white">{title}</span>
        </li>
      ))}
    </ul>
  );
}

const PREVIEWS: Record<string, () => ReactNode> = {
  LayoutDashboard: Dashboard,
  Map: FloorPlan,
  ShieldCheck: Approvals,
  BarChart3: Analytics,
  MessagesSquare: Messages,
  CalendarClock: Schedule,
};

/* ================================================================== */
/*  Section                                                            */
/* ================================================================== */
export default function Features() {
  const [active, setActive] = useState(0);
  const uid = useId();
  const current = FEATURES[active];
  const Preview = PREVIEWS[current.icon] ?? Dashboard;
  const CurrentIcon = ICONS[current.icon] ?? LayoutDashboard;

  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const n = (active + (e.key === "ArrowDown" ? 1 : -1) + FEATURES.length) % FEATURES.length;
    setActive(n);
    document.getElementById(`${uid}-tab-${n}`)?.focus();
  }

  return (
    <section id="features" className="section-space bg-slate-50">
      <div className="content-wrap">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-slate-900 sm:text-[42px]">
                Everything your expo needs.
                <span className="block text-slate-400">Nothing it doesn’t.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
                Six connected modules replace the spreadsheet-and-email stack most event teams still rely on.
              </p>
            </div>
            <Link to="/expos">
              <Button variant="secondary" iconRight={<ArrowUpRight className="size-4" />}>See it in action</Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            {/* ---------- feature list (tabs) ---------- */}
            <div role="tablist" aria-orientation="vertical" aria-label="Platform features" onKeyDown={onKey} className="self-center">
              {FEATURES.map((f, i) => {
                const on = i === active;
                return (
                  <button
                    key={f.title}
                    id={`${uid}-tab-${i}`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={cn(
                      "group relative block w-full border-t border-slate-200 py-5 pl-6 text-left transition-colors last:border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-0 top-0 h-full w-[3px] origin-top rounded-full bg-brand-600 transition-transform duration-300",
                        on ? "scale-y-100" : "scale-y-0"
                      )}
                    />
                    <span className="flex items-baseline gap-4">
                      <span className={cn("w-6 shrink-0 font-display text-[13px] font-bold tabular-nums transition-colors", on ? "text-brand-600" : "text-slate-400")}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={cn("font-display text-[19px] font-bold tracking-[-0.015em] transition-colors sm:text-[21px]", on ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800")}>
                        {f.title}
                      </span>
                    </span>
                    <span className={cn("grid pl-10 transition-[grid-template-rows,opacity] duration-300", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                      <span className="overflow-hidden">
                        <span className="mt-2 block max-w-md text-[14.5px] leading-[1.7] text-slate-600">{f.body}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ---------- preview ---------- */}
            <div
              id={`${uid}-panel`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${active}`}
              className="relative overflow-hidden rounded-[28px] bg-ink-950 p-6 shadow-[0_30px_70px_-30px_rgba(23,28,53,.55)] sm:p-8"
            >
              <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-500/25 blur-[90px]" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-brand-500 text-white">
                      <CurrentIcon className="size-[18px]" />
                    </span>
                    <span className="font-display text-[15px] font-bold text-white">{current.title}</span>
                  </span>
                  <span className="text-[12px] text-white/40">Sample data</span>
                </div>
                <div key={active} className="min-h-[300px] animate-[fadeUp_.35s_ease-out]">
                  <Preview />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------- trust line ---------- */}
        <Reveal delay={120}>
          <div className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-slate-600">
              <b className="font-semibold text-slate-900">Built for production:</b> secure by default, accessible by design.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                  <Check className="size-4 text-emerald-500" strokeWidth={2.5} aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){[role="tabpanel"] *{animation:none!important}}
      `}</style>
    </section>
  );
}