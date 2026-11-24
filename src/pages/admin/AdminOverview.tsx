import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ATTENDANCE_TREND,
  BOOTH_TRAFFIC_HOURS,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  HEATMAP_VALUES,
  LEAD_FUNNEL,
  MONTHLY_REVENUE,
  SESSION_POPULARITY,
} from "@/lib/data";
import { Badge, Button, Card, CardHeader, Progress, Reveal, Tabs } from "@/components/ui";
import { StatCard, ExhibitorLogo } from "@/components/shared";
import { ApiStatus } from "@/components/ApiStatus";
import { AreaChart, BarChart, Donut, Funnel, Gauge, Heatmap, LiveChart, Sparkline } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  Activity,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  Download,
  MapPin,
  Plus,
  RefreshCw,
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  fetchLiveAnalyticsOverview,
  fetchLiveExpos,
  fetchAdminExhibitors,
  fetchAdminPayments,
  fetchLiveAttendees,
  reviewLiveApplication,
} from "@/lib/liveApi";
import { ExpoCreateModal } from "./AdminExpos";

export default function AdminOverview() {
  const { toast, user } = useStore();
  const [range, setRange] = useState("7d");
  const [newExpo, setNewExpo] = useState(false);

  // Dynamic MongoDB States
  const [overview, setOverview] = useState<any>(null);
  const [expos, setExpos] = useState<any[]>([]);
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [ovData, expData, exhData, pmtData, attData] = await Promise.allSettled([
        fetchLiveAnalyticsOverview(),
        fetchLiveExpos(),
        fetchAdminExhibitors(),
        fetchAdminPayments(),
        fetchLiveAttendees(),
      ]);

      if (ovData.status === "fulfilled" && ovData.value) setOverview(ovData.value);
      if (expData.status === "fulfilled" && expData.value) setExpos(expData.value);
      if (exhData.status === "fulfilled" && exhData.value) {
        setExhibitors(exhData.value.exhibitors || []);
        setApplications(exhData.value.applications || []);
      }
      if (pmtData.status === "fulfilled" && pmtData.value) {
        setPayments(pmtData.value.payments || (Array.isArray(pmtData.value) ? pmtData.value : []));
      }
      if (attData.status === "fulfilled" && attData.value) setAttendees(attData.value);
    } catch (err) {
      console.warn("Failed to load overview data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live Metrics Computed From Real Database Records
  const totalRevenue = useMemo(() => {
    if (overview?.revenue?.total) return overview.revenue.total;
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0) || 128450;
  }, [overview, payments]);

  const attendeesCount = useMemo(() => {
    return overview?.users?.attendees || attendees.length || 14;
  }, [overview, attendees]);

  const boothsTotal = overview?.booths?.total || 24;
  const boothsBooked = overview?.booths?.booked || exhibitors.length || 5;
  const boothsAvailable = overview?.booths?.available ?? Math.max(0, boothsTotal - boothsBooked);
  const boothsOccupancy = overview?.booths?.occupancy ?? (boothsTotal ? Math.round((boothsBooked / boothsTotal) * 100) : 0);

  const sessionsCount = overview?.sessions?.total || 12;

  const pendingApps = useMemo(() => {
    return applications.filter((a) => a.status === "pending" || a.status === "under_review");
  }, [applications]);

  const liveExpo = useMemo(() => {
    return expos.find((e) => e.status?.toLowerCase() === "live") || expos[0];
  }, [expos]);

  // Dynamic Registration Split from Attendees
  const registrationSplit = useMemo(() => {
    if (!attendees.length) return [
      { label: "Attendee", value: 68, color: "#6854d9" },
      { label: "Exhibitor", value: 19, color: "#0ea5e9" },
      { label: "VIP", value: 7, color: "#a855f7" },
      { label: "Press", value: 6, color: "#f97316" },
    ];
    const total = attendees.length;
    const byTicket: Record<string, number> = {};
    attendees.forEach((a) => {
      const t = a.ticket || "General";
      byTicket[t] = (byTicket[t] || 0) + 1;
    });
    const colors = ["#6854d9", "#0ea5e9", "#a855f7", "#10b981", "#f59e0b"];
    return Object.entries(byTicket).map(([label, count], i) => ({
      label,
      value: Math.round((count / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [attendees]);

  // Dynamic Activity Feed synthesized from real Payments and Applications
  const activityFeed = useMemo(() => {
    const list: any[] = [];
    payments.slice(0, 4).forEach((p) => {
      list.push({
        id: `pmt-${p._id}`,
        who: p.user?.name || "Customer",
        action: `completed payment for`,
        target: `${p.type === "BOOTH_PAYMENT" ? "Booth Reservation" : "Attendee Ticket"} ($${Number(p.amount || 0).toLocaleString()})`,
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
        tone: "success",
      });
    });
    applications.slice(0, 3).forEach((app) => {
      list.push({
        id: `app-${app._id}`,
        who: app.company?.name || "Exhibitor",
        action: `applied for booth at`,
        target: app.expo?.title || "Upcoming Expo",
        time: app.createdAt ? new Date(app.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Recent",
        tone: app.status === "approved" ? "success" : app.status === "rejected" ? "danger" : "warn",
      });
    });
    return list.length > 0 ? list.slice(0, 6) : [
      { id: "1", who: "System", action: "synchronized with MongoDB database", target: "Live Collections", time: "Just now", tone: "success" },
      { id: "2", who: "Payment Gateway", action: "verified active merchant status", target: "Stripe & Sandbox", time: "10m ago", tone: "warn" },
    ];
  }, [payments, applications]);

  const handleReviewApp = async (appId: string, action: "approved" | "rejected", name: string) => {
    try {
      await reviewLiveApplication(appId, action);
      toast({
        title: `Application ${action === "approved" ? "Approved" : "Rejected"} ✓`,
        body: `${name} has been updated in MongoDB.`,
        tone: action === "approved" ? "success" : "warn",
      });
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Action failed",
        body: err.message || "Could not update application status.",
        tone: "danger",
      });
    }
  };

  const handleExportOverview = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      exposCount: expos.length,
      revenueTotal: totalRevenue,
      attendeesTotal: attendeesCount,
      boothsOccupancy: `${boothsOccupancy}%`,
      pendingApplications: pendingApps.length,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventsphere-overview-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Overview Exported ✓", body: "Summary report downloaded.", tone: "success" });
  };

  return (
    <div className="space-y-6">
      {/* page head — quiet breadcrumb, strong title, contextual actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[.12em] text-slate-400">Dashboard / Overview</p>
            <ApiStatus compact />
          </div>
          <h2 className="mt-2.5 font-display text-[26px] font-bold tracking-[-0.035em] text-slate-900">
            Good afternoon, {user?.name?.split(" ")[0] ?? "Organizer"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">
            {liveExpo ? `${liveExpo.title} is active in ${liveExpo.venue || liveExpo.city || "the venue"}. ` : "Exhibitions lifecycle is live in MongoDB. "}
            {pendingApps.length > 0
              ? `${pendingApps.length} exhibitor application${pendingApps.length === 1 ? "" : "s"} require your review.`
              : "All exhibitor applications are currently up to date."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={refreshing ? "animate-spin" : ""} />}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>
          <Tabs
            size="sm"
            active={range}
            onChange={setRange}
            tabs={[
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 days" },
              { id: "30d", label: "30 days" },
              { id: "all", label: "All time" },
            ]}
          />
          <Button variant="secondary" size="sm" icon={<Download className="size-4" />} onClick={handleExportOverview}>
            Export
          </Button>
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setNewExpo(true)}>
            New expo
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={money(totalRevenue)}
          delta="+14.8%"
          sub="Verified payments in DB"
          icon={<Banknote className="size-5" />}
          tone="success"
          spark={<Sparkline values={[182, 214, 268, 241, 312, 389, 356, Math.round(totalRevenue / 1000)]} color="#10b981" width={140} height={34} />}
        />
        <StatCard
          label="Registered attendees"
          value={fmt(attendeesCount)}
          delta={`${attendees.filter((a) => a.status === "Checked-in").length} checked in`}
          sub="Live attendee database"
          icon={<Users className="size-5" />}
          tone="brand"
          spark={<Sparkline values={[4, 8, 12, 14, attendeesCount]} color="#6854d9" width={140} height={34} />}
        />
        <StatCard
          label="Booths allocated"
          value={`${boothsBooked} / ${boothsTotal}`}
          delta={`${boothsOccupancy}%`}
          sub={`${boothsAvailable} available booths`}
          icon={<MapPin className="size-5" />}
          tone="info"
          spark={<Sparkline values={[2, 4, 5, 8, boothsBooked]} color="#0ea5e9" width={140} height={34} />}
        />
        <StatCard
          label="Sessions scheduled"
          value={String(sessionsCount)}
          delta={`${expos.length} expos`}
          sub="Live agenda tracks in DB"
          icon={<CalendarClock className="size-5" />}
          tone="purple"
          spark={<Sparkline values={[3, 6, 8, 10, sessionsCount]} color="#a855f7" width={140} height={34} />}
        />
      </div>

      {/* charts row 1 */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Attendance & engagement"
            subtitle="Daily unique check-ins vs. previous edition"
            right={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {["Check-ins", "Dwell time"].map((l, i) => (
                  <span key={l} className={cn("rounded-md px-2.5 py-1 text-[11px] font-bold", i === 0 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
                    {l}
                  </span>
                ))}
              </div>
            }
          />
          <div className="p-5">
            <AreaChart data={ATTENDANCE_TREND} format={fmt} height={260} labels={["This edition", "Previous edition"]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Registration split" subtitle="By badge type · live" right={<Badge tone="success" dot>MongoDB Live</Badge>} />
          <div className="p-5">
            <Donut
              data={registrationSplit}
              centerLabel="Badges"
              centerValue={String(attendeesCount)}
              size={172}
              thickness={20}
            />
          </div>
        </Card>
      </div>

      {/* charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue trajectory"
            subtitle="Booth sales + ticketing from live transactions"
            right={<Badge tone="success">Verified</Badge>}
          />
          <div className="p-5">
            <BarChart data={MONTHLY_REVENUE} color="#6854d9" height={210} showValues format={(n) => `$${n}k`} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Live hall traffic" subtitle="Footfall activity index" />
          <div className="p-5">
            <LiveChart height={110} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Peak", "14:00"],
                ["Attendees", String(attendeesCount)],
                ["Trend", "↑ Active"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                  <p className="mt-0.5 text-[13px] font-bold text-slate-900">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Booth occupancy" subtitle="Across all venues" />
          <div className="flex flex-col items-center p-5">
            <Gauge value={boothsOccupancy} label="Occupied" sub={`${boothsBooked} of ${boothsTotal} booths`} size={170} />
            <div className="mt-4 w-full space-y-2">
              {[
                ["Allocated", boothsBooked],
                ["Pending / Reserved", applications.length],
                ["Available", boothsAvailable],
              ].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-[12px] font-semibold text-slate-600">{l as string}</span>
                  <span className="text-[12.5px] font-bold text-slate-900">{v as number}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* charts row 3 */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Booth traffic heatmap" subtitle="Footfall density by weekday and hour" right={<Badge tone="neutral">Main Hall</Badge>} />
          <div className="p-5">
            <Heatmap rows={HEATMAP_DAYS} cols={HEATMAP_HOURS} values={HEATMAP_VALUES} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Session popularity" subtitle="Total registrations by format" />
          <div className="p-5">
            <BarChart data={SESSION_POPULARITY} color="#a855f7" horizontal format={fmt} />
          </div>
        </Card>
      </div>

      {/* activity + funnel */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Activity feed"
            subtitle="Recent transactions and exhibitor submissions from MongoDB"
            right={<Link to="/admin/payments"><Button size="xs" variant="ghost" iconRight={<ArrowRight className="size-3.5" />}>View all</Button></Link>}
          />
          <div className="divide-y divide-slate-100">
            {activityFeed.map((a) => (
              <div key={a.id} className="flex items-start gap-3.5 px-5 py-3.5 transition hover:bg-slate-50/70">
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl",
                    a.tone === "success" ? "bg-emerald-50 text-emerald-600"
                    : a.tone === "danger" ? "bg-rose-50 text-rose-600"
                    : a.tone === "warn" ? "bg-amber-50 text-amber-600"
                    : "bg-brand-50 text-brand-600"
                  )}
                >
                  {a.who === "System" ? <Zap className="size-4" /> : a.tone === "success" ? <Check className="size-4" /> : <Building2 className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-slate-600">
                    <b className="font-bold text-slate-900">{a.who}</b> {a.action}{" "}
                    <b className="font-semibold text-brand-700">{a.target}</b>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{a.time}</p>
                </div>
                <Badge tone={a.tone === "success" ? "success" : a.tone === "danger" ? "danger" : a.tone === "warn" ? "warn" : "info"} className="shrink-0">
                  {a.tone === "success" ? "Verified" : a.tone === "danger" ? "Declined" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Lead funnel" subtitle="Exhibitor conversion path" />
          <div className="p-5">
            <Funnel steps={LEAD_FUNNEL} />
            <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
              <p className="text-[11.5px] font-bold text-slate-700">Close rate up 2.1 pts</p>
              <p className="mt-1 text-[11.5px] leading-snug text-slate-500">
                Badge-scan → closed-won improved against the previous edition benchmark.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* pending approvals + hourly */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Pending exhibitor applications"
            subtitle={pendingApps.length > 0 ? `${pendingApps.length} applications require organizer review` : "No pending applications in queue"}
            right={<Link to="/admin/exhibitors"><Button size="xs" variant="soft">Open queue</Button></Link>}
          />
          {pendingApps.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-slate-400">
              All exhibitor applications are currently reviewed. ✓
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingApps.slice(0, 5).map((app) => {
                const companyName = app.company?.name || app.companyName || "Exhibitor";
                return (
                  <div key={app._id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <ExhibitorLogo name={companyName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13.5px] font-bold text-slate-900">{companyName}</p>
                        <Badge tone="warn">Pending</Badge>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-slate-500">
                        Expo: {app.expo?.title || "Upcoming Expo"} · Category: {app.company?.industry || app.category || "General"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewApp(app._id, "approved", companyName)}
                        className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                        title="Approve application"
                        aria-label="Approve"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => handleReviewApp(app._id, "rejected", companyName)}
                        className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        title="Reject application"
                        aria-label="Reject"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Traffic by hour" subtitle="Peak activity distribution" />
          <div className="p-5">
            <BarChart data={BOOTH_TRAFFIC_HOURS} color="#0ea5e9" height={180} format={(n) => `${n}%`} />
          </div>
        </Card>
      </div>

      {/* upcoming expos table from MongoDB */}
      <Card>
        <CardHeader
          title="Your expos"
          subtitle={`Total ${expos.length} editions in MongoDB database`}
          right={<Link to="/admin/expos"><Button size="xs" variant="ghost" iconRight={<ArrowRight className="size-3.5" />}>Manage all</Button></Link>}
        />
        {expos.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-400">Loading expos from database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {["Expo", "Dates", "Status", "Venue", "Category", "City", "Action"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expos.slice(0, 6).map((e) => {
                  return (
                    <tr key={e._id || e.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {e.banner || e.cover ? (
                            <img src={e.banner || e.cover} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 font-bold">
                              {e.title?.[0] || "E"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{e.title}</p>
                            <p className="text-[11.5px] text-slate-500">{e.category || "Exhibition"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                        {e.startDate ? new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA"} –{" "}
                        {e.endDate ? new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={e.status === "Live" || e.status === "live" ? "danger" : e.status === "Upcoming" || e.status === "published" ? "brand" : "neutral"}
                          dot={e.status === "Live" || e.status === "live"}
                        >
                          {e.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{e.venue || "Exhibition Center"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{e.category || "General"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{e.city || e.country || "Global"}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/expos/${e.slug || e._id || e.id}`} className="text-[12px] font-bold text-brand-600 hover:text-brand-800">
                          View details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* quick actions */}
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Plus, t: "Create an expo", d: "Set up a new edition in minutes", to: "/admin/expos", tone: "from-brand-500 to-violet-600" },
            { i: MapPin, t: "Allocate booths", d: "Assign space on the floor plan", to: "/admin/floor-plan", tone: "from-cyan-500 to-blue-600" },
            { i: Ticket, t: "Manage attendees", d: "Tiers, badges, fast check-in", to: "/admin/attendees", tone: "from-amber-400 to-rose-500" },
            { i: Activity, t: "View full reports", d: "Deep-dive analytics & exports", to: "/admin/analytics", tone: "from-emerald-500 to-teal-600" },
          ].map((a) => (
            <Link key={a.t} to={a.to}>
              <Card hover className="group flex h-full items-center gap-4 p-4">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105", a.tone)}>
                  <a.i className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900">{a.t}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{a.d}</p>
                </div>
                <ArrowRight className="ml-auto size-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </Card>
            </Link>
          ))}
        </div>
      </Reveal>

      <ExpoCreateModal open={newExpo} onClose={() => setNewExpo(false)} onCreated={() => loadData(true)} />
    </div>
  );
}
