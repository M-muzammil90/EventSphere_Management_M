import { useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, EXPOS, TESTIMONIALS, PARTNERS, FEATURES, IMG } from "@/lib/data";
import { HOME_FAQS } from "@/lib/mock";
import { Button, Reveal } from "@/components/ui";
import { Shell } from "@/components/SiteLayout";
import CinematicHero from "@/components/home/CinematicHero";
import { cn } from "@/utils/cn";
import { fmt } from "@/lib/store";
import {
  ArrowRight, BarChart3, Building2, Check,
  ChevronDown, ChevronLeft, ChevronRight, Clock, LayoutDashboard, Map,
  MapPin, MessagesSquare, Play, ShieldCheck, Sparkles, Star,
  Users,
} from "lucide-react";

const FEATURE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Map, ShieldCheck, BarChart3, MessagesSquare, CalendarClock: Clock,
};

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={cn("inline-flex rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]", light ? "bg-white/10 text-brand-200" : "bg-brand-50 text-brand-600")}>
      {children}
    </span>
  );
}

function Partners() {
  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <div className="content-wrap">
        <p className="text-center text-[10px] font-semibold text-slate-500">Trusted by industry leaders</p>
        <div className="mt-6 grid grid-cols-3 items-center gap-5 sm:grid-cols-6">
          {PARTNERS.slice(0, 6).map((p) => (
            <span key={p} className="text-center font-display text-[14px] font-bold tracking-[-.02em] text-slate-400 transition hover:text-slate-700">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="section-space-sm bg-white">
      <div className="content-wrap grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <Eyebrow>Why EventSphere?</Eyebrow>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-[1.12] tracking-[-.045em] text-slate-900 sm:text-[40px]">
            Built by event producers who were tired of broken event software.
          </h2>
          <p className="mt-5 max-w-md text-[14px] leading-[1.8] text-slate-600">
            We understand the challenges of planning, managing and scaling events. That’s why we created a modern, powerful platform to help you do more with less effort.
          </p>
          <Link to="/about"><Button className="mt-7" iconRight={<ArrowRight className="size-4" />}>Discover the platform</Button></Link>
        </Reveal>

        <Reveal delay={90}>
          <div className="relative lg:pl-8">
            <div className="overflow-hidden rounded-[22px]">
              <img src={IMG.expoTech} alt="Large technology expo audience" className="h-[310px] w-full object-cover sm:h-[360px]" />
            </div>
            <div className="absolute -right-2 -top-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_12px_32px_-16px_rgba(23,28,53,.25)] sm:-right-4">
              <span className="mx-auto grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Sparkles className="size-3.5" /></span>
              <p className="mt-1.5 font-display text-[18px] font-bold text-slate-900">2014</p>
              <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Founded</p>
            </div>
            <div className="absolute -right-2 top-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_12px_32px_-16px_rgba(23,28,53,.25)] sm:-right-4">
              <span className="mx-auto grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Building2 className="size-3.5" /></span>
              <p className="mt-1.5 font-display text-[18px] font-bold text-slate-900">480+</p>
              <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Events</p>
            </div>
            <div className="absolute -bottom-5 left-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_12px_32px_-16px_rgba(23,28,53,.25)]">
              <span className="mx-auto grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600"><Clock className="size-3.5" /></span>
              <p className="mt-1.5 font-display text-[18px] font-bold text-slate-900">38m</p>
              <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Avg. setup</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="section-space-sm bg-slate-50">
      <div className="content-wrap grid items-start gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-14">
        <Reveal>
          <Eyebrow>Powerful features</Eyebrow>
          <h2 className="mt-5 font-display text-[30px] font-bold leading-[1.12] tracking-[-.04em] text-slate-900 sm:text-[36px]">Everything you expect needs.</h2>
          <p className="mt-4 text-[13px] text-slate-600">Working beautifully together.</p>
          <Link to="/expos" className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold text-brand-600 transition hover:gap-3">Explore all features <ArrowRight className="size-3.5" /></Link>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = FEATURE_ICONS[feature.icon] ?? LayoutDashboard;
            return (
              <Reveal key={feature.title} delay={i * 45}>
                <div className="h-full rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_12px_32px_-20px_rgba(23,28,53,.2)]">
                  <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-4" /></span>
                  <h3 className="mt-3.5 font-display text-[13.5px] font-bold tracking-[-.015em] text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-[11px] leading-[1.7] text-slate-500">{feature.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CommandCenter() {
  const bars = [38, 52, 46, 64, 58, 78, 70, 88];
  return (
    <section className="bg-slate-50 pb-16 sm:pb-20">
      <div className="content-wrap">
        <Reveal>
          <div className="grid overflow-hidden rounded-[24px] bg-ink-950 lg:grid-cols-[.72fr_1.28fr]">
            <div className="relative p-7 text-white sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(104,84,217,.25),transparent_60%)]" />
              <div className="relative">
                <Eyebrow light>Powerful analytics</Eyebrow>
                <h2 className="mt-5 font-display text-[28px] font-bold leading-[1.15] tracking-[-.04em] sm:text-[34px]">A full command center for your event success.</h2>
                <p className="mt-4 max-w-sm text-[12.5px] leading-[1.8] text-slate-300/75">Track performance, manage attendees and make data-driven decisions.</p>
                <Link to="/admin/analytics"><Button className="mt-7" iconRight={<ArrowRight className="size-4" />}>Explore analytics</Button></Link>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid h-full gap-4 rounded-2xl bg-white p-5 sm:grid-cols-[1.35fr_.65fr] sm:p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[14px] font-bold text-slate-900">Event performance</h3>
                    <span className="text-[9px] font-semibold text-slate-400">Last 30 days</span>
                  </div>
                  <div className="mt-6 flex h-32 items-end gap-2 border-b border-slate-100">
                    {bars.map((h, i) => <div key={i} className={cn("flex-1 rounded-t-md", i === 6 ? "bg-brand-400" : "bg-brand-500/70")} style={{ height: `${h}%` }} />)}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[["24.5K", "Attendees"], ["8.7K", "Active visitors"], ["92%", "Satisfaction"]].map(([v, l]) => (
                      <div key={l}><p className="font-display text-[19px] font-bold text-slate-900">{v}</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-slate-400">{l}</p></div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <div className="flex items-center justify-between"><h3 className="font-display text-[12px] font-bold text-slate-900">Top events</h3><span className="text-[8px] font-semibold text-slate-400">Last 30 days</span></div>
                  <div className="mt-3 space-y-3">
                    {EXPOS.slice(0, 3).map((expo, i) => (
                      <div key={expo.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2">
                        <img
                          src={expo.cover}
                          alt=""
                          className="size-8 rounded-md object-cover"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).src =
                              "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
                          }}
                        />
                        <div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold text-slate-800">{expo.title}</p><p className="mt-0.5 text-[8px] text-slate-400">{fmt(expo.attendees)} visitors</p></div>
                        <span className="text-[8px] font-bold text-emerald-600">+{[24, 18, 12][i]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Upcoming() {
  const list = EXPOS.filter((e) => e.status !== "Completed").slice(0, 4);
  return (
    <section className="section-space-sm bg-white">
      <div className="content-wrap">
        <Reveal>
          <div className="flex items-end justify-between gap-5">
            <div>
              <Eyebrow>Find opportunities</Eyebrow>
              <h2 className="mt-4 font-display text-[28px] font-bold tracking-[-.04em] text-slate-900 sm:text-[32px]">Find your next opportunity.</h2>
              <p className="mt-2.5 text-[12.5px] text-slate-600">Discover upcoming expos, meet industry leaders and grow your network.</p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <Link to="/expos" aria-label="Previous expos" className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-600"><ChevronLeft className="size-4" /></Link>
              <Link to="/expos" aria-label="Next expos" className="grid size-9 place-items-center rounded-full border border-brand-200 bg-brand-50 text-brand-600 transition hover:bg-brand-100"><ChevronRight className="size-4" /></Link>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((expo, i) => (
            <Reveal key={expo.id} delay={i * 55}>
              <article className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_14px_36px_-20px_rgba(23,28,53,.22)]">
                <Link to={`/expos/${expo.slug}`} className="relative block h-36 overflow-hidden">
                  <img
                    src={expo.cover}
                    alt={expo.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 to-transparent" />
                  <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white/95 px-2 py-1 text-[8px] font-bold text-brand-600">{new Date(expo.startDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase()}</span>
                </Link>
                <div className="p-4">
                  <h3 className="truncate font-display text-[13px] font-bold text-slate-900">{expo.title}</h3>
                  <p className="mt-1.5 flex items-center gap-1 text-[9.5px] text-slate-500"><MapPin className="size-2.5" /> {expo.city}</p>
                  <p className="mt-2 flex items-center gap-1 text-[9.5px] font-semibold text-slate-500"><Users className="size-2.5" /> {fmt(expo.attendees)} attendees</p>
                  <Link to={`/expos/${expo.slug}`} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 transition group-hover:gap-2">View details <ArrowRight className="size-3" /></Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section id="benefits" className="bg-white pb-16 sm:pb-20">
      <div className="content-wrap">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-[24px] border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
            <div className="relative">
              <div className="overflow-hidden rounded-[18px]">
                <img src={IMG.expoCenter} alt="Exhibitors networking at an expo" className="h-[250px] w-full object-cover sm:h-[300px]" />
              </div>
              <div className="absolute -bottom-4 left-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_-16px_rgba(23,28,53,.3)]">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-500 text-white"><Users className="size-4" /></span>
                <div><p className="font-display text-[18px] font-bold leading-none text-slate-900">3.2M+</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-slate-400">Connections made</p></div>
              </div>
            </div>
            <div className="lg:pl-5">
              <Eyebrow>Grow your business</Eyebrow>
              <h2 className="mt-4 font-display text-[26px] font-bold leading-[1.18] tracking-[-.04em] text-slate-900 sm:text-[30px]">Better outcomes for exhibitors. A better day for attendees.</h2>
              <p className="mt-4 max-w-md text-[13px] leading-[1.8] text-slate-600">Whether you’re exhibiting or attending, EventSphere helps you make the most of every event with fewer tools and less friction.</p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {["Visual booth selection", "Qualified lead capture", "Personal agenda", "Instant reminders"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600"><Check className="size-3.5 text-emerald-500" /> {item}</span>
                ))}
              </div>
              <Link to="/register"><Button className="mt-6" iconRight={<ArrowRight className="size-4" />}>Learn more</Button></Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlannerPreview() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl sm:grid-cols-[120px_1fr]">
      <div className="hidden bg-ink-900 p-3 sm:block">
        <div className="flex items-center gap-2 px-1 py-2"><span className="grid size-6 place-items-center rounded-md bg-brand-500 text-[8px] font-bold text-white">ES</span><span className="font-display text-[9px] font-bold text-white">EventSphere</span></div>
        <div className="mt-3 space-y-1">
          {["Overview", "Events", "Floor plan", "Schedule", "Messages", "Settings"].map((item, i) => (
            <div key={item} className={cn("rounded-md px-2 py-1.5 text-[8px] font-semibold", i === 2 ? "bg-brand-500 text-white" : "text-white/40")}>{item}</div>
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between"><p className="font-display text-[12px] font-bold text-slate-900">Your event planner</p><span className="text-[8px] font-semibold text-slate-400">March 2026</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]">
          <div className="space-y-2">
            {["Opening keynote", "Product discovery", "Investor meetings", "Closing roundtable"].map((item, i) => (
              <div key={item} className={cn("rounded-lg border p-2.5", i === 1 ? "border-brand-200 bg-brand-50" : "border-slate-100")}>
                <p className="text-[9px] font-bold text-slate-800">{item}</p>
                <p className="mt-1 text-[7.5px] text-slate-400">{["09:00 · Main Stage", "11:00 · Hall 4", "14:00 · Lounge", "16:00 · Forum A"][i]}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-bold text-slate-800">Event summary</p>
            <div className="mt-3 space-y-3">
              {[["12", "Meetings", Users], ["6", "Booths", MapPin], ["3", "Reminders", Clock]].map(([v, l, Icon]) => {
                const I = Icon as React.ElementType;
                return <div key={l as string} className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-brand-50 text-brand-600"><I className="size-3" /></span><div><p className="text-[10px] font-bold text-slate-900">{v as string}</p><p className="text-[7px] text-slate-400">{l as string}</p></div></div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloorPlanSection() {
  return (
    <section id="floor-plan" className="bg-white pb-16 sm:pb-20">
      <div className="content-wrap">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-[24px] bg-ink-950 p-7 sm:p-10 lg:grid-cols-[.7fr_1.3fr]">
            <div className="text-white">
              <Eyebrow light>Plan smarter</Eyebrow>
              <h2 className="mt-5 font-display text-[28px] font-bold leading-[1.15] tracking-[-.04em] sm:text-[34px]">See every booth. Know every opportunity.</h2>
              <p className="mt-4 max-w-sm text-[12.5px] leading-[1.8] text-slate-300/75">Our advanced event planner helps you find the right booths, schedule meetings and never miss what matters.</p>
              <Link to="/floor-plan"><Button className="mt-7" iconRight={<ArrowRight className="size-4" />}>Start planning</Button></Link>
            </div>
            <PlannerPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    ["01", "Create your expo", "Set dates, venue and ticket tiers."],
    ["02", "Design the floor plan", "Add zones, booths and pricing."],
    ["03", "Approve exhibitors", "Review applications and allocate space."],
    ["04", "Publish and go live", "Open registration and track everything."],
  ];
  return (
    <section className="bg-slate-50 py-14">
      <div className="content-wrap">
        <Reveal><div className="text-center"><Eyebrow>How it works</Eyebrow><h2 className="mt-4 font-display text-[28px] font-bold tracking-[-.04em] text-slate-900">From blank hall to live expo</h2></div></Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 55}>
              <div className="relative border-t-2 border-slate-200 pt-5 first:border-brand-500">
                <span className="font-display text-[12px] font-bold text-brand-500">{n}</span>
                <h3 className="mt-2 font-display text-[14px] font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="section-space-sm bg-white">
      <div className="content-wrap">
        <Reveal><Eyebrow>Testimonials</Eyebrow><h2 className="mt-4 font-display text-[28px] font-bold tracking-[-.04em] text-slate-900 sm:text-[32px]">Loved by event teams worldwide</h2></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 60}>
              <figure className="h-full rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_12px_32px_-20px_rgba(23,28,53,.2)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src={t.avatar} alt={t.name} className="size-9 rounded-full object-cover" />
                    <div><p className="text-[11px] font-bold text-slate-900">{t.name}</p><p className="mt-0.5 text-[8.5px] text-slate-400">{t.role}</p></div>
                  </div>
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="size-2.5 fill-amber-400 text-amber-400" />)}</div>
                </div>
                <blockquote className="mt-4 text-[11.5px] leading-[1.75] text-slate-600">“{t.quote}”</blockquote>
                <span className="mt-4 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">{t.stat}</span>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-slate-50 py-14 sm:py-16">
      <div className="content-wrap grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
        <Reveal><Eyebrow>FAQ</Eyebrow><h2 className="mt-4 font-display text-[28px] font-bold tracking-[-.04em] text-slate-900">Questions, answered</h2><p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">Everything you need to know before getting started.</p><Link to="/support"><Button variant="secondary" size="sm" className="mt-5">Contact support</Button></Link></Reveal>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {HOME_FAQS.slice(0, 5).map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="text-[12.5px] font-semibold text-slate-800">{f.q}</span>
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform", open === i && "rotate-180 text-brand-600")} />
              </button>
              <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden"><p className="pb-4 pr-6 text-[11.5px] leading-[1.75] text-slate-600">{f.a}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-white pb-8 pt-14 sm:pb-10 sm:pt-16">
      <div className="content-wrap">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[24px] bg-ink-950 px-6 py-14 text-center sm:py-16">
            <video autoPlay loop muted playsInline poster={MEDIA.heroPoster} className="absolute inset-0 -z-10 size-full object-cover opacity-30">
              <source src={MEDIA.conferenceVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/90 via-brand-800/60 to-ink-950/75" />
            <Eyebrow light>Ready to get started?</Eyebrow>
            <h2 className="mx-auto mt-5 max-w-xl font-display text-[28px] font-bold leading-[1.15] tracking-[-.04em] text-white sm:text-[36px]">Your next expo yet starts with better software.</h2>
            <p className="mx-auto mt-4 max-w-md text-[12px] leading-relaxed text-white/60">Join hundreds of event professionals and take your events to the next level.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/register"><Button iconRight={<ArrowRight className="size-4" />}>Get started free</Button></Link>
              <Link to="/contact"><Button variant="outline" icon={<Play className="size-3.5" />}>Watch demo</Button></Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Shell>
      <CinematicHero />
      <Partners />
      <AboutSection />
      <Features />
      <CommandCenter />
      <Upcoming />
      <Benefits />
      <FloorPlanSection />
      <Workflow />
      <Testimonials />
      <FAQ />
      <CTA />
    </Shell>
  );
}
