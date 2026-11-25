import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "@/components/SiteLayout";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { fetchLiveSessions } from "@/lib/liveApi";
import { type Session } from "@/lib/data";
import { cn } from "@/utils/cn";
import {
  ArrowUpRight,
  CalendarClock,
  Layers,
  MapPin,
  Mic,
  Search,
  Users,
  X,
} from "lucide-react";

interface SpeakerProfile {
  name: string;
  role: string;
  company: string;
  avatar: string;
  sessions: Session[];
  tracks: string[];
}

export default function SpeakersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("All");

  useEffect(() => {
    fetchLiveSessions()
      .then((data) => setSessions(data || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const speakers = useMemo<SpeakerProfile[]>(() => {
    const map = new Map<string, SpeakerProfile>();

    sessions.forEach((s) => {
      const speakerName = s.speaker || "Distinguished Speaker";
      if (!map.has(speakerName)) {
        map.set(speakerName, {
          name: speakerName,
          role: s.speakerRole || "Keynote Presenter",
          company: s.company || "Industry Pioneer",
          avatar:
            s.avatar ||
            "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
          sessions: [],
          tracks: [],
        });
      }
      const entry = map.get(speakerName)!;
      entry.sessions.push(s);
      if (s.track && !entry.tracks.includes(s.track)) {
        entry.tracks.push(s.track);
      }
    });

    return Array.from(map.values());
  }, [sessions]);

  const allTracks = useMemo(() => {
    const set = new Set<string>();
    speakers.forEach((sp) => sp.tracks.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [speakers]);

  const filteredSpeakers = useMemo(() => {
    return speakers.filter((sp) => {
      const hay = `${sp.name} ${sp.role} ${sp.company} ${sp.tracks.join(" ")}`.toLowerCase();
      const matchQ = !q || hay.includes(q.toLowerCase());
      const matchTrack = track === "All" || sp.tracks.includes(track);
      return matchQ && matchTrack;
    });
  }, [speakers, q, track]);

  const hasFilters = !!q || track !== "All";
  const clearFilters = () => {
    setQ("");
    setTrack("All");
  };

  return (
    <Shell>
      {/* ============================== EDITORIAL HEADER ============================== */}
      <header className="border-b border-slate-200/80 bg-white pt-10 pb-10 sm:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="inline-flex rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
                Speaker Lineup
              </span>
              <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-950 sm:text-[46px]">
                Keynotes & industry leaders.
              </h1>
              <p className="mt-3.5 max-w-2xl text-[15.5px] leading-relaxed text-slate-600">
                Meet the founders, operators, and technical leads sharing practical playbooks
                across EventSphere stages.
              </p>
            </div>

            {/* Compact Metric Strip */}
            <dl className="grid grid-cols-2 divide-x divide-slate-100 rounded-2xl border border-slate-200/90 bg-[#FAFAFA] lg:col-span-4">
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="size-3.5 text-brand-600" />
                  <dt className="text-[11.5px] font-medium text-slate-500">Speakers</dt>
                </div>
                <dd className="mt-1.5 font-display text-[22px] font-extrabold leading-none text-slate-950 tabular-nums">
                  {speakers.length}
                </dd>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Layers className="size-3.5 text-brand-600" />
                  <dt className="text-[11.5px] font-medium text-slate-500">Tracks</dt>
                </div>
                <dd className="mt-1.5 font-display text-[22px] font-extrabold leading-none text-slate-950 tabular-nums">
                  {Math.max(0, allTracks.length - 1)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* ============================== FILTER BAR ============================== */}
      <section className="sticky top-16 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, company, or topic…"
                aria-label="Search speakers"
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#FAFAFA] pl-9 pr-3 text-[13.5px] text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-1 rounded-xl px-2.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-950"
                >
                  <X className="size-3.5" />
                  Reset
                </button>
              )}
              <span className="text-[13px] text-slate-500 tabular-nums">
                <span className="font-semibold text-slate-950">{filteredSpeakers.length}</span> of{" "}
                {speakers.length} speakers
              </span>
            </div>
          </div>

          {/* Track Pills */}
          {allTracks.length > 1 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
              {allTracks.map((t) => {
                const active = track === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrack(t)}
                    aria-pressed={active}
                    className={cn(
                      "shrink-0 rounded-xl border px-3 py-1.5 text-[12.5px] font-semibold transition",
                      active
                        ? "border-ink-950 bg-ink-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    {t === "All" ? "All tracks" : t}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================== SPEAKERS GRID ============================== */}
      <main className="bg-[#FAFAFA] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6"
                />
              ))}
            </div>
          ) : filteredSpeakers.length === 0 ? (
            <Card className="border-slate-200/90 bg-white">
              <EmptyState
                icon={<Mic className="size-6" />}
                title="No speakers found"
                body="Try clearing your search query or switching to another track."
                action={
                  <Button size="sm" variant="secondary" onClick={clearFilters}>
                    Reset filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSpeakers.map((sp) => (
                <article
                  key={sp.name}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-brand-200 hover:shadow-[0_14px_32px_-22px_rgba(23,28,53,.22)]"
                >
                  <div>
                    {/* Speaker Header */}
                    <div className="flex items-center gap-3.5">
                      <img
                        src={sp.avatar}
                        alt={sp.name}
                        loading="lazy"
                        className="size-14 shrink-0 rounded-xl border border-slate-200/80 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-[17px] font-bold tracking-tight text-slate-950">
                          {sp.name}
                        </h2>
                        <p className="truncate text-[12.5px] font-semibold text-brand-600">
                          {sp.role}
                        </p>
                        <p className="truncate text-[12px] text-slate-500">{sp.company}</p>
                      </div>
                    </div>

                    {/* Tracks */}
                    {sp.tracks.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {sp.tracks.map((t) => (
                          <Badge key={t} tone="brand">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Sessions List */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Sessions</span>
                        <span className="tabular-nums">{sp.sessions.length}</span>
                      </div>

                      <div className="mt-2.5 space-y-2">
                        {sp.sessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="rounded-xl border border-slate-200/70 bg-[#FAFAFA] px-3 py-2.5"
                          >
                            <p className="line-clamp-1 text-[13px] font-semibold text-slate-900">
                              {s.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="size-3 text-brand-600" />
                                {s.day} · {s.start}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3 text-slate-400" />
                                {s.stage}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                    <Link
                      to="/schedule"
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-600 transition hover:text-slate-950"
                    >
                      <span>View in schedule</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link
                      to="/contact"
                      className="rounded-lg bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
                    >
                      Connect
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}