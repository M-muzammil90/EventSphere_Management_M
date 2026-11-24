import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FloorPlan } from "@/components/shared";
import { Badge, Button, Card, CardHeader, Reveal, SectionHeading, Tabs, Select } from "@/components/ui";
import { Shell } from "@/components/SiteLayout";
import { BOOTH_TRAFFIC_HOURS, HEATMAP_DAYS, HEATMAP_HOURS, HEATMAP_VALUES, type Expo, type Booth } from "@/lib/data";
import { fetchLiveExpos, fetchLiveBooths } from "@/lib/liveApi";
import { BarChart, Heatmap } from "@/components/charts";
import { useStore } from "@/lib/store";
import { Download, MapPin, Maximize2, MousePointerClick, Printer, Zap, RefreshCw, Check, CalendarDays } from "lucide-react";

export default function FloorPlanPage() {
  const { toast } = useStore();
  const [tab, setTab] = useState("plan");
  const [expos, setExpos] = useState<Expo[]>([]);
  const [selectedExpoId, setSelectedExpoId] = useState<string>("");
  const [liveBooths, setLiveBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [loadingBooths, setLoadingBooths] = useState(false);

  useEffect(() => {
    fetchLiveExpos()
      .then((data) => {
        const valid = (data || []).filter((e) => e.status !== "Draft");
        const list = valid.length > 0 ? valid : (data || []);
        setExpos(list);
        if (list.length > 0) {
          setSelectedExpoId(list[0].id);
        }
      })
      .catch((err) => console.warn("Live expos load error:", err));
  }, []);

  useEffect(() => {
    if (!selectedExpoId) return;
    setLoadingBooths(true);
    fetchLiveBooths(selectedExpoId)
      .then((booths) => setLiveBooths(booths || []))
      .catch(() => setLiveBooths([]))
      .finally(() => setLoadingBooths(false));
  }, [selectedExpoId]);

  const currentExpo = useMemo(() => {
    return expos.find((e) => e.id === selectedExpoId) || expos[0] || null;
  }, [expos, selectedExpoId]);

  const availableCount = useMemo(() => {
    return liveBooths.filter((b) => b.status === "available").length;
  }, [liveBooths]);

  const bookedCount = useMemo(() => {
    return liveBooths.filter((b) => b.status === "sold" || (b.status as string) === "booked").length;
  }, [liveBooths]);

  const zonesCount = useMemo(() => {
    return new Set(liveBooths.map((b) => b.zone)).size || 4;
  }, [liveBooths]);

  const currentBoothObj = useMemo(() => {
    if (!selectedBooth) return null;
    return liveBooths.find((b) => b.id === selectedBooth || (b as any)._id === selectedBooth) || null;
  }, [selectedBooth, liveBooths]);

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white pb-10 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <SectionHeading
                  eyebrow={currentExpo?.title || "Live Expo Floor Plan"}
                  title="Interactive floor plan"
                  body={`Live floor layout and booth occupancy for ${currentExpo?.venue || "Exhibition Centre"}. Real-time sizing, pricing, and availability.`}
                />
              </div>

              {/* Expo Selector */}
              <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Expo Edition
                </label>
                <Select
                  value={selectedExpoId}
                  onChange={(e) => {
                    setSelectedExpoId(e.target.value);
                    setSelectedBooth(null);
                  }}
                  className="h-10 text-[13px] font-semibold"
                >
                  {expos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.city})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Badge tone="brand" dot>Live availability</Badge>
              <Badge tone="neutral">{zonesCount} zones · {liveBooths.length || 32} booths</Badge>
              <Badge tone="success">{availableCount} Available</Badge>
              {bookedCount > 0 && <Badge tone="warn">{bookedCount} Occupied</Badge>}
              <span className="text-[12px] text-slate-500 ml-2 hidden sm:inline-flex items-center gap-1">
                <CalendarDays className="size-3.5 text-slate-400" />
                {currentExpo?.startDate} – {currentExpo?.endDate}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-slate-50/60 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              active={tab}
              onChange={setTab}
              tabs={[
                { id: "plan", label: "Floor plan" },
                { id: "traffic", label: "Traffic analysis" },
              ]}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Printer className="size-4" />}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                size="sm"
                icon={<Download className="size-4" />}
                onClick={() => toast({ title: "Floor plan exported ✓", body: "Floor layout saved as PDF.", tone: "success" })}
              >
                Export
              </Button>
            </div>
          </div>

          {tab === "plan" ? (
            <div className="space-y-6">
              {loadingBooths ? (
                <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RefreshCw className="size-6 animate-spin text-brand-600" />
                    <p className="text-[13px]">Loading live floor plan from MongoDB...</p>
                  </div>
                </div>
              ) : (
                <FloorPlan
                  key={selectedExpoId}
                  expoId={selectedExpoId}
                  mode="select"
                  selected={selectedBooth}
                  onSelect={setSelectedBooth}
                  booths={liveBooths.length > 0 ? liveBooths : undefined}
                  onBoothsLoaded={(booths) => setLiveBooths(booths)}
                  height={540}
                />
              )}

              {/* Selected Booth Inspector Card */}
              {selectedBooth && currentBoothObj && (
                <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 font-display font-extrabold text-[16px] border border-brand-200">
                        {currentBoothObj.id || selectedBooth}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-[16px] font-bold text-slate-900">
                            Booth {currentBoothObj.id || selectedBooth}
                          </h4>
                          <Badge tone={currentBoothObj.status === "available" ? "success" : "warn"}>
                            {currentBoothObj.status?.toUpperCase() || "AVAILABLE"}
                          </Badge>
                          <Badge tone="purple">{currentBoothObj.size || "Standard"}</Badge>
                        </div>
                        <p className="mt-1 text-[12.5px] text-slate-500">
                          Zone {currentBoothObj.zone || "A"} · {currentBoothObj.sqm || 12} m² · ${currentBoothObj.price?.toLocaleString() || "2,500"} USD
                          {currentBoothObj.owner && ` · Occupied by ${currentBoothObj.owner}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to="/portal">
                        <Button size="sm" icon={<Check className="size-4" />}>
                          Reserve in Exhibitor Portal
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedBooth(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Booth traffic by hour" subtitle="Aggregate footfall across all zones — peak expo hours" />
                <div className="p-5">
                  <BarChart data={BOOTH_TRAFFIC_HOURS} color="#6854d9" height={220} showValues format={(n) => `${n}%`} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Zone × hour heatmap" subtitle="Peak density by zone across the week" />
                <div className="p-5">
                  <Heatmap rows={HEATMAP_DAYS} cols={HEATMAP_HOURS} values={HEATMAP_VALUES} />
                </div>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader title="Facilities & access" subtitle={`${currentExpo?.venue || "Exhibition Centre"} — Live Amenities`} />
                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Main Entrance", "Registration + 12 self-service kiosks", MapPin],
                    ["Food Court", "Seating for 480 · 9 vendors", Zap],
                    ["Networking Lounge", "Meeting pods · lead-exchange bar", MousePointerClick],
                    ["Press Room", "Interview sets · fibre uplink", Maximize2],
                  ].map(([t, d, Ic]) => {
                    const I = Ic as any;
                    return (
                      <div key={t as string} className="rounded-2xl border border-slate-200 p-4">
                        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><I className="size-4" /></span>
                        <p className="mt-3 text-[13px] font-bold text-slate-900">{t as string}</p>
                        <p className="mt-1 text-[11.5px] leading-snug text-slate-500">{d as string}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
