import { useEffect, useMemo, useState } from "react";
import { SESSIONS, type Session } from "@/lib/data";
import { IMG } from "@/lib/data";
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import { SessionCard } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Bell, BellRing, CalendarDays, Download, Filter, Layers, MapPin, Mic2, Search, Users, X } from "lucide-react";
import { fetchLiveSessions } from "@/lib/liveApi";

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString("en-US", opts);

export default function SchedulePage() {
  const { bookmarks, toast } = useStore();
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);
  const [day, setDay] = useState("All");
  const [track, setTrack] = useState("All");
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);

  useEffect(() => {
    fetchLiveSessions().then((data) => {
      if (data && data.length > 0) setSessions(data);
    });
  }, []);

  const TRACKS = ["All", ...Array.from(new Set(sessions.map((s) => s.track)))];
  const TYPES = ["All", "Keynote", "Workshop", "Panel", "Demo", "Roundtable"];
  const days = Array.from(new Set(sessions.map((s) => s.day)));
  const speakerCount = new Set(sessions.map((s) => s.speaker)).size;

  const list = useMemo(
    () =>
      sessions.filter((s) => {
        const hay = `${s.title} ${s.speaker} ${s.role || ""} ${s.stage} ${s.track}`.toLowerCase();
        return (
          (day === "All" || s.day === day) &&
          (track === "All" || s.track === track) &&
          (type === "All" || s.type === type) &&
          (!q || hay.includes(q.toLowerCase())) &&
          (!onlySaved || bookmarks.includes(s.id))
        );
      }),
    [sessions, day, track, type, q, onlySaved, bookmarks]
  );

  const grouped = days
    .filter((d) => list.some((s) => s.day === d))
    .map((d) => ({ day: d, items: list.filter((s) => s.day === d) }));

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    list.forEach((s) => m.set(s.stage, (m.get(s.stage) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [list]);

  const hasFilters = day !== "All" || track !== "All" || type !== "All" || !!q || onlySaved;
  const clearAll = () => { setQ(""); setTrack("All"); setType("All"); setDay("All"); setOnlySaved(false); };

  return (
    <Shell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-950 pt-14">
        <img src={IMG.expoCenter} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/92 to-ink-950/75" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">Programme</Badge>
          <h1 className="mt-5 max-w-2xl font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[46px]">
            Plan your days, one session at a time.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-slate-300/90">
            {sessions.length} sessions across {days.length} days and {TRACKS.length - 1} tracks. Bookmark anything and we will remind you 45 minutes before it starts.
          </p>

          <div className="mt-12 grid grid-cols-2 divide-white/10 border-t border-white/10 lg:grid-cols-4 lg:divide-x">
            {[
              { i: Mic2, v: sessions.length, l: "Sessions" },
              { i: CalendarDays, v: days.length, l: "Days" },
              { i: Layers, v: TRACKS.length - 1, l: "Tracks" },
              { i: Users, v: speakerCount, l: "Speakers" },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-4 px-2 py-6 lg:px-8 lg:first:pl-0">
                <s.i className="size-6 text-brand-200" strokeWidth={1.6} />
                <div>
                  <p className="font-display text-[26px] font-extrabold leading-none text-white">{s.v}</p>
                  <p className="mt-1.5 text-[12px] text-white/50">{s.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="sticky top-16.5 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* day picker */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
            {[{ id: "All", top: "All days", sub: `${sessions.length} sessions` }, ...days.map((d) => {
              const first = sessions.find((s) => s.day === d)!;
              return { id: d, top: d, sub: fmt(first.date, { weekday: "short", month: "short", day: "numeric" }) };
            })].map((d) => (
              <button
                key={d.id}
                onClick={() => setDay(d.id)}
                aria-pressed={day === d.id}
                className={cn(
                  "shrink-0 rounded-xl border px-4 py-2 text-left transition",
                  day === d.id ? "border-ink-950 bg-ink-950 text-white shadow-md shadow-slate-900/15" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <p className="text-[13px] font-bold leading-tight">{d.top}</p>
                <p className={cn("mt-0.5 text-[11.5px] leading-tight", day === d.id ? "text-white/60" : "text-slate-400")}>{d.sub}</p>
              </button>
            ))}
          </div>

          {/* filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sessions, speakers…"
                aria-label="Search sessions"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Select value={track} onChange={(e) => setTrack(e.target.value)} className="h-10 min-w-[150px]" aria-label="Track">
              {TRACKS.map((t) => <option key={t} value={t}>{t === "All" ? "All tracks" : t}</option>)}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="h-10 min-w-[140px]" aria-label="Format">
              {TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All formats" : t}</option>)}
            </Select>
            <button
              onClick={() => setOnlySaved((v) => !v)}
              aria-pressed={onlySaved}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold transition",
                onlySaved ? "bg-brand-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Bell className="size-4" /> Saved ({bookmarks.length})
            </button>
            {hasFilters && (
              <button onClick={clearAll} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
                <X className="size-3.5" /> Clear
              </button>
            )}
            <span className="ml-auto hidden text-[12.5px] text-slate-500 md:block">
              Showing <span className="font-semibold text-slate-800">{list.length}</span> of {sessions.length}
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-slate-50/70 py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
          <div className="min-w-0">
            {grouped.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Filter className="size-6" />}
                  title="No sessions match your filters"
                  body="Try clearing the search or switching to a different track or format."
                  action={<Button variant="secondary" onClick={clearAll}>Clear filters</Button>}
                />
              </Card>
            ) : (
              <div className="space-y-12">
                {grouped.map((g) => (
                  <div key={g.day}>
                    <div className="mb-5 flex items-center gap-4 border-b border-slate-200 pb-4">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-950 text-white shadow-lg shadow-slate-900/15">
                        <div className="text-center">
                          <p className="font-display text-[20px] font-extrabold leading-none">{fmt(g.items[0].date, { day: "numeric" })}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">{fmt(g.items[0].date, { month: "short" })}</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-900">{g.day}</h2>
                        <p className="text-[13px] text-slate-500">
                          {fmt(g.items[0].date, { weekday: "long" })} · {g.items.length} {g.items.length === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                      <div className="ml-auto hidden flex-wrap justify-end gap-1.5 xl:flex">
                        {Array.from(new Set(g.items.map((i) => i.stage))).slice(0, 3).map((st) => (
                          <Badge key={st} tone="neutral">{st}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="relative space-y-3.5 sm:pl-8">
                      <span className="absolute bottom-3 left-[7px] top-3 hidden w-px bg-slate-200 sm:block" aria-hidden />
                      {g.items.map((s) => (
                        <div key={s.id} className="relative">
                          <span className="absolute -left-[30px] top-7 hidden size-3.5 rounded-full border-[3px] border-slate-50 bg-brand-500 ring-1 ring-brand-200 sm:block" aria-hidden />
                          <SessionCard s={s} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-60 space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><BellRing className="size-5" /></span>
                  <div>
                    <p className="font-display text-[15px] font-bold text-slate-900">Your agenda</p>
                    <p className="text-[12px] text-slate-500">{bookmarks.length} saved {bookmarks.length === 1 ? "session" : "sessions"}</p>
                  </div>
                </div>
                <p className="mt-3.5 text-[12.5px] leading-relaxed text-slate-600">
                  Saved sessions are reminded 45 minutes before they start. Export them to your own calendar anytime.
                </p>
                <div className="mt-4 grid gap-2">
                  <Button size="sm" variant="secondary" full onClick={() => setOnlySaved(true)}>View saved</Button>
                  <Button size="sm" full icon={<Download className="size-4" />} onClick={() => toast({ title: "Agenda exported to your calendar", tone: "success" })}>
                    Export to calendar
                  </Button>
                </div>
              </Card>

              {stageCounts.length > 0 && (
                <Card className="p-5">
                  <p className="font-display text-[15px] font-bold text-slate-900">Stages</p>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {stageCounts.map(([st, n]) => (
                      <li key={st} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                        <span className="flex min-w-0 items-center gap-2 text-slate-700">
                          <MapPin className="size-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{st}</span>
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">{n}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}