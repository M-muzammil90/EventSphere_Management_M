import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, TESTIMONIALS } from "@/lib/data";
import { Button, CountUp, Reveal } from "@/components/ui";
import { ArrowRight, ArrowUpRight, CircleCheck, MapPin, Play, Star, TrendingUp, Users } from "lucide-react";

const KPIS = [
  { label: "Revenue", value: "$4.83M", change: "+12.4%", icon: TrendingUp },
  { label: "Attendees", value: "18,420", change: "+18.4%", icon: Users },
  { label: "Booths booked", value: "486", change: "93% full", icon: MapPin },
];

const STATS = [
  { label: "Expos delivered", value: 480, suffix: "+" },
  { label: "Exhibitor teams", value: 12400, suffix: "+" },
  { label: "Attendee check-ins", value: 3.2, suffix: "M", decimals: 1 },
  { label: "Platform uptime", value: 99.9, suffix: "%", decimals: 1 },
];

function PreviewChart() {
  const points = [62, 74, 65, 89, 82, 108, 99, 128, 119, 145, 137, 163];
  const prev = [78, 84, 88, 92, 98, 106, 112, 115, 126, 132, 136, 142];
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i ? "L" : "M"}${8 + i * 29},${190 - v}`).join(" ");
  return (
    <svg viewBox="0 0 344 206" className="h-auto w-full" role="img" aria-label="Attendance growth chart">
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6854d9" stopOpacity=".16" />
          <stop offset="100%" stopColor="#6854d9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 100, 160].map((y) => (
        <line key={y} x1="8" x2="336" y1={y} y2={y} stroke="#eceef5" />
      ))}
      <path d={`${path(points)} L336,190 L8,190 Z`} fill="url(#heroArea)" />
      <path d={path(prev)} fill="none" stroke="#cfc6f5" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
      <path d={path(points)} fill="none" stroke="#6854d9" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="327" cy={190 - points[11]} r="5" fill="#fff" stroke="#6854d9" strokeWidth="2.75" />
      {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => (
        <text key={m} x={8 + i * 58} y="204" fill="#9ba1bc" fontSize="10" fontWeight="500">{m}</text>
      ))}
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-brand-500/15 blur-3xl" aria-hidden />

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,.7)] ring-1 ring-white/20">
        {/* window bar */}
        <div className="flex h-10 items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4">
          <span className="size-2.5 rounded-full bg-slate-200" />
          <span className="size-2.5 rounded-full bg-slate-200" />
          <span className="size-2.5 rounded-full bg-slate-200" />
          <span className="ml-3 text-[11px] font-medium text-slate-400">app.eventsphere.io/dashboard</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400">Organizer dashboard</p>
              <p className="mt-1 font-display text-lg font-bold tracking-tight text-slate-900">Welcome back, Sarah</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {KPIS.map((k) => (
              <div key={k.label} className="rounded-xl bg-slate-50 p-3.5">
                <k.icon className="size-4 text-brand-600" strokeWidth={2} />
                <p className="mt-3 font-display text-xl font-extrabold tracking-tight text-slate-900">{k.value}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{k.label}</p>
                <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">{k.change}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-slate-900">Daily check-ins</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3.5 rounded bg-brand-500" /> This week</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3.5 rounded bg-brand-200" /> Last week</span>
              </div>
            </div>
            <PreviewChart />
          </div>
        </div>
      </div>

      {/* single floating proof card */}
      <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_20px_50px_-15px_rgba(11,14,29,.45)] md:flex">
        <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Application approved</p>
          <p className="mt-0.5 text-xs text-slate-500">Nexora Cloud, Booth A-12</p>
        </div>
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
      {/* background */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <video autoPlay loop muted playsInline poster={MEDIA.heroPoster} className="size-full object-cover opacity-25 motion-reduce:hidden">
          <source src={MEDIA.heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#0b0e1d_0%,rgba(11,14,29,.96)_40%,rgba(11,14,29,.85)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(104,84,217,.22),transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="content-wrap pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-14 xl:gap-24">
          {/* left */}
          <div className="max-w-[560px]">
            <p className="flex items-center gap-2.5 text-sm font-medium text-white/70">
              <span className="relative flex size-2">
                <span className="absolute size-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-emerald-400" />
              </span>
              Powering 480+ expos worldwide
            </p>

            <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[56px] xl:text-[64px]">
              Run world-class expos.
              <span className="block text-white/45">Without the chaos.</span>
            </h1>

            <p className="mt-6 max-w-[480px] text-base leading-[1.75] text-slate-300 sm:text-lg">
              Registration, floor plans, exhibitor approvals, schedules and live analytics, all in one place for your expo team.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/expos">
                <Button size="lg" className="w-full sm:w-auto" iconRight={<ArrowRight className="size-4" />}>
                  Explore expos
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto" icon={<Play className="size-3.5" />}>
                  Book a demo
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-sm text-white/50">
              Free 14-day trial. No credit card needed.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex -space-x-2.5">
                {TESTIMONIALS.map((t) => (
                  <img key={t.name} src={t.avatar} alt={t.name} className="size-9 rounded-full object-cover ring-2 ring-ink-950" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5" aria-label="Rated 4.9 out of 5">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="ml-1.5 text-sm font-semibold text-white">4.9</span>
                </div>
                <p className="mt-0.5 text-sm text-white/50">Trusted by 1,200+ exhibitor teams</p>
              </div>
              <Link
                to="/exhibitors"
                className="hidden items-center gap-1 text-sm font-semibold text-brand-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300 sm:ml-auto sm:flex"
              >
                Exhibitor stories <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* right */}
          <Reveal delay={120} y={24} className="lg:pl-2">
            <DashboardPreview />
          </Reveal>
        </div>
      </div>

      {/* metrics */}
      <div className="border-t border-white/10">
        <div className="content-wrap grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="py-7 pr-4 sm:py-9">
              <p className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {ready ? <CountUp to={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} /> : 0}
              </p>
              <p className="mt-1.5 text-sm text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}