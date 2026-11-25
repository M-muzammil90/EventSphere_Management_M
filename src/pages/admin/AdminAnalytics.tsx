import { useEffect, useMemo, useState } from "react";
import {
  fetchLiveExpos,
  fetchLiveAnalyticsOverview,
  fetchLiveAttendeeAnalytics,
  fetchLiveBoothAnalytics,
  fetchLiveSessionAnalytics,
  fetchLiveEventAnalytics,
  fetchLiveRevenueAnalytics,
} from "@/lib/liveApi";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, Select, Tabs, Table, Td, Th } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { AreaChart, BarChart, Donut, Gauge } from "@/components/charts";
import { useExport } from "@/components/kit";
import { fmt, money, useStore } from "@/lib/store";
import {
  Activity,
  Banknote,
  Building2,
  CalendarRange,
  Download,
  FileSpreadsheet,
  MapPin,
  Printer,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

export default function AdminAnalytics() {
  const { toast } = useStore();
  const exportApi = useExport();
  const [range, setRange] = useState("all");
  const [tab, setTab] = useState("overview");
  const [selectedExpoId, setSelectedExpoId] = useState("all");
  const [custom, setCustom] = useState({ from: "2026-01-01", to: new Date().toISOString().split("T")[0] });
  const [schedule, setSchedule] = useState(false);

  const [expos, setExpos] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [attendeeReport, setAttendeeReport] = useState<any>(null);
  const [boothReport, setBoothReport] = useState<any>(null);
  const [sessionReport, setSessionReport] = useState<any>(null);
  const [eventReport, setEventReport] = useState<any[]>([]);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildQueryParams = () => {
    const params: Record<string, string> = {};
    if (selectedExpoId !== "all") params.expo = selectedExpoId;
    if (range === "custom") {
      params.from = custom.from;
      params.to = custom.to;
    } else {
      params.range = range;
    }
    return params;
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    const params = buildQueryParams();
    try {
      const [expRes, ovRes, attRes, boothRes, sessRes, evtRes, revRes] = await Promise.all([
        fetchLiveExpos(),
        fetchLiveAnalyticsOverview(params),
        fetchLiveAttendeeAnalytics(params),
        fetchLiveBoothAnalytics(params),
        fetchLiveSessionAnalytics(params),
        fetchLiveEventAnalytics(),
        fetchLiveRevenueAnalytics(params),
      ]);
      setExpos(expRes || []);
      setOverview(ovRes);
      setAttendeeReport(attRes);
      setBoothReport(boothRes);
      setSessionReport(sessRes);
      setEventReport(evtRes || []);
      setRevenueReport(revRes);
    } catch (err: any) {
      setError(err.message || "Failed to load MongoDB analytics.");
      toast({ title: "Analytics error", body: err.message, tone: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range, selectedExpoId]);

  const selectedExpoTitle = useMemo(() => {
    if (selectedExpoId === "all") return "All expos";
    return expos.find((e) => (e._id || e.id) === selectedExpoId)?.title || "Selected Expo";
  }, [selectedExpoId, expos]);

  // Derived Chart Datasets from MongoDB Aggregations
  const registrationTrendChart = useMemo(() => {
    const list = overview?.trends?.registrations || [];
    return list.map((r: any) => ({ label: r._id, a: r.count, b: 0 }));
  }, [overview]);

  const ticketSplitChart = useMemo(() => {
    const list = attendeeReport?.byTicket || [];
    const colors = ["#6854d9", "#0ea5e9", "#a855f7", "#10b981", "#f97316"];
    return list.map((t: any, i: number) => ({
      label: t._id || "General",
      value: t.count,
      color: colors[i % colors.length],
    }));
  }, [attendeeReport]);

  const revenueMonthChart = useMemo(() => {
    const list = revenueReport?.byMonth || [];
    return list.map((m: any) => ({ label: m._id, v: Math.round(m.total) }));
  }, [revenueReport]);

  const sessionTypeChart = useMemo(() => {
    const list = sessionReport?.byType || [];
    return list.map((s: any) => ({ label: s._id || "Session", v: s.registrations || 0 }));
  }, [sessionReport]);

  const zoneOccupancyChart = useMemo(() => {
    const list = boothReport?.byZone || [];
    return list.map((z: any) => ({ label: `Zone ${z._id}`, v: z.occupancy || 0 }));
  }, [boothReport]);

  const paymentStatusList = revenueReport?.byStatus || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">
            Analytics &amp; Real-Time Reporting
          </h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">
            100% MongoDB-aggregated metrics across attendees, exhibitors, booths, sessions and verified payments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="success" dot>MongoDB Live</Badge>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-200 text-slate-600"
            icon={<CalendarRange className="size-4" />}
            onClick={() => setSchedule(true)}
          >
            {range === "custom" ? `${custom.from} → ${custom.to}` : range.toUpperCase()}
          </Button>
          <Select
            value={selectedExpoId}
            onChange={(e) => setSelectedExpoId(e.target.value)}
            className="h-9.5 min-w-[210px]"
          >
            <option value="all">All expos</option>
            {expos.map((e) => (
              <option key={e._id || e.id} value={e._id || e.id}>
                {e.title}
              </option>
            ))}
          </Select>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9.5 min-w-[130px]">
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
            <option value="custom">Custom range</option>
          </Select>
          <Button size="sm" variant="ghost" icon={<RefreshCw className={loading ? "animate-spin" : ""} />} onClick={loadAnalytics}>
            Refresh
          </Button>
          <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
          <Button size="sm" variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => exportApi.xlsx(`analytics-${range}`)}>
            XLSX
          </Button>
          <Button size="sm" icon={<Download className="size-4" />} onClick={() => exportApi.pdf(`analytics-${range}`)}>
            PDF
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-800">
          {error}
        </Card>
      )}

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "attendees", label: "Attendees" },
          { id: "booths", label: "Booths & Occupancy" },
          { id: "sessions", label: "Popular Sessions" },
          { id: "events", label: "Expo-Wise Stats" },
          { id: "revenue", label: "Verified Revenue" },
        ]}
      />

      {loading && !overview ? (
        <Card className="p-12 text-center text-[13.5px] text-slate-400">
          Running MongoDB aggregation pipelines...
        </Card>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Verified Revenue"
                  value={money(overview?.revenue?.total || 0)}
                  sub={`${overview?.revenue?.transactions || 0} paid transactions`}
                  icon={<Banknote className="size-5" />}
                  tone="success"
                />
                <StatCard
                  label="Registered Attendees"
                  value={fmt(overview?.users?.attendees || 0)}
                  sub={`${attendeeReport?.summary?.checkedIn || 0} checked in (${attendeeReport?.summary?.checkInRate || 0}%)`}
                  icon={<Users className="size-5" />}
                  tone="brand"
                />
                <StatCard
                  label="Booth Occupancy"
                  value={`${overview?.booths?.occupancy || 0}%`}
                  sub={`${overview?.booths?.booked || 0} booked · ${overview?.booths?.reserved || 0} reserved · ${overview?.booths?.available || 0} free`}
                  icon={<MapPin className="size-5" />}
                  tone="info"
                />
                <StatCard
                  label="Expos & Exhibitors"
                  value={`${overview?.expos?.total || 0} / ${overview?.users?.exhibitors || 0}`}
                  sub={`${overview?.expos?.live || 0} live · ${overview?.applications?.pending || 0} pending apps`}
                  icon={<Building2 className="size-5" />}
                  tone="warn"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader
                    title="Registration Trend"
                    subtitle={`Daily registrations (${selectedExpoTitle})`}
                    right={<Badge tone="brand">{registrationTrendChart.length} days</Badge>}
                  />
                  <div className="p-5">
                    {registrationTrendChart.length ? (
                      <AreaChart data={registrationTrendChart} format={fmt} height={260} labels={["Registrations", "Baseline"]} />
                    ) : (
                      <p className="py-12 text-center text-[13px] text-slate-400">No registrations in selected range.</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Ticket Tier Mix" subtitle="MongoDB EventRegistration distribution" />
                  <div className="p-5">
                    {ticketSplitChart.length ? (
                      <Donut data={ticketSplitChart} centerLabel="Registrations" centerValue={String(attendeeReport?.summary?.total || 0)} />
                    ) : (
                      <p className="py-12 text-center text-[13px] text-slate-400">No ticket data.</p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === "attendees" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Registrations" value={fmt(attendeeReport?.summary?.total || 0)} icon={<Users className="size-5" />} tone="brand" />
                <StatCard label="Checked-In On Site" value={fmt(attendeeReport?.summary?.checkedIn || 0)} icon={<Activity className="size-5" />} tone="success" />
                <StatCard label="Check-In Rate" value={`${attendeeReport?.summary?.checkInRate || 0}%`} icon={<Sparkles className="size-5" />} tone="info" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="By Ticket Type" subtitle="Live MongoDB breakdown" />
                  <div className="p-5">
                    <BarChart
                      horizontal
                      color="#6854d9"
                      format={fmt}
                      data={(attendeeReport?.byTicket || []).map((t: any) => ({ label: t._id || "General", v: t.count }))}
                    />
                  </div>
                </Card>
                <Card>
                  <CardHeader title="By Registration Status" subtitle="Confirmed, Attended, Waitlisted, Cancelled" />
                  <div className="p-5">
                    <BarChart
                      horizontal
                      color="#10b981"
                      format={fmt}
                      data={(attendeeReport?.byStatus || []).map((s: any) => ({ label: s._id || "confirmed", v: s.count }))}
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === "booths" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard label="Total Booths" value={fmt(boothReport?.summary?.total || 0)} icon={<MapPin className="size-5" />} tone="brand" />
                <StatCard label="Occupancy Rate" value={`${boothReport?.summary?.occupancy || 0}%`} icon={<Activity className="size-5" />} tone="success" />
                <StatCard label="Booked Value" value={money(boothReport?.summary?.totalRevenue || 0)} icon={<Banknote className="size-5" />} tone="info" />
                <StatCard label="Available Booths" value={fmt(overview?.booths?.available || 0)} icon={<Building2 className="size-5" />} tone="warn" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Occupancy by Zone (%)" subtitle="Booked + Reserved percentage" />
                  <div className="p-5">
                    <BarChart color="#0ea5e9" format={(n) => `${n}%`} data={zoneOccupancyChart} />
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Booth Inventory Gauge" subtitle="Live floor utilization" />
                  <div className="flex justify-center p-6">
                    <Gauge
                      value={boothReport?.summary?.occupancy || 0}
                      label="Occupied"
                      sub={`${overview?.booths?.booked || 0} of ${boothReport?.summary?.total || 0} booths`}
                      size={180}
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === "sessions" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Published Sessions" value={fmt(sessionReport?.summary?.total || 0)} icon={<Sparkles className="size-5" />} tone="brand" />
                <StatCard label="Total Seat Registrations" value={fmt(sessionReport?.summary?.registrations || 0)} icon={<Users className="size-5" />} tone="success" />
                <StatCard label="Avg. Fill Rate" value={`${sessionReport?.summary?.avgFillRate || 0}%`} icon={<Activity className="size-5" />} tone="info" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Registrations by Session Format" subtitle="Keynote, Workshop, Panel, Demo" />
                  <div className="p-5">
                    <BarChart horizontal color="#a855f7" format={fmt} data={sessionTypeChart} />
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Top Popular Sessions" subtitle="Ranked by actual seat registrations" />
                  <Table>
                    <thead>
                      <tr>
                        <Th>Session</Th>
                        <Th>Type</Th>
                        <Th className="text-right">Fill</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12.5px]">
                      {(sessionReport?.topSessions || []).slice(0, 6).map((s: any) => (
                        <tr key={s._id}>
                          <Td className="font-semibold text-slate-900">{s.title}</Td>
                          <Td><Badge tone="neutral">{s.type}</Badge></Td>
                          <Td className="text-right font-mono">{s.registeredCount}/{s.capacity} ({s.fillRate}%)</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {tab === "events" && (
            <Card>
              <CardHeader title="Expo-Wise Performance Comparison" subtitle="Live MongoDB breakdown across every active expo" />
              <Table>
                <thead>
                  <tr>
                    <Th>Expo</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Attendees</Th>
                    <Th className="text-right">Sessions</Th>
                    <Th className="text-right">Booths</Th>
                    <Th className="text-right">Verified Revenue</Th>
                    <Th className="text-right">Rating</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {eventReport.map((e: any) => (
                    <tr key={e._id} className="hover:bg-slate-50/70">
                      <Td className="font-semibold text-slate-900">{e.title}</Td>
                      <Td><Badge tone={e.status === "live" ? "danger" : "brand"}>{e.status}</Badge></Td>
                      <Td className="text-right tabular-nums">{e.confirmed} / {e.registrations}</Td>
                      <Td className="text-right tabular-nums">{e.sessions}</Td>
                      <Td className="text-right tabular-nums">{e.boothsBooked}/{e.boothsTotal} ({e.boothOccupancy}%)</Td>
                      <Td className="text-right font-mono font-bold text-slate-900">{money(e.paymentRevenue || 0)}</Td>
                      <Td className="text-right">{e.avgRating ? `${e.avgRating} ★ (${e.feedbackCount})` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {tab === "revenue" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Verified Paid Revenue"
                  value={money(revenueReport?.summary?.grandTotal || 0)}
                  sub="Excludes failed, pending & unverified"
                  icon={<Banknote className="size-5" />}
                  tone="success"
                />
                <StatCard
                  label="Paid Transactions"
                  value={fmt(overview?.revenue?.transactions || 0)}
                  sub="Confirmed gateway settlements"
                  icon={<Activity className="size-5" />}
                  tone="brand"
                />
                <StatCard
                  label="Payment Mode"
                  value={revenueReport?.summary?.demoMode ? "Sandbox / Demo" : "Live Gateway"}
                  sub="Strictly verified on backend"
                  icon={<Sparkles className="size-5" />}
                  tone="info"
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Verified Revenue by Month" subtitle="Paid transactions only" />
                  <div className="p-5">
                    {revenueMonthChart.length ? (
                      <BarChart data={revenueMonthChart} color="#10b981" format={(n) => `$${n}`} />
                    ) : (
                      <p className="py-12 text-center text-[13px] text-slate-400">No verified transactions in this period.</p>
                    )}
                  </div>
                </Card>
                <Card>
                  <CardHeader title="All Payment Statuses" subtitle="Paid vs Pending vs Failed vs Refunded" />
                  <Table>
                    <thead>
                      <tr>
                        <Th>Status</Th>
                        <Th className="text-right">Count</Th>
                        <Th className="text-right">Volume</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {paymentStatusList.map((st: any) => (
                        <tr key={st._id}>
                          <Td>
                            <Badge tone={["PAID", "paid"].includes(st._id) ? "success" : ["PENDING", "pending"].includes(st._id) ? "warn" : "danger"}>
                              {st._id}
                            </Badge>
                          </Td>
                          <Td className="text-right tabular-nums">{st.count}</Td>
                          <Td className="text-right font-mono">{money(st.total || 0)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOM DATE MODAL */}
      <Modal
        open={schedule}
        onClose={() => setSchedule(false)}
        title="Custom Date Filter"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSchedule(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setRange("custom");
                setSchedule(false);
                loadAnalytics();
              }}
            >
              Apply Range
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="From">
            <Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          </Field>
          <Field label="To">
            <Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
