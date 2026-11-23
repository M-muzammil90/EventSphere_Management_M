import { useState } from "react";
import { FloorPlan } from "@/components/shared";
import { Badge, Button, Card, CardHeader, Reveal, SectionHeading, Tabs } from "@/components/ui";
import { Shell } from "@/components/SiteLayout";
import { BOOTH_TRAFFIC_HOURS, HEATMAP_DAYS, HEATMAP_HOURS, HEATMAP_VALUES } from "@/lib/data";
import { BarChart, Heatmap } from "@/components/charts";
import { useStore } from "@/lib/store";
import { Download, MapPin, Maximize2, MousePointerClick, Printer, Zap } from "lucide-react";

export default function FloorPlanPage() {
  const { toast } = useStore();
  const [tab, setTab] = useState("plan");

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white pb-10 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Global Tech Summit 2026"
              title="Interactive floor plan"
              body="Every booth, zone and facility for Hall 4 — live availability, sizing and pricing. Exhibitors can reserve directly from this view."
            />
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Badge tone="brand" dot>Live availability</Badge>
              <Badge tone="neutral">4 zones · 30 booths</Badge>
              <Badge tone="neutral">3,200 sqm total</Badge>
              <Badge tone="success">Wheelchair accessible</Badge>
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
              <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => toast({ title: "Print view opening…", tone: "info" })}>Print</Button>
              <Button size="sm" icon={<Download className="size-4" />} onClick={() => toast({ title: "Floor plan PDF exported", tone: "success" })}>Export</Button>
            </div>
          </div>

          {tab === "plan" ? (
            <FloorPlan mode="select" />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Booth traffic by hour" subtitle="Aggregate footfall across all zones — yesterday" />
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
                <CardHeader title="Facilities & access" subtitle="Hall 4 — Dubai World Trade Centre" />
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
