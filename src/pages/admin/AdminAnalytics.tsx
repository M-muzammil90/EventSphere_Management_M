import { useState } from "react";
import {
  EXPOS,
  ATTENDANCE_TREND,
  BOOTH_TRAFFIC_HOURS,
  EXHIBITORS,
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  HEATMAP_VALUES,
  LEAD_FUNNEL,
  MONTHLY_REVENUE,
  REGISTRATION_SPLIT,
  SESSION_POPULARITY,
} from "@/lib/data";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, Progress, Reveal, Select, Tabs, Table, Td, Th } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { AreaChart, BarChart, Donut, Funnel, Gauge, Heatmap, RadialStack, Sparkline, StackedBar } from "@/components/charts";
import { useExport } from "@/components/kit";
import { fmt, money, useStore } from "@/lib/store";
import {
  Activity, BarChart3, CalendarRange, Download, FileSpreadsheet, FileText, GitCompareArrows, Globe2,
  Mail, Percent, Printer, RefreshCw, Target, TrendingUp, Users,
} from "lucide-react";

const REPORTS = [
  { n: "Attendee engagement report", d: "Check-ins, dwell time, session attendance", s: "Ready", size: "2.4 MB", f: "PDF" },
  { n: "Booth traffic analysis", d: "Scans per booth, peak hours, heatmaps", s: "Ready", size: "1.8 MB", f: "XLSX" },
  { n: "Session popularity breakdown", d: "Fill rates, ratings, no-shows", s: "Ready", size: "940 KB", f: "PDF" },
  { n: "Exhibitor lead performance", d: "Scans, qualified leads, conversion", s: "Generating", size: "—", f: "CSV" },
  { n: "Revenue reconciliation", d: "Booth sales, ticketing, sponsorship", s: "Ready", size: "3.1 MB", f: "XLSX" },
  { n: "Post-event summary deck", d: "Auto-built 40-slide summary", s: "Scheduled", size: "—", f: "PDF" },
];

export default function AdminAnalytics() {
  const { toast } = useStore();
  const exportApi = useExport();
  const [range, setRange] = useState("30d");
  const [tab, setTab] = useState("overview");
  const [expo, setExpo] = useState("Global Tech Summit 2026");
  const [custom, setCustom] = useState({ from: "2026-02-18", to: "2026-03-18" });
  const [compare, setCompare] = useState(true);
  const [schedule, setSchedule] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Analytics & reporting</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Attendee engagement, booth traffic, session popularity and revenue — refreshed every 30 seconds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="success" dot>Live data</Badge>
          <Button size="sm" variant="outline" className="border-slate-200 text-slate-600" icon={<CalendarRange className="size-4" />} onClick={() => setSchedule(true)}>
            {range === "custom" ? `${custom.from} → ${custom.to}` : range === "24h" ? "Last 24 hours" : range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : range === "ytd" ? "Year to date" : "All time"}
          </Button>
          <Select value={expo} onChange={(e) => setExpo(e.target.value)} className="h-9.5 min-w-[210px]">
            {EXPOS.map((e) => <option key={e.id}>{e.title}</option>)}
            <option>All expos</option>
          </Select>
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9.5 min-w-[130px]">
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
            <option value="custom">Custom range</option>
          </Select>
          <Button size="sm" variant={compare ? "soft" : "secondary"} onClick={() => setCompare((v) => !v)} icon={<GitCompareArrows className="size-4" />}>
            {compare ? "Comparing" : "Compare"}
          </Button>
          <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>Print</Button>
          <Button size="sm" variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => exportApi.xlsx(`analytics-${range}`)}>XLSX</Button>
          <Button size="sm" icon={<Download className="size-4" />} onClick={() => exportApi.pdf(`analytics-${range}`)}>Export PDF</Button>
        </div>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Report scope</span>
              <Badge tone="brand">{expo}</Badge>
              <Badge tone="neutral" className="bg-slate-50">
                {range === "custom" ? `${custom.from} → ${custom.to}` : range === "24h" ? "Last 24 hours" : range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : range === "ytd" ? "Year to date" : "All time"}
              </Badge>
              {compare && <Badge tone="info">vs. previous period</Badge>}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3 text-[12px]">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <span className="size-2 rounded-full bg-brand-500" /> Current
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <span className="size-2 rounded-full bg-aqua-500" /> Previous
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <RefreshCw className="size-3.5" /> Refreshed 30s ago
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "attendees", label: "Attendee engagement" },
          { id: "booths", label: "Booth traffic" },
          { id: "sessions", label: "Sessions" },
          { id: "events", label: "Event-wise reports" },
          { id: "reports", label: "Reports" },
        ]}
      />

      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Engagement score" value="87 / 100" delta="+5.2" icon={<Activity className="size-5" />} tone="brand" sub="Composite of all signals" spark={<Sparkline values={[62, 68, 71, 74, 79, 83, 87]} color="#6854d9" width={140} height={32} />} />
            <StatCard label="Avg. dwell time" value="3h 42m" delta="+18.0%" icon={<Users className="size-5" />} tone="info" sub="Time on floor per attendee" spark={<Sparkline values={[140, 162, 155, 188, 202, 214, 222]} color="#0ea5e9" width={140} height={32} />} />
            <StatCard label="Lead conversion" value="12.0%" delta="+2.1 pts" icon={<Target className="size-5" />} tone="success" sub="Badge scan → closed won" spark={<Sparkline values={[7, 8, 8, 9, 10, 11, 12]} color="#10b981" width={140} height={32} />} />
            <StatCard label="NPS" value="72" delta="+8" icon={<TrendingUp className="size-5" />} tone="warn" sub="Post-event survey, n=4,812" spark={<Sparkline values={[52, 58, 61, 64, 68, 70, 72]} color="#f97316" width={140} height={32} />} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Attendance & engagement trend" subtitle="Unique check-ins vs. previous edition" right={<Badge tone="brand">This edition</Badge>} />
              <div className="p-5"><AreaChart data={ATTENDANCE_TREND} format={fmt} height={270} /></div>
            </Card>
            <Card>
              <CardHeader title="Badge type split" subtitle="18,420 issued badges" />
              <div className="p-5"><Donut data={REGISTRATION_SPLIT} centerLabel="Badges" centerValue="18.4K" /></div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Revenue trend" subtitle="Booth sales + ticketing, thousands USD" right={<Badge tone="success">+31% YoY</Badge>} />
              <div className="p-5"><BarChart data={MONTHLY_REVENUE} color="#10b981" height={220} showValues format={(n) => `$${n}k`} /></div>
            </Card>
            <Card>
              <CardHeader title="Lead funnel" subtitle="Exhibitor conversion path" />
              <div className="p-5"><Funnel steps={LEAD_FUNNEL} /></div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-2">
              <CardHeader title="Traffic heatmap" subtitle="Weekday × hour density" />
              <div className="p-5"><Heatmap rows={HEATMAP_DAYS} cols={HEATMAP_HOURS} values={HEATMAP_VALUES} /></div>
            </Card>
            <Card>
              <CardHeader title="Goal completion" subtitle="Against pre-event targets" />
              <div className="space-y-5 p-5">
                {[
                  ["Attendees", 92],
                  ["Booths sold", 93],
                  ["Sponsorship", 78],
                  ["Sessions filled", 84],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <div className="mb-1.5 flex justify-between text-[12px]">
                      <span className="font-semibold text-slate-600">{l as string}</span>
                      <span className="font-bold text-slate-900">{v as number}%</span>
                    </div>
                    <Progress value={v as number} tone={(v as number) > 85 ? "success" : (v as number) > 70 ? "brand" : "warn"} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Track engagement" subtitle="Relative interest" />
              <div className="flex flex-col items-center p-5">
                <RadialStack
                  items={[
                    { label: "Engineering", value: 92, color: "#5947c6" },
                    { label: "Vision", value: 78, color: "#6854d9" },
                    { label: "Security", value: 64, color: "#0ea5e9" },
                    { label: "Automation", value: 52, color: "#f97316" },
                  ]}
                  size={172}
                />
                <div className="mt-4 w-full space-y-1.5">
                  {[["Engineering", 92, "#5947c6"], ["Vision", 78, "#6854d9"], ["Security", 64, "#0ea5e9"], ["Automation", 52, "#f97316"]].map(([l, v, c]) => (
                    <div key={l as string} className="flex items-center gap-2 text-[11.5px]">
                      <span className="size-2 rounded-full" style={{ background: c as string }} />
                      <span className="text-slate-600">{l as string}</span>
                      <span className="ml-auto font-bold text-slate-900">{v as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "attendees" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Unique attendees" value="18,420" delta="+18.4%" icon={<Users className="size-5" />} tone="brand" sub="Across 4 days" />
            <StatCard label="Returning" value="31%" delta="+4.2 pts" icon={<Globe2 className="size-5" />} tone="info" sub="Attended a previous edition" />
            <StatCard label="Countries" value="74" delta="+9" icon={<Globe2 className="size-5" />} tone="success" sub="International delegation" />
            <StatCard label="Sessions per attendee" value="4.6" delta="+0.8" icon={<BarChart3 className="size-5" />} tone="warn" sub="Average bookmarks attended" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Daily check-ins" subtitle="Unique badge scans per day" />
              <div className="p-5"><AreaChart data={ATTENDANCE_TREND} keys={["a"]} labels={["Check-ins"]} colors={["#6854d9"]} format={fmt} height={260} /></div>
            </Card>
            <Card>
              <CardHeader title="Acquisition channels" subtitle="Where registrations came from" />
              <div className="p-5">
                <StackedBar
                  segments={[
                    { label: "Email", value: 42, color: "#5947c6" },
                    { label: "Organic", value: 24, color: "#0ea5e9" },
                    { label: "Social", value: 18, color: "#f97316" },
                    { label: "Partner", value: 11, color: "#a855f7" },
                    { label: "Paid", value: 5, color: "#64748b" },
                  ]}
                />
                <div className="mt-6 space-y-3">
                  {[["Email open rate", "38.4%"], ["Click-through", "11.2%"], ["Registration → check-in", "84%"]].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-medium text-slate-600">{l}</span>
                      <span className="text-[13px] font-bold text-slate-900">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <Card>
            <CardHeader title="Attendee geography" subtitle="Top countries by registration volume" />
            <div className="p-5">
              <BarChart
                horizontal
                color="#6854d9"
                format={(n) => `${(n / 100).toFixed(1)}K`}
                data={[["United Arab Emirates", 4200], ["India", 2800], ["United Kingdom", 2100], ["Germany", 1850], ["United States", 1620], ["Saudi Arabia", 1240], ["Singapore", 980], ["Japan", 760]].map(([l, v]) => ({ label: l as string, v: v as number }))}
              />
            </div>
          </Card>
        </>
      )}

      {tab === "booths" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total badge scans" value={fmt(EXHIBITORS.reduce((s, e) => s + e.traffic, 0))} delta="+11.2%" icon={<Activity className="size-5" />} tone="brand" sub="At-booth interactions" />
            <StatCard label="Busiest booth" value="A-12" icon={<Percent className="size-5" />} tone="info" sub="Nexora Cloud · 4,820 scans" />
            <StatCard label="Avg. scans / booth" value="1,860" delta="+6.4%" icon={<Target className="size-5" />} tone="success" sub="Approved booths only" />
            <StatCard label="Attributed revenue" value={money(EXHIBITORS.reduce((s, e) => s + e.revenue, 0))} delta="+19.4%" icon={<TrendingUp className="size-5" />} tone="warn" sub="Deals closed from leads" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Traffic heatmap" subtitle="Footfall density by weekday and hour" />
              <div className="p-5"><Heatmap rows={HEATMAP_DAYS} cols={HEATMAP_HOURS} values={HEATMAP_VALUES} /></div>
            </Card>
            <Card>
              <CardHeader title="Hourly distribution" subtitle="Share of daily traffic" />
              <div className="p-5"><BarChart data={BOOTH_TRAFFIC_HOURS} color="#0ea5e9" height={220} format={(n) => `${n}%`} /></div>
            </Card>
          </div>
          <Card>
            <CardHeader title="Booth performance leaderboard" subtitle="Ranked by total badge scans this edition" right={<Button size="xs" variant="ghost" icon={<Download className="size-3.5" />}>CSV</Button>} />
            <Table>
              <thead>
                <tr>
                  <Th>#</Th><Th>Booth & exhibitor</Th><Th>Scans</Th><Th>Qualified leads</Th><Th>Conversion</Th><Th>Revenue</Th><Th>Lead score</Th>
                </tr>
              </thead>
              <tbody>
                {[...EXHIBITORS].filter((e) => e.traffic > 0).sort((a, b) => b.traffic - a.traffic).map((e, i) => (
                  <tr key={e.id} className="transition hover:bg-slate-50/60">
                    <Td><span className={`grid size-7 place-items-center rounded-lg text-[11px] font-bold ${i < 3 ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span></Td>
                    <Td>
                      <p className="font-semibold text-slate-900">{e.company}</p>
                      <p className="text-[11.5px] text-slate-500">Booth {e.booth} · {e.category}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={(e.traffic / 5000) * 100} className="w-16" height={5} />
                        <span className="text-[12px] font-bold tabular-nums text-slate-800">{fmt(e.traffic)}</span>
                      </div>
                    </Td>
                    <Td className="tabular-nums text-slate-600">{fmt(Math.round(e.traffic * 0.61))}</Td>
                    <Td className="tabular-nums text-slate-600">12%</Td>
                    <Td className="font-semibold tabular-nums text-slate-900">{money(e.revenue)}</Td>
                    <Td><Badge tone={e.leadScore > 85 ? "success" : e.leadScore > 65 ? "warn" : "neutral"}>{e.leadScore}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {tab === "sessions" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sessions delivered" value="92" icon={<BarChart3 className="size-5" />} tone="brand" sub="6 tracks · 4 days" />
            <StatCard label="Avg. fill rate" value="84%" delta="+6.1%" icon={<Percent className="size-5" />} tone="success" sub="Registrations vs. capacity" />
            <StatCard label="Avg. rating" value="4.7" delta="+0.3" icon={<Activity className="size-5" />} tone="info" sub="Post-session feedback" />
            <StatCard label="No-show rate" value="8.2%" delta="-1.4 pts" icon={<Target className="size-5" />} tone="warn" sub="Booked but not attended" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Popularity by format" subtitle="Total registrations" />
              <div className="p-5"><BarChart data={SESSION_POPULARITY} color="#a855f7" horizontal format={fmt} /></div>
            </Card>
            <Card>
              <CardHeader title="Overall satisfaction" subtitle="All sessions" />
              <div className="flex flex-col items-center p-5">
                <Gauge value={94} label="Satisfied" sub="4,812 responses across 92 sessions" color="#a855f7" />
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                  {[["5★", "68%"], ["4★", "26%"], ["≤3★", "6%"]].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-[13px] font-bold text-slate-900">{v}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Time-slot demand" subtitle="Registrations by start hour" />
              <div className="p-5">
                <BarChart color="#f97316" height={200} showValues format={fmt}
                  data={[["09:00", 5031], ["10:00", 3820], ["11:00", 2610], ["12:00", 1180], ["13:00", 1440], ["14:00", 2210], ["15:00", 1990]].map(([l, v]) => ({ label: l as string, v: v as number }))} />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "events" && (
        <>
          <Card>
            <CardHeader
              title="Event-wise performance report"
              subtitle="Side-by-side metrics for every edition you manage"
              right={
                <div className="flex flex-wrap gap-2">
                  <Button size="xs" variant="secondary" onClick={() => exportApi.csv("event-report")}>CSV</Button>
                  <Button size="xs" variant="secondary" onClick={() => exportApi.xlsx("event-report")}>XLSX</Button>
                  <Button size="xs" onClick={() => exportApi.pdf("event-report")}>PDF</Button>
                </div>
              }
            />
            <Table>
              <thead>
                <tr>
                  <Th>Expo</Th><Th>Dates</Th><Th className="text-right">Attendees</Th><Th className="text-right">Exhibitors</Th>
                  <Th>Booths</Th><Th className="text-right">Fill rate</Th><Th className="text-right">Avg. rating</Th><Th>Trend</Th>
                </tr>
              </thead>
              <tbody>
                {EXPOS.map((e) => {
                  const pct = Math.round((e.boothsSold / e.boothsTotal) * 100);
                  return (
                    <tr key={e.id} className="transition hover:bg-slate-50/60">
                      <Td>
                        <div className="flex items-center gap-3">
                          <img src={e.cover} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{e.title}</p>
                            <p className="text-[11.5px] text-slate-500">{e.city}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-600">
                        {new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Td>
                      <Td className="text-right font-semibold tabular-nums text-slate-900">{fmt(e.attendees)}</Td>
                      <Td className="text-right tabular-nums text-slate-600">{e.exhibitors}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="w-20" height={6} tone={pct > 90 ? "warn" : "brand"} />
                          <span className="text-[11.5px] font-bold tabular-nums text-slate-600">{pct}%</span>
                        </div>
                      </Td>
                      <Td className="text-right tabular-nums text-slate-600">{Math.round(60 + (e.rating - 4) * 40)}%</Td>
                      <Td className="text-right font-semibold tabular-nums text-slate-800">{e.rating}</Td>
                      <Td>
                        <Sparkline values={[20, 28, 24, 36, 44, 52, 48, 62].map((v) => v * (e.attendees / 18000))} color="#5947c6" width={80} height={28} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Attendees by event" subtitle="Registered attendance per edition" />
              <div className="p-5">
                <BarChart horizontal color="#5947c6" format={fmt} data={EXPOS.map((e) => ({ label: e.title.length > 24 ? e.title.slice(0, 24) + "…" : e.title, v: e.attendees }))} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Revenue by event" subtitle="Booth sales, thousands USD" />
              <div className="p-5">
                <BarChart horizontal color="#10b981" format={(n) => money(n * 8400)} data={EXPOS.map((e) => ({ label: e.title.length > 24 ? e.title.slice(0, 24) + "…" : e.title, v: e.boothsSold }))} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Engagement report" subtitle="Attendee engagement score by event" />
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {EXPOS.slice(0, 8).map((e) => {
                const score = Math.round(58 + ((e.rating - 4) * 22) + (e.boothsSold / e.boothsTotal) * 18);
                return (
                  <div key={e.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="truncate text-[12.5px] font-bold text-slate-900">{e.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{e.city}</p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <p className="font-display text-[24px] font-extrabold leading-none text-slate-900">{score}</p>
                      <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-2"><Progress value={score} tone={score > 85 ? "success" : score > 70 ? "brand" : "warn"} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <Modal
        open={schedule}
        onClose={() => setSchedule(false)}
        title="Custom date range"
        subtitle="Filter every chart and table in this dashboard"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSchedule(false)}>Cancel</Button>
            <Button onClick={() => { setRange("custom"); setSchedule(false); toast({ title: "Date range applied", body: `${custom.from} → ${custom.to}`, tone: "success" }); }}>
              Apply range
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" required><Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></Field>
            <Field label="To" required><Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></Field>
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Quick ranges</p>
            <div className="flex flex-wrap gap-2">
              {[["Yesterday", "24h"], ["Last 7 days", "7d"], ["Last 30 days", "30d"], ["Year to date", "ytd"], ["All time", "all"]].map(([l, v]) => (
                <button
                  key={l}
                  onClick={() => { setRange(v); setSchedule(false); toast({ title: `Applied: ${l}`, tone: "success" }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-[12px] leading-relaxed text-brand-900">
            <CalendarRange className="mt-0.5 size-4 shrink-0" />
            Reports cover the selected range across all charts, tables and exports. Scheduled digests use the same range.
          </div>
        </div>
      </Modal>

      {tab === "reports" && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Generated reports" subtitle="Available for download — retained for 24 months" right={<Badge tone="neutral">6 reports</Badge>} />
              <div className="divide-y divide-slate-100">
                {REPORTS.map((r) => (
                  <div key={r.n} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileText className="size-4.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-slate-900">{r.n}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate-500">{r.d}</p>
                    </div>
                    <Badge tone={r.s === "Ready" ? "success" : r.s === "Generating" ? "warn" : "neutral"} dot={r.s === "Generating"}>{r.s}</Badge>
                    <span className="hidden text-[11.5px] font-semibold text-slate-400 sm:block">{r.f} · {r.size}</span>
                    <Button size="xs" variant={r.s === "Ready" ? "soft" : "secondary"} disabled={r.s !== "Ready"} icon={<Download className="size-3.5" />}
                      onClick={() => toast({ title: "Downloading", body: `${r.n}.${r.f.toLowerCase()}`, tone: "success" })}>
                      {r.s === "Ready" ? "Download" : r.s}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Scheduled digests" subtitle="Emailed automatically" />
                <div className="space-y-2.5 p-5">
                  {[
                    ["Daily performance digest", "07:00 GST · daily"],
                    ["Weekly stakeholder summary", "Monday 09:00"],
                    ["Post-event wrap-up", "After final day"],
                  ].map(([n, d]) => (
                    <div key={n} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12.5px] font-bold text-slate-900">{n}</p>
                        <Badge tone="success" dot>On</Badge>
                      </div>
                      <p className="mt-1 text-[11.5px] text-slate-500">{d}</p>
                    </div>
                  ))}
                  <Button full variant="secondary" size="sm" icon={<Mail className="size-4" />} onClick={() => toast({ title: "Digest settings", body: "Recipients can be managed in Settings.", tone: "info" })}>
                    Manage recipients
                  </Button>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-ink-900 to-ink-800 p-5 text-white">
                  <Activity className="size-5 text-brand-300" />
                  <p className="mt-3 font-display text-[15px] font-bold">Build a custom report</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">
                    Pick metrics, groupings and a date range. Save it as a template your whole team can reuse.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toast({ title: "Report builder", body: "Opens the drag-and-drop builder.", tone: "info" })}>
                    Open report builder
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <Reveal>
            <Card>
              <CardHeader title="Report history" subtitle="Last 8 exports" />
              <Table>
                <thead>
                  <tr><Th>Report</Th><Th>Requested by</Th><Th>Date</Th><Th>Format</Th><Th>Status</Th></tr>
                </thead>
                <tbody>
                  {[
                    ["Booth traffic analysis", "Sarah Whitfield", "Today, 09:14", "XLSX", "Ready"],
                    ["Attendee engagement report", "Sarah Whitfield", "Yesterday, 17:02", "PDF", "Ready"],
                    ["Revenue reconciliation", "Finance Team", "Feb 18, 11:40", "XLSX", "Ready"],
                    ["Session popularity breakdown", "Marcus Reid", "Feb 17, 14:22", "PDF", "Ready"],
                    ["Exhibitor lead performance", "Sarah Whitfield", "Feb 15, 08:05", "CSV", "Expired"],
                    ["Sponsorship deliverables", "Events Team", "Feb 12, 16:30", "PDF", "Ready"],
                    ["Badge check-in log", "Ops Team", "Feb 10, 10:11", "CSV", "Ready"],
                    ["Floor plan allocation audit", "Sarah Whitfield", "Feb 08, 13:45", "PDF", "Ready"],
                  ].map(([n, u, d, f, s]) => (
                    <tr key={n as string} className="transition hover:bg-slate-50/60">
                      <Td className="font-medium text-slate-800">{n as string}</Td>
                      <Td className="text-slate-600">{u as string}</Td>
                      <Td className="whitespace-nowrap text-slate-600">{d as string}</Td>
                      <Td><Badge tone="neutral" className="bg-slate-50">{f as string}</Badge></Td>
                      <Td><Badge tone={s === "Ready" ? "success" : "neutral"}>{s as string}</Badge></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Reveal>
        </>
      )}
    </div>
  );
}
