import { useState } from "react";
import { Link } from "react-router-dom";
import { ABOUT } from "@/lib/mock";
import { MEDIA, IMG } from "@/lib/data";
import { Badge, Button, CountUp, Reveal, SectionHeading } from "@/components/ui";
import { Shell, SocialLinks } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import { Accessibility, ArrowRight, Eye, Globe2, Mail, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";

const VALUE_ICON: Record<string, React.ElementType> = { Eye, Sparkles, ShieldCheck, Accessibility };

const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;
const PIC = {
  crowd: u("photo-1540575467063-178a50c2df87"),
  stage: u("photo-1505373877841-8d25f7d46678"),
  team: u("photo-1522071820081-009f0129c71c"),
};
const OFFICE_PIC = [
  u("photo-1486406146926-c627a92ad1ab", 800),
  u("photo-1497366216548-37526070297c", 800),
  u("photo-1556761175-5973dc0f32e7", 800),
];

/** Lazy image with fallback so a broken URL never leaves an empty hole. */
function Img({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={alt} className={cn("bg-gradient-to-br from-brand-500/30 to-ink-900", className)} />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

export default function About() {
  return (
    <Shell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-950 pt-14">
        <img src={IMG.expoCenter} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/90 to-ink-950/70" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">About EventSphere</Badge>
              <h1 className="mt-5 max-w-2xl font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[46px]">
                The software layer behind the world's best expos.
              </h1>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-slate-300/90">{ABOUT.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact"><Button size="lg" iconRight={<ArrowRight className="size-4" />}>Talk to sales</Button></Link>
                <Link to="/register"><Button size="lg" variant="outline">Start free trial</Button></Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <Img src={PIC.crowd} alt="Visitors at an expo opening" className="h-[360px] w-full rounded-[28px] object-cover shadow-2xl shadow-black/40 ring-1 ring-white/15" />
              <div className="absolute -bottom-5 -left-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-xl backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-500/20 text-brand-200"><Users className="size-4.5" /></span>
                <div>
                  <p className="font-display text-[15px] font-bold leading-none text-white">3.2M+</p>
                  <p className="mt-1 text-[11px] text-white/50">attendee check-ins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 divide-white/10 border-t border-white/10 lg:grid-cols-4 lg:divide-x">
            {[
              { v: 480, l: "Editions delivered", s: "+" },
              { v: 12400, l: "Exhibitor teams", s: "+" },
              { v: 3.2, l: "Attendee check-ins", s: "M", d: 1 },
              { v: 14, l: "Countries", s: "" },
            ].map((x) => (
              <div key={x.l} className="px-2 py-7 lg:px-8 lg:first:pl-0">
                <p className="font-display text-[28px] font-extrabold leading-none text-white">
                  <CountUp to={x.v} decimals={x.d ?? 0} suffix={x.s} />
                </p>
                <p className="mt-2 text-[12px] text-white/50">{x.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <Img src={PIC.stage} alt="Keynote on the main stage" className="h-72 w-full rounded-[28px] object-cover shadow-xl shadow-slate-900/10 lg:h-[440px]" />
          </Reveal>
          <Reveal delay={100}>
            <div className="divide-y divide-slate-200">
              {[
                { icon: Eye, title: "Our mission", body: ABOUT.mission },
                { icon: Globe2, title: "Our vision", body: ABOUT.vision },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-5 py-8 first:pt-0 last:pb-0">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white"><Icon className="size-5" /></span>
                  <div>
                    <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-900">{title}</h2>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="What we stand for" title="Four values that shape every release" body="These are the tests we apply before anything ships to production." />
          <div className="mt-12 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.values.map((v, i) => {
              const Icon = VALUE_ICON[v.icon] ?? Sparkles;
              return (
                <div key={v.title} className={cn("p-7", i > 0 && "border-t border-slate-200 sm:border-t-0 sm:border-l", i === 2 && "sm:border-t lg:border-t-0 sm:border-l-0 lg:border-l", i === 3 && "sm:border-t lg:border-t-0")}>
                  <Icon className="size-6 text-brand-600" strokeWidth={1.75} />
                  <h3 className="mt-5 font-display text-[16px] font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{v.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Our story" title="Twelve years, 480 editions" body="From a 90-booth trade show in Dubai to a platform serving three continents." />
          <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
            {ABOUT.timeline.map((t, i) => {
              const last = i === ABOUT.timeline.length - 1;
              return (
                <div key={t.year} className="grid gap-2 py-6 sm:grid-cols-[130px_1fr] sm:gap-8">
                  <div className="flex items-center gap-3 sm:block">
                    <p className={cn("font-display text-[26px] font-extrabold tracking-tight", last ? "text-brand-600" : "text-slate-900")}>{t.year}</p>
                    {last && <Badge tone="brand" className="sm:mt-1">Today</Badge>}
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-bold text-slate-900">{t.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{t.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Leadership" title="The people behind the platform" body="A small team with deep event-production and engineering roots." />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.team.map((m) => (
              <article key={m.name} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/10">
                <div className="h-60 overflow-hidden bg-slate-100">
                  <Img src={m.avatar} alt={m.name} className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="font-display text-[16px] font-bold text-slate-900">{m.name}</p>
                  <p className="mt-0.5 text-[12.5px] font-medium text-brand-600">{m.role}</p>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">{m.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OFFICES + CTA */}
      <section className="relative isolate overflow-hidden bg-ink-950 py-20">
        <video autoPlay loop muted playsInline poster={MEDIA.heroPoster} className="absolute inset-0 -z-10 size-full object-cover opacity-20">
          <source src={MEDIA.conferenceVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink-950/93 via-ink-900/75 to-ink-950/95" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading light center eyebrow="Get in touch" title="Come and find us" body="Three offices, one team. We answer every message within one business day." />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {ABOUT.offices.map((o, i) => (
              <div key={o.city} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
                <Img src={OFFICE_PIC[i % OFFICE_PIC.length]} alt={`${o.city} office`} className="h-32 w-full object-cover opacity-80" />
                <div className="p-6">
                  <p className="flex items-center gap-2 font-display text-[17px] font-bold text-white">
                    <MapPin className="size-4 text-brand-200" /> {o.city}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-300">{o.address}</p>
                  <div className="mt-4 space-y-1.5 text-[12.5px] text-slate-400">
                    <p className="flex items-center gap-2"><Phone className="size-3.5" /> {o.phone}</p>
                    <p className="flex items-center gap-2"><Mail className="size-3.5" /> hello@eventsphere.io</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-9 text-center backdrop-blur">
            <p className="font-display text-[24px] font-bold tracking-tight text-white sm:text-[30px]">Ready to run your best expo yet?</p>
            <p className="max-w-lg text-[14.5px] leading-relaxed text-slate-300/90">
              Talk to our team about your next edition, or start a free 14-day trial and explore the platform yourself.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact"><Button size="lg" iconRight={<ArrowRight className="size-4.5" />}>Talk to sales</Button></Link>
              <Link to="/register"><Button size="lg" variant="outline">Start free trial</Button></Link>
            </div>
            <SocialLinks light />
          </div>
        </div>
      </section>
    </Shell>
  );
}