import { useEffect, useMemo, useState } from "react";
import { type Session } from "@/lib/data";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Progress, Select, Table, Tabs, Td, Textarea, Th } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { BarChart } from "@/components/charts";
import { fmt, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { CalendarClock, Download, MapPin, Pencil, Plus, Search, Star, Trash2, Users } from "lucide-react";
import { fetchLiveSessions, createLiveSession, updateLiveSession, deleteLiveSession, fetchLiveExpos } from "@/lib/liveApi";

const DAYS = ["All", "Day 1", "Day 2", "Day 3", "Day 4"];
const TRACKS = ["Vision", "Engineering", "Infrastructure", "Automation", "Security", "Commerce", "Governance", "Energy", "Foresight"];
const TYPES = ["Keynote", "Workshop", "Panel", "Demo", "Roundtable"];
const STAGES = ["Main Stage", "Forum A", "Forum B", "Lab 1", "Lab 2", "Demo Arena"];

const typeTone = (t: string) => (t === "Keynote" ? "purple" : t === "Workshop" ? "brand" : t === "Demo" ? "warn" : "neutral");
const typeBar = (t: string) => (t === "Keynote" ? "bg-purple-500" : t === "Workshop" ? "bg-brand-500" : t === "Demo" ? "bg-amber-500" : "bg-slate-300");

function errorMessage(err: any, action: "save" | "delete") {
  const isRoleErr = err?.status === 403 || err?.message?.toLowerCase().includes("admin");
  if (isRoleErr) return `Sessions can only be ${action === "save" ? "saved" : "deleted"} by Admin / Organizer accounts. Please switch to the Admin account (admin@eventsphere.io).`;
  if (err?.status === 401) return `Please sign in as Admin (admin@eventsphere.io) to ${action} sessions.`;
  if (err?.isNetworkError) return "Cannot reach the server. Check that the backend is running on port 5000 (npm run dev).";
  return err?.message || (action === "save" ? "Validation error" : "Could not delete session");
}

export default function AdminSchedule() {
  const { toast } = useStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expos, setExpos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [day, setDay] = useState("All");
  const [editing, setEditing] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [sess, exp] = await Promise.all([fetchLiveSessions(), fetchLiveExpos()]);
    setSessions(sess);
    setExpos(exp);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = useMemo(
    () => sessions.filter((s) => (day === "All" || s.day === day) && (!q || `${s.title} ${s.speaker} ${s.stage} ${s.track}`.toLowerCase().includes(q.toLowerCase()))),
    [sessions, q, day]
  );

  const speakerCount = new Set(sessions.map((s) => s.speaker)).size;
  const withCap = sessions.filter((s) => s.capacity);
  const avgFill = withCap.length ? Math.round((withCap.reduce((a, s) => a + s.registered / s.capacity, 0) / withCap.length) * 100) : 0;
  const rated = sessions.filter((s) => Number(s.rating) > 0);
  const avgRating = rated.length ? (rated.reduce((a, s) => a + Number(s.rating), 0) / rated.length).toFixed(1) : "—";

  const exportCSV = () => {
    const headers = ["Title", "Format", "Track", "Speaker", "Day", "Time", "Stage", "Capacity", "Registered", "Rating"];
    const rows = sessions.map((s) => [s.title, s.type, s.track, s.speaker, s.day, s.time, s.stage, s.capacity, s.registered, s.rating].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`));
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `schedule-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Schedule exported", body: "Downloaded the schedule as a CSV file.", tone: "success" });
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setSubmitting(true);
    try {
      await deleteLiveSession(confirmDel.id);
      toast({ title: "Session deleted", body: confirmDel.title, tone: "danger" });
      setConfirmDel(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Delete failed", body: errorMessage(err, "delete"), tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Schedule management</h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            Create sessions, assign speakers and stages, and keep the programme current. Changes reach attendees in real time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCSV}>Export CSV</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Add session</Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sessions" value={String(sessions.length)} icon={<CalendarClock className="size-5" />} tone="brand" sub="Across all days" />
        <StatCard label="Speakers" value={String(speakerCount)} icon={<Users className="size-5" />} tone="info" sub="Unique speakers" />
        <StatCard label="Avg. fill rate" value={`${avgFill}%`} icon={<Users className="size-5" />} tone="success" sub="Registrations vs. capacity" />
        <StatCard label="Avg. rating" value={avgRating} icon={<Star className="size-5" />} tone="warn" sub="Post-session feedback" />
      </div>

      {/* MAIN CARD */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sessions, speakers, stages…"
              aria-label="Search sessions"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Tabs size="sm" active={day} onChange={setDay} tabs={DAYS.map((d) => ({ id: d, label: d, count: d === "All" ? sessions.length : sessions.filter((s) => s.day === d).length }))} />
          <div className="ml-auto">
            <Tabs size="sm" active={view} onChange={setView} tabs={[{ id: "list", label: "List" }, { id: "grid", label: "Timeline" }]} />
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-[13.5px] text-slate-400">Loading schedule…</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-6" />}
            title="No sessions found"
            body="Try another day or clear your search."
            action={<Button variant="secondary" onClick={() => { setQ(""); setDay("All"); }}>Clear filters</Button>}
          />
        ) : view === "list" ? (
          <Table>
            <thead>
              <tr>
                <Th>Session</Th>
                <Th>Speaker</Th>
                <Th>Schedule</Th>
                <Th>Stage</Th>
                <Th>Capacity</Th>
                <Th>Rating</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const fill = s.capacity ? Math.round((s.registered / s.capacity) * 100) : 0;
                return (
                  <tr key={s.id} className="transition hover:bg-slate-50/70">
                    <Td>
                      <div className="flex gap-3">
                        <span className={cn("mt-0.5 h-10 w-1 shrink-0 rounded-full", typeBar(s.type))} aria-hidden />
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug text-slate-900">{s.title}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge tone={typeTone(s.type)}>{s.type}</Badge>
                            <Badge tone="neutral">{s.track}</Badge>
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.speaker} size={34} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{s.speaker}</p>
                          <p className="truncate text-[11.5px] text-slate-500">{[s.role, s.company].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <p className="font-medium text-slate-900">{s.day}</p>
                      <p className="text-[12px] text-slate-500">{s.time}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-slate-400" /> {s.stage}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={fill} className="w-16" height={5} tone={fill > 95 ? "danger" : fill > 80 ? "warn" : "success"} />
                        <span className="w-9 text-[11.5px] font-bold tabular-nums text-slate-700">{fill}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{fmt(s.registered)} of {fmt(s.capacity)}</p>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-800">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" /> {s.rating}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(s)} aria-label={`Edit ${s.title}`} className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"><Pencil className="size-3.5" /></button>
                        <button onClick={() => setConfirmDel(s)} aria-label={`Delete ${s.title}`} className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 className="size-3.5" /></button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {DAYS.filter((d) => d !== "All").map((d) => {
              const items = list.filter((s) => s.day === d).sort((a, b) => String(a.time).localeCompare(String(b.time)));
              return (
                <div key={d} className="rounded-2xl bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-[13px] font-bold text-slate-800">{d}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">{items.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[12px] text-slate-400">No sessions</p>}
                    {items.map((s) => (
                      <button key={s.id} onClick={() => setEditing(s)} className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pl-4 text-left transition hover:border-brand-300 hover:shadow-md">
                        <span className={cn("absolute inset-y-0 left-0 w-1", typeBar(s.type))} aria-hidden />
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-[12px] font-bold text-slate-900">{s.time}</span>
                          <Badge tone={typeTone(s.type)}>{s.type}</Badge>
                        </div>
                        <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-slate-900">{s.title}</p>
                        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-slate-500"><MapPin className="size-3" /> {s.stage}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* CHARTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Capacity utilisation" subtitle="Registrations vs. room capacity" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#6854d9"
              format={(n) => `${n}%`}
              data={sessions.slice(0, 7).map((s) => ({ label: s.title.length > 26 ? s.title.slice(0, 26) + "…" : s.title, v: s.capacity ? Math.round((s.registered / s.capacity) * 100) : 0 }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Sessions by track" subtitle="Distribution across the programme" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#0ea5e9"
              format={(n) => String(n)}
              data={Array.from(new Set(sessions.map((s) => s.track))).map((t) => ({ label: t, v: sessions.filter((s) => s.track === t).length }))}
            />
          </div>
        </Card>
      </div>

      <SessionModal
        open={!!editing || creating}
        session={editing}
        expos={expos}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSaved={loadData}
      />

      {/* Delete confirmation */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete this session?" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Keep session</Button>
          <Button variant="danger" loading={submitting} icon={<Trash2 className="size-4" />} onClick={handleDelete}>Delete</Button>
        </>}>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-[13.5px] font-semibold text-rose-900">{confirmDel?.title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-rose-800">
            This removes the session from the schedule and notifies registered participants. It cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function SessionModal({ open, session, expos, onClose, onSaved }: { open: boolean; session: Session | null; expos: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    expoId: "",
    type: "Keynote",
    track: "Vision",
    speakerName: "",
    speakerRole: "",
    speakerCompany: "",
    stage: "Main Stage",
    startTime: "10:00",
    endTime: "11:00",
    capacity: 200,
    description: "",
  });

  useEffect(() => {
    if (session) {
      const times = (session.time || "10:00 – 11:00").split("–").map((s) => s.trim());
      setForm({
        title: session.title,
        expoId: session.expoId || (expos[0]?.id || ""),
        type: session.type,
        track: session.track,
        speakerName: session.speaker,
        speakerRole: session.role,
        speakerCompany: session.company,
        stage: session.stage,
        startTime: times[0] || "10:00",
        endTime: times[1] || "11:00",
        capacity: session.capacity,
        description: session.description || "",
      });
    } else {
      setForm({
        title: "",
        expoId: expos[0]?.id || "",
        type: "Keynote",
        track: "Vision",
        speakerName: "",
        speakerRole: "Executive / Specialist",
        speakerCompany: "EventSphere",
        stage: "Main Stage",
        startTime: "10:00",
        endTime: "11:00",
        capacity: 200,
        description: "",
      });
    }
  }, [session, expos]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Session title is required", tone: "warn" });
      return;
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      toast({ title: "Check the times", body: "The end time must be after the start time.", tone: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      if (session) {
        await updateLiveSession(session.id, {
          title: form.title,
          type: form.type,
          track: form.track,
          stage: form.stage,
          startTime: form.startTime,
          endTime: form.endTime,
          capacity: Number(form.capacity),
          description: form.description,
          speaker: {
            name: form.speakerName || "Speaker",
            role: form.speakerRole || "Speaker",
            company: form.speakerCompany || "Organization",
          },
        });
        toast({ title: "Session updated", body: form.title, tone: "success" });
      } else {
        await createLiveSession({
          ...form,
          expoId: form.expoId || expos[0]?.id,
        });
        toast({ title: "Session created", body: form.title, tone: "success" });
      }
      onClose();
      onSaved();
    } catch (err: any) {
      toast({ title: "Failed to save session", body: errorMessage(err, "save"), tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="mb-3 border-b border-slate-100 pb-2 text-[13px] font-bold text-slate-900">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={session ? "Edit session" : "Add a session"} subtitle={session ? `${session.id}` : "Set the topic, speaker, stage and time slot"} size="lg"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={submitting} onClick={handleSubmit}>{session ? "Save changes" : "Create session"}</Button>
      </>}>
      <div className="space-y-6">
        <Section title="Session details">
          <Field label="Session title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Hands-on: Ship a RAG pipeline" />
          </Field>
          {!session && (
            <Field label="Expo event" required className="sm:col-span-2">
              <Select value={form.expoId} onChange={(e) => setForm({ ...form, expoId: e.target.value })}>
                {expos.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Format">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Track">
            <Select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
              {TRACKS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will attendees learn?" />
          </Field>
        </Section>

        <Section title="Speaker">
          <Field label="Name" className="sm:col-span-2">
            <Input value={form.speakerName} onChange={(e) => setForm({ ...form, speakerName: e.target.value })} placeholder="Dr. Elena Vance" />
          </Field>
          <Field label="Role">
            <Input value={form.speakerRole} onChange={(e) => setForm({ ...form, speakerRole: e.target.value })} placeholder="CTO" />
          </Field>
          <Field label="Company">
            <Input value={form.speakerCompany} onChange={(e) => setForm({ ...form, speakerCompany: e.target.value })} placeholder="Nexora Cloud" />
          </Field>
        </Section>

        <Section title="Time and place">
          <Field label="Stage / room">
            <Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </Field>
          <Field label="Start time">
            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field label="End time">
            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </Field>
        </Section>
      </div>
    </Modal>
  );
}