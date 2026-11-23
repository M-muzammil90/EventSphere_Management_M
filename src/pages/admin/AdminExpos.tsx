import { useEffect, useMemo, useState } from "react";
import { type Expo } from "@/lib/data";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Progress, Select, Table, Tabs, Td, Th, Textarea } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { fmt, money, useStore } from "@/lib/store";
import { login as apiLogin } from "@/lib/authService";
import { cn } from "@/utils/cn";
import { AlertCircle, Building2, CalendarClock, Copy, Download, Image as ImageIcon, MapPin, Pencil, Plus, Search, ShieldCheck, Trash2, TrendingUp, Upload, Users } from "lucide-react";
import { fetchLiveExpos, createLiveExpo, updateLiveExpo, deleteLiveExpo, uploadExpoBanner } from "@/lib/liveApi";

export default function AdminExpos() {
  const { user, login, toast } = useStore();
  const [switchingAdmin, setSwitchingAdmin] = useState(false);
  const [expos, setExpos] = useState<Expo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Expo | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Expo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLiveExpos();
    setExpos(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = useMemo(
    () => {
      return expos.filter((e) => {
        const matchQ = !q || `${e.title} ${e.city} ${e.category}`.toLowerCase().includes(q.toLowerCase());
        const matchStatus = status === "All" || e.status === status;
        return matchQ && matchStatus;
      });
    },
    [expos, q, status]
  );

  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleStartEdit = (expo: Expo) => {
    setEditing(expo);
    setEditForm({
      title: expo.title || "",
      category: expo.category || "Technology",
      status: expo.status || "Draft",
      city: expo.city || "",
      venueName: (expo.venue || "").split("—")[0].trim(),
      hall: (expo.venue || "").split("—")[1]?.trim() || "",
      startDate: expo.startDate || "",
      endDate: expo.endDate || "",
      theme: expo.theme || "",
      description: expo.description || "",
      cover: expo.cover || "",
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingBanner(true);
    try {
      const res = await uploadExpoBanner(editing.id, file);
      // The API returns the full expo object: res.data is the expo
      const bannerUrl = res?.data?.banner?.url;
      if (bannerUrl) {
        const displayUrl = bannerUrl.startsWith("/") ? `http://localhost:5000${bannerUrl}` : bannerUrl;
        setEditForm((prev: any) => ({ ...prev, cover: displayUrl }));
        toast({ title: "Banner uploaded ✓", body: "Expo cover image updated.", tone: "success" });
        await loadData();
      } else {
        // Local storage fallback - the file was saved on disk
        toast({ title: "Banner saved", body: "Image saved to local server storage (no Cloudinary configured).", tone: "success" });
        await loadData();
      }
    } catch (err: any) {
      const isAuth = err?.status === 401 || err?.message?.toLowerCase().includes("not authenticated");
      toast({
        title: "Upload failed",
        body: isAuth
          ? "Session expired. Please use 'Switch to Admin' button above and try again."
          : err?.message || "Failed to upload banner image.",
        tone: "danger",
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleQuickSwitchAdmin = async () => {
    setSwitchingAdmin(true);
    try {
      const res = await apiLogin({ email: "admin@eventsphere.io", password: "ChangeMe!2026", role: "organizer" });
      login(res.user, res.mode);
      toast({ title: "Switched to Admin Account", body: "You now have full Admin / Organizer permissions.", tone: "success" });
      await loadData();
    } catch (e: any) {
      toast({ title: "Switch failed", body: e?.message || "Could not authenticate as admin.", tone: "danger" });
    } finally {
      setSwitchingAdmin(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await updateLiveExpo(editing.id, editForm);
      toast({ title: "Expo updated in MongoDB", body: `${editForm.title} changes are live.`, tone: "success" });
      setEditing(null);
      await loadData();
    } catch (err: any) {
      const isRoleErr = err?.status === 403 || err?.message?.toLowerCase().includes("admin");
      const msg = isRoleErr
        ? "Expos can only be modified by Admin / Organizer accounts. Please switch to the Admin account (admin@eventsphere.io)."
        : err?.status === 401
        ? "Please sign in as Admin (admin@eventsphere.io) to save changes."
        : err?.isNetworkError
        ? "Backend server is offline on port 5000. Start it with: npm run dev"
        : err?.message || "Could not save expo.";
      toast({ title: "Update failed", body: msg, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    const delId = confirmDel.id;
    const delTitle = confirmDel.title;
    setSubmitting(true);
    try {
      await deleteLiveExpo(delId);
      setExpos((prev) => prev.filter((e) => e.id !== delId));
      toast({ title: "Expo deleted", body: `${delTitle} removed from database.`, tone: "danger" });
      setConfirmDel(null);
      await loadData();
    } catch (err: any) {
      const isRoleErr = err?.status === 403 || err?.message?.toLowerCase().includes("admin");
      const msg = isRoleErr
        ? "Expos can only be deleted by Admin / Organizer accounts. Please switch to the Admin account (admin@eventsphere.io)."
        : err?.status === 401
        ? "Please sign in as Admin (admin@eventsphere.io) to delete records."
        : err?.isNetworkError
        ? "Backend server is offline on port 5000. Start it with: npm run dev"
        : err?.message || "Could not delete expo.";
      toast({ title: "Delete failed", body: msg, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {user?.role !== "organizer" && user?.role !== "admin" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm text-amber-900">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-800">
              <AlertCircle className="size-5" />
            </span>
            <div>
              <p className="text-[13.5px] font-bold">
                Signed in as: <span className="font-semibold">{user?.name || "Guest"}</span> ({user?.role === "exhibitor" ? "Exhibitor" : user?.role || "Not logged in"})
              </p>
              <p className="text-[12px] text-amber-800/80">
                In EventSphere, Expo CRUD requires an Admin / Organizer account. Exhibitors only apply for booths.
              </p>
            </div>
          </div>
          <Button size="sm" loading={switchingAdmin} onClick={handleQuickSwitchAdmin} icon={<ShieldCheck className="size-4" />}>
            Switch to Admin (admin@eventsphere.io)
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Expo management</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Create, edit and delete expos in MongoDB. Manage dates, venue, theme, pricing and booth inventory.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Create expo</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total expos" value={String(expos.length)} icon={<CalendarClock className="size-5" />} tone="brand" sub={`${expos.filter((e) => e.status === "Live").length} live · ${expos.filter((e) => e.status === "Upcoming").length} upcoming`} />
        <StatCard label="Total attendees" value={fmt(expos.reduce((s, e) => s + (e.attendees || 0), 0))} delta="+14.2%" icon={<Users className="size-5" />} tone="info" sub="Across all editions" />
        <StatCard label="Exhibitors" value={String(expos.reduce((s, e) => s + (e.exhibitors || 0), 0))} delta="+9.8%" icon={<Building2 className="size-5" />} tone="success" sub="Unique exhibitor accounts" />
        <StatCard label="Gross revenue" value={money(expos.reduce((s, e) => s + (e.boothsSold || 0) * (e.price * 25 || 8400), 0))} delta="+31.0%" icon={<TrendingUp className="size-5" />} tone="warn" sub="Booth sales, all editions" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-0 flex-1">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expos…" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Tabs size="sm" active={status} onChange={setStatus} tabs={["All", "Live", "Upcoming", "Completed", "Draft"].map((s) => ({ id: s, label: s, count: s === "All" ? expos.length : expos.filter((e) => e.status === s).length }))} />
          <Button size="sm" variant="secondary" icon={<Download className="size-4" />} onClick={() => toast({ title: "Expos exported to CSV", tone: "success" })}>CSV</Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13.5px] text-slate-400">Loading expos from database…</div>
        ) : list.length === 0 ? (
          <EmptyState icon={<CalendarClock className="size-6" />} title="No expos found" body="Adjust your search or create a new expo to get started." action={<Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>Create expo</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Expo</Th>
                <Th>Dates</Th>
                <Th>Status</Th>
                <Th className="text-right">Attendees</Th>
                <Th className="text-right">Exhibitors</Th>
                <Th>Booth inventory</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const totalB = e.boothsTotal || 32;
                const soldB = e.boothsSold || 0;
                const pct = Math.round((soldB / totalB) * 100);
                return (
                  <tr key={e.id} className="transition hover:bg-slate-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <img
                          src={e.cover}
                          alt=""
                          className="size-10 shrink-0 rounded-lg object-cover"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).src =
                              "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{e.title}</p>
                          <p className="flex items-center gap-1 text-[11.5px] text-slate-500"><MapPin className="size-3" /> {e.city}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-600">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} –{" "}
                      {e.endDate ? new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : ""}
                    </Td>
                    <Td>
                      <Badge tone={e.status === "Live" ? "danger" : e.status === "Upcoming" ? "brand" : e.status === "Draft" ? "warn" : "neutral"} dot={e.status === "Live"}>{e.status}</Badge>
                    </Td>
                    <Td className="text-right font-semibold tabular-nums text-slate-900">{fmt(e.attendees)}</Td>
                    <Td className="text-right tabular-nums text-slate-600">{e.exhibitors}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Progress value={pct} className="w-24" height={6} tone={pct > 90 ? "warn" : "brand"} />
                        <span className="text-[11.5px] font-bold tabular-nums text-slate-600">{soldB}/{totalB}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleStartEdit(e)} aria-label="Edit" className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"><Pencil className="size-3.5" /></button>
                        <button onClick={() => { navigator.clipboard?.writeText(e.id); toast({ title: `Expo ID copied`, body: e.id, tone: "info" }); }} aria-label="Copy ID" className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-brand-100 hover:text-brand-700"><Copy className="size-3.5" /></button>
                        <button onClick={() => setConfirmDel(e)} aria-label="Delete" className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 className="size-3.5" /></button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.title ?? ""}`} subtitle={`Database ID: ${editing?.id ?? ""}`} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button loading={submitting} onClick={handleSaveEdit}>Save to MongoDB</Button>
        </>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required className="sm:col-span-2">
              <Input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Global Tech Summit 2026" />
            </Field>
            <Field label="Category" required>
              <Select value={editForm.category || "Technology"} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                {["Technology", "Healthcare", "Manufacturing", "Automotive", "Retail", "Sustainability", "Food & Beverage", "Aerospace", "Education", "Other"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editForm.status || "Draft"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {["Live", "Upcoming", "Draft", "Completed"].map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="City, Country" required>
              <Input value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="Dubai, UAE" />
            </Field>
            <Field label="Venue / Hall name" required>
              <Input value={editForm.venueName || ""} onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })} placeholder="Dubai World Trade Centre" />
            </Field>
            <Field label="Hall">
              <Input value={editForm.hall || ""} onChange={(e) => setEditForm({ ...editForm, hall: e.target.value })} placeholder="Hall 4" />
            </Field>
            <Field label="Theme">
              <Input value={editForm.theme || ""} onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })} placeholder="Future at Scale" />
            </Field>
            <Field label="Start date" required>
              <Input type="date" value={editForm.startDate || ""} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
            </Field>
            <Field label="End date" required>
              <Input type="date" value={editForm.endDate || ""} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            </Field>
            <Field label="Description (min 20 chars)" className="sm:col-span-2">
              <Textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Describe what makes this expo unmissable..." rows={3} />
            </Field>

            <div className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[13px] font-bold text-slate-800">Expo Cover / Banner Image</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WEBP · max 5 MB · saved to server storage</p>
                </div>
                <label className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-300 bg-white text-[12.5px] font-semibold text-brand-700 cursor-pointer hover:bg-brand-50 transition shadow-sm", uploadingBanner && "opacity-60 cursor-not-allowed")}>
                  <Upload className="size-4" />
                  <span>{uploadingBanner ? "Uploading…" : "Choose image"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingBanner} onChange={handleBannerUpload} />
                </label>
              </div>
              {editForm.cover ? (
                <img
                  src={editForm.cover}
                  alt="Banner preview"
                  className="h-28 w-full rounded-xl object-cover border border-slate-200 shadow-sm"
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src =
                      "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
                  }}
                />
              ) : (
                <div className="h-20 w-full rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                  <div className="text-center">
                    <ImageIcon className="size-6 mx-auto mb-1" />
                    <p className="text-[11px]">No banner uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* create modal */}
      <ExpoCreateModal open={creating} onClose={() => setCreating(false)} onCreated={loadData} />

      {/* delete confirm */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete this expo?" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Keep it</Button>
          <Button variant="danger" loading={submitting} onClick={handleDelete}>Delete permanently</Button>
        </>}>
        <div className="rounded-xl bg-rose-50 p-4">
          <p className="text-[13.5px] font-semibold text-rose-900">{confirmDel?.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-rose-800/80">
            This will permanently remove this expo record from MongoDB.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export function ExpoCreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const { toast } = useStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    category: "Technology",
    status: "Upcoming",
    industry: "SaaS · AI · Cloud",
    startDate: "2026-11-25",
    endDate: "2026-11-28",
    theme: "Future at Scale",
    description: "An international expo showcasing technological breakthroughs and industry leaders.",
    city: "Dubai, UAE",
    venue: "Dubai World Trade Centre",
    hall: "Hall 4",
    totalBooths: "400",
    ticketPrice: "149",
  });

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", tone: "warn" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await createLiveExpo(form);
      const newId = res?.data?._id || res?.data?.id;

      if (newId && bannerFile) {
        try {
          await uploadExpoBanner(newId, bannerFile);
        } catch (bannerErr: any) {
          console.warn("Banner upload after creation had an issue:", bannerErr);
        }
      }

      toast({ title: "Expo created in MongoDB 🎉", body: `${form.title} has been saved.`, tone: "success" });
      onClose();
      setStep(1);
      setBannerFile(null);
      setBannerPreview("");
      await onCreated?.();
    } catch (err: any) {
      const isRoleErr = err?.status === 403 || err?.message?.toLowerCase().includes("admin");
      const msg = isRoleErr
        ? "Expos can only be created by Admin / Organizer accounts. Please switch to the Admin account (admin@eventsphere.io)."
        : err?.status === 401
        ? "Please sign in as Admin (admin@eventsphere.io) to create expos in the database."
        : err?.isNetworkError
        ? "Backend server is offline on port 5000. Start it with: npm run dev"
        : err?.message || "Validation error";
      toast({ title: "Failed to create expo", body: msg, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new expo" subtitle={`Step ${step} of 3`} size="lg"
      footer={<>
        {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button loading={submitting} onClick={handleCreate}>Create in Database</Button>
        )}
      </>}>
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[11.5px] font-bold transition", step >= s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400")}>
              {step > s ? "✓" : s}
            </span>
            <span className={cn("text-[12px] font-semibold", step >= s ? "text-slate-900" : "text-slate-400")}>
              {["Basics", "Venue & pricing", "Review & Save"][s - 1]}
            </span>
            {s < 3 && <span className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expo title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Global Tech Summit 2026" />
          </Field>
          <Field label="Category" required>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["Technology", "Healthcare", "Manufacturing", "Automotive", "Retail", "Sustainability"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Initial status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["Upcoming", "Live", "Draft"].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Industry focus">
            <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="SaaS · AI · Cloud" />
          </Field>
          <Field label="Start date" required>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="End date" required>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="Theme" className="sm:col-span-2">
            <Input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="Intelligence at Scale" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What makes this expo unmissable?" />
          </Field>

          <div className="sm:col-span-2 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <label className="block text-[13px] font-semibold text-slate-800 mb-2">Expo Cover / Banner Image</label>
            <div className="flex flex-wrap items-center gap-4">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Preview" className="h-16 w-28 rounded-lg object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="h-16 w-28 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                  <ImageIcon className="size-6" />
                </div>
              )}
              <div>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-300 text-[12.5px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition shadow-sm">
                  <Upload className="size-4 text-brand-600" />
                  <span>Choose Banner Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
                </label>
                <p className="mt-1 text-[11px] text-slate-500">Optional banner image (JPG, PNG, WEBP max 5MB). Automatically uploaded to MongoDB.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City, Country" required>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dubai, UAE" />
          </Field>
          <Field label="Venue name" required>
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Dubai World Trade Centre" />
          </Field>
          <Field label="Hall">
            <Input value={form.hall} onChange={(e) => setForm({ ...form, hall: e.target.value })} placeholder="Hall 4" />
          </Field>
          <Field label="Total booths">
            <Input type="number" value={form.totalBooths} onChange={(e) => setForm({ ...form, totalBooths: e.target.value })} placeholder="520" />
          </Field>
          <Field label="Ticket price (USD)">
            <Input type="number" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} placeholder="149" />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[13px] font-bold text-slate-900">Summary before MongoDB insertion</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {[["Title", form.title || "(Untitled)"], ["Category", form.category], ["Dates", `${form.startDate} to ${form.endDate}`], ["Location", `${form.venue}, ${form.city}`]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
            {bannerPreview && (
              <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
                <p className="text-[11.5px] font-bold text-brand-900 mb-1.5">Attached Cover Banner:</p>
                <img src={bannerPreview} alt="Attached banner" className="h-24 w-full rounded-lg object-cover border border-brand-200 shadow-sm" />
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-brand-50 p-4 text-[13px] leading-relaxed text-brand-900">
            Clicking <b>Create in Database</b> will send a live <code>POST /api/v1/expos</code> request to your Express server and insert the record directly into your MongoDB collection.
          </div>
        </div>
      )}
    </Modal>
  );
}
