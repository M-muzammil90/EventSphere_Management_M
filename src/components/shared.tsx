import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { BOOTHS, type Booth, type Expo, type Session } from "@/lib/data";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { fmt, money, useStore } from "@/lib/store";
import { Link } from "react-router-dom";
import { fetchLiveBooths } from "@/lib/liveApi";
import { getSocket } from "@/lib/socket";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  Clock,
  Globe2,
  MapPin,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

/* ============================ FLOOR PLAN ============================ */
const ZONE_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  A: { bg: "bg-indigo-500", ring: "ring-indigo-300", text: "text-indigo-700" },
  B: { bg: "bg-cyan-500", ring: "ring-cyan-300", text: "text-cyan-700" },
  C: { bg: "bg-amber-500", ring: "ring-amber-300", text: "text-amber-700" },
  D: { bg: "bg-emerald-500", ring: "ring-emerald-300", text: "text-emerald-700" },
};

export function FloorPlan({
  mode = "view",
  selected,
  onSelect,
  height = 520,
  expoId,
  booths: initialBooths,
  onBoothsLoaded,
}: {
  mode?: "view" | "select" | "admin";
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  height?: number;
  expoId?: string;
  booths?: Booth[];
  onBoothsLoaded?: (booths: Booth[]) => void;
}) {
  const [hover, setHover] = useState<Booth | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "sold">("all");
  const [liveBooths, setLiveBooths] = useState<Booth[]>(initialBooths || BOOTHS);
  const [_loading, setLoading] = useState(!initialBooths);

  const targetExpoId = expoId || "6b0001fbc32ac2ad55711ad7"; // Global Tech Summit default

  const loadLiveFloorPlan = async () => {
    try {
      const data = await fetchLiveBooths(targetExpoId);
      if (data && data.length > 0) {
        setLiveBooths(data);
        onBoothsLoaded?.(data);
      }
    } catch (err) {
      console.warn("Floor plan live load error, keeping current booths:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBooths && initialBooths.length > 0) {
      setLiveBooths(initialBooths);
      setLoading(false);
      return;
    }
    loadLiveFloorPlan();
  }, [initialBooths, targetExpoId]);

  // Real-time synchronization: listen for booth changes from admin, payments, reservations
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBoothUpdated = () => {
      loadLiveFloorPlan();
    };

    socket.on("booth:updated", handleBoothUpdated);
    socket.on("booth:reserved", handleBoothUpdated);
    socket.on("booth:booked", handleBoothUpdated);

    return () => {
      socket.off("booth:updated", handleBoothUpdated);
      socket.off("booth:reserved", handleBoothUpdated);
      socket.off("booth:booked", handleBoothUpdated);
    };
  }, [targetExpoId]);

  const displayedBooths = useMemo(
    () =>
      liveBooths.filter((b) =>
        filter === "all" ? true : filter === "available" ? b.status === "available" : b.status !== "available"
      ),
    [liveBooths, filter]
  );

  const legend = [
    { l: "Available", c: "bg-white border-slate-300" },
    { l: "Sold / Booked", c: "bg-indigo-500 border-indigo-500" },
    { l: "Reserved", c: "bg-amber-400 border-amber-400" },
    { l: "Blocked", c: "bg-slate-300 border-slate-300" },
    { l: "Selected", c: "bg-brand-600 border-brand-700 ring-2 ring-brand-300" },
  ];

  const active = hover || (selected ? liveBooths.find((b) => b.id === selected) : null);

  const availableCount = liveBooths.filter((b) => b.status === "available").length;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_286px]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <MapPin className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold text-slate-900">Hall 4 — Interactive Floor Plan</p>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Database Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Live MongoDB sync · Click a booth to view details or reserve</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["all", "available", "sold"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11.5px] font-bold capitalize transition",
                  filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-auto bg-slate-50 p-4" style={{ maxHeight: height }}>
          <div className="relative mx-auto min-w-[620px]">
            {/* hall outline */}
            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 shadow-sm">
              {/* entrance */}
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <span className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-4 w-1 rounded-full bg-slate-400" />
                  ))}
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">Main Entrance · Registration</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {(["A", "B", "C", "D"] as const).map((z) => (
                  <div key={z}>
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className={cn("grid size-5 place-items-center rounded-md text-[10px] font-bold text-white", ZONE_COLORS[z].bg)}>
                        {z}
                      </span>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Zone {z}</span>
                    </div>
                    <div className="space-y-1.5">
                      {displayedBooths
                        .filter((b) => b.zone === z)
                        .map((b) => {
                          const isSel = selected === b.id;
                          return (
                            <button
                              key={b.id}
                              onMouseEnter={() => setHover(b)}
                              onMouseLeave={() => setHover(null)}
                              onClick={() => onSelect?.(isSel ? null : b.id)}
                              className={cn(
                                "group relative w-full overflow-hidden rounded-lg border p-2 text-left transition-all duration-200",
                                b.status === "available" && "border-slate-300 bg-white hover:border-brand-400 hover:shadow-md",
                                b.status === "sold" && "border-transparent text-white",
                                b.status === "reserved" && "border-amber-500/50 bg-amber-50 text-amber-900",
                                b.status === "blocked" && "border-slate-200 bg-slate-200/70 text-slate-400",
                                b.status === "sold" && ZONE_COLORS[z].bg,
                                isSel && "ring-2 ring-brand-500 ring-offset-2",
                                mode !== "view" && b.status === "available" && "cursor-pointer"
                              )}
                              disabled={mode === "view"}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-display text-[12px] font-bold">{b.id}</span>
                                {isSel && <span className="size-2 rounded-full bg-brand-600" />}
                              </div>
                              <p className={cn("mt-0.5 truncate text-[10px] font-medium", b.status === "sold" ? "text-white/80" : "text-slate-500")}>
                                {b.owner ?? `${b.sqm} sqm`}
                              </p>
                              {mode !== "view" && b.status === "available" && (
                                <span className="mt-1 block text-[10px] font-bold text-brand-600 opacity-0 transition group-hover:opacity-100">
                                  {money(b.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* stage */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-ink-900 to-ink-800 px-4 py-3 text-white">
                <div>
                  <p className="font-display text-[12.5px] font-bold">MAIN STAGE</p>
                  <p className="text-[10px] text-white/60">Keynotes · 3,000 seats</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Screen 24m</span>
              </div>
            </div>

            {/* facilities */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                ["Food Court", "bg-rose-50 text-rose-700 border-rose-200"],
                ["Networking Lounge", "bg-brand-50 text-brand-700 border-brand-200"],
                ["Press Room", "bg-slate-100 text-slate-600 border-slate-200"],
              ].map(([l, c]) => (
                <div key={l} className={cn("rounded-xl border border-dashed px-3 py-2.5 text-center text-[11px] font-bold", c)}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3">
          {legend.map((l) => (
            <span key={l.l} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
              <span className={cn("size-3.5 rounded-[4px] border", l.c)} />
              {l.l}
            </span>
          ))}
          <span className="ml-auto text-[11.5px] font-semibold text-slate-500">
            <strong className="text-slate-900">{availableCount}</strong> of {liveBooths.length} booths available (MongoDB Live)
          </span>
        </div>
      </Card>

      {/* detail rail */}
      <div className="space-y-4">
        <Card className="p-4">
          {active ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-display text-[20px] font-bold text-slate-900">Booth {active.id}</span>
                <Badge
                  tone={
                    active.status === "available"
                      ? "success"
                      : active.status === "sold"
                      ? "brand"
                      : active.status === "reserved"
                      ? "warn"
                      : "neutral"
                  }
                >
                  {active.status === "sold" ? "Booked" : active.status}
                </Badge>
              </div>
              <p className="mt-1 text-[12px] font-medium text-slate-500">Zone {active.zone} · Hall 4</p>
              {active.owner ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700">
                    {active.owner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold text-slate-900">{active.owner}</p>
                    <p className="text-[11px] text-slate-500">{active.size} booth · Allocated in MongoDB</p>
                  </div>
                </div>
              ) : null}
              <div className="mt-3 space-y-2.5">
                {[
                  ["Size", `${active.sqm} sqm · ${active.size}`],
                  ["Live Rate", money(active.price)],
                  ["Dimensions", `${Math.round(active.sqm / 3)}m × 3m`],
                  ["Includes", "3-phase Power · High-speed Wi-Fi · Rigging points"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[12.5px]">
                    <span className="text-slate-500">{l}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>
              {mode !== "view" && active.status === "available" && (
                <Button
                  full
                  size="sm"
                  className="mt-4"
                  variant={selected === active.id ? "secondary" : "primary"}
                  onClick={() => onSelect?.(selected === active.id ? null : active.id)}
                >
                  {selected === active.id ? "Selected — proceed below" : "Select this booth"}
                </Button>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <MapPin className="size-5" />
              </div>
              <p className="mt-3 text-[13px] font-bold text-slate-800">Hover or click a booth</p>
              <p className="mt-1 text-[12px] text-slate-500">Live availability, admin allocation, size and pricing appear here.</p>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Zone occupancy (Database)</p>
          <div className="mt-3 space-y-2.5">
            {(["A", "B", "C", "D"] as const).map((z) => {
              const all = liveBooths.filter((b) => b.zone === z);
              const sold = all.filter((b) => b.status !== "available").length;
              return (
                <div key={z}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                      <span className={cn("size-2 rounded-full", ZONE_COLORS[z].bg)} /> Zone {z}
                    </span>
                    <span className="font-bold text-slate-900">
                      {sold}/{all.length || 1}
                    </span>
                  </div>
                  <Progress
                    value={all.length ? (sold / all.length) * 100 : 0}
                    tone={z === "A" ? "brand" : z === "B" ? "info" : z === "C" ? "warn" : "success"}
                    height={5}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== KPI CARD ============================= */
export function StatCard({
  label,
  value,
  delta,
  sub,
  icon,
  tone = "brand",
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "brand" | "success" | "warn" | "info" | "purple";
  spark?: React.ReactNode;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 ring-brand-100",
    success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    warn: "bg-amber-50 text-amber-600 ring-amber-100",
    info: "bg-aqua-500/10 text-aqua-600 ring-aqua-500/20",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
  };
  const up = delta?.startsWith("+");
  return (
    <Card hover className="group relative overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg ring-1 transition-colors", tones[tone])}>
          {icon}
        </span>
      </div>
      <div className="mt-3.5 flex flex-wrap items-end gap-x-2.5 gap-y-2">
        <p className="font-display text-[27px] font-bold leading-none tracking-[-.03em] text-slate-900">{value}</p>
        {delta && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold tabular-nums",
              up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}
          >
            <TrendingUp className={cn("size-3", !up && "rotate-180")} />
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">{sub}</p>}
      {spark && (
        <div className="-mb-1 mt-3 opacity-75 transition-opacity duration-300 group-hover:opacity-100">
          {spark}
        </div>
      )}
    </Card>
  );
}

/* ============================= EXPO CARD ============================= */
export function ExpoCard({ expo }: { expo: Expo }) {
  const sold = Math.round((expo.boothsSold / expo.boothsTotal) * 100);
  return (
    <Card hover className="group flex h-full flex-col overflow-hidden">
      <Link to={`/expos/${expo.slug}`} className="relative block h-44 overflow-hidden">
        <img src={expo.cover} alt={expo.title} loading="lazy" className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent" />
        <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
          <Badge tone="dark">{expo.category}</Badge>
          {expo.status === "Live" && (
            <Badge tone="danger" className="bg-rose-500 text-white ring-rose-400">
              <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </Badge>
          )}
          {expo.featured && <Badge tone="warn">Featured</Badge>}
        </div>
        <div className="absolute inset-x-3.5 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-white">{expo.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/75">
              <MapPin className="size-3" /> {expo.city}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
            ${expo.price}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-500">
          <CalendarDays className="size-3.5 text-brand-500" />
          {new Date(expo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {new Date(expo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {expo.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
              {t}
            </span>
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">{expo.description}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2.5 text-center">
          {[
            [fmt(expo.attendees), "Attendees"],
            [String(expo.exhibitors), "Exhibitors"],
            [String(expo.sessions), "Sessions"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display text-[14px] font-bold text-slate-900">{v}</p>
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
            <span className="font-semibold text-slate-600">Booth inventory</span>
            <span className="font-bold text-slate-900">{sold}% sold</span>
          </div>
          <Progress value={sold} tone={sold > 90 ? "warn" : "brand"} height={6} />
        </div>

        <Link to={`/expos/${expo.slug}`} className="mt-4">
          <Button full size="sm" variant="secondary" iconRight={<ArrowRight className="size-3.5" />}>
            Explore expo
          </Button>
        </Link>
      </div>
    </Card>
  );
}

/* =========================== SESSION CARD ============================ */
export function SessionCard({ s, compact }: { s: Session; compact?: boolean }) {
  const { bookmarks, toggleBookmark } = useStore();
  const marked = bookmarks.includes(s.id);
  const fill = Math.round((s.registered / s.capacity) * 100);

  return (
    <Card hover className="group flex gap-4 p-4">
      <div className="hidden w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-brand-50 to-white ring-1 ring-brand-100 sm:flex">
        <span className="font-display text-[15px] font-bold text-brand-700">{s.start}</span>
        <span className="my-1 h-px w-6 bg-brand-200" />
        <span className="text-[11px] font-semibold text-slate-400">{s.end}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={s.type === "Keynote" ? "purple" : s.type === "Workshop" ? "brand" : s.type === "Panel" ? "info" : s.type === "Demo" ? "warn" : "neutral"}>
            {s.type}
          </Badge>
          <Badge tone="neutral" className="bg-slate-50">{s.track}</Badge>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Star className="size-3 fill-amber-400 text-amber-400" /> {s.rating}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 sm:hidden">
            <Clock className="size-3" /> {s.start}–{s.end}
          </span>
        </div>

        <h4 className="mt-2.5 font-display text-[15px] font-bold leading-snug tracking-tight text-slate-900 group-hover:text-brand-700">
          {s.title}
        </h4>

        <div className="mt-2.5 flex items-center gap-2.5">
          <img src={s.avatar} alt="" className="size-7 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-slate-800">{s.speaker}</p>
            <p className="truncate text-[11px] text-slate-500">{s.speakerRole}</p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-bold text-slate-600 sm:inline-flex">
            <MapPin className="size-3" /> {s.stage}
          </span>
        </div>

        {!compact && (
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">
                {fmt(s.registered)} / {fmt(s.capacity)} registered
              </span>
              <span className={cn("font-bold", fill > 95 ? "text-rose-600" : fill > 80 ? "text-amber-600" : "text-emerald-600")}>
                {fill}% full
              </span>
            </div>
            <Progress value={fill} height={5} tone={fill > 95 ? "danger" : fill > 80 ? "warn" : "success"} />
          </div>
        )}
      </div>

      <button
        onClick={() => toggleBookmark(s.id)}
        aria-label={marked ? "Remove bookmark" : "Bookmark session"}
        className={cn(
          "grid size-9 shrink-0 place-items-center self-start rounded-xl border transition",
          marked ? "border-brand-200 bg-brand-50 text-brand-600" : "border-slate-200 text-slate-300 hover:border-brand-200 hover:text-brand-500"
        )}
      >
        {marked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      </button>
    </Card>
  );
}

/* =========================== EXHIBITOR ROW =========================== */
export function ExhibitorLogo({ name, bg, size = 44 }: { name: string; bg: string; size?: number }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-display font-bold text-white shadow-sm", bg)}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
    </span>
  );
}

export const RolePill = ({ role }: { role: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 ring-1 ring-white/15">
    <Building2 className="size-3" />
    {role}
  </span>
);

export const GlobeBadge = ({ country }: { country: string }) => (
  <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
    <Globe2 className="size-3.5" /> {country}
  </span>
);

export const UsersBadge = ({ n }: { n: number }) => (
  <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500">
    <Users className="size-3.5" /> {n} staff
  </span>
);
