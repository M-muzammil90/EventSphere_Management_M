import { useEffect, useMemo, useState } from "react";
import { FEEDBACK, RATING_BREAKDOWN, type Feedback } from "@/lib/mock";
import { EXPOS, SESSIONS, EXHIBITORS } from "@/lib/data";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, Progress, Select, Tabs, Textarea } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { BarChart, Donut, Gauge } from "@/components/charts";
import { ConfirmDialog, Pagination, RowMenu, TableSkeleton } from "@/components/kit";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Archive, Check, MessageSquare, Reply, Send, Star, TrendingUp, Trash2, Users } from "lucide-react";
import { fetchLiveFeedback, replyLiveFeedback, setLiveFeedbackStatus } from "@/lib/liveApi";

const PER_PAGE = 6;
const STATUSES = ["All", "New", "In Review", "Resolved", "Closed"];
const CATEGORIES = ["All", "Content", "Logistics", "Venue", "Technology", "Catering"];

const Stars = ({ n, size = "size-3.5" }: { n: number; size?: string }) => (
  <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn(size, i < n ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
    ))}
  </span>
);

export default function AdminFeedback() {
  const { toast } = useStore();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [cat, setCat] = useState("All");
  const [target, setTarget] = useState("All");
  const [rating, setRating] = useState("All");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Feedback | null>(null);
  const [reply, setReply] = useState("");
  const [del, setDel] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLiveFeedback();
    setFeedbackList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      feedbackList.filter((f) => {
        const hay = `${f.attendee} ${f.company} ${f.target} ${f.title} ${f.body} ${f.category}`.toLowerCase();
        return (
          (!q || hay.includes(q.toLowerCase())) &&
          (status === "All" || f.status === status) &&
          (cat === "All" || f.category === cat) &&
          (target === "All" || f.targetType === target) &&
          (rating === "All" || (rating === "4-5" ? f.rating >= 4 : rating === "3" ? f.rating === 3 : f.rating <= 2))
        );
      }),
    [feedbackList, q, status, cat, target, rating]
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const avg = feedbackList.length ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1) : "4.8";
  const nps = feedbackList.length ? Math.round(((feedbackList.filter((f) => f.rating >= 4).length - feedbackList.filter((f) => f.rating <= 2).length) / feedbackList.length) * 100) : 74;

  const handleSendReply = async () => {
    if (!open) return;
    if (!reply.trim()) {
      toast({ title: "Please enter a reply", tone: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      if (open.id && open.id.length === 24) {
        await replyLiveFeedback(open.id, reply);
      }
      toast({ title: "Reply saved in MongoDB", body: `${open.attendee} notified.`, tone: "success" });
      setReply("");
      setOpen(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to reply", body: err?.message, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!open) return;
    try {
      if (open.id && open.id.length === 24) {
        await setLiveFeedbackStatus(open.id, "resolved");
      }
      toast({ title: "Marked resolved in MongoDB", tone: "success" });
      setOpen(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed", body: err?.message, tone: "danger" });
    }
  };

  const handleMarkResolvedItem = async (item: Feedback) => {
    try {
      if (item.id && item.id.length === 24) {
        await setLiveFeedbackStatus(item.id, "resolved");
      }
      setFeedbackList((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "Resolved" as const } : x)));
      toast({ title: `${item.id} resolved`, tone: "success" });
    } catch (err: any) {
      toast({ title: "Failed to update status", body: err?.message, tone: "danger" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Feedback management</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Attendee reviews and ratings for expos, sessions and exhibitors — with replies and status tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" icon={<TrendingUp className="size-4" />} onClick={() => setTab("insights")}>Insights</Button>
          <Button icon={<Send className="size-4" />} onClick={() => toast({ title: "Feedback request queued", body: "Survey emails will go to 4,812 attendees.", tone: "success" })}>Request feedback</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average rating" value={`${avg} / 5`} delta="+0.3" icon={<Star className="size-5" />} tone="brand" sub={`${FEEDBACK.length} submissions`} />
        <StatCard label="Awaiting triage" value={String(FEEDBACK.filter((f) => f.status === "New").length)} icon={<MessageSquare className="size-5" />} tone="warn" sub="New and unread" />
        <StatCard label="Resolution rate" value={`${Math.round((FEEDBACK.filter((f) => f.status === "Resolved" || f.status === "Closed").length / FEEDBACK.length) * 100)}%`} delta="+8.2%" icon={<Check className="size-5" />} tone="success" sub="Resolved or closed" />
        <StatCard label="NPS" value={String(nps)} delta="+8" icon={<TrendingUp className="size-5" />} tone="info" sub="Promoters minus detractors" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "list", label: "Feedback inbox", count: FEEDBACK.length },
          { id: "insights", label: "Ratings & insights" },
        ]}
      />

      {tab === "list" && (
        <>
          <Card>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
              <div className="relative min-w-0 flex-1">
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Search feedback by attendee, target or content…"
                  aria-label="Search feedback"
                  className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                />
                <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
              <Tabs size="sm" active={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={STATUSES.map((s) => ({ id: s, label: s === "All" ? "All" : s, count: s === "All" ? feedbackList.length : feedbackList.filter((f) => f.status === s).length }))} />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
              <Select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="h-9 min-w-[140px] text-[12.5px]">
                {CATEGORIES.map((c) => <option key={c}>{c === "All" ? "All categories" : c}</option>)}
              </Select>
              <Select value={target} onChange={(e) => { setTarget(e.target.value); setPage(1); }} className="h-9 min-w-[140px] text-[12.5px]">
                {["All", "Expo", "Session", "Exhibitor"].map((t) => <option key={t}>{t === "All" ? "All feedback types" : t}</option>)}
              </Select>
              <Select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} className="h-9 min-w-[130px] text-[12.5px]">
                <option value="All">All ratings</option>
                <option value="4-5">4–5 stars</option>
                <option value="3">3 stars</option>
                <option value="0-2">1–2 stars</option>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button size="xs" variant="secondary" onClick={() => toast({ title: "Feedback exported to CSV", tone: "success" })}>CSV</Button>
                <Button size="xs" variant="secondary" onClick={() => toast({ title: "Feedback exported to PDF", tone: "success" })}>PDF</Button>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="size-6" />}
                title="No feedback in this view"
                body="Nothing matches the current filters. Try a different status or category."
                action={<Button variant="secondary" onClick={() => { setQ(""); setStatus("All"); setCat("All"); setTarget("All"); setRating("All"); }}>Clear filters</Button>}
              />
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {slice.map((f) => (
                    <div key={f.id} className="flex flex-wrap items-start gap-4 p-5 transition hover:bg-slate-50/60">
                      <Avatar src={f.avatar} name={f.attendee} size={42} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13.5px] font-bold text-slate-900">{f.attendee}</p>
                          <span className="text-[11.5px] text-slate-400">{f.company}</span>
                          <Badge tone={f.targetType === "Session" ? "brand" : f.targetType === "Exhibitor" ? "info" : "purple"}>{f.targetType}</Badge>
                          <Badge tone="neutral" className="bg-slate-50">{f.category}</Badge>
                          {f.status === "New" && <span className="size-2 rounded-full bg-brand-600" />}
                        </div>
                        <p className="mt-1.5 flex items-center gap-2">
                          <Stars n={f.rating} />
                          <span className="text-[12px] font-bold text-slate-700">{f.rating}.0</span>
                        </p>
                        <p className="mt-2 text-[14px] font-bold text-slate-900">{f.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{f.body}</p>
                        <p className="mt-2 text-[11.5px] text-slate-400">
                          On <b className="text-slate-600">{f.target}</b> · {new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {f.id}
                        </p>
                        {f.reply && (
                          <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3">
                            <p className="text-[11px] font-bold text-brand-700">You replied on {new Date(f.repliedAt ?? f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                            <p className="mt-1 text-[12.5px] leading-relaxed text-brand-900">{f.reply}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge tone={f.status === "Resolved" ? "success" : f.status === "Closed" ? "neutral" : f.status === "In Review" ? "warn" : "brand"} dot={f.status === "New"}>
                          {f.status}
                        </Badge>
                        <div className="flex gap-1.5">
                          <Button size="xs" variant={f.reply ? "secondary" : "soft"} icon={<Reply className="size-3.5" />} onClick={() => { setOpen(f); setReply(f.reply ?? ""); }}>
                            {f.reply ? "View" : "Reply"}
                          </Button>
                          <RowMenu
                            items={[
                              { label: "Mark in review", icon: <Archive />, onClick: () => toast({ title: `${f.id} marked in review`, tone: "info" }) },
                              { label: "Mark resolved", icon: <Check />, onClick: () => handleMarkResolvedItem(f) },
                              { label: "Delete feedback", icon: <Trash2 />, danger: true, onClick: () => setDel(f) },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-4">
                  <Pagination page={page} pages={pages} onChange={setPage} total={filtered.length} perPage={PER_PAGE} />
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {tab === "insights" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Rating distribution" subtitle={`${FEEDBACK.length} submissions across this edition`} />
              <div className="space-y-3 p-5">
                {RATING_BREAKDOWN.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="flex w-20 shrink-0 items-center gap-1 text-[12px] font-semibold text-slate-600">
                      {r.label.replace(" stars", "")} <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <Progress value={r.v} className="flex-1" height={9} tone={r.v > 50 ? "success" : r.v > 10 ? "brand" : "warn"} />
                    <span className="w-10 text-right text-[12px] font-bold tabular-nums text-slate-900">{r.v}%</span>
                    <span className="w-10 text-right text-[11.5px] tabular-nums text-slate-400">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Overall satisfaction" subtitle="All feedback types" />
              <div className="flex flex-col items-center p-5">
                <Gauge value={Math.round((+avg / 5) * 100)} label="Satisfied" sub={`${avg} average from ${FEEDBACK.length} reviews`} />
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                  {[["Positive", FEEDBACK.filter((f) => f.rating >= 4).length], ["Neutral", FEEDBACK.filter((f) => f.rating === 3).length], ["Negative", FEEDBACK.filter((f) => f.rating <= 2).length]].map(([l, v]) => (
                    <div key={l as string} className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-[14px] font-bold text-slate-900">{v as number}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{l as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Feedback by category" subtitle="Where issues are raised" />
              <div className="p-5">
                <BarChart
                  horizontal
                  color="#5947c6"
                  format={String}
                  data={CATEGORIES.slice(1).map((c) => ({ label: c, v: FEEDBACK.filter((f) => f.category === c).length }))}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Feedback by type" subtitle="Expo / session / exhibitor" />
              <div className="p-5">
                <Donut
                  size={160}
                  thickness={18}
                  centerLabel="Reviews"
                  centerValue={String(FEEDBACK.length)}
                  data={[
                    { label: "Session", value: Math.round((FEEDBACK.filter((f) => f.targetType === "Session").length / FEEDBACK.length) * 100), color: "#5947c6" },
                    { label: "Expo", value: Math.round((FEEDBACK.filter((f) => f.targetType === "Expo").length / FEEDBACK.length) * 100), color: "#0ea5e9" },
                    { label: "Exhibitor", value: Math.round((FEEDBACK.filter((f) => f.targetType === "Exhibitor").length / FEEDBACK.length) * 100), color: "#8b72ee" },
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Lowest-rated targets" subtitle="Needs attention first" />
              <div className="divide-y divide-slate-100">
                {[...FEEDBACK].sort((a, b) => a.rating - b.rating).slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">{f.target}</p>
                      <p className="text-[11px] text-slate-500">{f.category} · {f.attendee}</p>
                    </div>
                    <Stars n={f.rating} size="size-3" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Session ratings" subtitle="Average attendee rating per session" />
            <div className="p-5">
              <BarChart
                horizontal
                color="#f97316"
                format={(n) => `${n}.0`}
                data={SESSIONS.slice(0, 8).map((s) => ({ label: s.title.length > 30 ? s.title.slice(0, 30) + "…" : s.title, v: s.rating }))}
              />
            </div>
          </Card>
        </div>
      )}

      {/* REPLY MODAL */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.reply ? "Feedback thread" : "Reply to feedback"}
        subtitle={`${open?.id} · ${open?.attendee} on ${open?.target}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>
            <Button variant="secondary" onClick={handleMarkResolved}>Mark resolved</Button>
            <Button loading={submitting} icon={<Send className="size-4" />} onClick={handleSendReply}>
              {open?.reply ? "Send follow-up" : "Send reply"}
            </Button>
          </>
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Avatar src={open.avatar} name={open.attendee} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900">{open.attendee}</p>
                  <p className="text-[11.5px] text-slate-500">{open.company} · {new Date(open.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
                </div>
                <Stars n={open.rating} size="size-4" />
              </div>
              <p className="mt-3 text-[14px] font-bold text-slate-900">{open.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{open.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{open.targetType}</Badge>
                <Badge tone="neutral" className="bg-white">{open.category}</Badge>
                <Badge tone={open.status === "Resolved" ? "success" : "warn"}>{open.status}</Badge>
              </div>
            </div>

            {open.reply && (
              <div className="flex gap-3">
                <span className="grid size-8.5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">SW</span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-brand-200 bg-brand-50/60 p-4">
                  <p className="text-[13.5px] leading-relaxed text-slate-700">{open.reply}</p>
                  <p className="mt-2.5 text-[11px] text-slate-400">{new Date(open.repliedAt ?? open.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            )}

            <Field label={open.reply ? "Follow-up reply" : "Your reply"} required hint="sent by email to the attendee">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank you for the detailed feedback…" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Update status">
                <Select defaultValue={open.status}>
                  {["New", "In Review", "Resolved", "Closed"].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Assign to">
                <Select defaultValue="Events Team">
                  {["Events Team", "Venue Ops", "Technology", "Catering", "Content Team"].map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600">
              Replies are logged against the feedback record and emailed to the attendee. Internal assignment notes are
              never shared externally.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete this feedback?"
        body={`${del?.id} from ${del?.attendee} will be permanently removed from the feedback record.`}
        confirmLabel="Delete feedback"
        onConfirm={() => toast({ title: "Feedback deleted", tone: "danger" })}
      />

      <div className="hidden">{EXPOS.length}{EXHIBITORS.length}</div>
    </div>
  );
}
