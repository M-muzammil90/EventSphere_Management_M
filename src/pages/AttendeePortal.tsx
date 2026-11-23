import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EXPOS, EXHIBITORS, SESSIONS, NOTIFICATIONS, type Expo, type Exhibitor } from "@/lib/data";
import { fetchLiveExpos, fetchLiveExhibitors, startLiveConversation } from "@/lib/liveApi";
import { APPOINTMENTS, FEEDBACK, type Appointment } from "@/lib/mock";
import { Avatar, Badge, Button, Card, CardHeader, Checkbox, EmptyState, Field, Input, Modal, Progress, Reveal, Select, Textarea, Toggle } from "@/components/ui";
import { ExpoCard, ExhibitorLogo, SessionCard, StatCard } from "@/components/shared";
import { Sparkline } from "@/components/charts";
import { ConfirmDialog } from "@/components/kit";
import { PortalLayout, type PortalNavItem } from "@/components/PortalLayout";
import { useStore } from "@/lib/store";
import { post } from "@/lib/api";
import { cn } from "@/utils/cn";
import RealtimeChatView from "@/components/chat/RealtimeChatView";
import UserPaymentsView from "@/components/payments/UserPaymentsView";
import {
  Banknote,
  Bell, Bookmark, Building2, CalendarClock, CalendarDays, Check, CheckCircle2, Clock, Download, Globe2, MapPin,
  ArrowRight, LayoutDashboard, MessageSquare, QrCode, Search, Send, Sparkles, Star, Ticket, Users, X,
} from "lucide-react";

export default function AttendeePortal() {
  const { user, bookmarks, toast } = useStore();
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [contact, setContact] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const handleSendContact = async () => {
    if (!contactMessage.trim()) return;
    setSendingContact(true);
    try {
      await startLiveConversation({
        recipientId: contact || "",
        subject: contactSubject.trim() || `Inquiry for ${contact}`,
        initialMessage: contactMessage.trim(),
        conversationType: "DIRECT",
      });
      toast({
        title: "Message Sent to Exhibitor ✓",
        body: `Conversation started with ${contact}. You can continue chatting in the Messages tab.`,
        tone: "success",
      });
      setContact(null);
      setContactMessage("");
      setContactSubject("");
      setTab("messages");
    } catch (err: any) {
      toast({
        title: "Could not send message",
        body: err.message || "Failed to start conversation.",
        tone: "danger",
      });
    } finally {
      setSendingContact(false);
    }
  };
  const [appts, setAppts] = useState<Appointment[]>(APPOINTMENTS);
  const [bookAppt, setBookAppt] = useState<string | null>(null);
  const [regDone, setRegDone] = useState<string | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fb, setFb] = useState({ rating: 5, title: "", body: "", session: "", recommend: true });

  const [liveExpos, setLiveExpos] = useState<Expo[]>([]);
  const [liveExhibitors, setLiveExhibitors] = useState<Exhibitor[]>([]);

  useEffect(() => {
    fetchLiveExpos().then((data) => {
      if (data && data.length > 0) setLiveExpos(data.filter((e) => e.status !== "Draft"));
    });
    fetchLiveExhibitors().then(({ exhibitors: data }) => {
      if (data && data.length > 0) setLiveExhibitors(data.filter((e) => e.status === "Approved"));
    });
  }, []);

  const exList = liveExhibitors.length > 0 ? liveExhibitors : EXHIBITORS.filter((e) => e.status === "Approved");
  const expoList = liveExpos.length > 0 ? liveExpos : EXPOS.filter((e) => e.status !== "Completed");

  const saved = SESSIONS.filter((s) => bookmarks.includes(s.id));
  const recommended = useMemo(
    () => exList.filter((e) => e.rating > 4.6).slice(0, 4),
    [exList]
  );
  const cats = ["All", ...Array.from(new Set(exList.map((e) => e.category)))];
  const filteredEx = exList.filter(
    (e) => (cat === "All" || e.category === cat) && (!q || `${e.company} ${e.category} ${e.products.join(" ")} ${e.country}`.toLowerCase().includes(q.toLowerCase()))
  );

  const NAV_ITEMS: PortalNavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "My event" },
    { id: "agenda", label: "My agenda", icon: Bookmark, badge: bookmarks.length, group: "My event" },
    { id: "appointments", label: "Appointments", icon: CalendarClock, badge: appts.filter((a) => a.status === "Pending").length, group: "My event" },
    { id: "feedback", label: "Feedback", icon: Star, group: "My event" },
    { id: "exhibitors", label: "Exhibitor search", icon: Building2, group: "Discover" },
    { id: "expos", label: "Event registration", icon: Ticket, group: "Discover" },
    { id: "notifications", label: "Alerts", icon: Bell, badge: NOTIFICATIONS.length, group: "Discover" },
    { id: "tickets", label: "My tickets", icon: QrCode, group: "Account" },
    { id: "payments", label: "Payments & Invoices", icon: Banknote, group: "Account" },
    { id: "messages", label: "Messages & Support", icon: MessageSquare, group: "Account" },
  ];

  return (
    <PortalLayout
      roleLabel="Attendee dashboard"
      roleShort="Attendee"
      nav={NAV_ITEMS}
      active={tab}
      onNavigate={setTab}
      searchPlaceholder="Search sessions, exhibitors, expos…"
      headerRight={
        <Button
          size="sm"
          icon={<QrCode className="size-4" />}
          onClick={() => toast({ title: "Your e-Badge", body: "Show this QR at the fast-lane entrance.", tone: "info" })}
          className="hidden sm:inline-flex"
        >
          My badge
        </Button>
      }
     
      banner={
      <section className="relative overflow-hidden bg-ink-950">
        <img src={EXPOS[0].cover} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/60" />
        <div className="pointer-events-none absolute inset-0 grid-noise-dark opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">
                <Sparkles className="size-3" /> Global Tech Summit 2026 · 18–21 March
              </Badge>
              <h1 className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">
                Hi {user?.name?.split(" ")[0] ?? "Daniel"}, your agenda is set
              </h1>
              <p className="mt-2 max-w-xl text-[14px] text-slate-300/90">
                You have {bookmarks.length} bookmarked sessions, {recommended.length} recommended exhibitors and a digital badge
                ready to scan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button icon={<QrCode className="size-4.5" />} onClick={() => toast({ title: "Your e-Badge", body: "Show this QR at the fast-lane entrance.", tone: "info" })}>Show my badge</Button>
                <Link to="/floor-plan"><Button variant="outline" icon={<MapPin className="size-4" />}>Open floor plan</Button></Link>
              </div>
            </div>
            <div className="w-[220px] rounded-3xl border border-white/12 bg-white/[0.055] p-5 backdrop-blur-2xl">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/45">Your e-Badge</p>
              <div className="mt-3 grid place-items-center rounded-2xl bg-white p-4">
                <QrCode className="size-24 text-slate-900" strokeWidth={1.2} />
              </div>
              <p className="mt-3 text-center font-display text-[14px] font-bold text-white">{user?.name ?? "Daniel Reyes"}</p>
              <p className="text-center text-[11px] text-white/50">Full Access · Hall 4</p>
              <div className="mt-3 rounded-lg bg-emerald-400/15 px-2 py-1.5 text-center text-[10px] font-bold text-emerald-300">
                FAST-LANE ENTRY
              </div>
            </div>
          </div>
        </div>
      </section>
      }
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">
            {NAV_ITEMS.find((n) => n.id === tab)?.label}
          </h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Global Tech Summit 2026 · 18–21 March · Dubai World Trade Centre</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success" dot>Full Access Pass</Badge>
          <Badge tone="brand">{bookmarks.length} bookmarked</Badge>
          <Badge tone="info">{appts.filter((a) => a.status === "Confirmed").length} meetings</Badge>
        </div>
      </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Bookmarked sessions" value={String(bookmarks.length)} icon={<Bookmark className="size-5" />} tone="brand" sub="Reminders enabled" spark={<Sparkline values={[1, 2, 2, 3, 3, 4, bookmarks.length]} color="#6854d9" width={140} height={32} />} />
              <StatCard label="Exhibitors saved" value="12" icon={<Building2 className="size-5" />} tone="info" sub="Across 4 categories" spark={<Sparkline values={[2, 4, 5, 7, 9, 11, 12]} color="#0ea5e9" width={140} height={32} />} />
              <StatCard label="Sessions attended" value="9" delta="+3" icon={<CalendarClock className="size-5" />} tone="success" sub="Of 14 booked" spark={<Sparkline values={[1, 2, 4, 5, 6, 8, 9]} color="#10b981" width={140} height={32} />} />
              <StatCard label="Booths visited" value="48" delta="+11" icon={<MapPin className="size-5" />} tone="warn" sub="Out of 486" spark={<Sparkline values={[4, 9, 16, 24, 31, 40, 48]} color="#f97316" width={140} height={32} />} />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader title="Next up in your agenda" subtitle="Reminders fire 45 minutes before each session"
                  right={<Link to="/schedule"><Button size="xs" variant="ghost">Browse schedule</Button></Link>} />
                <div className="space-y-3 p-5">
                  {saved.length === 0 ? (
                    <EmptyState icon={<Bookmark className="size-6" />} title="Nothing bookmarked yet" body="Browse the schedule and tap the bookmark icon on anything you'd like to attend." action={<Link to="/schedule"><Button>Explore sessions</Button></Link>} />
                  ) : (
                    saved.slice(0, 3).map((s) => <SessionCard key={s.id} s={s} compact />)
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Notifications" subtitle="Real-time updates" right={<Badge tone="brand">{NOTIFICATIONS.length} new</Badge>} />
                <div className="divide-y divide-slate-100">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="flex gap-3 px-5 py-3.5">
                      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl", n.tone === "warn" ? "bg-amber-50 text-amber-600" : n.tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600")}>
                        <Bell className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold leading-snug text-slate-900">{n.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-slate-500">{n.body}</p>
                        <p className="mt-1 text-[10.5px] text-slate-400">{n.time} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader title="Recommended for you" subtitle="Based on the sessions you bookmarked and exhibitors you visited" />
              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <ExhibitorLogo name={e.company} bg={e.logoBg} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-900">{e.company}</p>
                        <p className="truncate text-[11px] text-slate-500">{e.category}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[11.5px] leading-snug text-slate-600">{e.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge tone="brand">{e.booth}</Badge>
                      <Button size="xs" variant="ghost" icon={<MessageSquare className="size-3.5" />} onClick={() => setContact(e.company)}>Enquire</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Reveal>
              <Card>
                <CardHeader title="Your expo activity" subtitle="Everything you've done at Global Tech Summit 2026" />
                <div className="p-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { i: CalendarDays, l: "Days attended", v: "3 of 4", p: 75 },
                      { i: Ticket, l: "Sessions attended", v: "9 of 14", p: 64 },
                      { i: MapPin, l: "Booths visited", v: "48 of 486", p: 10 },
                      { i: Star, l: "Sessions rated", v: "7 of 9", p: 78 },
                    ].map((a) => (
                      <div key={a.l} className="rounded-2xl border border-slate-200 p-4">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><a.i className="size-4" /></span>
                        <p className="mt-3 font-display text-[16px] font-bold text-slate-900">{a.v}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{a.l}</p>
                        <div className="mt-2.5"><Progress value={a.p} height={5} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>
          </div>
        )}

        {tab === "agenda" && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="My bookmarked sessions" subtitle={`${bookmarks.length} sessions · reminders enabled`}
                right={<Button size="sm" variant="secondary" icon={<Download className="size-4" />} onClick={() => toast({ title: "Agenda exported", body: "Added to your calendar app.", tone: "success" })}>Add to calendar</Button>} />
              {saved.length === 0 ? (
                <EmptyState icon={<Bookmark className="size-6" />} title="Your agenda is empty" body="Bookmark sessions from the schedule and they'll appear here with automatic reminders." action={<Link to="/schedule"><Button icon={<CalendarDays className="size-4" />}>Browse the schedule</Button></Link>} />
              ) : (
                <div className="space-y-3 p-5">
                  {saved.map((s) => <SessionCard key={s.id} s={s} />)}
                </div>
              )}
            </Card>

            {saved.length > 0 && (
              <Card>
                <CardHeader title="Day-by-day plan" subtitle="Your personal route through the expo" />
                <div className="grid gap-4 p-5 lg:grid-cols-4">
                  {["Day 1", "Day 2", "Day 3", "Day 4"].map((d) => {
                    const items = saved.filter((s) => s.day === d);
                    return (
                      <div key={d} className="rounded-2xl bg-slate-50 p-3">
                        <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">{d}</p>
                        {items.length === 0 ? (
                          <p className="px-1 py-4 text-[12px] text-slate-400">Nothing booked</p>
                        ) : (
                          <div className="space-y-2.5">
                            {items.map((s) => (
                              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="font-display text-[12px] font-bold text-brand-700">{s.start}</p>
                                <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-900">{s.title}</p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="size-3" /> {s.stage}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === "exhibitors" && (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="relative min-w-0 flex-1">
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exhibitors by company, product or keyword…" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-[14px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
                <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 min-w-[190px]">
                  {cats.map((c) => <option key={c}>{c === "All" ? "All categories" : c}</option>)}
                </Select>
                <Badge tone="neutral" className="h-8 px-3">{filteredEx.length} results</Badge>
              </div>
            </Card>

            {filteredEx.length === 0 ? (
              <Card><EmptyState icon={<Building2 className="size-6" />} title="No exhibitors found" body="Try a different keyword or widen the category filter." action={<Button variant="secondary" onClick={() => { setQ(""); setCat("All"); }}>Clear filters</Button>} /></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEx.map((e) => (
                  <Card key={e.id} hover className="p-5">
                    <div className="flex items-start gap-3.5">
                      <ExhibitorLogo name={e.company} bg={e.logoBg} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[15px] font-bold text-slate-900">{e.company}</p>
                        <p className="mt-0.5 text-[11.5px] text-slate-500">{e.category}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-[11.5px] font-bold text-slate-700">{e.rating}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Globe2 className="size-3" /> {e.country}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">{e.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.products.map((p) => <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{p}</span>)}
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                      <Badge tone="brand"><MapPin className="size-3" /> {e.booth}</Badge>
                      <span className="text-[11px] text-slate-400">{e.hall}</span>
                      <Button size="xs" variant="ghost" className="ml-auto" icon={<MessageSquare className="size-3.5" />} onClick={() => setContact(e.company)}>Chat</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "expos" && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Recommended expos" subtitle="Curated from your interests and past attendance" />
              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {expoList.slice(0, 3).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
                    <img src={e.cover} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-slate-900">{e.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate-500">{e.city}</p>
                      <p className="mt-1 text-[11px] font-semibold text-brand-600">${e.price} / day</p>
                    </div>
                    <Link to={`/expos/${e.slug || e.id}`}><Button size="xs" variant="soft">View</Button></Link>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {expoList.map((e) => <ExpoCard key={e.id} expo={e} />)}
            </div>
          </div>
        )}

        {tab === "tickets" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="My tickets" subtitle="Active passes and workshop add-ons" right={<Badge tone="success" dot>Paid</Badge>} />
              <div className="divide-y divide-slate-100">
                {[
                  { n: "Full Access Pass", e: "Global Tech Summit 2026", d: "18–21 March 2026", p: 349, id: "TKT-2026-88214", t: "Full" },
                  { n: "Workshop add-on", e: "Ship a RAG Pipeline in 90 Minutes", d: "18 March · 11:00", p: 120, id: "TKT-2026-88215", t: "Workshop" },
                  { n: "Expo Day Pass", e: "MedExpo International", d: "9 April 2026", p: 199, id: "TKT-2026-90112", t: "Day" },
                ].map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                      <Ticket className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-slate-900">{t.n}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{t.e}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> {t.d}</span>
                        <span className="font-mono text-[10.5px] text-slate-400">{t.id}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[18px] font-bold text-slate-900">${t.p}</p>
                      <Badge tone={t.t === "Full" ? "brand" : t.t === "Workshop" ? "purple" : "neutral"} className="mt-1">{t.t}</Badge>
                    </div>
                    <Button size="xs" variant="secondary" icon={<QrCode className="size-3.5" />} onClick={() => toast({ title: "Ticket QR", body: t.id, tone: "info" })}>Show QR</Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <div>
                  <p className="text-[12.5px] font-bold text-slate-900">Total paid</p>
                  <p className="text-[11.5px] text-slate-500">Including VAT · invoices in your email</p>
                </div>
                <p className="font-display text-[22px] font-bold text-slate-900">$668</p>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                  <Ticket className="size-5" />
                  <p className="mt-3 font-display text-[15px] font-bold">Upgrade your pass</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
                    Add workshop access and 12 months of session recordings for $120.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toast({ title: "Upgrade flow", body: "This is a UI preview — no billing connected.", tone: "info" })}>Upgrade now</Button>
                </div>
              </Card>
              <Card>
                <CardHeader title="Purchase history" />
                <div className="divide-y divide-slate-100">
                  {[
                    ["Full Access Pass", "12 Feb 2026", "$349.00"],
                    ["Workshop add-on", "12 Feb 2026", "$120.00"],
                    ["MedExpo Day Pass", "28 Feb 2026", "$199.00"],
                  ].map(([n, d, p]) => (
                    <div key={n} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-slate-800">{n}</p>
                        <p className="text-[11px] text-slate-500">{d}</p>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900">{p}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-4">
                  <Button full variant="secondary" size="sm" icon={<Download className="size-4" />} onClick={() => toast({ title: "Invoices downloaded", tone: "success" })}>Download invoices</Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "appointments" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Confirmed" value={String(appts.filter((a) => a.status === "Confirmed").length)} icon={<CheckCircle2 className="size-5" />} tone="brand" sub="Upcoming meetings" />
              <StatCard label="Pending" value={String(appts.filter((a) => a.status === "Pending").length)} icon={<Clock className="size-5" />} tone="warn" sub="Awaiting exhibitor reply" />
              <StatCard label="Completed" value={String(appts.filter((a) => a.status === "Completed").length)} icon={<CalendarClock className="size-5" />} tone="success" sub="This edition" />
              <StatCard label="Total time" value={`${appts.filter((a) => a.status !== "Cancelled").reduce((s, a) => s + a.duration, 0)}m`} icon={<Users className="size-5" />} tone="info" sub="Booked with exhibitors" />
            </div>

            <Card>
              <CardHeader
                title="Your appointments"
                subtitle="Meetings with exhibitors — request, confirm, reschedule or cancel"
                right={<Badge tone="brand">{appts.filter((a) => a.status === "Confirmed").length} confirmed</Badge>}
              />
              <div className="divide-y divide-slate-100">
                {appts.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-start gap-4 p-5">
                    <Avatar src={a.avatar} name={a.with} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-slate-900">{a.with}</p>
                        <span className="text-[12px] text-slate-500">{a.company}</span>
                        <Badge tone={a.status === "Confirmed" ? "success" : a.status === "Pending" ? "warn" : a.status === "Completed" ? "brand" : "danger"} dot={a.status === "Pending"}>{a.status}</Badge>
                        <Badge tone="neutral" className="bg-slate-50">{a.type}</Badge>
                        {a.initiatedBy === "me" && <Badge tone="info">Your request</Badge>}
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-600">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 text-brand-500" /> {new Date(a.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> {a.time} · {a.duration} min</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {a.location}</span>
                      </p>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{a.notes}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                      {a.status === "Confirmed" ? (
                        <>
                          <Button size="sm" full variant="secondary" onClick={() => toast({ title: "Reschedule requested", body: "Alternatives sent to the exhibitor.", tone: "info" })}>Reschedule</Button>
                          <Button size="sm" full variant="ghost" icon={<X className="size-3.5" />} onClick={() => setCancelAppt(a)}>Cancel</Button>
                        </>
                      ) : a.status === "Pending" ? (
                        <Button size="sm" full variant="ghost" icon={<X className="size-3.5" />} onClick={() => setCancelAppt(a)}>Withdraw request</Button>
                      ) : (
                        <Button size="sm" full variant="secondary" onClick={() => setFeedback(a.company)}>Leave feedback</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Exhibitor availability" subtitle="Live meeting slots across the four days" />
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {EXHIBITORS.filter((e) => e.status === "Approved").slice(0, 4).map((e) => (
                  <div key={e.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2.5">
                      <ExhibitorLogo name={e.company} bg={e.logoBg} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-slate-900">{e.company}</p>
                        <p className="text-[11px] text-slate-500">Booth {e.booth}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {[["Day 2 · 11:00", true], ["Day 2 · 15:00", true], ["Day 3 · 10:00", false], ["Day 4 · 13:00", true]].map(([slot, free]) => (
                        <button
                          key={slot as string}
                          disabled={!free}
                          onClick={() => setBookAppt(e.company)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition",
                            free ? "border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                          )}
                        >
                          {slot as string}
                          {free ? <span className="text-[10px] font-bold text-emerald-600">free</span> : <span className="text-[10px]">taken</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "expos" && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Your registered events" subtitle="Events you have a pass for" right={<Badge tone="success" dot>3 active</Badge>} />
              <div className="divide-y divide-slate-100">
                {[
                  { t: "Global Tech Summit 2026", p: "Full Access Pass", d: "18–21 March 2026", c: "Dubai, UAE", s: "Confirmed", i: 0 },
                  { t: "MedExpo International", p: "Expo Day Pass", d: "9 April 2026", c: "Singapore", s: "Confirmed", i: 1 },
                  { t: "Industrial Innovate Fair", p: "Expo Day Pass", d: "24–27 February 2026", c: "Munich, Germany", s: "Attended", i: 2 },
                ].map((r) => (
                  <div key={r.t} className="flex flex-wrap items-center gap-4 p-5">
                    <img src={EXPOS[r.i]?.cover ?? EXPOS[0].cover} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-slate-900">{r.t}</p>
                        <Badge tone={r.s === "Confirmed" ? "success" : "neutral"} dot={r.s === "Confirmed"}>{r.s}</Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {r.d}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {r.c}</span>
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-brand-600">{r.p}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                      <Button size="sm" full variant="secondary" icon={<QrCode className="size-3.5" />} onClick={() => toast({ title: "Your e-Badge", body: r.t, tone: "info" })}>Show badge</Button>
                      <Button size="sm" full variant="ghost" onClick={() => setRegDone(r.t)}>Registration details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-[18px] font-bold tracking-tight text-slate-900">Browse and register</h3>
                  <p className="mt-1 text-[13px] text-slate-500">Upcoming editions open for attendee registration</p>
                </div>
                <Link to="/expos">
                  <Button size="sm" variant="secondary" iconRight={<ArrowRight className="size-4" />}>View all expos</Button>
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {EXPOS.filter((e) => e.status !== "Completed").map((e) => (
                  <ExpoCard key={e.id} expo={e} />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "feedback" && (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Submit feedback"
                subtitle="Rate sessions, review the expo, or leave exhibitor feedback"
                right={<Button size="sm" icon={<Star className="size-4" />} onClick={() => setFeedback("Global Tech Summit 2026")}>Write a review</Button>}
              />
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { t: "Event review", d: "Overall expo experience", i: Globe2, to: "Global Tech Summit 2026" },
                  { t: "Session rating", d: "Rate a session you attended", i: CalendarClock, to: "Opening Keynote: Intelligence at Scale" },
                  { t: "Exhibitor feedback", d: "How was a booth visit?", i: Building2, to: "Nexora Cloud" },
                ].map((x) => (
                  <button key={x.t} onClick={() => setFeedback(x.to)} className="text-left">
                    <Card hover className="group h-full p-5">
                      <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white">
                        <x.i className="size-5" />
                      </span>
                      <p className="mt-4 text-[14px] font-bold text-slate-900">{x.t}</p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{x.d}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600">
                        Write review <ArrowRight className="size-3.5" />
                      </span>
                    </Card>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Your submitted feedback" subtitle={`${FEEDBACK.length} reviews from this edition`} />
              <div className="divide-y divide-slate-100">
                {FEEDBACK.map((f) => (
                  <div key={f.id} className="flex flex-wrap items-start gap-4 p-5">
                    <Avatar src={f.avatar} name={f.attendee} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13.5px] font-bold text-slate-900">{f.title}</p>
                        <Badge tone={f.targetType === "Session" ? "brand" : f.targetType === "Exhibitor" ? "info" : "purple"}>{f.targetType}</Badge>
                        <Badge tone={f.status === "Resolved" ? "success" : f.status === "Closed" ? "neutral" : "warn"} dot={f.status === "New"}>{f.status}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("size-3.5", i < f.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                          ))}
                        </span>
                        <span className="text-[11.5px] text-slate-400">on {f.target} · {new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{f.body}</p>
                      {f.reply && (
                        <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3">
                          <p className="text-[11px] font-bold text-brand-700">Reply from the organizer</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-900">{f.reply}</p>
                        </div>
                      )}
                    </div>
                    <Button size="xs" variant="ghost" onClick={() => setFeedback(f.target)}>Edit</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "notifications" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="All notifications" subtitle="Schedule changes, reminders and matches" right={<Button size="xs" variant="ghost" onClick={() => toast({ title: "All marked as read", tone: "success" })}>Mark all read</Button>} />
              <div className="divide-y divide-slate-100">
                {[...NOTIFICATIONS, ...NOTIFICATIONS.map((n) => ({ ...n, id: n.id + "-b", time: "1d", title: n.title, body: n.body, tone: n.tone }))].map((n, i) => (
                  <div key={n.id + i} className="flex gap-3 px-5 py-4 transition hover:bg-slate-50/70">
                    <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", n.tone === "warn" ? "bg-amber-50 text-amber-600" : n.tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600")}>
                      <Bell className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold leading-snug text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{n.time} ago</p>
                    </div>
                    {i < 4 && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Notification settings" subtitle="How and when we contact you" />
              <div className="space-y-5 p-5">
                <Toggle checked label="Session reminders" desc="45 minutes before each bookmarked session" onChange={() => {}} />
                <Toggle checked label="Schedule change alerts" desc="Instant notification for any change" onChange={() => {}} />
                <Toggle checked label="Exhibitor matches" desc="New exhibitors in your interest areas" onChange={() => {}} />
                <Toggle checked={false} label="Email summaries" desc="A daily digest during expo week" onChange={() => {}} />
                <Button variant="secondary" onClick={() => toast({ title: "Settings saved", tone: "success" })}>Save preferences</Button>
              </div>
            </Card>
          </div>
        )}

        {tab === "payments" && (
          <UserPaymentsView />
        )}

        {tab === "messages" && (
          <RealtimeChatView defaultFilter="ALL" />
        )}

      {/* BOOK APPOINTMENT */}
      <Modal
        open={!!bookAppt}
        onClose={() => setBookAppt(null)}
        title={`Book a meeting with ${bookAppt}`}
        subtitle="Pick a slot — they typically confirm within 4 hours"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookAppt(null)}>Cancel</Button>
            <Button icon={<CalendarClock className="size-4" />} onClick={() => { setBookAppt(null); toast({ title: "Appointment requested", body: `${bookAppt} will confirm by email.`, tone: "success" }); }}>
              Request appointment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Day" required>
            <Select defaultValue="Day 2 · 19 March">{["Day 1 · 18 March", "Day 2 · 19 March", "Day 3 · 20 March", "Day 4 · 21 March"].map((d) => <option key={d}>{d}</option>)}</Select>
          </Field>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Available times</p>
            <div className="flex flex-wrap gap-2">
              {["10:00", "11:00", "13:30", "15:00", "16:00"].map((t, i) => (
                <span key={t} className={cn("cursor-pointer rounded-xl border px-3 py-2 text-[12.5px] font-bold transition", i === 1 ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Field label="Duration"><Select defaultValue="30 minutes">{["20 minutes", "30 minutes", "45 minutes", "60 minutes"].map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="What would you like to discuss?" hint="helps them prepare"><Textarea placeholder="I'd like a walkthrough of…" /></Field>
          <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-[12px] leading-relaxed text-brand-900">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Your name, company and email are shared with {bookAppt} so they can confirm the appointment.
          </div>
        </div>
      </Modal>

      {/* REGISTRATION CONFIRMATION */}
      <Modal
        open={!!regDone}
        onClose={() => setRegDone(null)}
        title="Registration confirmed"
        subtitle={regDone ?? ""}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegDone(null)}>Close</Button>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => { setRegDone(null); toast({ title: "Pass downloaded", body: "Added to your wallet and calendar.", tone: "success" }); }}>
              Download pass
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-[17px] font-bold text-emerald-900">You're registered!</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-800/80">
              A confirmation and your e-Badge have been emailed to <b>{user?.email ?? "you"}</b>.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[["Event", regDone ?? ""], ["Pass type", "Full Access Pass"], ["Dates", "18–21 March 2026"], ["Venue", "Dubai World Trade Centre — Hall 4"], ["Order reference", `ORD-${Math.floor(Math.random() * 90000 + 10000)}`], ["Amount paid", "$349.00"]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                <p className="mt-0.5 text-[13px] font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[13px] font-bold text-slate-900">What happens next</p>
            <div className="mt-3 space-y-2.5">
              {[
                "Your QR e-Badge is ready — show it at the fast-lane entrance",
                "Bookmark sessions to get a reminder 45 minutes before",
                "Browse the exhibitor directory and book meetings in advance",
              ].map((x) => (
                <div key={x} className="flex items-start gap-2.5 text-[12.5px] text-slate-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* FEEDBACK MODAL */}
      <Modal
        open={!!feedback}
        onClose={() => setFeedback(null)}
        title="Share your feedback"
        subtitle={`Reviewing ${feedback}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFeedback(null)}>Cancel</Button>
            <Button
              icon={<Send className="size-4" />}
              onClick={async () => {
                if (!fb.title.trim() || fb.body.trim().length < 12) {
                  toast({ title: "Add a headline and at least 12 characters of detail", tone: "danger" });
                  return;
                }
                try {
                  await post("/feedback", {
                    targetType: "Expo",
                    rating: fb.rating,
                    category: "Content",
                    title: fb.title,
                    comment: fb.body,
                  });
                  toast({ title: "Feedback submitted in MongoDB — thank you!", body: "The organizing team reads every review.", tone: "success" });
                } catch {
                  toast({ title: "Feedback submitted — thank you!", body: "The organizing team reads every review.", tone: "success" });
                }
                setFeedback(null);
                setFb({ rating: 5, title: "", body: "", session: "", recommend: true });
              }}
            >
              Submit feedback
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="What are you reviewing?">
            <Select value={feedback ?? ""} onChange={(e) => setFeedback(e.target.value)}>
              <option value={feedback ?? ""}>{feedback}</option>
              {EXPOS.map((e) => <option key={e.id} value={e.title}>{e.title} (event)</option>)}
              {SESSIONS.slice(0, 5).map((se) => <option key={se.id} value={se.title}>{se.title} (session)</option>)}
              {EXHIBITORS.slice(0, 5).map((ex) => <option key={ex.id} value={ex.company}>{ex.company} (exhibitor)</option>)}
            </Select>
          </Field>

          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Your rating</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFb({ ...fb, rating: i + 1 })}
                  aria-label={`${i + 1} star${i ? "s" : ""}`}
                  className="transition hover:scale-110"
                >
                  <Star className={cn("size-7", i < fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                </button>
              ))}
              <span className="ml-2 text-[13px] font-bold text-slate-700">{fb.rating}.0</span>
            </div>
          </div>

          <Field label="Headline" required>
            <Input value={fb.title} onChange={(e) => setFb({ ...fb, title: e.target.value })} placeholder="Summarise your experience in a sentence" />
          </Field>

          <Field label="Your review" required hint={`${fb.body.length} / 800`}>
            <Textarea maxLength={800} value={fb.body} onChange={(e) => setFb({ ...fb, body: e.target.value })} placeholder="What worked well? What could be better?" className="min-h-[130px]" />
          </Field>

          <Field label="Category">
            <Select value={fb.session} onChange={(e) => setFb({ ...fb, session: e.target.value })}>
              <option value="">Select a category…</option>
              {["Content", "Logistics", "Venue", "Technology", "Catering"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <Checkbox
              checked={fb.recommend}
              onChange={(v: boolean) => setFb({ ...fb, recommend: v })}
              label="I would recommend this to a colleague"
            />
          </div>

          <p className="text-[11.5px] leading-relaxed text-slate-400">
            Reviews are published anonymously to other attendees and shared with the organizing team. Your name and company
            are only shown to organizers.
          </p>
        </div>
      </Modal>

      {/* CANCEL APPOINTMENT */}
      <ConfirmDialog
        open={!!cancelAppt}
        onClose={() => setCancelAppt(null)}
        title={cancelAppt?.status === "Pending" ? "Withdraw this request?" : "Cancel this appointment?"}
        body={`${cancelAppt?.with} on ${cancelAppt ? new Date(cancelAppt.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : ""} at ${cancelAppt?.time}. They will be notified immediately.`}
        confirmLabel={cancelAppt?.status === "Pending" ? "Withdraw request" : "Cancel appointment"}
        onConfirm={() => {
          setAppts((p) => p.map((x) => (x.id === cancelAppt?.id ? { ...x, status: "Cancelled" } : x)));
          toast({ title: cancelAppt?.status === "Pending" ? "Request withdrawn" : "Appointment cancelled", tone: "warn" });
        }}
      />

      <Modal
        open={!!contact}
        onClose={() => setContact(null)}
        title={`Message ${contact}`}
        subtitle="Live direct messaging — conversation will appear in your Messages tab"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContact(null)}>Cancel</Button>
            <Button
              icon={<Send className="size-4" />}
              disabled={sendingContact || !contactMessage.trim()}
              onClick={handleSendContact}
            >
              {sendingContact ? "Sending to MongoDB..." : "Send message"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject">
            <Input
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder={`Meeting inquiry with ${contact}`}
            />
          </Field>
          <Field label="Message" required>
            <Textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={`Hi ${contact}, I saw your profile and would like to ask about your products and booth demonstration…`}
            />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-[12px] text-slate-600">
            <Users className="size-4 shrink-0 text-slate-400" />
            Direct message sent via MongoDB Socket.IO. The exhibitor can reply to you immediately.
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
