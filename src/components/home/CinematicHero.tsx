import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, IMG, EXPOS } from "@/lib/data";
import { Button, Reveal } from "@/components/ui";
import { cn } from "@/utils/cn";
import { ArrowRight, Building2, CalendarDays, Check, Pause, Play, SkipForward, Star, Users, Volume2, VolumeX } from "lucide-react";

const SCENES = [
  { src: MEDIA.heroVideo, poster: MEDIA.heroPoster },
  { src: MEDIA.conferenceVideo, poster: IMG.expoTech },
];

export default function CinematicHero() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive((v) => (v + 1) % SCENES.length), 14000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i === active && playing) video.play().catch(() => undefined);
      else video.pause();
    });
  }, [active, playing]);

  return (
    <section className="relative isolate min-h-[calc(100svh-66px)] overflow-hidden bg-ink-950">
      {/* clear, full-bleed cinematic video */}
      <div className="absolute inset-0 -z-20">
        {SCENES.map((scene, i) => (
          <video
            key={scene.src}
            ref={(el) => { videos.current[i] = el; }}
            muted={muted}
            loop
            playsInline
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

      {/* light cinematic treatment — video stays clearly visible */}
      <div className="absolute inset-0 -z-10 bg-ink-950/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,28,53,.94)_0%,rgba(57,45,124,.72)_42%,rgba(11,14,29,.1)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent" />

      <div className="content-wrap relative flex min-h-[calc(100svh-66px)] items-center pb-36 pt-16 sm:pb-32 sm:pt-20">
        <div className="max-w-[760px]">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink-950/20 px-3.5 py-2 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold tracking-wide text-white/80">The operating system for modern expos</span>
            </div>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="mt-7 font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.052em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,.3)] sm:text-[62px] lg:text-[72px]">
              Expos that move
              <span className="mt-1 block text-gradient">industries forward.</span>
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <p className="mt-6 max-w-[590px] text-[16px] leading-[1.8] text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,.35)] sm:text-[18px]">
              Plan, sell and run extraordinary events with one beautifully connected platform —
              from the first booth reservation to the final lead report.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/expos">
                <Button size="lg" className="h-13 w-full px-7 sm:w-auto" iconRight={<ArrowRight className="size-4.5" />}>
                  Explore upcoming expos
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="h-13 w-full border-white/30 bg-ink-950/15 px-7 backdrop-blur-sm sm:w-auto">
                  Book a live demo
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={230}>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {["14-day free trial", "No credit card", "Cancel anytime"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[11px] font-medium text-white/65">
                  <Check className="size-3.5 text-emerald-400" strokeWidth={2.5} /> {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* floating event card */}
      <div className="absolute right-[7%] top-[16%] hidden lg:block">
        <Reveal delay={220} y={16}>
          <Link to={`/expos/${EXPOS[0].slug}`} className="flex w-[190px] items-center gap-3 rounded-2xl border border-white/20 bg-white p-4 shadow-[0_18px_50px_-16px_rgba(23,28,53,.45)] transition-transform hover:-translate-y-1">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><CalendarDays className="size-5" /></span>
            <div className="min-w-0">
              <p className="font-display text-[13px] font-bold text-slate-900">Global Expo 2026</p>
              <p className="mt-1 text-[9px] font-medium text-slate-500">18–21 March · Dubai, UAE</p>
            </div>
            <ArrowRight className="ml-auto size-3.5 shrink-0 text-slate-400" />
          </Link>
        </Reveal>
      </div>

      {/* unobtrusive video controls */}
      <div className="absolute bottom-[104px] right-4 z-10 flex items-center gap-1 rounded-xl border border-white/15 bg-ink-950/25 p-1.5 backdrop-blur-md sm:right-6 lg:right-8">
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause background video" : "Play background video"}
          className="grid size-8 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button
          onClick={() => setMuted((v) => !v)}
          aria-label={muted ? "Unmute background video" : "Mute background video"}
          className="grid size-8 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </button>
        <button
          onClick={() => setActive((active + 1) % SCENES.length)}
          aria-label="Next background video"
          className="grid size-8 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="size-3.5" />
        </button>
      </div>

      {/* restrained metrics */}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-ink-950/45 backdrop-blur-md">
        <div className="content-wrap grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          {[
            { value: "480+", label: "Events worldwide", icon: CalendarDays },
            { value: "12,400+", label: "Exhibitors", icon: Users },
            { value: "3.2M+", label: "Attendees", icon: Building2 },
            { value: "99.9%", label: "Satisfaction rate", icon: Star },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-3 px-3 py-5 sm:justify-start sm:px-5 sm:py-6">
              <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-white/8 text-brand-200 sm:grid"><stat.icon className="size-4" /></span>
              <div className="text-center sm:text-left">
                <p className="font-display text-[20px] font-extrabold tracking-[-.03em] text-white sm:text-[24px]">{stat.value}</p>
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.1em] text-white/40 sm:text-[9px]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
