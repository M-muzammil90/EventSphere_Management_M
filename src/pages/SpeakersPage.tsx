import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/SiteLayout";
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";
import { fetchLiveSessions } from "@/lib/liveApi";
import { type Session } from "@/lib/data";
import {
  CalendarClock,
  MapPin,
  Mic,
  Search,
  Sparkles,
} from "lucide-react";

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

  // Extract unique speakers from sessions
  const speakers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      role: string;
      company: string;
      avatar?: string;
      sessions: Session[];
      tracks: string[];
    }>();

    sessions.forEach((s) => {
      const speakerName = s.speaker || "Distinguished Speaker";
      if (!map.has(speakerName)) {
        map.set(speakerName, {
          name: speakerName,
          role: s.speakerRole || "Keynote Presenter",
          company: s.company || "Industry Pioneer",
          avatar: s.avatar || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-24">
          <div className="absolute inset-0 grid-noise-dark opacity-40" />
          <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">
              <Sparkles className="size-3" /> EventSphere Thought Leaders
            </Badge>
            <h1 className="mt-4 font-display text-[32px] font-extrabold tracking-tight sm:text-[44px]">
              World-Class Keynotes & Industry Speakers
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300">
              Meet the global visionaries, enterprise executives, and technical pioneers presenting across EventSphere expos.
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="mb-8 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search speakers by name, company, or topic..."
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-[14px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                />
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
              <Select value={track} onChange={(e) => setTrack(e.target.value)} className="h-11 min-w-[200px]">
                {allTracks.map((t) => (
                  <option key={t} value={t}>
                    {t === "All" ? "All Tracks" : t}
                  </option>
                ))}
              </Select>
              <Badge tone="neutral" className="h-9 px-3">
                {filteredSpeakers.length} speakers
              </Badge>
            </div>
          </Card>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-[14px]">
              Loading speaker directory...
            </div>
          ) : filteredSpeakers.length === 0 ? (
            <EmptyState
              icon={<Mic className="size-8" />}
              title="No speakers match your query"
              body="Try widening your search terms or clearing track filters."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setTrack("All");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSpeakers.map((sp) => (
                <Card key={sp.name} hover className="flex flex-col justify-between overflow-hidden p-6">
                  <div>
                    <div className="flex items-start gap-4">
                      <img
                        src={sp.avatar}
                        alt={sp.name}
                        className="size-16 rounded-2xl object-cover ring-2 ring-brand-500/20 shadow-md"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-[16px] font-bold text-slate-900">
                          {sp.name}
                        </h3>
                        <p className="truncate text-[12px] font-medium text-brand-600">
                          {sp.role}
                        </p>
                        <p className="truncate text-[11.5px] text-slate-500">
                          {sp.company}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {sp.tracks.map((t) => (
                        <Badge key={t} tone="brand">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Presenting Sessions ({sp.sessions.length})
                      </p>
                      <div className="mt-2 space-y-2">
                        {sp.sessions.slice(0, 2).map((s) => (
                          <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                            <p className="line-clamp-1 text-[12.5px] font-semibold text-slate-900">
                              {s.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="size-3 text-brand-500" />
                                {s.day} · {s.start}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                {s.stage}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                    <Link to="/schedule">
                      <Button size="xs" variant="ghost">
                        View in Schedule
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button size="xs" variant="soft">
                        Connect
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
