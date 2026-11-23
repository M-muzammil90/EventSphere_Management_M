import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, TESTIMONIALS } from "@/lib/data";
import { Button, CountUp, Reveal } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  ArrowRight, ArrowUpRight, BarChart3, Building2, CalendarClock, Check,
  ChevronDown, CircleCheck, LayoutDashboard, MapPin, MoreHorizontal,
  Play, Plus, Radio, ShieldCheck, Star, TrendingUp, Users, Zap,
} from "lucide-react";

const NAV = [
  ["Overview", LayoutDashboard],
  ["Expos", CalendarClock],
  ["Exhibitors", Building2],
  ["Analytics", BarChart3],
] as const;

const KPIS = [
  { label: "Total revenue", value: "$4.83M", change: "+12.4%", icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600" },
  { label: "Attendees", value: "18,420", change: "+18.4%", icon: Users, tone: "bg-brand-50 text-brand-600" },
  { label: "Booths booked", value: "486", change: "93% occupied", icon: MapPin, tone: "bg-aqua-500/10 text-aqua-600" },
];

function PreviewChart() {
  const points = [62, 74, 65, 89, 82, 108, 99, 128, 119, 145, 137, 163];
  const prev = [78, 84, 88, 92, 98, 106, 112, 115, 126, 132, 136, 142];
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${8 + i * 29},${190 - v}`).join(" ");
  return (
    <svg viewBox="0 0 344 206" className="h-[174px] w-full" role="img" aria-label="Attendance growth chart">
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6854d9" stopOpacity=".18" />
          <stop offset="100%" stopColor="#6854d9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 80, 120, 160].map((y) => <line key={y} x1="8" x2="336" y1={y} y2={y} stroke="#e7e9f2" strokeDasharray="3 5" />)}
      <path d={`${path(points)} L336,190 L8,190 Z`} fill="url(#heroArea)" />
      <path d={path(prev)} fill="none" stroke="#d3c9f7" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
      <path d={path(points)} fill="none" stroke="#6854d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="327" cy={190 - points[11]} r="4.5" fill="#fff" stroke="#6854d9" strokeWidth="2.5" />
      {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => <text key={m} x={8 + i * 58} y="204" fill="#9ba1bc" fontSize="8" fontWeight="600">{m}</text>)}
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[32px] bg-gradient-to-br from-brand-400/20 via-transparent to-aqua-500/10 blur-2xl" />
      <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_30px_90px_-24px_rgba(0,0,0,.6)]">
        {/* browser chrome */}
        <div className="flex h-10 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3.5">
          <span className="size-2 rounded-full bg-rose-300" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-300" />
          <div className="ml-3 flex h-6 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-[9px] font-medium text-slate-400">
            <ShieldCheck className="size-2.5 text-emerald-500" /> app.eventsphere.io/admin
          </div>
          <MoreHorizontal className="size-3.5 text-slate-400" />
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-[132px] shrink-0 flex-col border-r border-slate-100 bg-ink-950 p-3 sm:flex">
            <div className="flex items-center gap-2 px-1 pb-4 pt-1">
              <span className="grid size-6 place-items-center rounded-lg bg-brand-500 text-[8px] font-bold text-white">ES</span>
              <span className="font-display text-[9px] font-bold text-white">EventSphere</span>
            </div>
            <p className="px-2 pb-1.5 text-[6px] font-bold uppercase tracking-[.16em] text-white/30">Workspace</p>
            <div className="space-y-1">
              {NAV.map(([label, Icon], i) => (
                <div key={label} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[8px] font-semibold", i === 0 ? "bg-brand-500 text-white" : "text-white/45")}>
                  <Icon className="size-2.5" /> {label}
                </div>
              ))}
            </div>
            <div className="mt-auto rounded-lg border border-white/8 bg-white/[0.05] p-2">
              <div className="flex items-center gap-1 text-[7px] font-semibold text-emerald-300">
                <span className="size-1 rounded-full bg-emerald-400" /> All systems live
              </div>
              <p className="mt-1 text-[6px] leading-relaxed text-white/35">Synced just now</p>
            </div>
          </div>

          {/* main preview */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">Organizer dashboard</p>
                <p className="mt-1 font-display text-[14px] font-bold text-slate-900">Welcome back, Sarah</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[7px] font-bold text-emerald-600 sm:flex"><Radio className="size-2" /> LIVE</span>
                <span className="flex h-6 items-center gap-1 rounded-md border border-slate-200 px-2 text-[8px] font-semibold text-slate-500">Last 7 days <ChevronDown className="size-2" /></span>
                <span className="grid size-6 place-items-center rounded-md bg-brand-500 text-white"><Plus className="size-3" /></span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(23,28,53,.03)]">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("grid size-5 place-items-center rounded-md", k.tone)}><k.icon className="size-2.5" /></span>
                    <span className="text-[6.5px] font-bold text-emerald-600">{k.change}</span>
                  </div>
                  <p className="mt-2 font-display text-[13px] font-extrabold tracking-tight text-slate-900">{k.value}</p>
                  <p className="mt-0.5 truncate text-[7px] font-medium text-slate-400">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[9px] font-bold text-slate-900">Attendance & engagement</p>
                  <p className="mt-0.5 text-[7px] text-slate-400">Daily unique check-ins</p>
                </div>
                <div className="flex items-center gap-3 text-[7px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-1 w-3 rounded-full bg-brand-500" /> Current</span>
                  <span className="flex items-center gap-1"><span className="h-1 w-3 rounded-full bg-brand-200" /> Previous</span>
                </div>
              </div>
              <PreviewChart />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[8px] font-bold text-slate-900">Booth occupancy</p>
                  <span className="text-[8px] font-bold text-brand-600">93%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
                </div>
                <p className="mt-1.5 text-[7px] text-slate-400">486 of 520 booths allocated</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600"><Zap className="size-3" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-bold text-slate-900">Booth A-19 booked</p>
                    <p className="text-[7px] text-slate-400">CyberFortis · 2m ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating proof cards */}
      <div className="absolute -bottom-5 -left-4 hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_12px_36px_-12px_rgba(23,28,53,.28)] sm:flex">
        <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><CircleCheck className="size-4" /></span>
        <div className="leading-tight">
          <p className="text-[10px] font-bold text-slate-900">Application approved</p>
          <p className="mt-0.5 text-[8px] text-slate-400">Nexora Cloud · Booth A-12</p>
        </div>
      </div>
      <div className="absolute -right-3 top-12 hidden rounded-xl border border-white/15 bg-ink-900/90 px-3 py-2 text-white shadow-xl backdrop-blur md:block">
        <p className="text-[8px] font-medium text-white/50">On-floor right now</p>
        <p className="mt-0.5 font-display text-[18px] font-bold leading-none">9,310</p>
        <p className="mt-1 flex items-center gap-1 text-[7px] font-bold text-emerald-300"><TrendingUp className="size-2.5" /> +18.4% today</p>
      </div>
    </div>
  );
}

export default function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      {/* background video + restrained overlays */}
      <div className="absolute inset-0 -z-10">
        <video autoPlay loop muted playsInline poster={MEDIA.heroPoster} className="size-full object-cover opacity-35">
          <source src={MEDIA.heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#0b0e1d_0%,rgba(11,14,29,.97)_35%,rgba(11,14,29,.86)_65%,rgba(11,14,29,.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_12%,rgba(104,84,217,.2),transparent_48%),radial-gradient(ellipse_at_88%_78%,rgba(56,189,248,.09),transparent_42%)]" />
        <div className="absolute inset-0 grid-noise-dark opacity-60" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="content-wrap pb-16 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-12 xl:gap-20">
          {/* left */}
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 backdrop-blur">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white">
                <span className="relative flex size-1.5"><span className="absolute size-full animate-ping rounded-full bg-white/70" /><span className="relative size-1.5 rounded-full bg-white" /></span>
                Live platform
              </span>
              <span className="text-[11.5px] font-medium text-white/65">Now powering 480+ expos worldwide</span>
            </div>

            <h1 className="mt-7 font-display text-[40px] font-extrabold leading-[1.06] tracking-[-0.045em] text-white sm:text-[54px] lg:text-[58px] xl:text-[64px]">
              Run world-class expos.
              <span className="mt-1 block text-gradient">Without the chaos.</span>
            </h1>

            <p className="mt-6 max-w-[520px] text-[15px] leading-[1.8] text-slate-300/85 sm:text-[16.5px]">
              The complete operating system for expo teams — registration, interactive floor plans,
              exhibitor approvals, schedules and live analytics, in one beautifully simple platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/expos">
                <Button size="lg" className="w-full sm:w-auto" iconRight={<ArrowRight className="size-4.5" />}>
                  Explore upcoming expos
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto" icon={<Play className="size-3.5" />}>
                  Book a live demo
                </Button>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {["Free 14-day trial", "No credit card required", "Setup in under an hour"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/50">
                  <Check className="size-3.5 text-emerald-400" strokeWidth={2.5} /> {item}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex -space-x-2.5">
                {TESTIMONIALS.map((t) => (
                  <img key={t.name} src={t.avatar} alt={t.name} className="size-8 rounded-full object-cover ring-2 ring-ink-950" />
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-3 fill-amber-400 text-amber-400" />)}
                  <span className="ml-1 text-[11px] font-bold text-white">4.9</span>
                </div>
                <p className="mt-1 text-[11px] text-white/45">Trusted by 1,200+ exhibitor teams</p>
              </div>
              <Link to="/exhibitors" className="ml-auto hidden items-center gap-1 text-[11.5px] font-bold text-brand-300 transition hover:text-white sm:flex">
                View exhibitor stories <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* right */}
          <Reveal delay={120} y={24} className="lg:pl-4">
            <DashboardPreview />
          </Reveal>
        </div>
      </div>

      {/* clean metrics strip */}
      <div className="relative border-t border-white/10 bg-ink-900/55 backdrop-blur">
        <div className="content-wrap grid grid-cols-2 divide-white/10 sm:grid-cols-4 sm:divide-x">
          {[
            { label: "Expos delivered", value: 480, suffix: "+" },
            { label: "Exhibitor teams", value: 12400, suffix: "+" },
            { label: "Attendee check-ins", value: 3.2, suffix: "M", decimals: 1 },
            { label: "Platform uptime", value: 99.9, suffix: "%", decimals: 1 },
          ].map((s) => (
            <div key={s.label} className="px-3 py-6 text-center sm:px-5 sm:py-7 sm:text-left">
              <p className="font-display text-[24px] font-extrabold tracking-[-.03em] text-white sm:text-[28px]">
                {ready ? <CountUp to={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} /> : 0}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[.13em] text-white/35 sm:text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
