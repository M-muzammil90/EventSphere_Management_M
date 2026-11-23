import { useEffect, useState } from "react";
import { BOOTHS, type Booth } from "@/lib/data";
import { Badge, Button, Card } from "@/components/ui";
import { money } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, MousePointerClick } from "lucide-react";
import { fetchLiveBooths } from "@/lib/liveApi";
import { getSocket } from "@/lib/socket";

const ZONE_TONE: Record<string, string> = { A: "#5947c6", B: "#0ea5e9", C: "#f97316", D: "#10b981" };

const STATUS_STYLE: Record<Booth["status"], { border: string; bg: string; label: string }> = {
  available: { border: "border-slate-300", bg: "bg-white", label: "Available" },
  sold: { border: "border-transparent", bg: "bg-brand-500 text-white", label: "Booked" },
  reserved: { border: "border-flame-400", bg: "bg-flame-400/20 text-flame-500", label: "Reserved" },
  blocked: { border: "border-slate-200", bg: "bg-slate-200/70 text-slate-400", label: "Blocked" },
};

/**
 * Compact, interactive floor-plan preview used on the marketing homepage
 * and the About page. Booths are hoverable / selectable with a live detail
 * panel so visitors can try the real interaction before signing up.
 */
export function FloorPlanPreview({ compact = false }: { compact?: boolean }) {
  const [hover, setHover] = useState<Booth | null>(null);
  const [sel, setSel] = useState<Booth | null>(null);
  const [booths, setBooths] = useState<Booth[]>(BOOTHS);

  const loadBooths = async () => {
    try {
      const data = await fetchLiveBooths("6b0001fbc32ac2ad55711ad7");
      if (data && data.length > 0) setBooths(data);
    } catch (e) {
      console.warn("Live floor plan preview fallback:", e);
    }
  };

  useEffect(() => {
    loadBooths();
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => loadBooths();
    socket.on("booth:updated", onUpdate);
    return () => {
      socket.off("booth:updated", onUpdate);
    };
  }, []);

  const active = hover ?? sel;

  const counts = {
    available: booths.filter((b) => b.status === "available").length,
    reserved: booths.filter((b) => b.status === "reserved").length,
    sold: booths.filter((b) => b.status === "sold").length,
  };

  return (
    <div className={cn("grid gap-5", compact ? "" : "lg:grid-cols-[1fr_270px]")}>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <MapPin className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-slate-900">Hall 4 — Global Tech Summit 2026</p>
              <p className="text-[11px] text-slate-500">Click a booth to see live pricing & availability</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-600">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
          </span>
        </div>

        <div className="bg-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-200/70 px-3 py-2">
            <span className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-4 w-1 rounded-full bg-slate-400" />
              ))}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Main entrance · Registration</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {(["A", "B", "C", "D"] as const).map((z) => (
              <div key={z}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="grid size-4.5 place-items-center rounded-md text-[9px] font-bold text-white" style={{ background: ZONE_TONE[z] }}>
                    {z}
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">Zone {z}</span>
                </div>
                <div className="space-y-1.5">
                  {booths.filter((b) => b.zone === z).map((b) => {
                    const st = STATUS_STYLE[b.status];
                    const isSel = sel?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        onMouseEnter={() => setHover(b)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => setSel(isSel ? null : b)}
                        aria-label={`Booth ${b.id}, ${st.label}`}
                        className={cn(
                          "w-full rounded-lg border px-2 py-1.5 text-left transition-all duration-200",
                          st.border,
                          st.bg,
                          b.status === "available" && "hover:border-brand-400 hover:shadow-md",
                          isSel && "ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-100"
                        )}
                      >
                        <span className="font-display text-[11.5px] font-bold">{b.id}</span>
                        <span className={cn("mt-0.5 block truncate text-[9.5px] font-medium", b.status === "sold" ? "text-white/80" : "text-slate-500")}>
                          {b.owner ?? `${b.sqm} m²`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-ink-900 to-ink-800 px-4 py-2.5 text-white">
            <span className="font-display text-[11.5px] font-bold">MAIN STAGE</span>
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-white/40">3,000 seats</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-3">
          {[
            [STATUS_STYLE.available, counts.available],
            [STATUS_STYLE.reserved, counts.reserved],
            [STATUS_STYLE.sold, counts.sold],
          ].map(([st, n], i) => {
            const s = st as typeof STATUS_STYLE.available;
            const keys = ["Available", "Reserved", "Booked"] as const;
            return (
              <span key={keys[i]} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
                <span className={cn("size-3.5 rounded-[4px] border", s.border, s.bg)} />
                {keys[i]} · <b className="text-slate-900">{n as number}</b>
              </span>
            );
          })}
          <Link to="/floor-plan" className="ml-auto">
            <Button size="xs" variant="soft" iconRight={<ArrowRight className="size-3.5" />}>
              Open full plan
            </Button>
          </Link>
        </div>
      </Card>

      {!compact && (
        <div className="space-y-4">
          <Card className="p-4">
            {active ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[19px] font-bold text-slate-900">Booth {active.id}</span>
                  <Badge
                    tone={
                      active.status === "available" ? "success" : active.status === "sold" ? "brand" : active.status === "reserved" ? "warn" : "neutral"
                    }
                  >
                    {STATUS_STYLE[active.status].label}
                  </Badge>
                </div>
                <p className="mt-1 text-[12px] font-medium text-slate-500">Zone {active.zone} · Hall 4</p>
                {active.owner ? (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700">
                      {active.owner.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-slate-900">{active.owner}</p>
                      <p className="text-[11px] text-slate-500">{active.size} booth</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {[
                      ["Size", `${active.sqm} m² · ${active.size}`],
                      ["Rate", money(active.price)],
                      ["Includes", "Power · Wi-Fi · 1 table"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-[12.5px]">
                        <span className="text-slate-500">{l}</span>
                        <span className="font-bold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  {active.status === "available" ? (
                    <Link to="/register?role=exhibitor" className="flex-1">
                      <Button full size="sm" icon={<Check className="size-3.5" />}>
                        Reserve
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/floor-plan" className="flex-1">
                      <Button full size="sm" variant="secondary" iconRight={<ArrowRight className="size-3.5" />}>
                        View plan
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="py-3 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                  <MousePointerClick className="size-5" />
                </div>
                <p className="mt-3 text-[13px] font-bold text-slate-800">Try the floor plan</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                  Hover or tap any booth to see its size, live status and pricing.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Zone availability</p>
            <div className="mt-3 space-y-3">
              {(["A", "B", "C", "D"] as const).map((z) => {
                const all = BOOTHS.filter((b) => b.zone === z);
                const free = all.filter((b) => b.status === "available").length;
                const pct = Math.round(((all.length - free) / all.length) * 100);
                return (
                  <div key={z}>
                    <div className="mb-1 flex items-center justify-between text-[11.5px]">
                      <span className="font-semibold text-slate-600">Zone {z}</span>
                      <span className="font-bold text-slate-900">{free} free</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ZONE_TONE[z] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
