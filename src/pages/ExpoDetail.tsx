import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EXPOS, EXHIBITORS, SESSIONS, TESTIMONIALS, type Expo, type Exhibitor } from "@/lib/data";
import { Badge, Button, Card, CardHeader, EmptyState, Modal, Reveal, Tabs, Field, Textarea } from "@/components/ui";
import { FloorPlan, ExhibitorLogo, SessionCard } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { AreaChart, Donut, Gauge, Sparkline } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { fetchLiveExpos, createLiveOrder, fetchExpoApprovedExhibitors } from "@/lib/liveApi";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Globe2,
  MapPin,
  MessageSquare,
  Printer,
  Share2,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

export default function ExpoDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, toast } = useStore();
  const [liveExpos, setLiveExpos] = useState<Expo[]>(EXPOS);
  const [tab, setTab] = useState("overview");
  const [reg, setReg] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState("Day Pass");
  const [ticketQty, setTicketQty] = useState(1);
  const [bookingPass, setBookingPass] = useState(false);
  const [contact, setContact] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchLiveExpos().then((data) => {
      if (data && data.length > 0) setLiveExpos(data);
    });
  }, []);

  const expo = liveExpos.find((e) => e.slug === slug || e.id === slug) ?? liveExpos[0];

  if (!expo)
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState
            icon={<MapPin className="size-6" />}
            title="Expo not found"
            body="The expo you're looking for may have been removed or the link is incorrect."
            action={<Button onClick={() => nav("/expos")}>Browse all expos</Button>}
          />
        </div>
      </Shell>
    );

  const sold = Math.round((expo.boothsSold / expo.boothsTotal) * 100);
  const [liveExhibitors, setLiveExhibitors] = useState<Exhibitor[]>([]);

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

  const filtered = exhibitors.filter((e) => !q || `${e.company} ${e.category} ${e.products.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const days = Array.from(new Set(SESSIONS.map((s) => s.day)));

  return (
    <Shell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-950 pb-14 pt-10">
        <img
          src={expo.cover}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover opacity-40"
          onError={(ev) => {
            (ev.target as HTMLImageElement).src =
              "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/60" />
        <div className="pointer-events-none absolute inset-0 -z-10 grid-noise-dark opacity-50" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/expos" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/60 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> All expos
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="dark">{expo.category}</Badge>
                {expo.status === "Live" ? (
                  <Badge tone="danger" className="bg-rose-500 text-white ring-rose-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-white" /> Happening now
                  </Badge>
                ) : (
                  <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">{expo.status}</Badge>
                )}
                <Badge tone="warn" className="bg-white/10 text-amber-200 ring-white/15">
                  <Star className="size-3 fill-amber-300" /> {expo.rating} rated
                </Badge>
              </div>

              <h1 className="mt-5 font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">
                {expo.title}
              </h1>
              <p className="mt-2 text-[15px] font-semibold text-brand-300">Theme · {expo.theme}</p>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-300/90">{expo.description}</p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  { i: CalendarDays, l: "Dates", v: `${new Date(expo.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${new Date(expo.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` },
                  { i: MapPin, l: "Venue", v: expo.venue },
                  { i: Globe2, l: "Industry", v: expo.industry },
                  { i: Users, l: "Expected", v: `${fmt(expo.attendees)} attendees · ${expo.exhibitors} exhibitors` },
                ].map((m) => (
                  <div key={m.l} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200">
                      <m.i className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/40">{m.l}</p>
                      <p className="mt-0.5 text-[13px] font-semibold leading-snug text-white">{m.v}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button size="lg" icon={<Ticket className="size-4.5" />} onClick={() => setReg(true)}>
                  Register — ${expo.price}
                </Button>
                <Link to="/portal">
                  <Button size="lg" variant="secondary" icon={<Building2 className="size-4.5" />}>
                    Apply as Exhibitor
                  </Button>
                </Link>
                <Button size="lg" variant="outline" icon={<Share2 className="size-4" />} onClick={() => toast({ title: "Link copied to clipboard", tone: "success" })}>
                  Share
                </Button>
                <Button size="lg" variant="outline" icon={<Download className="size-4.5" />} onClick={() => toast({ title: "Programme PDF downloading…", tone: "info" })}>
                  Programme
                </Button>
              </div>
            </div>

            {/* live stats card */}
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-3xl border border-white/12 bg-white/[0.055] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-white/50">Live expo metrics</p>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> REAL-TIME
                  </span>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "On floor", v: "9,310", s: [12, 18, 15, 22, 19, 27, 31], c: "#38bdf8", d: "+18.4%" },
                      { l: "Sessions live", v: "6 / 44", s: [2, 3, 2, 4, 3, 5, 6], c: "#8b72ee", d: "+2 today" },
                    ].map((k) => (
                      <div key={k.l} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/45">{k.l}</p>
                        <div className="mt-1.5 flex items-end justify-between gap-2">
                          <p className="font-display text-[20px] font-bold leading-none text-white">{k.v}</p>
                          <Sparkline values={k.s} color={k.c} width={54} height={24} />
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                          <TrendingUp className="size-3" /> {k.d}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/45">Booth inventory</p>
                      <p className="text-[11.5px] font-bold text-white">{sold}% sold</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-aqua-400" style={{ width: `${sold}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="font-display text-[16px] font-bold text-white">{expo.boothsSold}</p>
                        <p className="text-[10px] uppercase tracking-wide text-white/40">Sold</p>
                      </div>
                      <div>
                        <p className="font-display text-[16px] font-bold text-white">{expo.boothsTotal - expo.boothsSold}</p>
                        <p className="text-[10px] uppercase tracking-wide text-white/40">Available</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/floor-plan">
                    <Button full variant="outline">Open interactive floor plan</Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TABS */}
      <section className="sticky top-16.5 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "exhibitors", label: "Exhibitors", count: exhibitors.length },
              { id: "schedule", label: "Schedule", count: SESSIONS.length },
              { id: "floorplan", label: "Floor Plan" },
              { id: "insights", label: "Insights" },
            ]}
          />
        </div>
      </section>

      <section className="bg-slate-50/60 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader title="About this expo" subtitle={`Edition #${expo.id}`} />
                  <div className="space-y-4 p-5 text-[14px] leading-relaxed text-slate-600">
                    <p>{expo.description}</p>
                    <p>
                      Across four days, {expo.title} brings together {expo.exhibitors} exhibitors and {fmt(expo.attendees)}{" "}
                      attendees in {expo.venue}. The programme spans {expo.sessions} sessions — keynotes, hands-on labs,
                      panels and closed roundtables — organised into six curated tracks.
                    </p>
                    <p>
                      Every badge, booth and session is managed live on EventSphere. Attendees receive real-time schedule
                      updates; exhibitors track booth traffic and capture leads directly from the floor plan.
                    </p>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="What's included" subtitle="Every ticket covers" />
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    {[
                      "Access to all halls & zones",
                      "Digital floor plan with exhibitor search",
                      "Keynote seating on a first-come basis",
                      "e-Badge with QR fast-lane check-in",
                      "Session bookmarks with reminders",
                      "Post-event recordings (Full Pass)",
                      "Networking lounge access",
                      "Exportable personal agenda",
                    ].map((x) => (
                      <div key={x} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <span className="text-[13px] font-medium text-slate-700">{x}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Featured exhibitors" right={<Badge tone="brand">{exhibitors.length} confirmed</Badge>} />
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    {exhibitors.slice(0, 6).map((x) => (
                      <div key={x.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/30">
                        <ExhibitorLogo name={x.company} bg={x.logoBg} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-slate-900">{x.company}</p>
                          <p className="truncate text-[11.5px] text-slate-500">{x.category}</p>
                        </div>
                        <Badge tone="neutral" className="shrink-0">{x.booth}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick facts</p>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Duration", `${Math.round((+new Date(expo.endDate) - +new Date(expo.startDate)) / 86400000) + 1} days`],
                      ["Halls", "3 halls · 4 zones"],
                      ["Booths", `${expo.boothsTotal} total`],
                      ["Sessions", `${expo.sessions} across 6 tracks`],
                      ["Languages", "EN · DE · AR"],
                      ["Ticket from", `$${expo.price} / day`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-100 pb-2.5 last:border-0">
                        <span className="text-[12.5px] text-slate-500">{l}</span>
                        <span className="text-[13px] font-bold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Organizer</p>
                  <div className="mt-3.5 flex items-center gap-3">
                    <img src={TESTIMONIALS[0].avatar} alt="" className="size-11 rounded-xl object-cover" />
                    <div>
                      <p className="text-[13.5px] font-bold text-slate-900">EventSphere Management</p>
                      <p className="text-[11.5px] text-slate-500">480 expos delivered since 2014</p>
                    </div>
                  </div>
                  <Button variant="secondary" full size="sm" className="mt-4" icon={<MessageSquare className="size-3.5" />} onClick={() => setContact("EventSphere Management")}>
                    Contact organizer
                  </Button>
                </Card>

                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                    <Sparkles className="size-5" />
                    <p className="mt-3 font-display text-[16px] font-bold">Exhibit at this expo</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
                      {expo.boothsTotal - expo.boothsSold} booths still available from {money(2600)}.
                    </p>
                    <Link to="/register?role=exhibitor" className="mt-4 block">
                      <Button full variant="secondary" size="sm">Become an exhibitor</Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* EXHIBITORS */}
          {tab === "exhibitors" && (
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search exhibitors by company, category or product…"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[14px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                  />
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
                <Badge tone="neutral" className="h-8 px-3">{filtered.length} results</Badge>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <EmptyState icon={<Building2 className="size-6" />} title="No exhibitors found" body="Try a different keyword or clear your search." />
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((x) => (
                    <Card key={x.id} hover className="p-5">
                      <div className="flex items-start gap-3.5">
                        <ExhibitorLogo name={x.company} bg={x.logoBg} size={48} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[15px] font-bold text-slate-900">{x.company}</p>
                          <p className="mt-0.5 text-[11.5px] text-slate-500">{x.category}</p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-[11.5px] font-bold text-slate-700">{x.rating}</span>
                            <span className="text-[11px] text-slate-400">· {x.country}</span>
                          </div>
                        </div>
                        <Badge tone={x.badgeTier === "Platinum" ? "purple" : x.badgeTier === "Gold" ? "warn" : "neutral"}>{x.badgeTier}</Badge>
                      </div>
                      <p className="mt-3.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">{x.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {x.products.map((p: any) => (
                          <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{p}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                        <Badge tone="brand" className="shrink-0">
                          <MapPin className="size-3" /> {x.booth}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{x.hall}</span>
                        <Button size="xs" variant="ghost" className="ml-auto" icon={<MessageSquare className="size-3.5" />} onClick={() => setContact(x.company)}>
                          Chat
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE */}
          {tab === "schedule" && (
            <div className="space-y-6">
              {days.map((d) => (
                <Card key={d}>
                  <CardHeader
                    title={d}
                    subtitle={new Date(SESSIONS.find((s) => s.day === d)!.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    right={<Badge tone="brand">{SESSIONS.filter((s) => s.day === d).length} sessions</Badge>}
                  />
                  <div className="space-y-3 p-5">
                    {SESSIONS.filter((s) => s.day === d).map((s) => (
                      <SessionCard key={s.id} s={s} />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* FLOOR PLAN */}
          {tab === "floorplan" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[19px] font-bold tracking-tight text-slate-900">Interactive floor plan</h2>
                  <p className="mt-1 text-[13px] text-slate-500">Hall 4 · {expo.venue}</p>
                </div>
                <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => toast({ title: "Print view opening…", tone: "info" })}>
                  Print plan
                </Button>
              </div>
              <FloorPlan mode="view" expoId={expo.id} />
            </div>
          )}

          {/* INSIGHTS */}
          {tab === "insights" && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader title="Attendance trend" subtitle="Daily unique check-ins vs. previous edition" />
                  <div className="p-5">
                    <AreaChart data={[{ label: "D1", a: 4200, b: 3100 }, { label: "D2", a: 6800, b: 4900 }, { label: "D3", a: 9200, b: 6100 }, { label: "D4", a: 8100, b: 7200 }]} format={fmt} height={230} />
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Registration mix" />
                  <div className="p-5">
                    <Donut
                      centerLabel="of badges"
                      centerValue="100%"
                      data={[
                        { label: "Attendee", value: 68, color: "#6854d9" },
                        { label: "Exhibitor", value: 19, color: "#0ea5e9" },
                        { label: "Press", value: 7, color: "#f97316" },
                        { label: "VIP", value: 6, color: "#a855f7" },
                      ]}
                    />
                  </div>
                </Card>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { l: "Session fill rate", v: 84, tone: "brand", s: "Average across 44 sessions" },
                  { l: "Booth occupancy", v: sold, tone: "success", s: `${expo.boothsSold}/${expo.boothsTotal} booths` },
                  { l: "Lead conversion", v: 12, tone: "info", s: "Scan → proposal sent" },
                  { l: "NPS score", v: 72, tone: "purple", s: "Promoters vs. detractors" },
                ].map((g) => (
                  <Card key={g.l} className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.l}</p>
                    <div className="mt-3">
                      <Gauge
                        value={g.v}
                        size={140}
                        color={g.tone === "success" ? "#10b981" : g.tone === "info" ? "#0ea5e9" : g.tone === "purple" ? "#a855f7" : "#5947c6"}
                      />
                    </div>
                    <p className="mt-1 text-center text-[11.5px] text-slate-500">{g.s}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* REGISTER MODAL */}
      <Modal
        open={reg}
        onClose={() => setReg(false)}
        title={`Register — ${expo.title}`}
        subtitle="Select your pass type and confirm your details"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReg(false)} disabled={bookingPass}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!user) {
                  localStorage.setItem(
                    "eventsphere_pending_booking",
                    JSON.stringify({
                      expoId: expo.id && expo.id.length === 24 ? expo.id : "6b0001fbc32ac2ad55711ad7",
                      expoSlug: expo.slug,
                      ticketType: selectedTicket,
                      quantity: ticketQty,
                    })
                  );
                  toast({
                    title: "Authentication Required",
                    body: "Please sign in or register to complete your ticket booking.",
                    tone: "info",
                  });
                  nav(`/login?redirect=/expos/${expo.slug}&role=attendee`);
                  return;
                }

                setBookingPass(true);
                try {
                  const targetExpoId = expo.id && expo.id.length === 24 ? expo.id : "6b0001fbc32ac2ad55711ad7";
                  await createLiveOrder({
                    orderType: "ticket_registration",
                    expoId: targetExpoId,
                    ticketType: selectedTicket,
                    quantity: ticketQty,
                  });

                  setReg(false);
                  toast({
                    title: "Registration Confirmed in MongoDB 🎉",
                    body: `Your ticket for ${expo.title} has been confirmed.`,
                    tone: "success",
                  });
                  nav("/attendee");
                } catch (err: any) {
                  toast({
                    title: "Booking Failed",
                    body: err.message || "Failed to create registration order.",
                    tone: "danger",
                  });
                } finally {
                  setBookingPass(false);
                }
              }}
              disabled={bookingPass}
            >
              {bookingPass ? "Processing..." : "Proceed to Checkout"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { n: "Day Pass", p: expo.price },
              { n: "Full Pass", p: 349, best: true },
              { n: "VIP", p: 850 },
            ].map((t) => (
              <div
                key={t.n}
                onClick={() => setSelectedTicket(t.n)}
                className={cn(
                  "cursor-pointer rounded-2xl border-2 p-4 transition",
                  selectedTicket === t.n
                    ? "border-brand-500 bg-brand-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                {t.best && <Badge tone="brand" className="mb-2">Most popular</Badge>}
                <p className="text-[12.5px] font-bold text-slate-900">{t.n}</p>
                <p className="mt-1 font-display text-[22px] font-extrabold text-slate-900">${t.p}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">per person</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                defaultValue={user?.name || "Attendee Guest"}
              />
            </Field>
            <Field label="Email" required>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                defaultValue={user?.email || "attendee@example.com"}
              />
            </Field>
            <Field label="Company">
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                defaultValue={user?.company || "Tech Innovators"}
              />
            </Field>
            <Field label="Quantity">
              <select
                value={ticketQty}
                onChange={(e) => setTicketQty(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12 bg-white"
              >
                {[1, 2, 3, 4, 5].map((q) => (
                  <option key={q} value={q}>
                    {q} Pass{q > 1 ? "es" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-[13px] font-bold text-slate-900">Total payable calculated server-side</p>
              <p className="text-[11.5px] text-slate-500">Secure 256-bit SSL encryption & official tax invoice included</p>
            </div>
            <Badge tone="brand">Official Booking</Badge>
          </div>
        </div>
      </Modal>

      {/* CONTACT MODAL */}
      <Modal
        open={!!contact}
        onClose={() => setContact(null)}
        title={`Message ${contact}`}
        subtitle="Sent through EventSphere — replies arrive in your inbox"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContact(null)}>Cancel</Button>
            <Button icon={<MessageSquare className="size-4" />} onClick={() => { setContact(null); toast({ title: "Message sent", body: `${contact} will reply within one business day.`, tone: "success" }); }}>
              Send message
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject" required><input defaultValue={`Enquiry about ${contact}`} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" /></Field>
          <Field label="Message" required>
            <Textarea placeholder="Hi, I'd like to know more about…" />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3.5 text-[12px] text-brand-800">
            <Clock className="size-4 shrink-0" />
            Typical response time is under 4 hours during expo week.
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
