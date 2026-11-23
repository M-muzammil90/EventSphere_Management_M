import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ACTIVITY_FEED,
  ATTENDANCE_TREND,
  BOOTH_TRAFFIC_HOURS,
  EXHIBITORS,
  EXPOS,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  HEATMAP_VALUES,
  LEAD_FUNNEL,
  MONTHLY_REVENUE,
  REGISTRATION_SPLIT,
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
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react";

import { ExpoCreateModal } from "./AdminExpos";

export default function AdminOverview() {
  const { toast, user } = useStore();
  const [range, setRange] = useState("7d");
  const [newExpo, setNewExpo] = useState(false);

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
            Good afternoon, {user?.name?.split(" ")[0] ?? "Sarah"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">
            Industrial Innovate Fair is live in Munich. Three exhibitor applications need your review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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
          <Button variant="secondary" size="sm" icon={<Download className="size-4" />} onClick={() => toast({ title: "Report queued", body: "Overview.pdf will be emailed to you.", tone: "success" })}>
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
          value="$4.83M"
          delta="+12.4%"
          sub="vs. $4.30M last edition"
          icon={<Banknote className="size-5" />}
          tone="success"
          spark={<Sparkline values={[182, 214, 268, 241, 312, 389, 356, 428]} color="#10b981" width={140} height={34} />}
        />
        <StatCard
          label="Registered attendees"
          value="18,420"
          delta="+18.4%"
          sub="68% attendee · 19% exhibitor"
          icon={<Users className="size-5" />}
          tone="brand"
          spark={<Sparkline values={[4200, 6800, 9200, 8100, 10400, 7600, 5200]} color="#6854d9" width={140} height={34} />}
        />
        <StatCard
          label="Booths sold"
          value="486 / 520"
          delta="+7.2%"
          sub="93% inventory utilisation"
          icon={<MapPin className="size-5" />}
          tone="info"
          spark={<Sparkline values={[40, 44, 43, 52, 58, 61, 63]} color="#0ea5e9" width={140} height={34} />}
        />
        <StatCard
          label="Sessions scheduled"
          value="92"
          delta="+5"
          sub="84% average fill rate"
          icon={<CalendarClock className="size-5" />}
          tone="purple"
          spark={<Sparkline values={[12, 18, 22, 28, 34, 41, 48]} color="#a855f7" width={140} height={34} />}
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
          <CardHeader title="Registration split" subtitle="By badge type · live" right={<Badge tone="success" dot>Updated 30s</Badge>} />
          <div className="p-5">
            <Donut data={REGISTRATION_SPLIT} centerLabel="Badges" centerValue="18.4K" size={172} thickness={20} />
          </div>
        </Card>
      </div>

      {/* charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue by month"
            subtitle="Booth sales + ticketing, thousands USD"
            right={<Badge tone="success">+31% YoY</Badge>}
          />
          <div className="p-5">
            <BarChart data={MONTHLY_REVENUE} color="#6854d9" height={210} showValues format={(n) => `$${n}k`} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Live hall traffic" subtitle="Aggregated footfall right now" />
          <div className="p-5">
            <LiveChart height={110} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Peak", "12:00"],
                ["Now", "6,412"],
                ["Trend", "↑ Rising"],
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
          <CardHeader title="Booth occupancy" subtitle="Current edition" />
          <div className="flex flex-col items-center p-5">
            <Gauge value={93} label="Occupied" sub="486 of 520 booths reserved" size={170} />
            <div className="mt-4 w-full space-y-2">
              {[
                ["Sold", 486],
                ["Reserved", 24],
                ["Available", 34],
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
          <CardHeader title="Booth traffic heatmap" subtitle="Footfall density by weekday and hour" right={<Badge tone="neutral">Hall 4</Badge>} />
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
            subtitle="Everything that happened across your expos today"
            right={<Button size="xs" variant="ghost" iconRight={<ArrowRight className="size-3.5" />}>View all</Button>}
          />
          <div className="divide-y divide-slate-100">
            {ACTIVITY_FEED.map((a) => (
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
                  {a.who === "System" ? <Zap className="size-4" /> : a.who === "You" ? <Check className="size-4" /> : <Building2 className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-slate-600">
                    <b className="font-bold text-slate-900">{a.who}</b> {a.action}{" "}
                    <b className="font-semibold text-brand-700">{a.target}</b>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{a.time}</p>
                </div>
                <Badge tone={a.tone === "success" ? "success" : a.tone === "danger" ? "danger" : a.tone === "warn" ? "warn" : "info"} className="shrink-0">
                  {a.tone === "success" ? "Approved" : a.tone === "danger" ? "Rejected" : a.tone === "warn" ? "System" : "New"}
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
            subtitle="3 applications require your decision"
            right={<Link to="/admin/exhibitors"><Button size="xs" variant="soft">Open queue</Button></Link>}
          />
          <div className="divide-y divide-slate-100">
            {EXHIBITORS.filter((e) => e.status === "Pending" || e.status === "Waitlist").map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <ExhibitorLogo name={e.company} bg={e.logoBg} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13.5px] font-bold text-slate-900">{e.company}</p>
                    <Badge tone={e.status === "Pending" ? "warn" : "info"}>{e.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    {e.category} · {e.country} · {e.staff} staff · docs {e.docs}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast({ title: `${e.company} approved`, body: "A confirmation email has been sent.", tone: "success" })}
                    className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                    aria-label="Approve"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => toast({ title: `${e.company} rejected`, tone: "danger" })}
                    className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label="Reject"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Traffic by hour" subtitle="Yesterday, all zones" />
          <div className="p-5">
            <BarChart data={BOOTH_TRAFFIC_HOURS} color="#0ea5e9" height={180} format={(n) => `${n}%`} />
          </div>
        </Card>
      </div>

      {/* upcoming expos table */}
      <Card>
        <CardHeader
          title="Your expos"
          subtitle="All editions managed by EventSphere Management"
          right={<Link to="/admin/expos"><Button size="xs" variant="ghost" iconRight={<ArrowRight className="size-3.5" />}>Manage all</Button></Link>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {["Expo", "Dates", "Status", "Attendees", "Booths", "Revenue", "Progress"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXPOS.slice(0, 6).map((e) => {
                const pct = Math.round((e.boothsSold / e.boothsTotal) * 100);
                return (
                  <tr key={e.id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={e.cover} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{e.title}</p>
                          <p className="text-[11.5px] text-slate-500">{e.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                      {new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={e.status === "Live" ? "danger" : e.status === "Upcoming" ? "brand" : "neutral"} dot={e.status === "Live"}>{e.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900">{fmt(e.attendees)}</td>
                    <td className="px-5 py-3.5 tabular-nums text-slate-600">{e.boothsSold}/{e.boothsTotal}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900">{money(e.boothsSold * 8400)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Progress value={pct} className="w-20" height={6} tone={pct > 90 ? "warn" : "brand"} />
                        <span className="text-[11.5px] font-bold tabular-nums text-slate-600">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* quick actions */}
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Plus, t: "Create an expo", d: "Set up a new edition in minutes", to: "/admin/expos", tone: "from-brand-500 to-violet-600" },
            { i: MapPin, t: "Allocate booths", d: "Assign space on the floor plan", to: "/admin/floor-plan", tone: "from-cyan-500 to-blue-600" },
            { i: Ticket, t: "Manage tickets", d: "Tiers, promo codes, capacity", to: "/admin/expos", tone: "from-amber-400 to-flame-500" },
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

      <ExpoCreateModal open={newExpo} onClose={() => setNewExpo(false)} />
    </div>
  );
}
