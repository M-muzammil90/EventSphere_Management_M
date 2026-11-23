import { Link } from "react-router-dom";
import { FEATURES } from "@/lib/data";
import { Button, Reveal } from "@/components/ui";
import {
  ArrowRight, ArrowUpRight, BarChart3, CalendarClock, Check,
  LayoutDashboard, Map, MessagesSquare, ShieldCheck,
} from "lucide-react";
import { cn } from "@/utils/cn";

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Map, ShieldCheck, BarChart3, MessagesSquare, CalendarClock,
};

function SpotlightVisual() {
  const bars = [42, 58, 48, 76, 66, 84, 72, 92, 81, 96];
  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/40">Live performance</p>
          <p className="mt-1.5 font-display text-[14px] font-bold text-white">One view. Every signal.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-md bg-emerald-400/10 px-2 py-1 text-[8px] font-bold text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> REAL TIME
        </span>
      </div>

      <div className="mt-6 flex h-28 items-end gap-2 border-b border-white/10 pb-px">
        {bars.map((h, i) => (
          <div key={i} className="group relative flex-1">
            <div
              className={cn(
                "w-full rounded-t-sm transition-all duration-500 group-hover:brightness-125",
                i === bars.length - 2 ? "bg-brand-300" : "bg-gradient-to-t from-brand-500/45 to-brand-400/85"
              )}
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          ["18.4K", "Check-ins"],
          ["93%", "Booth occupancy"],
          ["4.9", "Event rating"],
        ].map(([value, label]) => (
          <div key={label} className="border-l border-white/10 pl-3 first:border-0 first:pl-0">
            <p className="font-display text-[20px] font-bold tracking-tight text-white">{value}</p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[.12em] text-white/35">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  const spotlight = FEATURES[0];
  const rest = FEATURES.slice(1);

  return (
    <section id="features" className="section-space relative overflow-hidden border-y border-slate-200 bg-slate-100/65">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
      <div className="content-wrap relative">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow bg-brand-50 text-brand-700 ring-1 ring-brand-100">The platform</span>
              <h2 className="mt-5 font-display text-[30px] font-bold leading-[1.15] tracking-[-.035em] text-slate-900 sm:text-[38px]">
                Everything your expo needs.
                <span className="block text-slate-400">Nothing it doesn’t.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
                Six tightly integrated modules replace the spreadsheet-and-email stack most event teams still rely on.
              </p>
            </div>
            <Link to="/expos">
              <Button variant="secondary" iconRight={<ArrowUpRight className="size-4" />}>See it in action</Button>
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-12">
          {/* spotlight panel */}
          <Reveal delay={60}>
            <div className="relative h-full overflow-hidden rounded-[26px] bg-ink-950 p-7 shadow-[0_24px_64px_-28px_rgba(23,28,53,.45)] sm:p-9">
              <div className="pointer-events-none absolute inset-0 grid-noise-dark opacity-40" />
              <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-500/15 blur-[80px]" />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_8px_20px_-6px_rgba(104,84,217,.65)]">
                  <LayoutDashboard className="size-5" />
                </span>
                <span className="ml-4 inline-flex rounded-md border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-brand-300">Command center</span>
                <h3 className="mt-6 max-w-sm font-display text-[24px] font-bold leading-tight tracking-[-.025em] text-white sm:text-[28px]">
                  {spotlight.title}
                </h3>
                <p className="mt-3.5 max-w-md text-[13.5px] leading-relaxed text-slate-300/80">{spotlight.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Revenue", "Floor plans", "Sessions", "Attendees"].map((x) => (
                    <span key={x} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-white/55">{x}</span>
                  ))}
                </div>
                <SpotlightVisual />
              </div>
            </div>
          </Reveal>

          {/* refined feature list, not another grid of cards */}
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {rest.map((feature, i) => {
              const Icon = ICONS[feature.icon] ?? LayoutDashboard;
              return (
                <Reveal key={feature.title} delay={100 + i * 55}>
                  <div className="group flex gap-5 py-6 first:pt-1 last:pb-1 sm:gap-6">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600 transition-all duration-300 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-[16px] font-bold tracking-[-.015em] text-slate-900">{feature.title}</h3>
                        <ArrowRight className="size-4 shrink-0 -translate-x-1 text-brand-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                      <p className="mt-2 max-w-lg text-[13px] leading-[1.75] text-slate-600">{feature.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* quiet trust bar */}
        <Reveal delay={180}>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-[13px] text-slate-600">
              <b className="font-semibold text-slate-900">Built for production:</b> secure by default, accessible by design.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {["GDPR ready", "WCAG 2.1 AA", "99.9% uptime", "Daily backups"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-500">
                  <Check className="size-3.5 text-emerald-500" strokeWidth={2.5} /> {item}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
