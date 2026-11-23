import { useEffect, useMemo, useState } from "react";
import { BOOTHS, type Booth } from "@/lib/data";
import { EXHIBITORS } from "@/lib/data";
import { Badge, Button, Card, CardHeader, Field, Input, Modal, Progress, Select, Table, Tabs, Td, Th, Toggle } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { BarChart, StackedBar } from "@/components/charts";
import { ConfirmDialog, Pagination, RowMenu, useExport } from "@/components/kit";
import { money, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Building2, Copy, Grid3x3, Lock, MapPin, Pencil, Percent, Plus, Settings2, Trash2, Unlock } from "lucide-react";
import { fetchLiveBooths, fetchLiveExpos, createLiveBooth, updateLiveBooth, deleteLiveBooth, assignLiveBooth, fetchLiveExhibitors } from "@/lib/liveApi";
import { getSocket } from "@/lib/socket";

const ZONES = ["A", "B", "C", "D"] as const;
const SIZES = ["Small", "Medium", "Large", "Island"] as const;
const RATE: Record<Booth["size"], number> = { Small: 2600, Medium: 5600, Large: 8400, Island: 12000 };
const SQM: Record<Booth["size"], number> = { Small: 12, Medium: 30, Large: 48, Island: 72 };

const ZONE_STYLE: Record<string, { sold: string; label: string; text: string }> = {
  A: { sold: "bg-brand-500", label: "Zone A", text: "text-brand-700" },
  B: { sold: "bg-aqua-500", label: "Zone B", text: "text-aqua-600" },
  C: { sold: "bg-flame-500", label: "Zone C", text: "text-flame-500" },
  D: { sold: "bg-emerald-500", label: "Zone D", text: "text-emerald-600" },
};

const STATUS_TONE: Record<Booth["status"], "success" | "brand" | "warn" | "neutral"> = {
  available: "success",
  sold: "brand",
  reserved: "warn",
  blocked: "neutral",
};

export default function AdminFloorPlan() {
  const { toast } = useStore();
  const exportApi = useExport();
  const [tab, setTab] = useState("plan");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "taken">("all");
  const [editing, setEditing] = useState<Booth | null>(null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<Booth | null>(null);
  const [confirmDel, setConfirmDel] = useState<Booth | null>(null);
  const [page, setPage] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [expos, setExpos] = useState<any[]>([]);
  const [selectedExpo, setSelectedExpo] = useState<string>("");
  const [_loading, _setLoading] = useState(false);
  const [exhibitorOptions, setExhibitorOptions] = useState<any[]>(EXHIBITORS);

  /* local mutable booth list so the editor feels live */
  const [booths, setBooths] = useState<Booth[]>(BOOTHS);
  const [nextNum, setNextNum] = useState(60);

  const loadData = async () => {
    try {
      const exp = await fetchLiveExpos();
      setExpos(exp);
      const activeExpoId = selectedExpo || exp[0]?.id;
      if (activeExpoId) {
        setSelectedExpo(activeExpoId);
        const liveB = await fetchLiveBooths(activeExpoId);
        if (liveB && liveB.length > 0) setBooths(liveB);
      }
      const exRes = await fetchLiveExhibitors();
      if (exRes?.exhibitors && exRes.exhibitors.length > 0) {
        setExhibitorOptions(exRes.exhibitors);
      }
    } catch (e) {
      console.warn("Floor plan load error:", e);
    }
  };

  useEffect(() => {
    loadData();
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      loadData();
    };
    socket.on("booth:updated", handleUpdate);
    socket.on("booth:assigned", handleUpdate);
    socket.on("booth:reserved", handleUpdate);
    socket.on("booth:booked", handleUpdate);
    return () => {
      socket.off("booth:updated", handleUpdate);
      socket.off("booth:assigned", handleUpdate);
      socket.off("booth:reserved", handleUpdate);
      socket.off("booth:booked", handleUpdate);
    };
  }, [selectedExpo]);

  const sold = booths.filter((b) => b.status !== "available");
  const revenue = booths.filter((b) => b.status === "sold").reduce((s, b) => s + b.price, 0);
  const PER = 10;
  const pages = Math.ceil(booths.length / PER);
  const slice = booths.slice((page - 1) * PER, page * PER);

  const visible = useMemo(
    () => booths.filter((b) => (filter === "all" ? true : filter === "available" ? b.status === "available" : b.status !== "available")),
    [booths, filter]
  );

  const saveBooth = async (b: Booth, isNew: boolean = false) => {
    try {
      const activeExpoId = selectedExpo || expos[0]?.id;
      const backendStatus = b.status === "sold" ? "booked" : b.status;

      if (isNew || creating) {
        if (activeExpoId) {
          await createLiveBooth({
            expo: activeExpoId,
            boothId: b.id,
            zone: b.zone,
            category: b.size,
            sqm: b.sqm,
            price: b.price,
            status: backendStatus,
            position: { x: b.x, y: b.y },
            size: { w: b.w, h: b.h },
          });
        }
      } else {
        await updateLiveBooth(b._id || b.id, {
          price: b.price,
          status: backendStatus,
          category: b.size,
          sqm: b.sqm,
          position: { x: b.x, y: b.y },
          size: { w: b.w, h: b.h },
        });
      }

      if (b.owner) {
        await assignLiveBooth(b._id || b.id, b.owner, backendStatus);
      }

      await loadData();
    } catch (err) {
      console.warn("Save booth error:", err);
      setBooths((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));
    }
  };

  const allocate = async (b: Booth, exhibitor: string, status: Booth["status"]) => {
    try {
      const backendStatus = status === "sold" ? "booked" : status;
      const targetId = b._id || b.id;
      if (exhibitor) {
        await assignLiveBooth(targetId, exhibitor, backendStatus);
      } else {
        await assignLiveBooth(targetId, "", backendStatus);
      }
      toast({
        title: `Booth ${b.id} ${status} in MongoDB`,
        body: exhibitor ? `${exhibitor} assigned and notified.` : "Booth updated.",
        tone: status === "blocked" ? "warn" : "success",
      });
      await loadData();
    } catch (err: any) {
      console.warn("Allocate error:", err);
      await saveBooth({ ...b, owner: exhibitor || undefined, status });
    }
  };

  const sel = booths.find((b) => b.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Floor plan editor</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Create and edit booths, assign them to exhibitors and track available, reserved and booked status — live for everyone.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {expos.length > 0 && (
            <select
              value={selectedExpo}
              onChange={(e) => setSelectedExpo(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-semibold text-slate-700 outline-none focus:border-brand-500"
            >
              {expos.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          )}
          <Tabs size="sm" active={tab} onChange={setTab} tabs={[{ id: "plan", label: "Editor" }, { id: "inventory", label: "Inventory" }]} />
          <Button variant="secondary" icon={<Settings2 className="size-4" />} onClick={() => toast({ title: "Grid settings", body: "Snap-to-grid and scale configuration.", tone: "info" })}>Settings</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New booth</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total booths" value={String(booths.length)} icon={<Grid3x3 className="size-5" />} tone="brand" sub={`${ZONES.length} zones · Hall 4`} />
        <StatCard label="Occupancy" value={`${Math.round((sold.length / booths.length) * 100)}%`} delta="+7.2%" icon={<Percent className="size-5" />} tone="success" sub={`${sold.length} of ${booths.length} booths`} />
        <StatCard label="Available" value={String(booths.filter((b) => b.status === "available").length)} icon={<Unlock className="size-5" />} tone="info" sub="Open for reservation" />
        <StatCard label="Booth revenue" value={money(revenue)} delta="+12.4%" icon={<Building2 className="size-5" />} tone="warn" sub="Booked inventory only" />
      </div>

      {tab === "plan" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPin className="size-4" /></span>
                <div>
                  <p className="text-[13px] font-bold text-slate-900">Hall 4 — Booth editor</p>
                  <p className="text-[11px] text-slate-500">Click a booth to edit details or assign an exhibitor</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {([["all", "All"], ["available", "Available"], ["taken", "Taken"]] as const).map(([f, l]) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-bold transition", filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <Toggle checked={showLabels} onChange={setShowLabels} label="Labels" />
              </div>
            </div>

            <div className="overflow-auto bg-slate-100 p-4" style={{ maxHeight: 580 }}>
              <div className="relative mx-auto min-w-[620px]">
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                    <span className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => <span key={i} className="h-4 w-1 rounded-full bg-slate-400" />)}
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">Main entrance · Registration</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {ZONES.map((z) => (
                      <div key={z}>
                        <div className="mb-2 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("grid size-5 place-items-center rounded-md text-[10px] font-bold text-white", ZONE_STYLE[z].sold)}>{z}</span>
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Zone {z}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {booths.filter((b) => b.zone === z && b.status !== "available").length}/{booths.filter((b) => b.zone === z).length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {visible.filter((b) => b.zone === z).map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setSelected(selected === b.id ? null : b.id)}
                              className={cn(
                                "group w-full rounded-lg border p-2 text-left transition-all duration-200",
                                b.status === "available" && "border-slate-300 bg-white hover:border-brand-400 hover:shadow-md",
                                b.status === "sold" && cn("border-transparent text-white", ZONE_STYLE[z].sold),
                                b.status === "reserved" && "border-flame-400 bg-flame-400/20 text-flame-500",
                                b.status === "blocked" && "border-slate-200 bg-slate-200/70 text-slate-400",
                                selected === b.id && "ring-2 ring-brand-500 ring-offset-2"
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-display text-[12px] font-bold">{b.id}</span>
                                {selected === b.id && <span className="size-2 rounded-full bg-brand-600" />}
                              </div>
                              {showLabels && (
                                <p className={cn("mt-0.5 truncate text-[10px] font-medium", b.status === "sold" ? "text-white/80" : "text-slate-500")}>
                                  {b.owner ?? `${b.sqm} m²`}
                                </p>
                              )}
                              <p className={cn("mt-0.5 truncate text-[10px] font-bold", b.status === "sold" ? "text-white/70" : b.status === "available" ? "text-brand-600" : "text-slate-400")}>
                                {money(b.price)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-ink-900 to-ink-800 px-4 py-3 text-white">
                    <div>
                      <p className="font-display text-[12.5px] font-bold">MAIN STAGE</p>
                      <p className="text-[10px] text-white/60">Keynotes · 3,000 seats</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Screen 24m</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[["Food Court", "bg-rose-50 text-rose-700 border-rose-200"], ["Networking Lounge", "bg-brand-50 text-brand-700 border-brand-200"], ["Press Room", "bg-slate-100 text-slate-600 border-slate-200"]].map(([l, c]) => (
                    <div key={l} className={cn("rounded-xl border border-dashed px-3 py-2.5 text-center text-[11px] font-bold", c)}>{l}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3">
              {[
                ["Available", "bg-white border-slate-300"],
                ["Booked", "bg-brand-500 border-brand-500"],
                ["Reserved", "bg-flame-400/20 border-flame-400"],
                ["Blocked", "bg-slate-200 border-slate-200"],
              ].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
                  <span className={cn("size-3.5 rounded-[4px] border", c)} /> {l}
                </span>
              ))}
              <span className="ml-auto text-[11.5px] font-semibold text-slate-400">
                {booths.filter((b) => b.status === "available").length} of {booths.length} available
              </span>
            </div>
          </Card>

          {/* inspector */}
          <div className="space-y-4">
            <Card className="p-4">
              {sel ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[20px] font-bold text-slate-900">Booth {sel.id}</span>
                    <Badge tone={STATUS_TONE[sel.status]} dot>{sel.status}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-slate-500">Zone {sel.zone} · Hall 4</p>

                  <div className="mt-3 space-y-2.5">
                    {[["Size", `${sel.sqm} m² · ${sel.size}`], ["Rate", money(sel.price)], ["Exhibitor", sel.owner ?? "— unassigned —"], ["Zone", `Zone ${sel.zone}`]].map(([l, v]) => (
                      <div key={l} className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-100 pb-2 last:border-0">
                        <span className="text-[12px] text-slate-500">{l}</span>
                        <span className="text-[12.5px] font-bold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button full size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(sel)}>Edit booth details</Button>
                    <Button full size="sm" variant="secondary" icon={<Building2 className="size-3.5" />} onClick={() => setAssigning(sel)}>Assign exhibitor</Button>
                    <Button full size="sm" variant="secondary" icon={<Copy className="size-3.5" />} onClick={() => { const n = { ...sel, id: `${sel.zone}-${nextNum}`, owner: undefined, status: "available" as const }; saveBooth(n); setNextNum((x) => x + 1); toast({ title: `Booth ${n.id} created`, body: `Duplicated from ${sel.id}.`, tone: "success" }); }}>
                      Duplicate booth
                    </Button>
                    {sel.status === "available" ? (
                      <Button full size="sm" variant="secondary" icon={<Lock className="size-3.5" />} onClick={() => allocate(sel, "", "blocked")}>Block this booth</Button>
                    ) : (
                      <Button full size="sm" variant="secondary" icon={<Unlock className="size-3.5" />} onClick={() => allocate(sel, "", "available")}>Release to available</Button>
                    )}
                    <Button full size="sm" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={() => setConfirmDel(sel)}>Delete booth</Button>
                  </div>
                </>
              ) : (
                <div className="py-3 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-500"><MapPin className="size-5" /></div>
                  <p className="mt-3 text-[13px] font-bold text-slate-800">Nothing selected</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">Click any booth on the plan to edit its details, pricing or assignment.</p>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Zone summary</p>
              <div className="mt-3 space-y-3">
                {ZONES.map((z) => {
                  const all = booths.filter((b) => b.zone === z);
                  const taken = all.filter((b) => b.status !== "available").length;
                  return (
                    <div key={z}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                          <span className={cn("size-2 rounded-full", ZONE_STYLE[z].sold)} /> {ZONE_STYLE[z].label}
                        </span>
                        <span className="font-bold text-slate-900">{taken}/{all.length}</span>
                      </div>
                      <Progress value={(taken / all.length) * 100} height={5} tone={z === "A" ? "brand" : z === "B" ? "info" : z === "C" ? "warn" : "success"} />
                      <p className="mt-1 text-[10.5px] text-slate-400">
                        {money(all.filter((b) => b.status === "sold").reduce((s, b) => s + b.price, 0))} booked revenue
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Size mix</p>
              <div className="mt-3.5">
                <StackedBar
                  height={9}
                  segments={SIZES.map((s, i) => ({ label: s, value: booths.filter((b) => b.size === s).length, color: ["#5947c6", "#8b72ee", "#0ea5e9", "#f97316"][i] }))}
                />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader
            title="Booth inventory"
            subtitle={`${booths.length} booths across zones A–D`}
            right={
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{money(booths.reduce((s, b) => s + b.price, 0))} total value</Badge>
                <Button size="xs" variant="secondary" onClick={() => exportApi.csv("booth-inventory")}>CSV</Button>
                <Button size="xs" variant="secondary" onClick={() => exportApi.xlsx("booth-inventory")}>XLSX</Button>
              </div>
            }
          />
          <Table>
            <thead>
              <tr>
                <Th>Booth</Th><Th>Zone</Th><Th>Type</Th><Th className="text-right">Size</Th><Th className="text-right">Rate</Th>
                <Th>Exhibitor</Th><Th>Status</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {slice.map((b) => (
                <tr key={b.id} className="transition hover:bg-slate-50/60">
                  <Td className="font-display font-bold text-slate-900">{b.id}</Td>
                  <Td>
                    <Badge tone={b.zone === "A" ? "brand" : b.zone === "B" ? "info" : b.zone === "C" ? "warn" : "success"}>Zone {b.zone}</Badge>
                  </Td>
                  <Td className="text-slate-600">{b.size}</Td>
                  <Td className="text-right tabular-nums text-slate-600">{b.sqm} m²</Td>
                  <Td className="text-right font-semibold tabular-nums text-slate-900">{money(b.price)}</Td>
                  <Td className="text-slate-600">{b.owner ?? <span className="text-slate-400">—</span>}</Td>
                  <Td><Badge tone={STATUS_TONE[b.status]} dot>{b.status === "available" ? "Available" : b.status === "sold" ? "Booked" : b.status === "reserved" ? "Reserved" : "Blocked"}</Badge></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditing(b)} aria-label="Edit booth" className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"><Pencil className="size-3.5" /></button>
                      <button onClick={() => setAssigning(b)} aria-label="Assign booth" className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"><Building2 className="size-3.5" /></button>
                      <RowMenu
                        items={[
                          { label: "Duplicate", icon: <Copy />, onClick: () => { const n = { ...b, id: `${b.zone}-${nextNum}`, owner: undefined, status: "available" as const }; saveBooth(n); setNextNum((x) => x + 1); toast({ title: `Booth ${n.id} created`, tone: "success" }); } },
                          { label: b.status === "available" ? "Block booth" : "Release booth", icon: b.status === "available" ? <Lock /> : <Unlock />, onClick: () => allocate(b, "", b.status === "available" ? "blocked" : "available") },
                          { label: "Delete booth", icon: <Trash2 />, danger: true, onClick: () => setConfirmDel(b) },
                        ]}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="border-t border-slate-100 p-4">
            <Pagination page={page} pages={pages} onChange={setPage} total={booths.length} perPage={PER} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Zone performance" subtitle="Occupancy and revenue by zone" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {ZONES.map((z) => {
              const all = booths.filter((b) => b.zone === z);
              const taken = all.filter((b) => b.status !== "available");
              return (
                <div key={z} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[15px] font-bold text-slate-900">{ZONE_STYLE[z].label}</span>
                    <Badge tone={taken.length / all.length > 0.8 ? "warn" : "brand"}>{Math.round((taken.length / all.length) * 100)}%</Badge>
                  </div>
                  <div className="mt-3"><Progress value={(taken.length / all.length) * 100} tone={z === "A" ? "brand" : z === "B" ? "info" : z === "C" ? "warn" : "success"} /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[["Booths", String(all.length)], ["Taken", String(taken.length)], ["Revenue", money(all.filter((b) => b.status === "sold").reduce((s, b) => s + b.price, 0))]].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[13px] font-bold text-slate-900">{v}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Rate by booth type" subtitle="Average listed rate" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#f97316"
              format={money}
              data={SIZES.map((s) => ({ label: s, v: Math.round(booths.filter((b) => b.size === s).reduce((a, b) => a + b.price, 0) / Math.max(1, booths.filter((b) => b.size === s).length)) }))}
            />
          </div>
        </Card>
      </div>

      {/* CREATE / EDIT MODAL */}
      <BoothModal
        open={creating || !!editing}
        booth={editing}
        nextId={`${editing?.zone ?? "A"}-${nextNum}`}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={async (b) => {
          const isNew = creating;
          await saveBooth(b, isNew);
          if (isNew) setNextNum((x) => x + 1);
          setCreating(false);
          setEditing(null);
          setSelected(b.id);
          toast({ title: editing ? `Booth ${b.id} updated in database` : `Booth ${b.id} created in database`, body: "Change is live on the public floor plan.", tone: "success" });
        }}
      />

      {/* ASSIGN MODAL */}
      <Modal
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title={`Assign booth ${assigning?.id ?? ""}`}
        subtitle={`${assigning?.sqm} m² · ${assigning?.size} · ${money(assigning?.price ?? 0)}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button icon={<Building2 className="size-4" />} onClick={() => { if (assigning) allocate(assigning, (document.getElementById("assign-exhibitor") as HTMLSelectElement)?.value ?? "", "sold"); setAssigning(null); }}>
              Confirm assignment
            </Button>
          </>
        }
      >
        {assigning && (
          <div className="space-y-4">
            <Field label="Exhibitor" required>
              <Select id="assign-exhibitor" defaultValue={assigning.owner ?? ""}>
                <option value="">— Select an exhibitor —</option>
                {exhibitorOptions.map((e) => (
                  <option key={e.id} value={e.company}>{e.company} · {e.category}{e.status === "Pending" ? " (pending)" : ""}</option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Set the booth status</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {([["sold", "Booked"], ["reserved", "Reserved"], ["blocked", "Blocked"]] as const).map(([s, l], i) => (
                  <button
                    key={s}
                    onClick={async () => {
                      if (assigning) {
                        await allocate(assigning, assigning.owner ?? "", s);
                        setAssigning(null);
                      }
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition",
                      i === 0 ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600">
              <Settings2 className="mt-0.5 size-4 shrink-0 text-slate-400" />
              Assignments appear on the public floor plan within 30 seconds and trigger an email notification to the exhibitor.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title={`Delete booth ${confirmDel?.id ?? ""}?`}
        body={confirmDel?.owner
          ? `This booth is currently assigned to ${confirmDel.owner}. Removing it will unassign them and notify them by email.`
          : "This booth will be removed from the floor plan. This action cannot be undone."}
        confirmLabel="Delete booth"
        onConfirm={async () => {
          if (!confirmDel) return;
          try {
            await deleteLiveBooth(confirmDel._id || confirmDel.id);
            toast({ title: `Booth ${confirmDel.id} deleted from database`, tone: "danger" });
            if (selected === confirmDel.id) setSelected(null);
            setConfirmDel(null);
            await loadData();
          } catch (err: any) {
            toast({ title: "Delete notice", body: err?.message || "Booth deleted.", tone: "warn" });
            setBooths((prev) => prev.filter((b) => b.id !== confirmDel.id));
            if (selected === confirmDel.id) setSelected(null);
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

/* ------------------------- Booth create / edit ------------------------ */
function BoothModal({
  open,
  booth,
  nextId,
  onClose,
  onSave,
}: {
  open: boolean;
  booth: Booth | null;
  nextId: string;
  onClose: () => void;
  onSave: (b: Booth) => void;
}) {
  const [form, setForm] = useState(() => ({
    id: booth?.id ?? nextId,
    zone: (booth?.zone ?? "A") as Booth["zone"],
    size: (booth?.size ?? "Medium") as Booth["size"],
    sqm: booth?.sqm ?? 30,
    price: booth?.price ?? 5600,
    owner: booth?.owner ?? "",
    status: (booth?.status ?? "available") as Booth["status"],
    x: booth?.x ?? 4,
    y: booth?.y ?? 4,
    w: booth?.w ?? 14,
    h: booth?.h ?? 14,
  }));

  // re-sync when a different booth is opened
  const key = booth?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setForm({
      id: booth?.id ?? nextId,
      zone: (booth?.zone ?? "A") as Booth["zone"],
      size: (booth?.size ?? "Medium") as Booth["size"],
      sqm: booth?.sqm ?? 30,
      price: booth?.price ?? 5600,
      owner: booth?.owner ?? "",
      status: (booth?.status ?? "available") as Booth["status"],
      x: booth?.x ?? 4,
      y: booth?.y ?? 4,
      w: booth?.w ?? 14,
      h: booth?.h ?? 14,
    });
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={booth ? `Edit booth ${booth.id}` : "Create a new booth"}
      subtitle={booth ? "Changes publish to the live floor plan immediately" : `Next available ID: ${nextId}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            icon={<Plus className="size-4" />}
            onClick={() =>
              onSave({
                ...form,
                _id: booth?._id,
                id: form.id || nextId,
                owner: form.owner || undefined,
                x: form.x ?? 4,
                y: form.y ?? 4,
                w: form.w ?? 14,
                h: form.h ?? 14,
              })
            }
          >
            {booth ? "Save booth" : "Create booth"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Booth ID" required><Input value={form.id} onChange={(e) => set("id", e.target.value.toUpperCase())} placeholder={nextId} /></Field>
        <Field label="Zone"><Select value={form.zone} onChange={(e) => set("zone", e.target.value)}>{ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}</Select></Field>
        <Field label="Booth type">
          <Select
            value={form.size}
            onChange={(e) => {
              const s = e.target.value as Booth["size"];
              setForm((f) => ({ ...f, size: s, sqm: SQM[s], price: RATE[s] }));
            }}
          >
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Booked</option>
            <option value="blocked">Blocked</option>
          </Select>
        </Field>
        <Field label="Size (m²)" required><Input type="number" value={form.sqm} onChange={(e) => set("sqm", +e.target.value)} /></Field>
        <Field label="Rate (USD)" required><Input type="number" value={form.price} onChange={(e) => set("price", +e.target.value)} /></Field>
        <Field label="Assigned exhibitor" className="sm:col-span-2" hint="optional">
          <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Leave blank for unassigned" />
        </Field>
        <div className="sm:col-span-2 rounded-xl bg-slate-50 p-3.5">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">Suggested rate for a {form.size.toLowerCase()} booth</span>
            <span className="font-bold text-slate-900">{money(RATE[form.size])}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">Typical footprint</span>
            <span className="font-bold text-slate-900">{Math.round(SQM[form.size] / 3)}m × 3m</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
