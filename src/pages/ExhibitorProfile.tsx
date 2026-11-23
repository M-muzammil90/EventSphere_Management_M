import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EXHIBITORS, SESSIONS, EXPOS } from "@/lib/data";
import { FEEDBACK } from "@/lib/mock";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, Progress, Select, Textarea, Tabs } from "@/components/ui";
import { ExhibitorLogo } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { BarChart, Gauge } from "@/components/charts";
import { ConfirmDialog } from "@/components/kit";
import { fmt, money, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { startLiveConversation } from "@/lib/liveApi";
import {
  ArrowLeft, Award, Bookmark, Building2, CalendarClock, CheckCircle2, Clock, Globe2, Mail, MapPin,
  MessageSquare, Send, Star, TrendingUp, Users,
} from "lucide-react";

export default function ExhibitorProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useStore();
  const ex = EXHIBITORS.find((e) => e.id.toLowerCase() === (id ?? "").toLowerCase());

  const [tab, setTab] = useState("overview");
  const [contact, setContact] = useState(false);
  const [msgSub, setMsgSub] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [booking, setBooking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState({ day: "Day 2 · 19 March", time: "11:00", topic: "", message: "" });

  const reviews = useMemo(() => FEEDBACK.filter((f) => f.targetType === "Exhibitor"), []);
  const related = useMemo(() => EXHIBITORS.filter((e) => e.category === ex?.category && e.id !== ex?.id).slice(0, 3), [ex]);

  if (!ex)
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24">
          <EmptyState
            icon={<Building2 className="size-6" />}
            title="Exhibitor not found"
            body="This exhibitor may have withdrawn or the link is incorrect."
            action={<Button onClick={() => nav("/exhibitors")}>Browse the directory</Button>}
          />
        </div>
      </Shell>
    );

  const avail = [
    ["Day 1 · 18 March", ["09:30", "11:00", "14:00", "16:00"]],
    ["Day 2 · 19 March", ["10:00", "11:00", "13:30", "15:00"]],
    ["Day 3 · 20 March", ["09:00", "12:00", "14:30"]],
    ["Day 4 · 21 March", ["10:30", "13:00", "15:30"]],
  ] as const;

  return (
    <Shell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0 grid-noise-dark opacity-50" />
        <div className="pointer-events-none absolute -left-24 -top-24 size-[400px] rounded-full bg-brand-600/25 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-[400px] rounded-full bg-brand-400/15 blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/exhibitors" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/60 transition hover:text-white">
            <ArrowLeft className="size-3.5" /> Exhibitor directory
          </Link>

          <div className="mt-6 flex flex-wrap items-start gap-6">
            <ExhibitorLogo name={ex.company} bg={ex.logoBg} size={80} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[26px] font-extrabold tracking-[-0.025em] text-white sm:text-[34px]">{ex.company}</h1>
                <Badge tone="purple" className="bg-white/10 text-purple-200 ring-white/15">{ex.badgeTier} sponsor</Badge>
                <Badge tone="success" className="bg-white/10 text-emerald-200 ring-white/15" dot>Verified</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-[14px] text-slate-300/90">{ex.description}</p>
              <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-slate-400">
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> Booth {ex.booth} · {ex.hall}</span>
                <span className="inline-flex items-center gap-1.5"><Globe2 className="size-3.5" /> {ex.country}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {ex.staff} on-booth team</span>
                <span className="inline-flex items-center gap-1.5"><Star className="size-3.5" /> {ex.rating} exhibitor rating</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="outline" icon={<Bookmark className="size-4" />} onClick={() => { setSaved((v) => !v); toast({ title: saved ? "Removed from saved" : `${ex.company} saved`, tone: saved ? "info" : "success" }); }}>
                {saved ? "Saved" : "Save"}
              </Button>
              <Button icon={<CalendarClock className="size-4" />} onClick={() => setBooking(true)}>Book a meeting</Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Booth traffic", v: fmt(ex.traffic), s: "Badge scans" },
              { l: "Products showcased", v: String(ex.products.length), s: "Live and beta" },
              { l: "Lead score", v: String(ex.leadScore), s: "Enrichment model" },
              { l: "Joined", v: new Date(ex.joined).toLocaleDateString("en-US", { month: "short", year: "numeric" }), s: ex.id },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/45">{k.l}</p>
                <p className="mt-1.5 font-display text-[20px] font-bold leading-none text-white">{k.v}</p>
                <p className="mt-1.5 text-[11px] text-white/40">{k.s}</p>
              </div>
            ))}
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
              { id: "products", label: "Products & services", count: ex.products.length },
              { id: "team", label: "On-booth team", count: 4 },
              { id: "schedule", label: "Speaking slots", count: 2 },
              { id: "reviews", label: "Reviews", count: reviews.length },
            ]}
          />
        </div>
      </section>

      <section className="bg-slate-100/70 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {tab === "overview" && (
                <>
                  <Card>
                    <CardHeader title={`About ${ex.company}`} subtitle={`${ex.category} · ${ex.country}`} />
                    <div className="space-y-4 p-5 text-[14px] leading-relaxed text-slate-600">
                      <p>{ex.description}</p>
                      <p>
                        {ex.company} is exhibiting at Global Tech Summit 2026 with a dedicated booth in {ex.hall}. Their
                        team of {ex.staff} will be running live demonstrations throughout all four days, with {ex.products.length} products and services on show.
                      </p>
                      <p>
                        Over previous editions the company has generated {fmt(ex.traffic)} badge scans and {money(ex.revenue)} in
                        attributed pipeline. Their lead score of {ex.leadScore} places them in the top decile of exhibitors at
                        this event.
                      </p>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="Products & services" right={<Badge tone="brand">{ex.products.length} showcased</Badge>} />
                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      {ex.products.map((p, i) => (
                        <div key={p} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-brand-50 font-display text-[12px] font-bold text-brand-600">{i + 1}</span>
                            <Badge tone={i === ex.products.length - 1 ? "warn" : "success"}>{i === ex.products.length - 1 ? "Beta" : "Live"}</Badge>
                          </div>
                          <p className="mt-3 text-[14px] font-bold text-slate-900">{p}</p>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
                            Demonstrated on-booth across all four days. Ask the team for the technical pack.
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader title="Performance at this expo" subtitle="Live data, refreshed every 30 seconds" />
                    <div className="grid gap-6 p-5 sm:grid-cols-2">
                      <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Booth traffic by day</p>
                        <BarChart
                          color="#5947c6"
                          height={170}
                          showValues
                          format={fmt}
                          data={[{ label: "D1", v: 620 }, { label: "D2", v: 980 }, { label: "D3", v: 1240 }, { label: "D4", v: 1080 }]}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <Gauge value={ex.leadScore} label="Lead score" sub="Top decile at this expo" size={162} />
                        <div className="mt-3 w-full space-y-2">
                          {[["Badge scans", fmt(ex.traffic), 100], ["Qualified", fmt(Math.round(ex.traffic * 0.61)), 61], ["Meetings", "214", 24]].map(([l, v, p]) => (
                            <div key={l as string} className="flex items-center gap-2.5">
                              <span className="w-20 text-[11.5px] font-semibold text-slate-600">{l as string}</span>
                              <Progress value={p as number} className="flex-1" height={6} />
                              <span className="w-14 text-right text-[11.5px] font-bold text-slate-900">{v as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {tab === "products" && (
                <Card>
                  <CardHeader title="Products & services" subtitle={`Everything ${ex.company} is showcasing at booth ${ex.booth}`} />
                  <div className="divide-y divide-slate-100">
                    {ex.products.concat(["Professional Services"]).map((p, i) => (
                      <div key={p} className="flex flex-wrap items-start gap-4 p-5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                          <Award className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14.5px] font-bold text-slate-900">{p}</p>
                            <Badge tone={i === ex.products.length ? "info" : "success"}>{i === ex.products.length ? "Service" : "Product"}</Badge>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                            {i === ex.products.length
                              ? "Implementation, migration and managed operations delivered by their in-house engineering team."
                              : "Live demonstrations running on the hour, every hour, at booth " + ex.booth + "."}
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" icon={<MessageSquare className="size-4" />} onClick={() => setContact(true)}>
                          Enquire
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {tab === "team" && (
                <Card>
                  <CardHeader title="On-booth team" subtitle={`${ex.staff} staff badges issued — say hello on the day`} />
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    {[
                      { n: ex.rep, r: "Booth Lead", e: "Primary contact" },
                      { n: "Daniel Cho", r: "Sales Engineer", e: "Technical questions" },
                      { n: "Lucia Ferrer", r: "Demo Specialist", e: "Runs the demo bay" },
                      { n: "Tom Berger", r: "Field Marketer", e: "Follow-up & content" },
                    ].map((t, i) => (
                      <div key={t.n} className="flex items-center gap-3.5 rounded-2xl border border-slate-200 p-4">
                        <Avatar name={t.n} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-bold text-slate-900">{t.n}</p>
                          <p className="text-[11.5px] text-slate-500">{t.r}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{t.e}</p>
                        </div>
                        <Button size="xs" variant="ghost" icon={<Mail className="size-3.5" />} onClick={() => setContact(true)}>Message</Button>
                        {i === 0 && <Badge tone="brand">Lead</Badge>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {tab === "schedule" && (
                <Card>
                  <CardHeader title="Speaking slots" subtitle="Sessions featuring the team" right={<Link to="/schedule"><Button size="xs" variant="ghost">Full schedule</Button></Link>} />
                  {SESSIONS.filter((s) => s.speaker.includes(ex.rep.split(" ")[0])).length === 0 ? (
                    <div className="p-5">
                      {SESSIONS.slice(0, 2).map((s) => (
                        <div key={s.id} className="mb-3 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4">
                          <div className="w-16 shrink-0 rounded-xl bg-brand-50 py-2 text-center ring-1 ring-brand-100">
                            <p className="font-display text-[14px] font-bold text-brand-700">{s.start}</p>
                            <p className="text-[10.5px] text-slate-400">{s.end}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-slate-900">{s.title}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{s.speaker} · {s.stage} · {s.day}</p>
                          </div>
                          <Link to="/schedule"><Button size="sm" variant="secondary">View session</Button></Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 p-5">
                      {SESSIONS.filter((s) => s.speaker.includes(ex.rep.split(" ")[0])).map((s) => (
                        <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4">
                          <div className="w-16 shrink-0 rounded-xl bg-brand-50 py-2 text-center ring-1 ring-brand-100">
                            <p className="font-display text-[14px] font-bold text-brand-700">{s.start}</p>
                            <p className="text-[10.5px] text-slate-400">{s.end}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-slate-900">{s.title}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{s.speakerRole} · {s.stage} · {s.day}</p>
                          </div>
                          <Link to="/schedule"><Button size="sm" variant="secondary">View session</Button></Link>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {tab === "reviews" && (
                <Card>
                  <CardHeader title="Attendee reviews" subtitle={`${reviews.length} verified reviews from this edition`} />
                  <div className="space-y-4 p-5">
                    {reviews.length === 0 ? (
                      <EmptyState icon={<Star className="size-6" />} title="No reviews yet" body="Reviews appear here once attendees submit feedback after the event." />
                    ) : (
                      reviews.map((f) => (
                        <div key={f.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-start gap-3">
                            <Avatar src={f.avatar} name={f.attendee} size={38} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-bold text-slate-900">{f.attendee}</p>
                                <span className="text-[11.5px] text-slate-400">{f.company}</span>
                                <span className="ml-auto flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn("size-3.5", i < f.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                                  ))}
                                </span>
                              </div>
                              <p className="mt-2 text-[13px] font-bold text-slate-800">{f.title}</p>
                              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{f.body}</p>
                              {f.reply && (
                                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                  <p className="text-[11.5px] font-bold text-slate-700">Reply from {ex.company}</p>
                                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{f.reply}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* SIDE RAIL */}
            <div className="space-y-6">
              <Card className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Find them at the expo</p>
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/15"><MapPin className="size-5" /></span>
                    <div>
                      <p className="font-display text-[22px] font-bold leading-none">Booth {ex.booth}</p>
                      <p className="mt-1 text-[12px] text-white/70">{ex.hall}</p>
                    </div>
                  </div>
                  <Link to="/floor-plan" className="mt-4 block">
                    <Button full variant="secondary" size="sm">Open floor plan</Button>
                  </Link>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    ["Category", ex.category],
                    ["Country", ex.country],
                    ["Sponsorship", `${ex.badgeTier} tier`],
                    ["Team size", `${ex.staff} staff`],
                    ["Exhibitor ID", ex.id],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-100 pb-2 last:border-0">
                      <span className="text-[12.5px] text-slate-500">{l}</span>
                      <span className="text-[12.5px] font-bold text-slate-900">{v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Book a meeting" subtitle="30-minute slots across all four days" />
                <div className="space-y-3 p-5">
                  {avail.slice(0, 2).map(([day, times]) => (
                    <div key={day}>
                      <p className="text-[11.5px] font-bold text-slate-500">{day}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(times as readonly string[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => { setForm((f) => ({ ...f, day, time: t })); setBooking(true); }}
                            className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[12px] font-bold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button full variant="secondary" size="sm" icon={<CalendarClock className="size-4" />} onClick={() => setBooking(true)}>
                    See all availability
                  </Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Similar exhibitors" subtitle={`More in ${ex.category}`} />
                <div className="divide-y divide-slate-100">
                  {related.map((r) => (
                    <Link key={r.id} to={`/exhibitors/${r.id.toLowerCase()}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                      <ExhibitorLogo name={r.company} bg={r.logoBg} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold text-slate-900">{r.company}</p>
                        <p className="text-[11px] text-slate-500">Booth {r.booth}</p>
                      </div>
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11.5px] font-bold text-slate-700">{r.rating}</span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Also exhibiting at</p>
                <div className="mt-3 space-y-2">
                  {EXPOS.slice(0, 3).map((e) => (
                    <Link key={e.id} to={`/expos/${e.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300">
                      <img src={e.cover} alt="" className="size-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-slate-900">{e.title}</p>
                        <p className="text-[11px] text-slate-500">{e.city}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING MODAL */}
      <Modal
        open={booking}
        onClose={() => setBooking(false)}
        title={`Book a meeting with ${ex.company}`}
        subtitle={`Booth ${ex.booth} · 30 minutes · confirmation within 4 hours`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBooking(false)}>Cancel</Button>
            <Button icon={<CalendarClock className="size-4" />} onClick={() => setConfirm(true)}>Request appointment</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Select a day">
            <Select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {avail.map(([d]) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Available times</p>
            <div className="flex flex-wrap gap-2">
              {avail.find(([d]) => d === form.day)?.[1].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, time: t })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12.5px] font-bold transition",
                    form.time === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Field label="What would you like to discuss?" hint="helps them prepare">
            <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="I'd like a walkthrough of your multi-region setup for a regulated environment…" />
          </Field>
          <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-[12px] leading-relaxed text-brand-900">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Your name, company and email address will be shared with {ex.company} so they can confirm the appointment.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        tone="success"
        icon={<CheckCircle2 className="size-5" />}
        title="Request this appointment?"
        body={`${form.day} at ${form.time} with ${ex.company} at booth ${ex.booth}. They'll confirm by email within 4 hours.`}
        confirmLabel="Send request"
        onConfirm={() => {
          setBooking(false);
          toast({ title: "Appointment requested", body: `${form.day} at ${form.time} — pending confirmation.`, tone: "success" });
        }}
      />

      {/* CONTACT MODAL */}
      <Modal
        open={contact}
        onClose={() => setContact(false)}
        title={`Message ${ex.company}`}
        subtitle="Direct conversation — messages are delivered in real time"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContact(false)}>Cancel</Button>
            <Button
              icon={<Send className="size-4" />}
              disabled={sendingMsg || !msgText.trim()}
              onClick={async () => {
                if (!msgText.trim()) return;
                setSendingMsg(true);
                try {
                  await startLiveConversation({
                    recipientId: ex.company || ex.id,
                    subject: msgSub.trim() || `Inquiry for ${ex.company}`,
                    initialMessage: msgText.trim(),
                    conversationType: "DIRECT",
                  });
                  toast({
                    title: "Message Sent ✓",
                    body: `Conversation opened with ${ex.company}. Redirecting to your Messages...`,
                    tone: "success",
                  });
                  setContact(false);
                  setMsgText("");
                  nav("/attendee");
                } catch (err: any) {
                  toast({
                    title: "Could not send message",
                    body: err.message || "Please login or verify your account.",
                    tone: "danger",
                  });
                } finally {
                  setSendingMsg(false);
                }
              }}
            >
              {sendingMsg ? "Sending to MongoDB..." : "Send message"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject">
            <input
              value={msgSub}
              onChange={(e) => setMsgSub(e.target.value)}
              placeholder={`Enquiry to ${ex.company}`}
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-[14px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
            />
          </Field>
          <Field label="Message" required>
            <Textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder={`Hi ${ex.company}, I'd like to know more about your solutions and arrange a meeting at your booth…`}
            />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3.5 text-[12px] text-slate-600">
            <Clock className="size-4 shrink-0 text-slate-400" /> Typical response time is under 24 hours during expo week.
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-[12px] text-emerald-800">
            <TrendingUp className="size-4 shrink-0" /> Real-time chat powered by EventSphere Socket.IO & MongoDB.
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
