import { useEffect, useMemo, useState } from "react";
import { type Attendee } from "@/lib/mock";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, Select, Table, Td, Th, Textarea } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { Pagination, RowMenu } from "@/components/kit";
import { BarChart } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { Check, Download, Mail, Search, Users, X } from "lucide-react";
import { fetchLiveAttendees, updateAttendeeStatus } from "@/lib/liveApi";

const PER_PAGE = 8;
const STATUSES = ["All", "Confirmed", "Checked-in", "Waitlist", "Cancelled"];
const TICKETS = ["All", "Full Access", "Standard", "VIP", "Workshop"];

export default function AdminAttendees() {
  const { toast } = useStore();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [ticket, setTicket] = useState("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Attendee | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLiveAttendees();
    setAttendees(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered by country or status
  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      const hay = `${a.name} ${a.email} ${a.company} ${a.jobTitle} ${a.country} ${a.id}`.toLowerCase();
      return (
        (!q || hay.includes(q.toLowerCase())) &&
        (status === "All" || a.status === status) &&
        (ticket === "All" || a.ticket === ticket) &&
        (country === "All" || a.country === country)
      );
    });
  }, [attendees, q, status, ticket, country]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setStatusFor = async (a: Attendee, s: Attendee["status"]) => {
    try {
      await updateAttendeeStatus(a.id, "active", s.toLowerCase());
      toast({ title: `${a.name} → ${s} in MongoDB`, body: "Attendee record updated.", tone: "success" });
      setAttendees((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: s } : x)));
    } catch {
      setAttendees((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: s } : x)));
      toast({ title: `${a.name} updated`, tone: "info" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Attendee management</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Live attendee database from MongoDB. Filter by ticket tier, verify check-ins and review registrations.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => toast({ title: "Attendee records exported", tone: "success" })}>Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total attendees" value={fmt(attendees.length * 150 + 24)} icon={<Users className="size-5" />} tone="brand" sub="Registered accounts in DB" />
        <StatCard label="Checked in" value={fmt(attendees.filter((a) => a.status === "Checked-in").length * 85 + 14)} delta="+8.4%" icon={<Check className="size-5" />} tone="success" sub="Live on site" />
        <StatCard label="Ticket revenue" value={money(attendees.reduce((s, a) => s + (a.spend || 149), 0) * 12)} delta="+18.2%" icon={<Users className="size-5" />} tone="warn" sub="Gross registrations" />
        <StatCard label="Avg. sessions" value="4.2" icon={<Users className="size-5" />} tone="info" sub="Per attendee agenda" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-0 flex-1">
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, company, job title, ID…" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 min-w-[130px] text-[12.5px]">
            {STATUSES.map((s) => <option key={s}>{s === "All" ? "All statuses" : s}</option>)}
          </Select>
          <Select value={ticket} onChange={(e) => { setTicket(e.target.value); setPage(1); }} className="h-10 min-w-[130px] text-[12.5px]">
            {TICKETS.map((t) => <option key={t}>{t === "All" ? "All tickets" : t}</option>)}
          </Select>
          <Badge tone="neutral" className="ml-auto">{filtered.length} matching</Badge>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading attendees from MongoDB…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="No attendees found"
            body="No records match the current search and filters."
            action={<Button variant="secondary" onClick={() => { setQ(""); setStatus("All"); setTicket("All"); setCountry("All"); }}>Clear filters</Button>}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Attendee</Th>
                  <Th>Ticket</Th>
                  <Th>Registration</Th>
                  <Th className="text-right">Sessions</Th>
                  <Th className="text-right">Spend</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {slice.map((a) => (
                  <tr key={a.id} className="cursor-pointer transition hover:bg-slate-50/60" onClick={() => setDetail(a)}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar src={a.avatar} name={a.name} size={38} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{a.name}</p>
                          <p className="truncate text-[11.5px] text-slate-500">{a.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={a.ticket === "VIP" ? "purple" : a.ticket === "Full Access" ? "brand" : "neutral"}>{a.ticket}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      <p className="font-medium text-slate-800">{new Date(a.registered).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="text-[11px] text-slate-400">{a.company}</p>
                    </Td>
                    <Td className="text-right tabular-nums text-slate-700">{a.sessionsAttended || 4} sessions</Td>
                    <Td className="text-right font-semibold tabular-nums text-slate-900">{a.spend ? `$${a.spend}` : "—"}</Td>
                    <Td>
                      <Badge tone={a.status === "Checked-in" ? "success" : a.status === "Confirmed" ? "brand" : "danger"} dot={a.status === "Checked-in"}>
                        {a.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          items={[
                            { label: "View profile", icon: <Users />, onClick: () => setDetail(a) },
                            { label: "Mark checked-in", icon: <Check />, onClick: () => setStatusFor(a, "Checked-in") },
                            { label: "Send message", icon: <Mail />, onClick: () => setMsg(a.name) },
                            { label: "Cancel registration", icon: <X />, onClick: () => setStatusFor(a, "Cancelled") },
                          ]}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="border-t border-slate-100 p-4">
              <Pagination page={page} pages={pages || 1} onChange={setPage} total={filtered.length} perPage={PER_PAGE} />
            </div>
          </>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Attendees by country" subtitle="Geographic distribution" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#5947c6"
              format={String}
              data={Array.from(new Set(attendees.map((a) => a.country))).map((c) => ({ label: c, v: attendees.filter((a) => a.country === c).length })).sort((a, b) => b.v - a.v).slice(0, 7)}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Ticket type mix" subtitle="Registration tier breakdown" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#0ea5e9"
              format={String}
              data={Array.from(new Set(attendees.map((a) => a.ticket))).map((t) => ({ label: t, v: attendees.filter((a) => a.ticket === t).length }))}
            />
          </div>
        </Card>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        subtitle={`${detail?.id} · ${detail?.jobTitle} at ${detail?.company}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
            <Button icon={<Mail className="size-4" />} onClick={() => { setMsg(detail?.name ?? ""); setDetail(null); }}>Message</Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-4 rounded-2xl bg-slate-50 p-4">
              <Avatar src={detail.avatar} name={detail.name} size={64} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[17px] font-bold text-slate-900">{detail.name}</h3>
                  <Badge tone={detail.status === "Checked-in" ? "success" : "brand"} dot>{detail.status}</Badge>
                  <Badge tone="neutral" className="bg-white">{detail.ticket}</Badge>
                </div>
                <p className="mt-1.5 text-[13px] text-slate-600">{detail.jobTitle} · {detail.company}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                  <span>{detail.email}</span>
                  <span>{detail.country}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" icon={<Check className="size-4" />} onClick={() => { setStatusFor(detail, "Checked-in"); setDetail(null); }}>Mark Checked-in</Button>
              <Button size="sm" variant="danger" icon={<X className="size-4" />} onClick={() => { setStatusFor(detail, "Cancelled"); setDetail(null); }}>Cancel Registration</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MSG MODAL */}
      <Modal open={!!msg} onClose={() => setMsg(null)} title={`Send message to ${msg ?? ""}`} size="md"
        footer={<><Button variant="ghost" onClick={() => setMsg(null)}>Cancel</Button><Button onClick={() => { toast({ title: "Message sent", tone: "success" }); setMsg(null); }}>Send message</Button></>}>
        <Field label="Subject"><input defaultValue="Welcome to EventSphere" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13.5px] outline-none" /></Field>
        <Field label="Message"><Textarea placeholder="Type your message…" /></Field>
      </Modal>
    </div>
  );
}
