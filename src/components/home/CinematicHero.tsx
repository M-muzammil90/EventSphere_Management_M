import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, IMG, EXPOS } from "@/lib/data";
import { Button, Reveal } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Pause,
  Play,
  SkipForward,
  Star,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

const SCENES = [
  { src: MEDIA.heroVideo, poster: MEDIA.heroPoster, label: "Expo floor" },
  { src: MEDIA.conferenceVideo, poster: IMG.expoTech, label: "Conference" },
];

const SCENE_MS = 14000;
const TRUST = ["14-day free trial", "No credit card", "Cancel anytime"];

const STATS = [
  { value: "480+", label: "Events worldwide", icon: CalendarDays },
  { value: "12,400+", label: "Exhibitors", icon: Users },
  { value: "3.2M+", label: "Attendees", icon: Building2 },
  { value: "99.9%", label: "Satisfaction rate", icon: Star },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const controlBtn = cn(
  "grid size-9 place-items-center rounded-lg text-white/85 transition hover:bg-white/10 hover:text-white",
  focusRing
);

export default function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [inView, setInView] = useState(true);
  const running = playing && inView;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i === active && running) video.play().catch(() => undefined);
      else video.pause();
    });
  }, [active, running]);

  useEffect(() => {
    videos.current.forEach((video) => {
      if (video) video.muted = muted;
    });
  }, [muted]);

  const next = () => setActive((v) => (v + 1) % SCENES.length);
  const featured = EXPOS[0];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[calc(100svh-66px)] flex-col overflow-hidden bg-ink-950"
    >
      <style>{`@keyframes hero-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>

      {/* ---------- background video ---------- */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {SCENES.map((scene, i) => (
          <video
            key={scene.src}
            ref={(el) => {
              videos.current[i] = el;
            }}
            muted
            loop
            playsInline
            tabIndex={-1}
            preload={i === 0 ? "auto" : "metadata"}
            poster={scene.poster}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-[1400ms]",
              active === i ? "opacity-100" : "opacity-0"
            )}
          >
            <source src={scene.src} type="video/mp4" />
          </video>
        ))}
      </div>

      {/* ---------- overlays: smooth fade so text is always readable, video clear on the right ---------- */}
      <div className="absolute inset-0 -z-10 bg-ink-950/45 sm:bg-ink-950/10" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(15,18,38,.96)_0%,rgba(24,28,58,.9)_28%,rgba(47,38,104,.55)_55%,rgba(11,14,29,0)_82%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink-950/80 to-transparent" />

      {/* ---------- main content ---------- */}
      <div className="content-wrap relative flex flex-1 items-center py-12 sm:py-16 lg:py-20">
        <div className="grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          {/* left: message */}
          <Reveal>
            <div className="max-w-[52rem]">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-white backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                The operating system for modern expos
              </p>

              {/* fluid: scales with width and height, so it always fits the screen */}
              <h1
                id="hero-title"
                style={{ fontSize: "clamp(2.125rem, min(1rem + 5.2vw, 10svh), 5.25rem)" }}
                className="mt-6 font-display font-extrabold leading-[1.03] tracking-[-0.045em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,.35)] sm:mt-7"
              >
                Expos that move
                <span className="block text-gradient">industries forward.</span>
              </h1>

              <p className="mt-6 max-w-[36rem] text-base leading-[1.7] text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,.4)] sm:text-[17px] lg:text-lg">
                Plan, sell and run extraordinary events on one connected platform, from the first booth
                reservation to the final lead report.
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

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
                {TRUST.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] font-medium text-white/85">
                    <Check className="size-4 text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* right: featured expo + video controls, aligned to the bottom of the message */}
          <div className="flex flex-col gap-4 lg:items-stretch">
            <div className="hidden lg:block">
              <Reveal delay={200} y={16}>
                <Link
                  to={`/expos/${featured.slug}`}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border border-white/25 bg-white p-4 shadow-[0_20px_50px_-18px_rgba(10,12,30,.6)] transition-transform hover:-translate-y-1",
                    focusRing
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <CalendarDays className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold leading-tight text-slate-900">Global Expo 2026</p>
                    <p className="mt-1 text-[13px] text-slate-500">18–21 March · Dubai, UAE</p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* progress bars also drive the auto-advance, so pause/resume stays in sync */}
              <div className="flex items-center gap-2" role="group" aria-label="Background videos">
                {SCENES.map((scene, i) => (
                  <button
                    key={scene.src}
                    onClick={() => setActive(i)}
                    aria-label={`Show ${scene.label} video`}
                    aria-current={active === i}
                    className={cn("group py-3", focusRing)}
                  >
                    <span className="block h-[3px] w-12 overflow-hidden rounded-full bg-white/30 transition group-hover:bg-white/45">
                      {active === i && (
                        <span
                          key={active}
                          onAnimationEnd={next}
                          style={{
                            animation: `hero-progress ${SCENE_MS}ms linear forwards`,
                            animationPlayState: running ? "running" : "paused",
                          }}
                          className="block size-full origin-left rounded-full bg-white"
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-0.5 rounded-xl border border-white/20 bg-ink-950/40 p-1 backdrop-blur-md">
                <button
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? "Pause background video" : "Play background video"}
                  className={controlBtn}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <button
                  onClick={() => setMuted((v) => !v)}
                  aria-label={muted ? "Unmute background video" : "Mute background video"}
                  className={controlBtn}
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <button onClick={next} aria-label="Next background video" className={controlBtn}>
                  <SkipForward className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- stats bar ---------- */}
      <div className="relative border-t border-white/15 bg-ink-950/60 backdrop-blur-md">
        <dl className="content-wrap grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-white/10">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex items-center gap-3.5 px-2 py-4 sm:px-6 sm:py-5 sm:first:pl-0",
                i % 2 === 1 && "border-l border-white/10 sm:border-l-0",
                i < 2 && "border-b border-white/10 sm:border-b-0"
              )}
            >
              <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200 sm:grid">
                <stat.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 pl-2 sm:pl-0">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-[22px] font-extrabold leading-none tracking-[-.03em] text-white sm:text-[28px]">
                  {stat.value}
                </dd>
                <p className="mt-1.5 text-[13px] leading-none text-white/70" aria-hidden="true">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}