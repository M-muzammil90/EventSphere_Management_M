import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminBoothPrices,
  upsertAdminBoothPrice,
  updateAdminBoothPrice,
  deleteAdminBoothPrice,
  fetchAdminTicketTypes,
  upsertAdminTicketType,
  updateAdminTicketType,
  deleteAdminTicketType,
  fetchAdminPricingSettings,
  updateAdminPricingSettings,
  fetchLiveExpos,
  type LiveBoothPricing,
  type LiveTicketPricing,
  type LivePricingSetting,
} from "@/lib/liveApi";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
  Toggle,
} from "@/components/ui";
import { StatCard } from "@/components/shared";
import { ConfirmDialog, Pagination } from "@/components/kit";
import { money, useStore } from "@/lib/store";
import {
  BadgeDollarSign,
  CheckCircle2,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Tag,
  Ticket,
  Trash2,
  Pencil,
  Power,
} from "lucide-react";

const PER_PAGE = 8;
const BOOTH_CATEGORIES = ["Small", "Medium", "Large", "Island"] as const;
const TICKET_NAMES = ["General", "Standard", "VIP", "Workshop"] as const;

export default function AdminPricing() {
  const { toast } = useStore();
  const [tab, setTab] = useState("booths");
  const [expos, setExpos] = useState<any[]>([]);
  const [boothPrices, setBoothPrices] = useState<LiveBoothPricing[]>([]);
  const [ticketTypes, setTicketTypes] = useState<LiveTicketPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [q, setQ] = useState("");
  const [expoFilter, setExpoFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Booth Modal
  const [boothModalOpen, setBoothModalOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<LiveBoothPricing | null>(null);
  const [boothForm, setBoothForm] = useState({
    expo: "",
    category: "Small" as (typeof BOOTH_CATEGORIES)[number],
    sqm: 12,
    basePrice: 2500,
    discountPercent: 0,
    currency: "USD",
    status: "active" as "active" | "draft" | "archived",
  });
  const [savingBooth, setSavingBooth] = useState(false);

  // Ticket Modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<LiveTicketPricing | null>(null);
  const [ticketForm, setTicketForm] = useState({
    expo: "",
    name: "Standard" as (typeof TICKET_NAMES)[number],
    price: 99,
    capacity: 500,
    perksText: "Full expo floor access\nKeynote sessions",
    description: "",
    status: "active" as "active" | "draft" | "sold_out" | "archived",
  });
  const [savingTicket, setSavingTicket] = useState(false);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "booth" | "ticket"; item: any } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expo Settings
  const [settingsExpoId, setSettingsExpoId] = useState("");
  const [settings, setSettings] = useState<LivePricingSetting | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expList, booths, tickets] = await Promise.all([
        fetchLiveExpos(),
        fetchAdminBoothPrices({ limit: 100 }),
        fetchAdminTicketTypes({ limit: 100 }),
      ]);
      setExpos(expList || []);
      setBoothPrices(booths || []);
      setTicketTypes(tickets || []);
      if (expList?.length && !settingsExpoId) {
        const firstId = (expList[0] as any)._id || expList[0].id;
        setSettingsExpoId(firstId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load pricing records from MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!settingsExpoId) return;
    setLoadingSettings(true);
    fetchAdminPricingSettings(settingsExpoId)
      .then((s) => setSettings(s))
      .catch((err) => toast({ title: "Settings load failed", body: err.message, tone: "danger" }))
      .finally(() => setLoadingSettings(false));
  }, [settingsExpoId]);

  const getExpoTitle = (expoRef: any) => {
    if (!expoRef) return "Unknown Expo";
    if (typeof expoRef === "object") return expoRef.title || "Expo";
    const match = expos.find((e) => (e._id || e.id) === expoRef);
    return match?.title || expoRef;
  };

  const getExpoId = (expoRef: any) => (typeof expoRef === "object" ? expoRef?._id : expoRef);

  const filteredBooths = useMemo(() => {
    return boothPrices.filter((b) => {
      const title = getExpoTitle(b.expo);
      const matchQ = !q || `${title} ${b.category} ${b.currency}`.toLowerCase().includes(q.toLowerCase());
      const matchExpo = expoFilter === "All" || getExpoId(b.expo) === expoFilter;
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      return matchQ && matchExpo && matchStatus;
    });
  }, [boothPrices, q, expoFilter, statusFilter, expos]);

  const filteredTickets = useMemo(() => {
    return ticketTypes.filter((t) => {
      const title = getExpoTitle(t.expo);
      const matchQ = !q || `${title} ${t.name} ${t.description || ""}`.toLowerCase().includes(q.toLowerCase());
      const matchExpo = expoFilter === "All" || getExpoId(t.expo) === expoFilter;
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      return matchQ && matchExpo && matchStatus;
    });
  }, [ticketTypes, q, expoFilter, statusFilter, expos]);

  const activeList = tab === "booths" ? filteredBooths : filteredTickets;
  const totalPages = Math.ceil(activeList.length / PER_PAGE) || 1;
  const pagedBooths = filteredBooths.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pagedTickets = filteredTickets.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNewBooth = () => {
    setEditingBooth(null);
    setBoothForm({
      expo: expos[0]?._id || expos[0]?.id || "",
      category: "Small",
      sqm: 12,
      basePrice: 2500,
      discountPercent: 0,
      currency: "USD",
      status: "active",
    });
    setBoothModalOpen(true);
  };

  const openEditBooth = (b: LiveBoothPricing) => {
    setEditingBooth(b);
    setBoothForm({
      expo: getExpoId(b.expo),
      category: b.category,
      sqm: b.sqm,
      basePrice: b.basePrice,
      discountPercent: b.discountPercent || 0,
      currency: b.currency || "USD",
      status: b.status,
    });
    setBoothModalOpen(true);
  };

  const handleSaveBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothForm.expo) {
      toast({ title: "Expo required", body: "Please select an expo.", tone: "danger" });
      return;
    }
    if (boothForm.sqm < 4 || boothForm.basePrice < 0 || boothForm.discountPercent < 0 || boothForm.discountPercent > 50) {
      toast({ title: "Validation error", body: "Sqm must be >= 4, Base price >= 0, Discount 0-50%.", tone: "danger" });
      return;
    }
    setSavingBooth(true);
    try {
      if (editingBooth) {
        await updateAdminBoothPrice(editingBooth._id, {
          sqm: Number(boothForm.sqm),
          basePrice: Number(boothForm.basePrice),
          discountPercent: Number(boothForm.discountPercent),
          currency: boothForm.currency,
          status: boothForm.status,
        });
        toast({ title: "Booth pricing updated", tone: "success" });
      } else {
        await upsertAdminBoothPrice({
          expo: boothForm.expo,
          category: boothForm.category,
          sqm: Number(boothForm.sqm),
          basePrice: Number(boothForm.basePrice),
          discountPercent: Number(boothForm.discountPercent),
          currency: boothForm.currency,
          status: boothForm.status,
        });
        toast({ title: "Booth pricing saved", tone: "success" });
      }
      setBoothModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: "Save failed", body: err.message, tone: "danger" });
    } finally {
      setSavingBooth(false);
    }
  };

  const openNewTicket = () => {
    setEditingTicket(null);
    setTicketForm({
      expo: expos[0]?._id || expos[0]?.id || "",
      name: "Standard",
      price: 99,
      capacity: 500,
      perksText: "Full expo floor access\nKeynote sessions",
      description: "",
      status: "active",
    });
    setTicketModalOpen(true);
  };

  const openEditTicket = (t: LiveTicketPricing) => {
    setEditingTicket(t);
    setTicketForm({
      expo: getExpoId(t.expo),
      name: t.name,
      price: t.price,
      capacity: t.capacity,
      perksText: (t.perks || []).join("\n"),
      description: t.description || "",
      status: t.status,
    });
    setTicketModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.expo) {
      toast({ title: "Expo required", body: "Please select an expo.", tone: "danger" });
      return;
    }
    if (ticketForm.price < 0 || ticketForm.capacity < 1) {
      toast({ title: "Validation error", body: "Price must be >= 0 and capacity >= 1.", tone: "danger" });
      return;
    }
    setSavingTicket(true);
    const perks = ticketForm.perksText.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      if (editingTicket) {
        await updateAdminTicketType(editingTicket._id, {
          price: Number(ticketForm.price),
          capacity: Number(ticketForm.capacity),
          perks,
          description: ticketForm.description,
          status: ticketForm.status,
        });
        toast({ title: "Ticket type updated", tone: "success" });
      } else {
        await upsertAdminTicketType({
          expo: ticketForm.expo,
          name: ticketForm.name,
          price: Number(ticketForm.price),
          capacity: Number(ticketForm.capacity),
          perks,
          description: ticketForm.description,
          status: ticketForm.status,
        });
        toast({ title: "Ticket type saved", tone: "success" });
      }
      setTicketModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: "Save failed", body: err.message, tone: "danger" });
    } finally {
      setSavingTicket(false);
    }
  };

  const toggleStatus = async (kind: "booth" | "ticket", item: any) => {
    const nextStatus = item.status === "active" ? "draft" : "active";
    try {
      if (kind === "booth") {
        await updateAdminBoothPrice(item._id, { status: nextStatus });
      } else {
        await updateAdminTicketType(item._id, { status: nextStatus });
      }
      toast({ title: `Status set to ${nextStatus}`, tone: "success" });
      await loadAll();
    } catch (err: any) {
      toast({ title: "Status update failed", body: err.message, tone: "danger" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "booth") {
        await deleteAdminBoothPrice(deleteTarget.item._id);
        toast({ title: "Booth pricing deleted", tone: "success" });
      } else {
        await deleteAdminTicketType(deleteTarget.item._id);
        toast({ title: "Ticket type removed/archived", tone: "success" });
      }
      setDeleteTarget(null);
      await loadAll();
    } catch (err: any) {
      toast({ title: "Delete failed", body: err.message, tone: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !settingsExpoId) return;
    if (settings.taxRate < 0 || settings.taxRate > 50) {
      toast({ title: "Invalid tax rate", body: "Tax rate must be between 0% and 50%.", tone: "danger" });
      return;
    }
    setSavingSettings(true);
    try {
      const updated = await updateAdminPricingSettings(settingsExpoId, {
        currency: settings.currency,
        taxRate: Number(settings.taxRate),
        taxLabel: settings.taxLabel,
        earlyBirdEnabled: settings.earlyBirdEnabled,
        earlyBirdPercent: Number(settings.earlyBirdPercent || 0),
        earlyBirdDeadline: settings.earlyBirdDeadline || undefined,
        multiBoothEnabled: settings.multiBoothEnabled,
        multiBoothPercent: Number(settings.multiBoothPercent || 0),
        multiBoothMinQty: Number(settings.multiBoothMinQty || 2),
        demoPaymentsEnabled: settings.demoPaymentsEnabled,
      });
      setSettings(updated);
      toast({ title: "Pricing settings saved ✓", body: "Tax & promotional rules updated in MongoDB.", tone: "success" });
    } catch (err: any) {
      toast({ title: "Failed to save settings", body: err.message, tone: "danger" });
    } finally {
      setSavingSettings(false);
    }
  };

  const activeBoothCount = boothPrices.filter((b) => b.status === "active").length;
  const activeTicketCount = ticketTypes.filter((t) => t.status === "active").length;
  const avgBoothPrice = boothPrices.length
    ? Math.round(boothPrices.reduce((s, b) => s + (b.effectivePrice || 0), 0) / boothPrices.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">
            Pricing &amp; Ticket Configuration
          </h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">
            Manage booth category rates, attendee ticket tiers, taxes and promotional discounts across expos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="ghost" size="sm" icon={<RefreshCw className={loading ? "animate-spin" : ""} />} onClick={loadAll}>
            Refresh
          </Button>
          {tab === "tickets" ? (
            <Button size="sm" icon={<Plus className="size-4" />} onClick={openNewTicket}>
              Add Ticket Type
            </Button>
          ) : (
            <Button size="sm" icon={<Plus className="size-4" />} onClick={openNewBooth}>
              Add Booth Tier
            </Button>
          )}
        </div>
      </div>

      {/* Overview StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Booth Tiers"
          value={String(activeBoothCount)}
          sub={`${boothPrices.length} total configured`}
          icon={<Tag className="size-5" />}
          tone="brand"
        />
        <StatCard
          label="Active Ticket Passes"
          value={String(activeTicketCount)}
          sub={`${ticketTypes.length} total tiers`}
          icon={<Ticket className="size-5" />}
          tone="info"
        />
        <StatCard
          label="Avg. Booth Rate"
          value={money(avgBoothPrice)}
          sub="Effective after discounts"
          icon={<BadgeDollarSign className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Tax & Promo Rules"
          value={settings ? `${settings.taxRate}% ${settings.taxLabel}` : "5% VAT"}
          sub={settings?.earlyBirdEnabled ? `Early bird ${settings.earlyBirdPercent}% ON` : "Standard pricing active"}
          icon={<Percent className="size-5" />}
          tone="warn"
        />
      </div>

      <Tabs
        active={tab}
        onChange={(v) => {
          setTab(v);
          setPage(1);
        }}
        tabs={[
          { id: "booths", label: "Booth Pricing", count: boothPrices.length, icon: <Tag className="size-3.5" /> },
          { id: "tickets", label: "Ticket Types", count: ticketTypes.length, icon: <Ticket className="size-3.5" /> },
          { id: "settings", label: "Tax & Promotions", icon: <Settings2 className="size-3.5" /> },
        ]}
      />

      {error && (
        <Card className="border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-800">
          {error}
        </Card>
      )}

      {tab !== "settings" ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[200px] flex-1">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search expo, tier, category..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Select
              value={expoFilter}
              onChange={(e) => {
                setExpoFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[180px] text-[12.5px]"
            >
              <option value="All">All Expos</option>
              {expos.map((ex) => (
                <option key={ex._id || ex.id} value={ex._id || ex.id}>
                  {ex.title}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[130px] text-[12.5px]"
            >
              <option value="All">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft / Inactive</option>
              <option value="archived">Archived</option>
            </Select>
            <Badge tone="neutral" className="ml-auto">
              {activeList.length} records
            </Badge>
          </div>

          {loading ? (
            <div className="p-10 text-center text-[13.5px] text-slate-400">
              Loading pricing configurations from MongoDB...
            </div>
          ) : activeList.length === 0 ? (
            <EmptyState
              icon={<Tag className="size-6" />}
              title={`No ${tab === "booths" ? "booth pricing" : "ticket types"} found`}
              body="Create a pricing tier or adjust your filters."
              action={
                <Button size="sm" onClick={tab === "booths" ? openNewBooth : openNewTicket}>
                  {tab === "booths" ? "Create Booth Tier" : "Create Ticket Type"}
                </Button>
              }
            />
          ) : tab === "booths" ? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Expo</Th>
                    <Th>Category</Th>
                    <Th>Size</Th>
                    <Th>Base Price</Th>
                    <Th>Discount</Th>
                    <Th>Effective Price</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {pagedBooths.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70">
                      <Td className="font-semibold text-slate-900">{getExpoTitle(b.expo)}</Td>
                      <Td>
                        <Badge tone={b.category === "Island" ? "purple" : b.category === "Large" ? "brand" : "neutral"}>
                          {b.category}
                        </Badge>
                      </Td>
                      <Td className="tabular-nums text-slate-600">{b.sqm} sqm</Td>
                      <Td className="font-mono text-slate-700">${b.basePrice.toLocaleString()}</Td>
                      <Td>{b.discountPercent ? <Badge tone="warn">{b.discountPercent}% OFF</Badge> : "—"}</Td>
                      <Td className="font-mono font-bold text-slate-900">
                        ${b.effectivePrice.toLocaleString()} {b.currency}
                      </Td>
                      <Td>
                        <Badge tone={b.status === "active" ? "success" : "neutral"} dot={b.status === "active"}>
                          {b.status === "active" ? "Active" : b.status === "draft" ? "Inactive" : b.status}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="xs" variant="ghost" icon={<Power className="size-3.5" />} onClick={() => toggleStatus("booth", b)}>
                            {b.status === "active" ? "Disable" : "Activate"}
                          </Button>
                          <Button size="xs" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => openEditBooth(b)}>
                            Edit
                          </Button>
                          <Button size="xs" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={() => setDeleteTarget({ kind: "booth", item: b })}>
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="border-t border-slate-100 p-4">
                  <Pagination page={page} pages={totalPages} onChange={setPage} />
                </div>
              )}
            </>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Expo</Th>
                    <Th>Pass Tier</Th>
                    <Th>Price</Th>
                    <Th>Capacity / Sold</Th>
                    <Th>Perks</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {pagedTickets.map((t) => {
                    const pct = t.capacity ? Math.min(100, Math.round((t.soldCount / t.capacity) * 100)) : 0;
                    return (
                      <tr key={t._id} className="hover:bg-slate-50/70">
                        <Td className="font-semibold text-slate-900">{getExpoTitle(t.expo)}</Td>
                        <Td>
                          <Badge tone={t.name === "VIP" ? "purple" : t.name === "Standard" ? "brand" : "neutral"}>
                            {t.name}
                          </Badge>
                        </Td>
                        <Td className="font-mono font-bold text-slate-900">
                          {t.price === 0 ? "Free" : `$${t.price.toLocaleString()} ${t.currency}`}
                        </Td>
                        <Td>
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>{t.soldCount} sold</span>
                              <span>{t.capacity} max</span>
                            </div>
                            <Progress value={pct} height={5} tone={pct > 85 ? "warn" : "brand"} />
                          </div>
                        </Td>
                        <Td className="max-w-[200px] truncate text-[12px] text-slate-500">
                          {(t.perks || []).join(", ") || "Standard entry"}
                        </Td>
                        <Td>
                          <Badge tone={t.status === "active" ? "success" : "neutral"} dot={t.status === "active"}>
                            {t.status === "active" ? "Active" : t.status === "draft" ? "Inactive" : t.status}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="xs" variant="ghost" icon={<Power className="size-3.5" />} onClick={() => toggleStatus("ticket", t)}>
                              {t.status === "active" ? "Disable" : "Activate"}
                            </Button>
                            <Button size="xs" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => openEditTicket(t)}>
                              Edit
                            </Button>
                            <Button size="xs" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={() => setDeleteTarget({ kind: "ticket", item: t })}>
                              Delete
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="border-t border-slate-100 p-4">
                  <Pagination page={page} pages={totalPages} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Expo Tax, Discount & Promotional Rules"
            subtitle="Configure tax rates, early-bird discounts and multi-booth promotions per expo"
            right={
              <Select
                value={settingsExpoId}
                onChange={(e) => setSettingsExpoId(e.target.value)}
                className="h-9.5 min-w-[220px] text-[12.5px]"
              >
                {expos.map((ex) => (
                  <option key={ex._id || ex.id} value={ex._id || ex.id}>
                    {ex.title}
                  </option>
                ))}
              </Select>
            }
          />
          {loadingSettings || !settings ? (
            <div className="p-10 text-center text-[13px] text-slate-400">
              Loading pricing settings for selected expo...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Currency">
                  <Select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PKR">PKR (₨)</option>
                  </Select>
                </Field>
                <Field label="Tax Rate (%)" hint="0% to 50%">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Tax Label">
                  <Input
                    value={settings.taxLabel}
                    onChange={(e) => setSettings({ ...settings, taxLabel: e.target.value })}
                    placeholder="VAT / GST / Tax"
                  />
                </Field>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-slate-900">Early-Bird Promotion</p>
                      <p className="text-[12px] text-slate-500">Automatic discount before deadline</p>
                    </div>
                    <Toggle
                      checked={settings.earlyBirdEnabled}
                      onChange={(v) => setSettings({ ...settings, earlyBirdEnabled: v })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Discount (%)">
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={settings.earlyBirdPercent}
                        onChange={(e) => setSettings({ ...settings, earlyBirdPercent: Number(e.target.value) })}
                        disabled={!settings.earlyBirdEnabled}
                      />
                    </Field>
                    <Field label="Deadline">
                      <Input
                        type="date"
                        value={settings.earlyBirdDeadline ? settings.earlyBirdDeadline.split("T")[0] : ""}
                        onChange={(e) => setSettings({ ...settings, earlyBirdDeadline: e.target.value })}
                        disabled={!settings.earlyBirdEnabled}
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-slate-900">Multi-Booth Discount</p>
                      <p className="text-[12px] text-slate-500">Bulk discount for exhibitors</p>
                    </div>
                    <Toggle
                      checked={settings.multiBoothEnabled}
                      onChange={(v) => setSettings({ ...settings, multiBoothEnabled: v })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Discount (%)">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={settings.multiBoothPercent}
                        onChange={(e) => setSettings({ ...settings, multiBoothPercent: Number(e.target.value) })}
                        disabled={!settings.multiBoothEnabled}
                      />
                    </Field>
                    <Field label="Min Booth Qty">
                      <Input
                        type="number"
                        min={2}
                        value={settings.multiBoothMinQty}
                        onChange={(e) => setSettings({ ...settings, multiBoothMinQty: Number(e.target.value) })}
                        disabled={!settings.multiBoothEnabled}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-[13.5px] font-bold text-slate-900">Demo / Sandbox Checkout</p>
                  <p className="text-[12px] text-slate-500">Allow simulated test payments when live merchant credentials are absent</p>
                </div>
                <Toggle
                  checked={settings.demoPaymentsEnabled}
                  onChange={(v) => setSettings({ ...settings, demoPaymentsEnabled: v })}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingSettings} icon={<CheckCircle2 className="size-4" />}>
                  {savingSettings ? "Saving..." : "Save Pricing Settings"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* BOOTH PRICING MODAL */}
      <Modal
        open={boothModalOpen}
        onClose={() => setBoothModalOpen(false)}
        title={editingBooth ? "Edit Booth Pricing" : "Create Booth Pricing Tier"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBoothModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBooth} disabled={savingBooth}>
              {savingBooth ? "Saving..." : "Save Booth Pricing"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBooth} className="space-y-4">
          <Field label="Expo" required>
            <Select
              value={boothForm.expo}
              disabled={!!editingBooth}
              onChange={(e) => setBoothForm({ ...boothForm, expo: e.target.value })}
            >
              {expos.map((ex) => (
                <option key={ex._id || ex.id} value={ex._id || ex.id}>
                  {ex.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Booth Category" required>
              <Select
                value={boothForm.category}
                disabled={!!editingBooth}
                onChange={(e) => setBoothForm({ ...boothForm, category: e.target.value as any })}
              >
                {BOOTH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Floor Area (sqm)" required>
              <Input
                type="number"
                min={4}
                max={400}
                value={boothForm.sqm}
                onChange={(e) => setBoothForm({ ...boothForm, sqm: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Base Price (USD)" required>
              <Input
                type="number"
                min={0}
                value={boothForm.basePrice}
                onChange={(e) => setBoothForm({ ...boothForm, basePrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="Discount (%)" hint="0 - 50%">
              <Input
                type="number"
                min={0}
                max={50}
                value={boothForm.discountPercent}
                onChange={(e) => setBoothForm({ ...boothForm, discountPercent: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={boothForm.status}
              onChange={(e) => setBoothForm({ ...boothForm, status: e.target.value as any })}
            >
              <option value="active">Active</option>
              <option value="draft">Inactive (Draft)</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <div className="rounded-xl bg-brand-50/70 p-3 text-[12.5px] text-brand-900">
            Effective Price Preview:{" "}
            <strong className="font-mono">
              ${Math.round(boothForm.basePrice * (1 - boothForm.discountPercent / 100) * 100) / 100} {boothForm.currency}
            </strong>
          </div>
        </form>
      </Modal>

      {/* TICKET TYPE MODAL */}
      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title={editingTicket ? "Edit Ticket Pass" : "Create Ticket Pass"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTicketModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTicket} disabled={savingTicket}>
              {savingTicket ? "Saving..." : "Save Ticket Type"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTicket} className="space-y-4">
          <Field label="Expo" required>
            <Select
              value={ticketForm.expo}
              disabled={!!editingTicket}
              onChange={(e) => setTicketForm({ ...ticketForm, expo: e.target.value })}
            >
              {expos.map((ex) => (
                <option key={ex._id || ex.id} value={ex._id || ex.id}>
                  {ex.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ticket Tier" required>
              <Select
                value={ticketForm.name}
                disabled={!!editingTicket}
                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value as any })}
              >
                {TICKET_NAMES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </Field>
            <Field label="Price (USD)" required>
              <Input
                type="number"
                min={0}
                value={ticketForm.price}
                onChange={(e) => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
              />
            </Field>
            <Field label="Capacity" required>
              <Input
                type="number"
                min={1}
                value={ticketForm.capacity}
                onChange={(e) => setTicketForm({ ...ticketForm, capacity: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={ticketForm.status}
              onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value as any })}
            >
              <option value="active">Active</option>
              <option value="draft">Inactive (Draft)</option>
              <option value="sold_out">Sold Out</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Perks (one per line)">
            <Textarea
              rows={3}
              value={ticketForm.perksText}
              onChange={(e) => setTicketForm({ ...ticketForm, perksText: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              placeholder="Optional summary shown to attendees"
            />
          </Field>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.kind === "booth" ? "Booth Pricing" : "Ticket Type"}?`}
        body="This action will remove or archive the pricing configuration in MongoDB."
        confirmLabel={deleting ? "Deleting..." : "Confirm Delete"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
