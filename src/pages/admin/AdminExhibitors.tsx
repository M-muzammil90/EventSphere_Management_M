import { useEffect, useMemo, useState } from "react";
import { type Exhibitor } from "@/lib/data";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Progress, Table, Tabs, Td, Th, Select } from "@/components/ui";
import { ExhibitorLogo, StatCard } from "@/components/shared";
import { BarChart } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { BadgeCheck, Building2, Check, Download, FileWarning, Mail, MapPin, Search, ShieldCheck, Star, Users, X, Copy, Send, CalendarClock } from "lucide-react";
import { fetchAdminExhibitors, reviewLiveApplication, updateLiveExhibitorStatus, fetchExpoBooths } from "@/lib/liveApi";

const STATUSES = ["All", "Pending", "Approved", "Rejected", "Waitlist"];

export default function AdminExhibitors() {
  const { toast } = useStore();
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [detail, setDetail] = useState<Exhibitor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    company: "",
    email: "",
    category: "Technology",
    expo: "Industrial Innovate Fair",
    boothTier: "Standard",
  });

  // Applications queue state
  const [viewMode, setViewMode] = useState<"applications" | "directory">("applications");
  const [reviewingApp, setReviewingApp] = useState<any | null>(null);
  const [availableBooths, setAvailableBooths] = useState<any[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loadingBooths, setLoadingBooths] = useState(false);

  const openAppReview = async (app: any) => {
    setReviewingApp(app);
    setRejectionReason(app.rejectionReason || "");
    setSelectedBoothId(app.booth?._id || app.booth?.id || app.booth || "");
    const expoId = app.expo?._id || app.expo?.id || app.expo;
    if (expoId) {
      setLoadingBooths(true);
      const booths = await fetchExpoBooths(expoId);
      const av = booths.filter((b: any) => b.status === "available" || b._id === app.booth?._id || b._id === app.booth);
      setAvailableBooths(av);
      if (av.length > 0 && !app.booth) {
        setSelectedBoothId(av[0]._id || av[0].id);
      }
      setLoadingBooths(false);
    }
  };

  const handleReviewApp = async (approve: boolean) => {
    if (!reviewingApp) return;
    setReviewLoading(true);
    try {
      if (approve) {
        await reviewLiveApplication(reviewingApp._id, {
          status: "approved",
          booth: selectedBoothId || undefined,
        });
        toast({
          title: "Application Approved in MongoDB ✓",
          body: `${reviewingApp.exhibitor?.company?.name || "Company"} has been approved and booth assigned.`,
          tone: "success",
        });
      } else {
        await reviewLiveApplication(reviewingApp._id, {
          status: "rejected",
          rejectionReason: rejectionReason.trim() || "Application does not meet current criteria",
        });
        toast({
          title: "Application Rejected",
          body: "Application status updated in MongoDB.",
          tone: "danger",
        });
      }
      setReviewingApp(null);
      await loadData();
    } catch (err: any) {
      toast({
        title: "Review action failed",
        body: err.message || "Could not update application",
        tone: "danger",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { exhibitors: exList, applications: appList } = await fetchAdminExhibitors();
    setExhibitors(exList);
    setApplications(appList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = useMemo(
    () => exhibitors.filter((e) => (!q || `${e.company} ${e.category} ${e.country} ${e.rep}`.toLowerCase().includes(q.toLowerCase())) && (status === "All" || e.status === status)),
    [exhibitors, q, status]
  );

  const act = async (e: Exhibitor, approve: boolean) => {
    setActionLoading(true);
    const nextStatus = approve ? "Approved" : "Rejected";
    try {
      // 1. Direct status update in MongoDB on ExhibitorProfile
      await updateLiveExhibitorStatus(e.id, approve ? "verified" : "rejected");

      // 2. Also review application in MongoDB if available
      const app = applications.find((a) => a.exhibitor?._id === e.id || a.exhibitor?.company?.name === e.company);
      if (app?._id) {
        await reviewLiveApplication(app._id, {
          status: approve ? "approved" : "rejected",
          rejectionReason: approve ? undefined : "Application does not meet current criteria",
        });
      }

      toast({
        title: `${e.company} ${approve ? "Approved in MongoDB" : "Rejected in MongoDB"}`,
        body: approve ? `Verification status set to Approved in database.` : "The applicant status was updated in database.",
        tone: approve ? "success" : "danger",
      });
      setDetail(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Action notice", body: err?.message || "Status updated locally.", tone: "warn" });
      setExhibitors((prev) =>
        prev.map((item) => (item.id === e.id ? { ...item, status: nextStatus as any } : item))
      );
      setDetail(null);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Company", "Category", "Country", "Representative", "Booth", "Status", "Traffic", "Revenue"];
    const rows = exhibitors.map((e) => [
      `"${e.company}"`,
      `"${e.category}"`,
      `"${e.country}"`,
      `"${e.rep}"`,
      `"${e.booth}"`,
      `"${e.status}"`,
      e.traffic || 0,
      e.revenue || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exhibitors-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exhibitor list exported", body: "Downloaded exhibitors CSV file.", tone: "success" });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/#/register?role=exhibitor`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: "Invite Link Copied!", body: link, tone: "success" });
  };

  const sendInvite = async () => {
    if (!inviteForm.company || !inviteForm.email) {
      toast({ title: "Missing details", body: "Please provide company name and email.", tone: "warn" });
      return;
    }
    const newEx: Exhibitor = {
      id: `EX-${Date.now().toString(36).toUpperCase()}`,
      company: inviteForm.company,
      logoText: inviteForm.company.slice(0, 2).toUpperCase(),
      logoBg: "from-blue-600 to-indigo-600",
      category: inviteForm.category as any,
      booth: "TBD",
      hall: "Hall 1",
      country: "Pakistan",
      rep: inviteForm.company + " Representative",
      avatar: "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
      status: "Pending",
      docs: "Complete",
      staff: 2,
      leadScore: 75,
      rating: 5.0,
      products: ["Software Services"],
      joined: new Date().toISOString().split("T")[0],
      traffic: 0,
      revenue: 0,
      description: "Invited exhibitor for " + inviteForm.expo,
      badgeTier: inviteForm.boothTier as any,
      email: inviteForm.email,
      leads: 0,
    };
    setExhibitors((prev) => [newEx, ...prev]);
    setInviteOpen(false);
    toast({
      title: "Invitation Sent & Added",
      body: `Invitation sent to ${inviteForm.email}. Company added to directory.`,
      tone: "success",
    });
    setInviteForm({ company: "", email: "", category: "Technology", expo: "Industrial Innovate Fair", boothTier: "Standard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Exhibitor management</h2>
          <p className="mt-1.5 text-[13.5px] text-slate-500">Review applications, validate documents, assign booths and manage exhibitors in MongoDB.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCSV}>Export CSV</Button>
          <Button icon={<Building2 className="size-4" />} onClick={() => setInviteOpen(true)}>Invite exhibitors</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending applications"
          value={String(applications.filter((a) => a.status === "pending" || a.status === "under_review").length)}
          icon={<FileWarning className="size-5" />}
          tone="warn"
          sub="Requires booth allocation"
        />
        <StatCard
          label="Approved applications"
          value={String(applications.filter((a) => a.status === "approved").length)}
          icon={<BadgeCheck className="size-5" />}
          tone="success"
          sub="Booths allocated"
        />
        <StatCard
          label="Total applications"
          value={String(applications.length)}
          icon={<CalendarClock className="size-5" />}
          tone="brand"
          sub="Across all MongoDB expos"
        />
        <StatCard
          label="Directory listings"
          value={String(exhibitors.length)}
          icon={<Building2 className="size-5" />}
          tone="info"
          sub="Verified exhibitor profiles"
        />
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setViewMode("applications")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition",
            viewMode === "applications"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <FileWarning className="size-4" />
          <span>Applications Queue</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            viewMode === "applications" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          )}>
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setViewMode("directory")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition",
            viewMode === "directory"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Building2 className="size-4" />
          <span>Exhibitor Directory</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            viewMode === "directory" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          )}>
            {exhibitors.length}
          </span>
        </button>
      </div>

      {viewMode === "applications" ? (
        <Card>
          <CardHeader
            title="Applications Queue"
            subtitle="Exhibitor applications submitted from MongoDB. Review and assign available booths."
            right={<Badge tone={applications.some((a) => a.status === "pending") ? "warn" : "brand"}>{applications.length} Total</Badge>}
          />
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarClock className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-[14px] font-bold text-slate-700">No applications received yet</p>
              <p className="mt-1 text-[12.5px] text-slate-500">When exhibitors apply for an expo, their requests will appear here for review and booth assignment.</p>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Applicant Company</Th>
                  <Th>Applied Expo</Th>
                  <Th>Tier & Zone</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th>Assigned Booth</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const company = app.exhibitor?.company?.name || "Company";
                  const expoTitle = app.expo?.title || "Expo";
                  const isApproved = app.status === "approved";
                  const isPending = app.status === "pending" || app.status === "under_review";
                  const isRejected = app.status === "rejected";
                  return (
                    <tr key={app._id} className="transition hover:bg-slate-50/60">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <ExhibitorLogo name={company} size={36} bg="from-brand-600 to-indigo-600" />
                          <div>
                            <p className="font-bold text-slate-900">{company}</p>
                            <p className="text-[11px] text-slate-500">{app.exhibitor?.contact?.email || app.exhibitor?.category || "Exhibitor"}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="font-semibold text-slate-900">{expoTitle}</p>
                        <p className="text-[11px] text-slate-500">{app.expo?.venue?.city || "Venue"}</p>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <Badge tone="purple">{app.tier || "Standard"}</Badge>
                          <span className="text-[11.5px] text-slate-500">Zone {app.requestedZone || "A"}</span>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-[12px] text-slate-500">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently"}
                      </Td>
                      <Td>
                        <Badge tone={isApproved ? "success" : isRejected ? "danger" : "warn"} dot={isPending || isApproved}>
                          {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending Review"}
                        </Badge>
                      </Td>
                      <Td>
                        {app.boothLabel || app.booth?.boothId ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11.5px] border border-emerald-200">
                            <MapPin className="size-3" /> Booth {app.boothLabel || app.booth?.boothId}
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-slate-400 italic">Unassigned</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="xs"
                          variant={isApproved ? "outline" : undefined}
                          onClick={() => openAppReview(app)}
                        >
                          {isApproved ? "Reassign Booth" : "Review & Assign Booth"}
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      ) : (

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-0 flex-1">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, category, country, rep…" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12" />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Tabs size="sm" active={status} onChange={setStatus} tabs={STATUSES.map((s) => ({ id: s, label: s === "All" ? "All" : s, count: s === "All" ? exhibitors.length : exhibitors.filter((e) => e.status === s).length }))} />
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13.5px] text-slate-400">Loading exhibitors from database…</div>
        ) : list.length === 0 ? (
          <EmptyState icon={<Building2 className="size-6" />} title="Nothing in this queue" body={`No ${status.toLowerCase()} exhibitors match your search.`} action={<Button variant="secondary" onClick={() => { setQ(""); setStatus("All"); }}>Show all</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Category</Th>
                <Th>Booth</Th>
                <Th>Documents</Th>
                <Th className="text-right">Lead score</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="cursor-pointer transition hover:bg-slate-50/60" onClick={() => setDetail(e)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ExhibitorLogo name={e.company} bg={e.logoBg} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{e.company}</p>
                        <p className="text-[11.5px] text-slate-500">{e.country}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-600">{e.category}</Td>
                  <Td>
                    <Badge tone="brand">{e.booth}</Badge>
                  </Td>
                  <Td>
                    <Badge tone="success" dot>Verified</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={e.leadScore || 85} className="w-16" height={5} tone="success" />
                      <span className="text-[11.5px] font-bold tabular-nums text-slate-700">{e.leadScore || 85}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={e.status === "Approved" ? "success" : e.status === "Pending" ? "warn" : e.status === "Rejected" ? "danger" : "info"} dot>{e.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                      <button onClick={() => act(e, true)} disabled={actionLoading} aria-label="Approve" className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"><Check className="size-4" /></button>
                      <button onClick={() => act(e, false)} disabled={actionLoading} aria-label="Reject" className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"><X className="size-4" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Exhibitors by category" subtitle="Database distribution" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#6854d9"
              format={(n) => String(n)}
              data={Array.from(new Set(exhibitors.map((e) => e.category))).map((c) => ({ label: c, v: exhibitors.filter((e) => e.category === c).length }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top booths by traffic" subtitle="Badge scans at booth level" />
          <div className="p-5">
            <BarChart
              horizontal
              color="#0ea5e9"
              format={fmt}
              data={[...exhibitors].sort((a, b) => (b.traffic || 0) - (a.traffic || 0)).slice(0, 6).map((e) => ({ label: `${e.booth} · ${e.company}`, v: e.traffic || 1000 }))}
            />
          </div>
        </Card>
      </div>

      {/* detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.company ?? ""} subtitle={`${detail?.id} · ${detail?.category}`} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
          <Button variant="danger" loading={actionLoading} icon={<X className="size-4" />} onClick={() => detail && act(detail, false)}>Reject</Button>
          <Button loading={actionLoading} icon={<Check className="size-4" />} onClick={() => detail && act(detail, true)}>Approve in MongoDB</Button>
        </>}>
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-4 rounded-2xl bg-slate-50 p-4">
              <ExhibitorLogo name={detail.company} bg={detail.logoBg} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[17px] font-bold text-slate-900">{detail.company}</h3>
                  <Badge tone={detail.badgeTier === "Platinum" ? "purple" : "warn"}>{detail.badgeTier || "Featured"} sponsor</Badge>
                </div>
                <p className="mt-1 text-[13px] text-slate-600">{detail.description || `${detail.company} is a leading provider of innovative solutions.`}</p>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {detail.hall || "Hall 4"}</span>
                  <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {detail.staff || 4} staff</span>
                  <span className="inline-flex items-center gap-1"><Star className="size-3.5" /> {detail.rating} rated</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Booth", detail.booth],
                ["Lead score", String(detail.leadScore || 85)],
                ["Traffic", fmt(detail.traffic || 1200)],
                ["Revenue", detail.revenue ? money(detail.revenue) : "—"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                  <p className="mt-0.5 font-display text-[16px] font-bold text-slate-900">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Allocated booth"><Input value={detail.booth} readOnly className="bg-slate-50" /></Field>
              <Field label="Sponsorship tier"><Input value={(detail as any).tier || detail.badgeTier || "Standard"} readOnly className="bg-slate-50" /></Field>
            </div>

            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Required compliance documents</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Certificate of incorporation", true],
                  ["Insurance certificate", true],
                  ["Product liability waiver", true],
                  ["Booth build risk assessment", true],
                ].map(([n, _ok]) => (
                  <div key={n as string} className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 border-emerald-200 bg-emerald-50/60")}>
                    <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                    <span className="text-[12.5px] font-medium text-emerald-900">{n as string}</span>
                    <span className="ml-auto text-[11px] font-bold text-emerald-600">Verified</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Primary contact</p>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                <Avatar name={detail.rep} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900">{detail.rep}</p>
                  <p className="text-[11.5px] text-slate-500">{(detail as any).email || `contact@${detail.company.toLowerCase().replace(/\s+/g, "")}.com`}</p>
                </div>
                <Button size="sm" variant="secondary" icon={<Mail className="size-4" />} onClick={() => toast({ title: `Email opened for ${(detail as any).email || detail.company}`, tone: "info" })}>Contact</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Invite Exhibitors Modal */}
      {inviteOpen && (
        <Modal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          title="Invite New Exhibitor"
          subtitle="Generate registration invites and add exhibitors directly to directory"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <Input
                placeholder="e.g. Apex Robotics Ltd"
                value={inviteForm.company}
                onChange={(e) => setInviteForm({ ...inviteForm, company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
              <Input
                placeholder="e.g. contact@apexrobotics.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Category</label>
                <select
                  value={inviteForm.category}
                  onChange={(e) => setInviteForm({ ...inviteForm, category: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700"
                >
                  {["Technology", "Healthcare", "Energy & CleanTech", "Industrial", "Fintech", "Consumer Goods"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sponsorship Tier</label>
                <select
                  value={inviteForm.boothTier}
                  onChange={(e) => setInviteForm({ ...inviteForm, boothTier: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700"
                >
                  {["Standard", "Featured", "Platinum", "Gold"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Share Link Box */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Exhibitor Onboarding URL:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/#/register?role=exhibitor`}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-mono"
                />
                <Button size="sm" variant="outline" icon={<Copy className="size-3.5" />} onClick={copyInviteLink}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">Exhibitors registering with this link will automatically appear in your review queue.</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                icon={<Send className="size-3.5" />}
                onClick={sendInvite}
                disabled={!inviteForm.company || !inviteForm.email}
              >
                Send Invite & Add to Directory
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Application Review & Booth Allocation Modal */}
      <Modal
        open={!!reviewingApp}
        onClose={() => setReviewingApp(null)}
        title={`Review Application — ${reviewingApp?.exhibitor?.company?.name || "Exhibitor"}`}
        subtitle={`Expo: ${reviewingApp?.expo?.title || "Expo"} · Submitted: ${reviewingApp?.submittedAt ? new Date(reviewingApp.submittedAt).toLocaleDateString() : "Recently"}`}
        size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setReviewingApp(null)} disabled={reviewLoading}>Cancel</Button>
          <Button variant="danger" loading={reviewLoading} icon={<X className="size-4" />} onClick={() => handleReviewApp(false)}>Reject Application</Button>
          <Button loading={reviewLoading} icon={<Check className="size-4" />} onClick={() => handleReviewApp(true)}>Approve & Assign Booth</Button>
        </>}
      >
        {reviewingApp && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-[16px] text-slate-900">{reviewingApp.exhibitor?.company?.name || "Company"}</h4>
                  <p className="text-[12px] text-slate-500">{reviewingApp.exhibitor?.contact?.email || "No contact email"}</p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="purple">{reviewingApp.tier || "Silver"} Tier</Badge>
                  <Badge tone={reviewingApp.status === "approved" ? "success" : reviewingApp.status === "rejected" ? "danger" : "warn"}>
                    {reviewingApp.status?.toUpperCase() || "PENDING"}
                  </Badge>
                </div>
              </div>
              {reviewingApp.showcaseSummary && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Showcase Plan</p>
                  <p className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">{reviewingApp.showcaseSummary}</p>
                </div>
              )}
            </div>

            {/* Booth Allocation Picker */}
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="size-4 text-brand-600" />
                <p className="text-[13px] font-bold text-slate-900">Floor Plan Booth Allocation</p>
              </div>
              <p className="text-[12px] text-slate-600 mb-3">
                Requested: Zone {reviewingApp.requestedZone || "A"} ({reviewingApp.requestedCategory || "Standard"}). Select an available booth for {reviewingApp.expo?.title}:
              </p>

              {loadingBooths ? (
                <p className="text-[12.5px] text-slate-500">Loading available booths...</p>
              ) : availableBooths.length === 0 ? (
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-800 text-[12.5px]">
                  No free booths found for this expo. Approving without a booth will keep the status approved.
                </div>
              ) : (
                <Field label="Assign Booth Space">
                  <Select
                    value={selectedBoothId}
                    onChange={(e: any) => setSelectedBoothId(e.target.value)}
                  >
                    {availableBooths.map((b: any) => (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        Booth {b.boothId} — Zone {b.zone} ({b.category || "Standard"}, {b.sqm}m²) — ${b.price || 2500}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            {/* Rejection reason (if rejecting) */}
            <Field label="Rejection Reason (only needed if rejecting)">
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Requested booth size is sold out or documents incomplete"
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
