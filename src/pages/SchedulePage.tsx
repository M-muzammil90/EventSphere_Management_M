import { useEffect, useMemo, useState } from "react";
import { SESSIONS, type Session } from "@/lib/data";
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import { SessionCard } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Bell,
  BellRing,
  CalendarDays,
  Download,
  Filter,
  Layers,
  MapPin,
  Mic2,
  Search,
  Users,
  X,
} from "lucide-react";
import { fetchLiveSessions } from "@/lib/liveApi";

const fmtDate = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString("en-US", opts);

export default function SchedulePage() {
  const { bookmarks, toast } = useStore();
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);
  const [day, setDay] = useState("All");
  const [track, setTrack] = useState("All");
  const [type, setType] = useState("All");
  const [stage, setStage] = useState("All");
  const [q, setQ] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);

  useEffect(() => {
    fetchLiveSessions().then((data) => {
      if (data && data.length > 0) setSessions(data);
    });
  }, []);

  const TRACKS = useMemo(
    () => ["All", ...Array.from(new Set(sessions.map((s) => s.track)))],
    [sessions]
  );
  const TYPES = ["All", "Keynote", "Workshop", "Panel", "Demo", "Roundtable"];
  const days = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.day))),
    [sessions]
  );
  const speakerCount = useMemo(
    () => new Set(sessions.map((s) => s.speaker)).size,
    [sessions]
  );

  const list = useMemo(
    () =>
      sessions.filter((s) => {
        const hay = `${s.title} ${s.speaker} ${s.role || ""} ${s.stage} ${s.track}`.toLowerCase();
        return (
          (day === "All" || s.day === day) &&
          (track === "All" || s.track === track) &&
          (type === "All" || s.type === type) &&
          (stage === "All" || s.stage === stage) &&
          (!q || hay.includes(q.toLowerCase())) &&
          (!onlySaved || bookmarks.includes(s.id))
        );
      }),
    [sessions, day, track, type, stage, q, onlySaved, bookmarks]
  );

  const grouped = useMemo(
    () =>
      days
        .filter((d) => list.some((s) => s.day === d))
        .map((d) => ({ day: d, items: list.filter((s) => s.day === d) })),
    [days, list]
  );

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    sessions.forEach((s) => m.set(s.stage, (m.get(s.stage) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const hasFilters =
    day !== "All" ||
    track !== "All" ||
    type !== "All" ||
    stage !== "All" ||
    !!q ||
    onlySaved;

  const clearAll = () => {
    setQ("");
    setTrack("All");
    setType("All");
    setDay("All");
    setStage("All");
    setOnlySaved(false);
  };

  return (
    <Shell>
      {/* ============================== EDITORIAL HEADER ============================== */}
      <header className="border-b border-slate-200/80 bg-white pt-10 pb-10 sm:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
                Event Programme
              </div>
              <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[46px]">
                Plan your days, one session at a time.
              </h1>
              <p className="mt-3.5 max-w-xl text-[15.5px] leading-relaxed text-slate-600">
                Explore {sessions.length} keynotes, hands-on workshops, and roundtables across{" "}
                {days.length} days. Save sessions to build your personal agenda with automatic
                45-minute reminders.
              </p>
            </div>

            {/* Clean Architectural Stat Strip */}
            <dl className="grid grid-cols-2 divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-[#FAFAFA] sm:grid-cols-4 sm:divide-x sm:divide-y-0 lg:col-span-5">
              {[
                { icon: Mic2, val: sessions.length, label: "Sessions" },
                { icon: CalendarDays, val: days.length, label: "Days" },
                { icon: Layers, val: Math.max(1, TRACKS.length - 1), label: "Tracks" },
                { icon: Users, val: speakerCount, label: "Speakers" },
              ].map((stat) => (
                <div key={stat.label} className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <stat.icon className="size-3.5 text-brand-600" />
                    <dt className="text-[11.5px] font-medium text-slate-500">{stat.label}</dt>
                  </div>
                  <dd className="mt-1.5 font-display text-[22px] font-extrabold leading-none text-slate-950 tabular-nums">
                    {stat.val}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* ============================== STICKY FILTER & DAY BAR ============================== */}
      <section className="sticky top-16 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Top Row: Segmented Day Tabs + Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
              {[
                { id: "All", label: "All Days", meta: `${sessions.length}` },
                ...days.map((d) => {
                  const first = sessions.find((s) => s.day === d)!;
                  return {
                    id: d,
                    label: d,
                    meta: fmtDate(first.date, { month: "short", day: "numeric" }),
                  };
                }),
              ].map((d) => {
                const active = day === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDay(d.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition",
                      active
                        ? "border-ink-950 bg-ink-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span>{d.label}</span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                        active ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {d.meta}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="hidden text-[13px] text-slate-500 md:block tabular-nums">
              Showing <span className="font-semibold text-slate-950">{list.length}</span> of{" "}
              {sessions.length} sessions
            </p>
          </div>

          {/* Bottom Row: Search + Selectors + Saved Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, speaker, or stage…"
                aria-label="Search sessions"
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#FAFAFA] pl-9 pr-3 text-[13.5px] text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <Select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="h-10 min-w-[155px]"
              aria-label="Track"
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All tracks" : t}
                </option>
              ))}
            </Select>

            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 min-w-[145px]"
              aria-label="Format"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All formats" : t}
                </option>
              ))}
            </Select>

            <button
              type="button"
              onClick={() => setOnlySaved((v) => !v)}
              aria-pressed={onlySaved}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition",
                onlySaved
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Bell className="size-3.5" />
              <span>Saved</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                  onlySaved ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {bookmarks.length}
              </span>
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-10 items-center gap-1 rounded-xl px-2.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-950"
              >
                <X className="size-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================== MAIN TIMELINE & SIDEBAR ============================== */}
      <main className="bg-[#FAFAFA] py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:px-8">
          {/* LEFT: GROUPED SESSIONS */}
          <div className="min-w-0">
            {grouped.length === 0 ? (
              <Card className="border-slate-200/90 bg-white">
                <EmptyState
                  icon={<Filter className="size-6" />}
                  title="No matching sessions"
                  body="Adjust your track, stage, or search keywords to explore the full programme."
                  action={
                    <Button variant="secondary" onClick={clearAll}>
                      Reset all filters
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-12">
                {grouped.map((g) => {
                  const firstSession = g.items[0];
                  const stagesOnDay = Array.from(new Set(g.items.map((i) => i.stage)));

                  return (
                    <section key={g.day} aria-label={g.day}>
                      {/* Day Header */}
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-950 text-white">
                            <span className="font-display text-[17px] font-extrabold leading-none tabular-nums">
                              {fmtDate(firstSession.date, { day: "2-digit" })}
                            </span>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                              {fmtDate(firstSession.date, { month: "short" })}
                            </span>
                          </div>

                          <div>
                            <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-950">
                              {g.day}
                            </h2>
                            <p className="text-[13px] text-slate-500">
                              {fmtDate(firstSession.date, { weekday: "long" })} · {g.items.length}{" "}
                              {g.items.length === 1 ? "session" : "sessions"}
                            </p>
                          </div>
                        </div>

                        <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                          {stagesOnDay.slice(0, 3).map((st) => (
                            <Badge key={st} tone="neutral">
                              {st}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Sessions Rail */}
                      <div className="relative space-y-3 sm:pl-6">
                        <span
                          className="absolute bottom-4 left-[5px] top-4 hidden w-px bg-slate-200 sm:block"
                          aria-hidden="true"
                        />
                        {g.items.map((s) => (
                          <div key={s.id} className="relative">
                            <span
                              className="absolute -left-[22px] top-7 hidden size-2.5 rounded-full bg-brand-600 ring-4 ring-[#FAFAFA] sm:block"
                              aria-hidden="true"
                            />
                            <SessionCard s={s} />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: STICKY AGENDA & INTERACTIVE STAGE FILTER */}
          <aside className="hidden lg:sticky lg:top-44 lg:block">
            <div className="space-y-5">
              {/* Signature Dark Agenda Block (Matches Home & ExpoDetail rhythm) */}
              <div className="relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(104,84,217,.28),transparent_65%)]"
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-brand-300">
                      <BellRing className="size-5" />
                    </span>
                    <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-white/90 tabular-nums">
                      {bookmarks.length} SAVED
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[18px] font-bold tracking-tight text-white">
                    Personal Agenda
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300/80">
                    Bookmark talks to receive alerts 45 minutes prior to start time, or sync directly
                    with your calendar.
                  </p>

                  <div className="mt-5 space-y-2">
                    <Button
                      size="sm"
                      full
                      icon={<Download className="size-4" />}
                      onClick={() =>
                        toast({
                          title: "Calendar file downloaded",
                          body: "Your saved sessions (.ics) are ready to import.",
                          tone: "success",
                        })
                      }
                    >
                      Export .ICS Calendar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setOnlySaved((v) => !v)}
                      className="w-full rounded-xl border border-white/15 bg-white/[0.05] py-2 text-[12.5px] font-semibold text-white transition hover:bg-white/10"
                    >
                      {onlySaved ? "Show full programme" : "Filter saved sessions"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Stages Filter Card */}
              {stageCounts.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[15px] font-bold text-slate-950">
                      Venue Stages
                    </h3>
                    {stage !== "All" && (
                      <button
                        type="button"
                        onClick={() => setStage("All")}
                        className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        All stages
                      </button>
                    )}
                  </div>

                  <ul className="mt-3 space-y-1">
                    {stageCounts.map(([st, count]) => {
                      const active = stage === st;
                      return (
                        <li key={st}>
                          <button
                            type="button"
                            onClick={() => setStage(active ? "All" : st)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] transition",
                              active
                                ? "bg-brand-50 font-semibold text-brand-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <MapPin
                                className={cn(
                                  "size-3.5 shrink-0",
                                  active ? "text-brand-600" : "text-slate-400"
                                )}
                              />
                              <span className="truncate">{st}</span>
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                                active
                                  ? "bg-brand-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {count}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </Shell>
  );
}