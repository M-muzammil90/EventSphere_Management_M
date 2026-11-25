import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EXPOS, EXHIBITORS, SESSIONS, TESTIMONIALS, type Expo, type Exhibitor } from "@/lib/data";
import { Badge, Button, EmptyState, Modal, Field, Textarea } from "@/components/ui";
import { FloorPlan, ExhibitorLogo, SessionCard } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { AreaChart, Donut } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { fetchLiveExpos, createLiveOrder, fetchExpoApprovedExhibitors } from "@/lib/liveApi";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  Download,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  Printer,
  Search,
  Share2,
  Star,
  Ticket,
  Users,
} from "lucide-react";

const FALLBACK_COVER =
  "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

const inputCls =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

const INCLUDED = [
  { title: "Full Hall & Zone Access", desc: "Entry to all exhibition halls, demo stages, and innovation pavilions." },
  { title: "Interactive Floor Navigation", desc: "Live booth directory with instant exhibitor filtering and bookmarking." },
  { title: "Keynote & Mainstage Seating", desc: "Access to all mainstage talks (first-come, first-served seating)." },
  { title: "Fast-Lane QR e-Badge", desc: "Contactless check-in and instant digital badge sharing with exhibitors." },
  { title: "On-Demand Session Archive", desc: "Full HD recordings and slide decks available 48 hours post-event." },
  { title: "Curated Networking Lounge", desc: "Dedicated quiet zones, coffee bars, and 1:1 matchmaking tables." },
];

function passesFor(expo: Expo) {
  return [
    { n: "Day Pass", p: expo.price, note: "Single-day floor & keynote access" },
    { n: "Full Pass", p: 349, note: "All days + recordings & workshops", best: true },
    { n: "VIP Executive", p: 850, note: "Front-row seating + speaker lounge" },
  ];
}

function dateRange(expo: Expo) {
  const a = new Date(expo.startDate);
  const b = new Date(expo.endDate);
  if (isNaN(+a) || isNaN(+b)) return `${expo.startDate} – ${expo.endDate}`;
  return `${a.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${b.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function ExpoDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, toast } = useStore();

  const [liveExpos, setLiveExpos] = useState<Expo[]>(EXPOS);
  const [liveExhibitors, setLiveExhibitors] = useState<Exhibitor[]>([]);
  const [tab, setTab] = useState("overview");
  const [reg, setReg] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState("Full Pass");
  const [ticketQty, setTicketQty] = useState(1);
  const [bookingPass, setBookingPass] = useState(false);
  const [contact, setContact] = useState<string | null>(null);
  const [contactMsg, setContactMsg] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchLiveExpos().then((data) => {
      if (data && data.length > 0) setLiveExpos(data);
    });
  }, []);

  const expo = liveExpos.find((e) => e.slug === slug || e.id === slug) ?? liveExpos[0];

  useEffect(() => {
    if (expo?.id) {
      fetchExpoApprovedExhibitors(expo.id).then((data) => {
        if (data && data.length > 0) setLiveExhibitors(data);
      });
    }
  }, [expo?.id]);

  const exhibitors = useMemo(() => {
    if (liveExhibitors.length > 0) return liveExhibitors;
    return EXHIBITORS.filter((e) => e.status === "Approved");
  }, [liveExhibitors]);

  const filtered = useMemo(
    () =>
      exhibitors.filter(
        (e) =>
          !q ||
          `${e.company} ${e.category} ${e.products.join(" ")}`.toLowerCase().includes(q.toLowerCase())
      ),
    [exhibitors, q]
  );

  const days = useMemo(() => Array.from(new Set(SESSIONS.map((s) => s.day))), []);

  if (!expo) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-4 py-28">
          <EmptyState
            icon={<MapPin className="size-6" />}
            title="Expo not found"
            body="This event may have concluded or the link is no longer active."
            action={<Button onClick={() => nav("/expos")}>Explore upcoming expos</Button>}
          />
        </div>
      </Shell>
    );
  }

  const sold = expo.boothsTotal ? Math.round((expo.boothsSold / expo.boothsTotal) * 100) : 0;
  const available = Math.max(0, expo.boothsTotal - expo.boothsSold);
  const passes = passesFor(expo);
  const chosen = passes.find((p) => p.n === selectedTicket) ?? passes[0];
  const durationDays = Math.max(1, Math.round((+new Date(expo.endDate) - +new Date(expo.startDate)) / 86400000) + 1);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", body: "Event URL copied to your clipboard.", tone: "success" });
    } catch {
      toast({ title: "Unable to copy", body: "Please copy the URL from your browser bar.", tone: "warn" });
    }
  }

  async function checkout() {
    const targetExpoId = (expo as any)._id || (expo.id && expo.id.length === 24 ? expo.id : null) || liveExpos.find((e) => e.slug === expo.slug || e.title === expo.title)?.id || expo.id;
    if (!user) {
      localStorage.setItem(
        "eventsphere_pending_booking",
        JSON.stringify({ expoId: targetExpoId, expoSlug: expo.slug, ticketType: selectedTicket, quantity: ticketQty })
      );
      toast({ title: "Sign in required", body: "Sign in to reserve your pass.", tone: "info" });
      nav(`/login?redirect=/expos/${expo.slug}&role=attendee`);
      return;
    }

    setBookingPass(true);
    try {
      await createLiveOrder({
        orderType: "ticket_registration",
        expoId: targetExpoId,
        ticketType: selectedTicket,
        quantity: ticketQty,
      });
      setReg(false);
      toast({ title: "You're registered", body: `Pass confirmed for ${expo.title}.`, tone: "success" });
      nav("/attendee");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        body: err?.message || "Something went wrong while issuing your pass.",
        tone: "danger",
      });
    } finally {
      setBookingPass(false);
    }
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "exhibitors", label: "Directory", count: exhibitors.length },
    { id: "schedule", label: "Programme", count: SESSIONS.length },
    { id: "floorplan", label: "Floor Plan" },
    { id: "insights", label: "Metrics" },
  ];

  return (
    <Shell>
      {/* ============================== ARCHITECTURAL HEADER ============================== */}
      <header className="border-b border-slate-200/80 bg-white pt-6 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Breadcrumb & Utility Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/expos"
              className={cn(
                "group inline-flex items-center gap-2 text-[13.5px] font-medium text-slate-500 transition hover:text-slate-950",
                focusRing
              )}
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to directory
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={share}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50",
                  focusRing
                )}
              >
                <Share2 className="size-3.5 text-slate-500" />
                Share
              </button>
              <button
                type="button"
                onClick={() => toast({ title: "Downloading brochure…", tone: "info" })}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50",
                  focusRing
                )}
              >
                <Download className="size-3.5 text-slate-500" />
                Brochure PDF
              </button>
            </div>
          </div>

          {/* Editorial Title Block */}
          <div className="mt-7 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] font-semibold uppercase tracking-wider">
                <span className="text-brand-600">{expo.category}</span>
                <span className="text-slate-300">/</span>
                {expo.status === "Live" ? (
                  <span className="inline-flex items-center gap-1.5 text-rose-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-rose-600" />
                    Live Now
                  </span>
                ) : (
                  <span className="text-slate-600">{expo.status}</span>
                )}
                <span className="text-slate-300">/</span>
                <span className="inline-flex items-center gap-1 text-slate-700">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {expo.rating} <span className="font-normal text-slate-400">(420+ reviews)</span>
                </span>
              </div>

              <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] text-slate-950 sm:text-[48px]">
                {expo.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-slate-600">
                {expo.theme}
              </p>
            </div>

            {/* Key Metadata Strip */}
            <div className="flex flex-col gap-2.5 border-l-2 border-slate-900 pl-4 lg:col-span-4">
              <div className="flex items-center gap-2.5 text-[14px] font-medium text-slate-900">
                <Calendar className="size-4 shrink-0 text-slate-400" />
                <span>{dateRange(expo)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] font-medium text-slate-900">
                <MapPin className="size-4 shrink-0 text-slate-400" />
                <span>{expo.venue}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-slate-600">
                <Users className="size-4 shrink-0 text-slate-400" />
                <span className="tabular-nums">
                  {fmt(expo.attendees)} attendees · {expo.exhibitors} exhibitors
                </span>
              </div>
            </div>
          </div>

          {/* Crisp Framed Cover Image */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
            <img
              src={expo.cover}
              alt={expo.title}
              className="aspect-[21/8] min-h-[240px] w-full object-cover"
              onError={(ev) => {
                ev.currentTarget.onerror = null;
                ev.currentTarget.src = FALLBACK_COVER;
              }}
            />
            <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/75 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
              Edition #{expo.id} · Official Venue Partner
            </div>
          </div>
        </div>
      </header>

      {/* ============================== STICKY NAVIGATION BAR ============================== */}
      <nav
        aria-label="Expo sections"
        className="sticky top-16 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div role="tablist" className="-mb-px flex gap-6 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex h-13 shrink-0 items-center gap-2 border-b-2 text-[14px] font-semibold transition-colors",
                    focusRing,
                    active
                      ? "border-slate-950 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  )}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums",
                        active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="text-[13px] text-slate-500">
              Passes from <strong className="font-semibold text-slate-950">${expo.price}</strong>
            </span>
            <Button size="sm" onClick={() => setReg(true)}>
              Reserve Pass
            </Button>
          </div>
        </div>
      </nav>

      {/* ============================== MAIN CONTENT + STICKY TICKET RAIL ============================== */}
      <main className="bg-[#FAFAFA] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* LEFT COLUMN: TAB CONTENT */}
            <div role="tabpanel" className="min-w-0">
              {/* ---------- OVERVIEW ---------- */}
              {tab === "overview" && (
                <div className="space-y-10">
                  {/* Narrative */}
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
                    <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-950">
                      About the exhibition
                    </h2>
                    <div className="mt-4 space-y-4 text-[15.5px] leading-[1.7] text-slate-600">
                      <p>{expo.description}</p>
                      <p>
                        Spanning {durationDays} days at {expo.venue}, {expo.title} convenes{" "}
                        {expo.exhibitors} vetted industry leaders and {fmt(expo.attendees)} delegates.
                        The agenda is structured around {expo.sessions} technical keynotes, live product
                        teardowns, and closed-door buyer roundtables.
                      </p>
                    </div>

                    {/* Clean Key Metrics Row */}
                    <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-100 pt-6 sm:grid-cols-4">
                      {[
                        { label: "Duration", val: `${durationDays} Days` },
                        { label: "Exhibition Halls", val: "3 Halls · 4 Zones" },
                        { label: "Programme", val: `${expo.sessions} Sessions` },
                        { label: "Languages", val: "EN · DE · AR" },
                      ].map((item) => (
                        <div key={item.label}>
                          <dt className="text-[12.5px] font-medium text-slate-400">{item.label}</dt>
                          <dd className="mt-1 font-display text-[16px] font-bold text-slate-950">
                            {item.val}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  {/* What's Included - Hairline Grid */}
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-950">
                        Included with admission
                      </h2>
                      <span className="text-[13px] text-slate-500">All pass tiers</span>
                    </div>

                    <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                      {INCLUDED.map((item) => (
                        <div key={item.title} className="flex gap-3.5">
                          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                            <Check className="size-3" strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="text-[14.5px] font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Featured Exhibitors Preview */}
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-950">
                          Confirmed exhibitors
                        </h2>
                        <p className="mt-0.5 text-[13.5px] text-slate-500">
                          Selected organizations showcasing on the main floor
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab("exhibitors")}
                        className={cn(
                          "inline-flex items-center gap-1 text-[13.5px] font-semibold text-slate-950 hover:text-brand-600",
                          focusRing
                        )}
                      >
                        Full directory ({exhibitors.length})
                        <ArrowUpRight className="size-4" />
                      </button>
                    </div>

                    <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                      {exhibitors.slice(0, 5).map((x) => (
                        <div
                          key={x.id}
                          className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-slate-50/70"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <ExhibitorLogo name={x.company} bg={x.logoBg} size={40} />
                            <div className="min-w-0">
                              <p className="truncate text-[14.5px] font-semibold text-slate-900">
                                {x.company}
                              </p>
                              <p className="truncate text-[13px] text-slate-500">{x.category}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="hidden text-[12.5px] text-slate-400 sm:inline">
                              {x.hall}
                            </span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[12px] font-medium text-slate-700">
                              {x.booth}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* ---------- DIRECTORY (EXHIBITORS) ---------- */}
              {tab === "exhibitors" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 sm:max-w-md">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Filter by company, sector, or product…"
                        className={cn(inputCls, "pl-10")}
                      />
                    </div>
                    <p className="text-[13.5px] font-medium text-slate-500 tabular-nums">
                      Showing {filtered.length} of {exhibitors.length} exhibitors
                    </p>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-12">
                      <EmptyState
                        icon={<Building2 className="size-6" />}
                        title="No matching exhibitors"
                        body="Try clearing your filter or searching for a broader product category."
                      />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filtered.map((x) => (
                        <article
                          key={x.id}
                          className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-slate-300"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <ExhibitorLogo name={x.company} bg={x.logoBg} size={44} />
                              <div>
                                <h3 className="font-display text-[16px] font-bold text-slate-950">
                                  {x.company}
                                </h3>
                                <p className="text-[13px] text-slate-500">
                                  {x.category} · {x.country}
                                </p>
                              </div>
                            </div>
                            <Badge
                              tone={
                                x.badgeTier === "Platinum"
                                  ? "purple"
                                  : x.badgeTier === "Gold"
                                  ? "warn"
                                  : "neutral"
                              }
                            >
                              {x.badgeTier}
                            </Badge>
                          </div>

                          <p className="mt-3.5 line-clamp-2 text-[14px] leading-relaxed text-slate-600">
                            {x.description}
                          </p>

                          <div className="mt-3.5 flex flex-wrap gap-1.5">
                            {x.products.slice(0, 3).map((p: string) => (
                              <span
                                key={p}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-600"
                              >
                                {p}
                              </span>
                            ))}
                          </div>

                          <div className="mt-auto pt-4">
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                <span className="font-mono font-semibold text-slate-900">
                                  {x.booth}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>{x.hall}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setContact(x.company)}
                                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 transition hover:text-brand-600"
                              >
                                <MessageSquare className="size-3.5" />
                                Message
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---------- PROGRAMME (SCHEDULE) ---------- */}
              {tab === "schedule" && (
                <div className="space-y-8">
                  {days.map((d) => {
                    const daySessions = SESSIONS.filter((s) => s.day === d);
                    return (
                      <section
                        key={d}
                        className="rounded-2xl border border-slate-200/80 bg-white p-6"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="font-display text-[18px] font-bold text-slate-950">
                              {d}
                            </h3>
                            <p className="text-[13.5px] text-slate-500">
                              {new Date(daySessions[0].date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <span className="text-[13px] font-medium text-slate-500">
                            {daySessions.length} scheduled sessions
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {daySessions.map((s) => (
                            <SessionCard key={s.id} s={s} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

              {/* ---------- FLOOR PLAN ---------- */}
              {tab === "floorplan" && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-[19px] font-bold text-slate-950">
                        Exhibition Floor Map
                      </h2>
                      <p className="text-[13.5px] text-slate-500">
                        Hall 4 · {expo.venue} — Click any booth for live availability
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Printer className="size-4" />}
                      onClick={() => toast({ title: "Preparing printable floor plan…", tone: "info" })}
                    >
                      Print PDF
                    </Button>
                  </div>
                  <FloorPlan mode="view" expoId={expo.id} />
                </div>
              )}

              {/* ---------- METRICS (INSIGHTS) ---------- */}
              {tab === "insights" && (
                <div className="space-y-6">
                  {/* Editorial KPI Strip */}
                  <div className="grid grid-cols-2 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                    {[
                      { label: "Session Fill Rate", value: "84%", sub: "+6% vs last edition" },
                      { label: "Booth Occupancy", value: `${sold}%`, sub: `${expo.boothsSold}/${expo.boothsTotal} allocated` },
                      { label: "Lead Conversion", value: "12.4%", sub: "Badge scan to pipeline" },
                      { label: "Attendee NPS", value: "72", sub: "Top 5% industry benchmark" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-5">
                        <p className="text-[12.5px] font-medium text-slate-500">{stat.label}</p>
                        <p className="mt-1.5 font-display text-[26px] font-extrabold tracking-tight text-slate-950 tabular-nums">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-400">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 lg:col-span-2">
                      <h3 className="font-display text-[16px] font-bold text-slate-950">
                        Daily Check-in Velocity
                      </h3>
                      <p className="mb-4 text-[13px] text-slate-500">
                        Unique badge scans per day compared to prior edition
                      </p>
                      <AreaChart
                        data={[
                          { label: "Day 1", a: 4200, b: 3100 },
                          { label: "Day 2", a: 6800, b: 4900 },
                          { label: "Day 3", a: 9200, b: 6100 },
                          { label: "Day 4", a: 8100, b: 7200 },
                        ]}
                        format={fmt}
                        height={230}
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
                      <h3 className="font-display text-[16px] font-bold text-slate-950">
                        Audience Composition
                      </h3>
                      <p className="mb-4 text-[13px] text-slate-500">Verified badge breakdown</p>
                      <Donut
                        centerLabel="Total"
                        centerValue="100%"
                        data={[
                          { label: "Attendee", value: 68, color: "#0f172a" },
                          { label: "Exhibitor", value: 19, color: "#4f46e5" },
                          { label: "Press", value: 7, color: "#0ea5e9" },
                          { label: "VIP", value: 6, color: "#f59e0b" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY TICKET & EXHIBITOR RAIL */}
            <aside className="space-y-5 lg:sticky lg:top-34">
              {/* Ticket Selector Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-[18px] font-bold text-slate-950">
                    Registration
                  </h2>
                  <span className="text-[12.5px] font-medium text-emerald-700">
                    Instant e-Badge
                  </span>
                </div>

                <div role="radiogroup" aria-label="Select pass tier" className="mt-4 space-y-2.5">
                  {passes.map((t) => {
                    const active = selectedTicket === t.n;
                    return (
                      <button
                        key={t.n}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedTicket(t.n)}
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition",
                          focusRing,
                          active
                            ? "border-slate-950 bg-slate-950/[0.02] ring-1 ring-slate-950"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-950">
                            {t.n}
                            {t.best && (
                              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                                Recommended
                              </span>
                            )}
                          </span>
                          <span className="font-display text-[17px] font-bold text-slate-950 tabular-nums">
                            ${t.p}
                          </span>
                        </div>
                        <p className="mt-1 text-[12.5px] text-slate-500">{t.note}</p>
                      </button>
                    );
                  })}
                </div>

                <Button
                  full
                  size="lg"
                  className="mt-5"
                  icon={<Ticket className="size-4" />}
                  onClick={() => setReg(true)}
                >
                  Continue · ${chosen.p}
                </Button>

                {/* Booth Occupancy Meter */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-slate-500">Floor space allocated</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {sold}% ({available} booths open)
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${sold}%` }}
                    />
                  </div>
                  <div className="mt-3.5 flex items-center justify-between text-[13px]">
                    <Link
                      to="/register?role=exhibitor"
                      className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950"
                    >
                      Book a booth ({money(2600)}+)
                    </Link>
                    <button
                      type="button"
                      onClick={() => setTab("floorplan")}
                      className="font-medium text-slate-500 hover:text-slate-900"
                    >
                      View map →
                    </button>
                  </div>
                </div>
              </div>

              {/* Organizer Mini Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Hosted by
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={TESTIMONIALS[0].avatar}
                    alt="EventSphere Management"
                    className="size-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-slate-950">
                      EventSphere Management
                    </p>
                    <p className="text-[12.5px] text-slate-500">Verified Organizer · Since 2014</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContact("EventSphere Management")}
                  className={cn(
                    "mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50",
                    focusRing
                  )}
                >
                  <MessageSquare className="size-3.5" />
                  Message organizer
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ============================== REGISTRATION MODAL ============================== */}
      <Modal
        open={reg}
        onClose={() => setReg(false)}
        title={`Reserve your pass`}
        subtitle={`${expo.title} · ${dateRange(expo)}`}
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              <span className="text-[12px] text-slate-500">Total due</span>
              <p className="font-display text-[20px] font-extrabold text-slate-950 tabular-nums">
                ${chosen.p * ticketQty}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setReg(false)} disabled={bookingPass}>
                Cancel
              </Button>
              <Button onClick={checkout} disabled={bookingPass}>
                {bookingPass ? "Issuing pass…" : "Confirm & Checkout"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Pass Picker */}
          <div role="radiogroup" aria-label="Pass tier" className="grid gap-2.5 sm:grid-cols-3">
            {passes.map((t) => {
              const active = selectedTicket === t.n;
              return (
                <button
                  key={t.n}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedTicket(t.n)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition",
                    focusRing,
                    active
                      ? "border-slate-950 bg-slate-50 ring-1 ring-slate-950"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <p className="text-[13px] font-semibold text-slate-900">{t.n}</p>
                  <p className="mt-1 font-display text-[20px] font-extrabold text-slate-950 tabular-nums">
                    ${t.p}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{t.note}</p>
                </button>
              );
            })}
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Number of passes</p>
              <p className="text-[12.5px] text-slate-500">Group badges can be assigned later</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setTicketQty((q) => Math.max(1, q - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-5 text-center font-display text-[15px] font-bold tabular-nums">
                {ticketQty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setTicketQty((q) => Math.min(10, q + 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Attendee full name" required>
              <input
                className={inputCls}
                defaultValue={user?.name || ""}
                placeholder="e.g. Sarah Jenkins"
                autoComplete="name"
              />
            </Field>
            <Field label="Work email" required>
              <input
                type="email"
                className={inputCls}
                defaultValue={user?.email || ""}
                placeholder="sarah@company.com"
                autoComplete="email"
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* ============================== CONTACT ORGANIZER / EXHIBITOR MODAL ============================== */}
      <Modal
        open={Boolean(contact)}
        onClose={() => {
          setContact(null);
          setContactMsg("");
        }}
        title={`Message ${contact ?? ""}`}
        subtitle="Direct inquiry via EventSphere Messenger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContact(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Message sent",
                  body: `Your inquiry has been delivered to ${contact}.`,
                  tone: "success",
                });
                setContact(null);
                setContactMsg("");
              }}
              disabled={!contactMsg.trim()}
            >
              Send message
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Your message" required>
            <Textarea
              rows={4}
              value={contactMsg}
              onChange={(e: any) => setContactMsg(e.target.value)}
              placeholder="Ask about booth availability, group discounts, or meeting times…"
            />
          </Field>
        </div>
      </Modal>
    </Shell>
  );
}