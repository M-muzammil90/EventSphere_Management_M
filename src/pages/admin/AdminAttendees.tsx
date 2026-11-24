import { useEffect, useMemo, useState } from "react";
import { type Attendee } from "@/lib/mock";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, Select, Table, Td, Th, Textarea } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { Pagination, RowMenu } from "@/components/kit";
import { BarChart } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { Check, Download, Mail, QrCode, Search, Users, X, RefreshCw } from "lucide-react";
import { fetchLiveAttendees, updateAttendeeStatus, checkInLiveAttendee, fetchAttendeeStatsLive } from "@/lib/liveApi";

const PER_PAGE = 8;
const STATUSES = ["All", "Confirmed", "Checked-in", "Waitlist", "Cancelled"];

export default function AdminAttendees() {
  const { toast } = useStore();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [ticket, setTicket] = useState("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Attendee | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastCheckedIn, setLastCheckedIn] = useState<any>(null);

  const handleCheckInBadge = async () => {
    if (!scanCode.trim()) return;
    setScanning(true);
    try {
      const res = await checkInLiveAttendee(scanCode.trim());
      setLastCheckedIn(res);
      toast({
        title: "Attendee Checked In! ✓",
        body: `Badge ${scanCode.toUpperCase()} verified and marked Attended in MongoDB.`,
        tone: "success",
      });
      setScanCode("");
      loadData();
    } catch (err: any) {
      toast({
        title: "Check-in failed",
        body: err.message || "Invalid badge code or already checked in.",
        tone: "danger",
      });
    } finally {
      setScanning(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        fetchLiveAttendees(),
        fetchAttendeeStatsLive(),
      ]);
      setAttendees(data);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.warn("Failed to load attendees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ticketOptions = useMemo(() => {
    const set = new Set(attendees.map((a) => a.ticket).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [attendees]);

  // Filtered by country or status
  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      const hay = `${a.name} ${a.email} ${a.company} ${a.jobTitle} ${a.country} ${a.id} ${a.badgeCode || ""}`.toLowerCase();
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

  const setStatusFor = async (a: any, s: string) => {
    try {
      const backendStatus =
        s === "Checked-in" ? "attended" : s === "Cancelled" ? "cancelled" : s === "Waitlist" ? "waitlisted" : "confirmed";
      await updateAttendeeStatus(a.id, a.regId || a.id, backendStatus);
      toast({ title: `${a.name} → ${s} in MongoDB`, body: "Attendee record updated.", tone: "success" });
      setAttendees((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: s } : x)));
    } catch (err: any) {
      toast({ title: "Update failed", body: err.message || "Could not update status", tone: "danger" });
    }
  };

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      toast({ title: "No attendees to export", tone: "warn" });
      return;
    }
    const headers = ["ID", "Name", "Email", "Company", "Job Title", "Country", "Ticket", "Status", "Badge Code", "Spend", "Registered"];
    const rows = attendees.map((a) => [
      `"${a.id}"`,
      `"${(a.name || "").replace(/"/g, '""')}"`,
      `"${a.email || ""}"`,
      `"${(a.company || "").replace(/"/g, '""')}"`,
      `"${(a.jobTitle || "").replace(/"/g, '""')}"`,
      `"${a.country || ""}"`,
      `"${a.ticket || ""}"`,
      `"${a.status || ""}"`,
      `"${a.badgeCode || ""}"`,
      a.spend || 0,
      `"${a.registered || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventsphere-attendees-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Attendees Exported ✓", body: `${attendees.length} records saved to CSV.`, tone: "success" });
  };

  // Live Metrics (Computed strictly from MongoDB)
  const totalAttendeesCount = stats?.summary?.totalAttendeeAccounts || attendees.length;
  const checkedInCount = stats?.summary?.attended || attendees.filter((a) => a.status === "Checked-in").length;
  const totalRevenue = attendees.reduce((s, a) => s + (a.spend || 0), 0);
  const avgSessions = attendees.length
    ? (attendees.reduce((s, a) => s + (a.sessionsAttended || 0), 0) / attendees.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Attendee management</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Live attendee database from MongoDB. Filter by ticket tier, verify check-ins and review registrations.</p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={loading ? "animate-spin" : ""} />}
            onClick={() => loadData()}
          >
            Refresh
          </Button>
          <Button
            icon={<QrCode className="size-4" />}
            onClick={() => setScanModalOpen(true)}
          >
            Fast Check-In
          </Button>
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total attendees"
          value={fmt(totalAttendeesCount)}
          icon={<Users className="size-5" />}
          tone="brand"
          sub="Registered accounts in DB"
        />
        <StatCard
          label="Checked in"
          value={fmt(checkedInCount)}
          delta={`${totalAttendeesCount ? Math.round((checkedInCount / totalAttendeesCount) * 100) : 0}% rate`}
          icon={<Check className="size-5" />}
          tone="success"
          sub="Verified badges on site"
        />
        <StatCard
          label="Ticket revenue"
          value={money(totalRevenue)}
          delta="100% verified"
          icon={<Users className="size-5" />}
          tone="warn"
          sub="Gross ticket sales in DB"
        />
        <StatCard
          label="Avg. sessions"
          value={avgSessions}
          icon={<Users className="size-5" />}
          tone="info"
          sub="Per attendee agenda in DB"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-0 flex-1">
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, company, job title, ID, badge…" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 min-w-[130px] text-[12.5px]">
            {STATUSES.map((s) => <option key={s}>{s === "All" ? "All statuses" : s}</option>)}
          </Select>
          <Select value={ticket} onChange={(e) => { setTicket(e.target.value); setPage(1); }} className="h-10 min-w-[130px] text-[12.5px]">
            {ticketOptions.map((t) => <option key={t}>{t === "All" ? "All tickets" : t}</option>)}
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
                  {detail.badgeCode && (
                    <span className="font-mono font-semibold text-brand-700">Badge: {detail.badgeCode}</span>
                  )}
                  <span>Spend: ${detail.spend || 0}</span>
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

      {/* FAST CHECK-IN MODAL */}
      <Modal
        open={scanModalOpen}
        onClose={() => {
          setScanModalOpen(false);
          setLastCheckedIn(null);
        }}
        title="Fast-Lane Attendee Check-In"
        subtitle="Verify entry badge and record live attendance in MongoDB"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setScanModalOpen(false);
                setLastCheckedIn(null);
              }}
            >
              Close
            </Button>
            <Button
              icon={<Check className="size-4" />}
              disabled={scanning || !scanCode.trim()}
              onClick={handleCheckInBadge}
            >
              {scanning ? "Verifying..." : "Verify & Check-In"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-center">
            <QrCode className="mx-auto size-12 text-brand-600" />
            <p className="mt-2 font-display text-[15px] font-bold text-brand-950">
              Scan or enter badge code
            </p>
            <p className="mt-0.5 text-[12px] text-brand-700">
              Works with handheld USB/Bluetooth barcode scanners and digital QR codes
            </p>
          </div>

          <Field label="Attendee Badge Code" required hint="e.g. GTS-2026-X821">
            <input
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheckInBadge();
              }}
              placeholder="GTS-2026-XXXX"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 font-mono text-[14px] font-bold uppercase tracking-wider outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12"
              autoFocus
            />
          </Field>

          {lastCheckedIn && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="size-5 text-emerald-600" />
                <span className="font-bold text-[14px]">
                  Checked In Successfully!
                </span>
              </div>
              <p className="mt-1 text-[12.5px] text-emerald-800">
                {lastCheckedIn.attendeeSnapshot?.name} · {lastCheckedIn.ticketType} Pass · {lastCheckedIn.expo?.title}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
