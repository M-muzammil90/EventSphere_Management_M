import { Link } from "react-router-dom";
import { EXPOS } from "@/lib/data";
import { Button, Reveal } from "@/components/ui";
import { cn } from "@/utils/cn";
import { ArrowRight, CalendarDays, Check, MapPin } from "lucide-react";

/* If your two image lines already work, keep yours and only replace the rest of this file. */
import heroBackground from "@/public/images/hero-background.jpg";
import heroStage from "@/public/images/hero-stage.jpg";

const TRUST = ["14-day free trial", "No credit card", "Cancel anytime"];

const STATS = [
  { value: "480+", label: "Events hosted worldwide" },
  { value: "12,400+", label: "Exhibitors on the platform" },
  { value: "3.2M+", label: "Attendee check-ins" },
  { value: "99.9%", label: "Customer satisfaction" },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function CinematicHero() {
  const featured = EXPOS[0];

  return (
    <section aria-labelledby="hero-title" className="bg-white">
      {/* one slow settle-in on load; skipped for people who prefer reduced motion */}
      <style>{`
        @keyframes hero-settle{from{transform:scale(1.08)}to{transform:scale(1)}}
        @media (prefers-reduced-motion:no-preference){.hero-settle{animation:hero-settle 2.4s cubic-bezier(.2,.7,.2,1) both}}
      `}</style>

      {/* ============================ photo stage ============================ */}
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-[26px] bg-ink-950 sm:rounded-[32px] lg:min-h-[calc(100svh-66px-190px)]">
          {/* background photo */}
          <img
            src={heroBackground}
            alt=""
            fetchPriority="high"
            className="hero-settle absolute inset-0 -z-20 size-full object-cover"
          />

          {/* overlays: soft brand tint, dark base for the text, and a left fade */}
          <div className="absolute inset-0 -z-10 bg-brand-800/15" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(11,14,29,.92)_0%,rgba(11,14,29,.5)_42%,rgba(11,14,29,.1)_75%,rgba(11,14,29,.3)_100%)]" />
          <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(11,14,29,.6)_0%,rgba(11,14,29,0)_62%)] lg:block" />

          <div className="mt-auto grid items-end gap-10 px-6 pb-8 pt-40 sm:px-9 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_352px] lg:gap-16 lg:px-12 lg:pb-12 lg:pt-12">
            {/* ---------------- message ---------------- */}
            <Reveal>
              <div className="max-w-[44rem]">
                <h1
                  id="hero-title"
                  style={{ fontSize: "clamp(2.25rem, min(1rem + 4.6vw, 9svh), 4.75rem)" }}
                  className="font-display font-extrabold leading-[1.05] tracking-[-0.03em] text-white"
                >
                  Expos that move industries forward.
                </h1>

                <p className="mt-5 max-w-[34rem] text-base leading-[1.7] text-white/85 sm:text-[17px]">
                  Plan, sell and run your events on one connected platform, from the first booth reservation to the
                  final lead report.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/expos">
                    <Button size="lg" className="h-13 w-full px-7 sm:w-auto" iconRight={<ArrowRight className="size-4.5" />}>
                      Explore upcoming expos
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 w-full border-white/40 bg-white/10 px-7 backdrop-blur-sm sm:w-auto"
                    >
                      Book a live demo
                    </Button>
                  </Link>
                </div>

                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  {TRUST.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] font-medium text-white/80">
                      <Check className="size-4 text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* ---------------- featured expo card ---------------- */}
            <div className="hidden lg:block">
              <Reveal delay={200} y={16}>
                <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_30px_70px_-24px_rgba(5,6,20,.75)] ring-1 ring-white/30">
                  {/* header image — cropped to the stage's geometric wall so no stray text shows */}
                  <div className="relative h-[150px] overflow-hidden bg-ink-950">
                    <img
                      src={heroStage}
                      alt=""
                      loading="eager"
                      className="size-full origin-[92%_58%] scale-[1.9] object-cover object-right"
                    />
                    <div className="absolute inset-0 bg-brand-600 mix-blend-color" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand-700 shadow-sm">
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Next expo
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900">
                      Global Expo 2026
                    </h2>

                    <dl className="mt-3 space-y-2 text-[13.5px] text-slate-600">
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
                        <dt className="sr-only">Dates</dt>
                        <dd>18–21 March 2026</dd>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="size-4 text-slate-400" aria-hidden="true" />
                        <dt className="sr-only">Venue</dt>
                        <dd>Dubai, UAE</dd>
                      </div>
                    </dl>

                    <Link to={`/expos/${featured.slug}`} className={cn("mt-5 block rounded-xl", focusRing, "focus-visible:outline-brand-500")}>
                      <Button full iconRight={<ArrowRight className="size-4" />}>
                        Reserve a booth
                      </Button>
                    </Link>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* ============================ stats ============================ */}
      <dl className="content-wrap grid grid-cols-2 gap-y-8 pb-10 pt-6 sm:grid-cols-4 sm:gap-y-0 sm:pb-12 sm:pt-7">
        {STATS.map((stat, i) => (
          <div key={stat.label} className={cn("sm:px-8 sm:first:pl-0", i > 0 && "sm:border-l sm:border-slate-200")}>
            <dd className="font-display text-[32px] font-extrabold leading-none tracking-[-0.03em] text-slate-900 sm:text-[40px]">
              {stat.value}
            </dd>
            <dt className="mt-2 max-w-[11rem] text-[13.5px] leading-snug text-slate-500">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}