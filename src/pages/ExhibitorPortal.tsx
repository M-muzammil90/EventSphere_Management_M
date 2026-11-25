import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { EXHIBITORS, BOOTHS, type Expo, type Booth, type Session, type Exhibitor } from "@/lib/data";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Modal, Progress, Reveal, Select, Textarea, Toggle } from "@/components/ui";
import { FloorPlan, StatCard, ExhibitorLogo, SessionCard } from "@/components/shared";
import RealtimeChatView from "@/components/chat/RealtimeChatView";
import { PortalLayout, type PortalNavItem } from "@/components/PortalLayout";
import { AreaChart, BarChart, Gauge, Sparkline } from "@/components/charts";
import { fmt, money, useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import {
  fetchMyExhibitorProfile, updateMyExhibitorProfile, fetchLiveExpos, fetchMyApplications, applyForLiveExpo,
  fetchLiveBooths, fetchMyDocuments, uploadMyDocument, deleteMyDocument, uploadMyLogo,
  reserveLiveBooth, releaseLiveBooth,
  fetchLiveLeads, createLiveLead, updateLiveLead, deleteLiveLead, type LiveLead,
  addLiveStaff, removeLiveStaff,
  fetchMyAppointments, fetchLiveSessions, fetchLiveExhibitors, startLiveConversation, type LiveAppointment,
  createLiveOrder, fetchMyOrders, type LiveOrder,
} from "@/lib/liveApi";
import UserPaymentsView from "@/components/payments/UserPaymentsView";
import CheckoutModal from "@/components/payments/CheckoutModal";
import {
  Activity, Award, Banknote, Building2, CalendarClock, Check, Clock,
  Download, FileCheck2, FileText, LayoutDashboard, MapPin,
  MessageSquare, Plus, RefreshCw, Save, ScanLine, Settings, Sparkles, Star,
  Target, Trash2, TrendingUp, Upload, UserPlus, Users, X, QrCode, Printer, Eye, Search, ShieldCheck, ExternalLink,
} from "lucide-react";

const ME = EXHIBITORS[0];

export default function ExhibitorPortal() {
  const { toast } = useStore();
  const [tab, setTab] = useState("overview");
  const [booth, setBooth] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [notify, setNotify] = useState({ alloc: true, neighbour: true, leads: true, digest: false });

  // MongoDB Live Profile state
  const [profileId, setProfileId] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [companyName, setCompanyName] = useState(ME.company);
  const [repName, setRepName] = useState(ME.rep);
  const [contactEmail, setContactEmail] = useState("amara@nexoracloud.com");
  const [category, setCategory] = useState(ME.category);
  const [country, setCountry] = useState(ME.country);
  const [description, setDescription] = useState(ME.description);
  const [website, setWebsite] = useState("https://nexoracloud.com");
  const [businessPhone, setBusinessPhone] = useState("+1 (555) 234-5678");
  const [companyAddress, setCompanyAddress] = useState("500 Tech Blvd, Suite 400, San Francisco, CA");
  const [registrationNo, setRegistrationNo] = useState("US-DE-8821940");
  const [foundedYear, setFoundedYear] = useState<number | string>(2021);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profileTier, setProfileTier] = useState<string>("Platinum");
  const [profileRating, setProfileRating] = useState<number>(4.9);
  const [profileVerificationStatus, setProfileVerificationStatus] = useState<string>("verified");
  const [liveAppointments, setLiveAppointments] = useState<LiveAppointment[]>([]);
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [liveOtherExhibitors, setLiveOtherExhibitors] = useState<Exhibitor[]>([]);
  const [productsList, setProductsList] = useState<Array<{ name: string; description: string; price: string }>>([
    { name: "Cloud Infrastructure Core", description: "Multi-region hybrid cloud deployment framework.", price: "From $2,400 / mo" },
    { name: "Enterprise Observability", description: "Real-time telemetry and distributed tracing suite.", price: "From $1,200 / mo" },
  ]);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState({
    showBoothOnPlan: true,
    allowAttendeeChat: true,
    showEmailPublicly: false,
  });

  // Dynamic Leads state
  const [liveLeads, setLiveLeads] = useState<LiveLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    phone: "",
    interest: "Cloud Infrastructure Core",
    score: 85,
    status: "Warm" as "Hot" | "Warm" | "Cold" | "Nurture" | "Closed",
    notes: "",
  });

  // Dynamic Staff state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);
  const [badgeModalMember, setBadgeModalMember] = useState<any | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    role: "Booth Lead",
    permissions: "lead_scanner_full",
  });

  // MongoDB Live Expos & Applications state
  const [liveExpos, setLiveExpos] = useState<Expo[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [applyExpo, setApplyExpo] = useState<Expo | null>(null);
  const [applyForm, setApplyForm] = useState({
    tier: "Silver",
    requestedZone: "A",
    requestedCategory: "Medium",
    showcaseSummary: "",
    boothQty: 1,
  });
  const [applying, setApplying] = useState(false);

  // Dynamic Booth & Floor Plan state
  const [selectedExpoId, setSelectedExpoId] = useState<string>("");
  const [liveBooths, setLiveBooths] = useState<Booth[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const [reservingBooth, setReservingBooth] = useState(false);

  // Compliance Documents state
  const [myDocs, setMyDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTypeToUpload, setDocTypeToUpload] = useState("certificate_of_incorporation");

  // Orders & Checkout state
  const [ordersList, setOrdersList] = useState<LiveOrder[]>([]);
  const [checkoutOrder, setCheckoutOrder] = useState<LiveOrder | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const loadOrders = async () => {
    try {
      const ords = await fetchMyOrders();
      setOrdersList(ords || []);
    } catch (e) {
      console.warn("loadOrders error:", e);
    }
  };

  const handlePayBoothApplication = async (app: any) => {
    const expoId = app.expo?._id || app.expo?.id || app.expo;
    const boothId =
      typeof app.booth === "object"
        ? (app.booth?._id || app.booth?.id || app.booth?.boothId)
        : (app.booth || app.boothLabel);

    // Refresh orders list to get any active pending order
    let currentOrders = ordersList;
    try {
      const freshOrders = await fetchMyOrders();
      if (freshOrders && freshOrders.length > 0) {
        currentOrders = freshOrders;
        setOrdersList(freshOrders);
      }
    } catch {}

    // Check if an order already exists
    const existing = currentOrders.find(
      (o) =>
        (o.orderType === "BOOTH_BOOKING" || (o.orderType as string) === "booth_booking") &&
        String(o.expoId?._id || o.expoId) === String(expoId) &&
        o.paymentStatus !== "PAID"
    );

    if (existing) {
      setCheckoutOrder(existing);
      return;
    }

    setCreatingOrder(true);
    try {
      const created = await createLiveOrder({
        orderType: "booth_booking",
        expoId,
        boothId: boothId || undefined,
        billingDetails: {
          fullName: repName || companyName,
          companyName: companyName,
          email: contactEmail,
          phone: businessPhone,
          country: country,
        },
      });
      setOrdersList((prev) => [created, ...prev]);
      setCheckoutOrder(created);
      toast({
        title: "Booth Order Created ✓",
        body: `Order #${created.orderNumber} generated for checkout.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Could not start checkout",
        body: err.message || "Unable to create booth payment order.",
        tone: "danger",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePayReservedBooth = async (targetBoothId: string) => {
    if (!selectedExpoId) return;
    const target = liveBooths.find((b) => b.id === targetBoothId || (b as any)._id === targetBoothId);
    const dbBoothId = (target as any)?._id || targetBoothId;

    // Check existing pending order for this expo
    const existing = ordersList.find(
      (o) =>
        (o.orderType === "BOOTH_BOOKING" || (o.orderType as string) === "booth_booking") &&
        String(o.expoId?._id || o.expoId) === String(selectedExpoId) &&
        o.paymentStatus !== "PAID"
    );

    if (existing) {
      setCheckoutOrder(existing);
      return;
    }

    setCreatingOrder(true);
    try {
      const created = await createLiveOrder({
        orderType: "booth_booking",
        expoId: selectedExpoId,
        boothId: dbBoothId,
        billingDetails: {
          fullName: repName || companyName,
          companyName: companyName,
          email: contactEmail,
          phone: businessPhone,
          country: country,
        },
      });
      setOrdersList((prev) => [created, ...prev]);
      setCheckoutOrder(created);
      toast({
        title: "Booth Order Ready ✓",
        body: `Order #${created.orderNumber} ready for payment.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        body: err.message || "Failed to create booth order.",
        tone: "danger",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const loadExposAndApps = async () => {
    try {
      const [expos, apps] = await Promise.all([fetchLiveExpos(), fetchMyApplications()]);
      const valid = expos.filter((e) => e.status !== "Draft");
      const exposToUse = valid.length > 0 ? valid : expos;
      setLiveExpos(exposToUse);
      setMyApps(apps || []);
      if (exposToUse.length > 0) {
        setSelectedExpoId((prev) => {
          if (prev && exposToUse.some((e) => e.id === prev)) return prev;
          const approvedApp = (apps || []).find((a: any) => a.status === "approved");
          const approvedExpoId = approvedApp?.expo?._id || approvedApp?.expo?.id || approvedApp?.expo;
          if (approvedExpoId && exposToUse.some((e) => e.id === approvedExpoId)) return approvedExpoId;
          return exposToUse[0].id;
        });
      }
    } catch (e) {
      console.warn("loadExposAndApps error:", e);
    }
  };

  const handleReserveBooth = async (targetBoothId: string) => {
    setReservingBooth(true);
    try {
      const target = liveBooths.find((b) => b.id === targetBoothId || (b as any)._id === targetBoothId);
      const resId = (target as any)?._id || targetBoothId;
      await reserveLiveBooth(resId, `Reserved via Exhibitor Portal for ${companyName}`);
      toast({
        title: `Booth ${targetBoothId} Reserved! ✓`,
        body: "Your booth space has been reserved in MongoDB.",
        tone: "success",
      });
      if (selectedExpoId) {
        const fresh = await fetchLiveBooths(selectedExpoId);
        setLiveBooths(fresh || []);
      }
      setBooth(targetBoothId);
    } catch (err: any) {
      toast({
        title: "Reservation Failed",
        body: err?.response?.data?.message || err?.message || "Could not reserve booth. Please ensure your profile is verified and application is approved.",
        tone: "danger",
      });
    } finally {
      setReservingBooth(false);
    }
  };

  const handleReleaseBooth = async (targetBoothId: string) => {
    setReservingBooth(true);
    try {
      const target = liveBooths.find((b) => b.id === targetBoothId || (b as any)._id === targetBoothId);
      const resId = (target as any)?._id || targetBoothId;
      await releaseLiveBooth(resId);
      toast({
        title: `Booth ${targetBoothId} Released`,
        body: "The booth is now available again on the floor plan.",
        tone: "info",
      });
      if (selectedExpoId) {
        const fresh = await fetchLiveBooths(selectedExpoId);
        setLiveBooths(fresh || []);
      }
      setBooth(null);
    } catch (err: any) {
      toast({
        title: "Release Failed",
        body: err?.response?.data?.message || err?.message || "Could not release booth.",
        tone: "danger",
      });
    } finally {
      setReservingBooth(false);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const docs = await fetchMyDocuments();
      setMyDocs(docs || []);
    } catch (e) {
      console.warn("loadDocuments error:", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadExposAndApps();
    loadDocuments();
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedExpoId) {
      setLoadingBooths(true);
      fetchLiveBooths(selectedExpoId)
        .then((b) => setLiveBooths(b || []))
        .catch(() => setLiveBooths([]))
        .finally(() => setLoadingBooths(false));
    }
  }, [selectedExpoId]);

  const handleApply = async () => {
    if (!applyExpo) return;
    setApplying(true);
    try {
      await applyForLiveExpo(applyExpo.id, applyForm);
      toast({
        title: "Application submitted! 🎉",
        body: `Your application for ${applyExpo.title} was submitted to the organizer for approval.`,
        tone: "success",
      });
      setApplyExpo(null);
      await loadExposAndApps();
    } catch (err: any) {
      toast({
        title: "Application failed",
        body: err.message || "Could not submit application",
        tone: "danger",
      });
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetchMyExhibitorProfile()
      .then((data) => {
        if (data?.profile) {
          const p = data.profile;
          if (p.company?.name) setCompanyName(p.company.name);
          if (p.company?.description) setDescription(p.company.description);
          if (p.company?.website) setWebsite(p.company.website);
          if (p.company?.registrationNo) setRegistrationNo(p.company.registrationNo);
          if (p.company?.foundedYear) setFoundedYear(p.company.foundedYear);
          if (p.logo?.url) setLogoUrl(p.logo.url);
          if (p.category) setCategory(p.category);
          if (p.contact?.primaryName) setRepName(p.contact.primaryName);
          if (p.contact?.email) setContactEmail(p.contact.email);
          if (p.contact?.phone) setBusinessPhone(p.contact.phone);
          if (p.contact?.country) setCountry(p.contact.country);
          if (Array.isArray(p.products) && p.products.length > 0) {
            setProductsList(p.products.map((x: any) => ({
              name: x.name || "Product",
              description: x.description || "",
              price: x.price || "",
            })));
          }
          if (p.tier) setProfileTier(p.tier);
          if (p.rating) setProfileRating(p.rating);
          if (p.verificationStatus) setProfileVerificationStatus(p.verificationStatus);
          if (p._id) setProfileId(p._id);
          if (Array.isArray(p.staff) && p.staff.length > 0) {
            setStaffList(p.staff);
          } else {
            setStaffList([
              { _id: "st-1", name: p.contact?.primaryName || "Amara Osei", email: p.contact?.email || "amara@nexoracloud.com", role: "Booth Lead", permissions: "lead_scanner_full", badgeIssued: true },
              { _id: "st-2", name: "Daniel Cho", email: "daniel@nexoracloud.com", role: "Sales Engineer", permissions: "lead_scanner_only", badgeIssued: true },
              { _id: "st-3", name: "Lucia Ferrer", email: "lucia@nexoracloud.com", role: "Demo Specialist", permissions: "demo_only", badgeIssued: true },
            ]);
          }
          if (p.visibility) {
            setVisibilitySettings({
              showBoothOnPlan: p.visibility.showBoothOnPlan ?? true,
              allowAttendeeChat: p.visibility.allowAttendeeChat ?? true,
              showEmailPublicly: p.visibility.showEmailPublicly ?? false,
            });
          }
        }
        if (data?.documents && Array.isArray(data.documents)) {
          setMyDocs(data.documents);
        }
      })
      .catch(() => {});

    // Load dynamic leads & overview live data
    loadLeads();
    fetchMyAppointments().then(setLiveAppointments).catch(() => {});
    fetchLiveSessions().then(setLiveSessions).catch(() => {});
    fetchLiveExhibitors().then((res) => setLiveOtherExhibitors(res.exhibitors || [])).catch(() => {});
  }, []);

  // Dynamic Overview Calculations
  const activeApp = useMemo(
    () => myApps.find((a) => a.status === "approved" || a.status === "Approved"),
    [myApps]
  );
  const assignedBooth = useMemo(() => {
    if (!activeApp) return "A-12";
    if (activeApp.boothLabel) return String(activeApp.boothLabel);
    if (activeApp.booth) {
      if (typeof activeApp.booth === "string") return activeApp.booth;
      if (typeof activeApp.booth === "object") {
        return activeApp.booth.boothId || activeApp.booth.name || activeApp.booth.id || "A-12";
      }
    }
    if (activeApp.allocatedBooth) {
      if (typeof activeApp.allocatedBooth === "string") return activeApp.allocatedBooth;
      if (typeof activeApp.allocatedBooth === "object") {
        return activeApp.allocatedBooth.boothId || activeApp.allocatedBooth.name || "A-12";
      }
    }
    const found = liveBooths.find((b) => (b as any).assignedTo === profileId);
    if (found) return (found as any).boothId || found.id || "A-12";
    return "A-12";
  }, [activeApp, liveBooths, profileId]);

  const assignedHall = useMemo(() => {
    if (!activeApp) return "Hall 4";
    if (activeApp.booth && typeof activeApp.booth === "object" && (activeApp.booth as any).hall) {
      return (activeApp.booth as any).hall;
    }
    if (activeApp.allocatedBooth && typeof activeApp.allocatedBooth === "object" && (activeApp.allocatedBooth as any).hall) {
      return (activeApp.allocatedBooth as any).hall;
    }
    if (typeof activeApp.hall === "string") return activeApp.hall;
    return "Hall 4";
  }, [activeApp]);

  const totalInteractions = useMemo(() => {
    if (liveLeads.length > 0) {
      return liveLeads.length * 14 + liveAppointments.length * 6 + 18;
    }
    return 84;
  }, [liveLeads, liveAppointments]);

  const qualifiedLeads = useMemo(
    () => liveLeads.filter((l) => l.status === "Hot" || l.status === "Warm"),
    [liveLeads]
  );

  const qualificationRate = useMemo(() => {
    if (liveLeads.length === 0) return 62;
    return Math.round((qualifiedLeads.length / liveLeads.length) * 100);
  }, [liveLeads, qualifiedLeads]);

  const confirmedMeetings = useMemo(
    () => liveAppointments.filter((a) => a.status === "confirmed"),
    [liveAppointments]
  );

  const estimatedPipeline = useMemo(() => {
    if (liveLeads.length > 0) {
      return liveLeads.reduce((acc, l) => {
        if (l.status === "Closed") return acc + 25000;
        if (l.status === "Hot") return acc + 18500;
        if (l.status === "Warm") return acc + 9000;
        return acc + 3500;
      }, 0);
    }
    return 74000;
  }, [liveLeads]);

  const leadDistribution = useMemo(() => {
    const total = liveLeads.length || 1;
    const hot = liveLeads.filter((l) => l.status === "Hot").length;
    const warm = liveLeads.filter((l) => l.status === "Warm").length;
    if (liveLeads.length === 0) {
      return [
        { label: "Hot", pct: 38 },
        { label: "Warm", pct: 44 },
        { label: "Nurture", pct: 18 },
      ];
    }
    const hPct = Math.round((hot / total) * 100);
    const wPct = Math.round((warm / total) * 100);
    const nPct = Math.max(0, 100 - hPct - wPct);
    return [
      { label: "Hot", pct: hPct },
      { label: "Warm", pct: wPct },
      { label: "Nurture", pct: nPct },
    ];
  }, [liveLeads]);

  const avgLeadScore = useMemo(() => {
    if (liveLeads.length === 0) return 88;
    return Math.round(liveLeads.reduce((sum, l) => sum + (l.score || 75), 0) / liveLeads.length);
  }, [liveLeads]);

  const trafficTrendData = useMemo(() => {
    const base = totalInteractions;
    return [
      { label: "Day 1", a: Math.round(base * 0.18), b: Math.round(base * 0.14) },
      { label: "Day 2", a: Math.round(base * 0.35), b: Math.round(base * 0.25) },
      { label: "Day 3", a: Math.round(base * 0.65), b: Math.round(base * 0.45) },
      { label: "Day 4", a: Math.round(base * 0.85), b: Math.round(base * 0.68) },
      { label: "Day 5", a: base, b: Math.round(base * 0.78) },
    ];
  }, [totalInteractions]);

  const speakingSessions = useMemo(() => {
    const cName = companyName.toLowerCase();
    const rName = repName.toLowerCase();
    const matches = liveSessions.filter(
      (s) =>
        (s.company && s.company.toLowerCase().includes(cName)) ||
        (s.speaker && (s.speaker.toLowerCase().includes(rName) || s.speaker.toLowerCase().includes("elena") || s.speaker.toLowerCase().includes("marcus")))
    );
    if (matches.length > 0) return matches.slice(0, 3);
    return liveSessions.slice(0, 3);
  }, [liveSessions, companyName, repName]);

  const neighbouringExhibitors = useMemo(() => {
    return liveOtherExhibitors
      .filter((e) => e.company.toLowerCase() !== companyName.toLowerCase() && e.id !== profileId)
      .slice(0, 4);
  }, [liveOtherExhibitors, companyName, profileId]);

  const handleChatNeighbour = async (ex: Exhibitor) => {
    try {
      await startLiveConversation({
        recipientId: ex.id,
        subject: `Collaboration with ${companyName}`,
        initialMessage: `Hi ${ex.company}, reaching out from booth ${assignedBooth} (${companyName}) for potential collaboration during the expo.`,
        conversationType: "EXHIBITOR_COLLABORATION",
      });
      toast({
        title: `Conversation opened with ${ex.company} ✓`,
        body: "You can continue chatting in the Messages tab.",
        tone: "success",
      });
      setTab("messages");
    } catch {
      toast({
        title: `Thread opened with ${ex.company}`,
        body: "Redirecting to messages...",
        tone: "info",
      });
      setTab("messages");
    }
  };

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const data = await fetchLiveLeads();
      setLiveLeads(data || []);
    } catch (e) {
      console.warn("loadLeads error:", e);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLeadForm.name || !newLeadForm.email) {
      toast({ title: "Validation error", body: "Lead name and email are required.", tone: "warn" });
      return;
    }
    setSavingLead(true);
    try {
      const created = await createLiveLead(newLeadForm);
      setLiveLeads((prev) => [created, ...prev]);
      setLeadModalOpen(false);
      setNewLeadForm({
        name: "",
        email: "",
        company: "",
        jobTitle: "",
        phone: "",
        interest: "Cloud Infrastructure Core",
        score: 85,
        status: "Warm",
        notes: "",
      });
      toast({
        title: "Lead Captured Successfully! 🎯",
        body: `${created.name} (${created.company}) saved to MongoDB leads registry.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({ title: "Failed to capture lead", body: err.message || "Could not save lead.", tone: "danger" });
    } finally {
      setSavingLead(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: LiveLead["status"]) => {
    try {
      await updateLiveLead(leadId, { status: newStatus });
      setLiveLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l)));
      toast({ title: "Lead Status Updated", body: `Moved to ${newStatus}.`, tone: "info" });
    } catch (err: any) {
      toast({ title: "Update failed", body: err.message || "Could not update lead status.", tone: "danger" });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLiveLead(leadId);
      setLiveLeads((prev) => prev.filter((l) => l._id !== leadId));
      toast({ title: "Lead Removed", body: "Lead removed from your registry.", tone: "info" });
    } catch (err: any) {
      toast({ title: "Delete failed", body: err.message || "Could not remove lead.", tone: "danger" });
    }
  };

  const handleExportLeadsCSV = () => {
    if (liveLeads.length === 0) {
      toast({ title: "No leads to export", body: "Capture leads first before exporting.", tone: "warn" });
      return;
    }
    const headers = ["Name", "Email", "Company", "Job Title", "Phone", "Product Interest", "Score", "Status", "Notes", "Scanned At"];
    const rows = liveLeads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${(l.company || "").replace(/"/g, '""')}"`,
      `"${(l.jobTitle || "").replace(/"/g, '""')}"`,
      `"${(l.phone || "").replace(/"/g, '""')}"`,
      `"${(l.interest || "").replace(/"/g, '""')}"`,
      l.score || 70,
      `"${l.status}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${new Date(l.scannedAt).toLocaleString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventsphere-leads-${companyName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Leads CSV Exported ✓", body: `${liveLeads.length} leads exported to CSV file.`, tone: "success" });
  };

  const handleAddStaffMember = async () => {
    if (!staffForm.name || !staffForm.email) {
      toast({ title: "Validation error", body: "Staff name and email are required.", tone: "warn" });
      return;
    }
    setSavingStaff(true);
    try {
      const res = await addLiveStaff(staffForm);
      if (res?.staff) {
        setStaffList(res.staff);
      } else {
        setStaffList((prev) => [
          ...prev,
          {
            _id: `st-${Date.now()}`,
            name: staffForm.name,
            email: staffForm.email,
            role: staffForm.role,
            permissions: staffForm.permissions,
            badgeIssued: true,
          },
        ]);
      }
      setStaffOpen(false);
      setStaffForm({ name: "", email: "", role: "Booth Lead", permissions: "lead_scanner_full" });
      toast({
        title: "Staff Member Added! 🎟️",
        body: `${staffForm.name} registered. Official Exhibitor Badge issued.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({ title: "Failed to add staff", body: err.message || "Could not add staff member.", tone: "danger" });
    } finally {
      setSavingStaff(false);
    }
  };

  const handleRemoveStaffMember = async (staffId: string) => {
    try {
      await removeLiveStaff(staffId);
      setStaffList((prev) => prev.filter((s) => (s._id || s.id) !== staffId));
      toast({ title: "Staff Member Removed", body: "Badge de-allocated.", tone: "info" });
    } catch (err: any) {
      // If mock ID or local fallback, remove from local state
      setStaffList((prev) => prev.filter((s) => (s._id || s.id) !== staffId));
      toast({ title: "Staff Member Removed", body: "Badge de-allocated.", tone: "info" });
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateMyExhibitorProfile({
        company: {
          name: companyName,
          description,
          website,
          registrationNo,
          foundedYear: Number(foundedYear) || undefined,
        },
        category: category as any,
        contact: {
          primaryName: repName,
          email: contactEmail,
          phone: businessPhone,
          country,
        },
        visibility: visibilitySettings,
        logo: logoUrl ? { url: logoUrl } : undefined,
      });
      setEditProfile(false);
      toast({
        title: "Company Profile saved to MongoDB ✓",
        body: "All company details, logo, products, and contact information updated.",
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
        body: err.message || "Could not save profile to server.",
        tone: "danger",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadMyLogo(file);
      const url = res?.data?.logo?.url;
      if (url) {
        const fullUrl = url.startsWith("/") ? `http://localhost:5000${url}` : url;
        setLogoUrl(fullUrl);
        toast({ title: "Logo Uploaded ✓", body: "Company logo updated in MongoDB.", tone: "success" });
      } else {
        toast({ title: "Logo saved", body: "Logo uploaded to local server.", tone: "success" });
      }
    } catch (err: any) {
      toast({ title: "Logo upload failed", body: err.message, tone: "danger" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      await uploadMyDocument(file, docTypeToUpload);
      toast({
        title: "Document Uploaded ✓",
        body: `${file.name} submitted for compliance verification.`,
        tone: "success",
      });
      await loadDocuments();
    } catch (err: any) {
      toast({ title: "Document upload failed", body: err.message, tone: "danger" });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteMyDocument(id);
      toast({ title: "Document removed", tone: "info" });
      await loadDocuments();
    } catch (err: any) {
      toast({ title: "Delete failed", body: err.message, tone: "danger" });
    }
  };

  const PRESET_LOGOS = [
    { name: "Cloud Tech", url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=200&h=200&q=80" },
    { name: "AI Brain", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80" },
    { name: "Cyber Shield", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&h=200&q=80" },
    { name: "MedTech Pulse", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&h=200&q=80" },
    { name: "Eco Green", url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&h=200&q=80" },
  ];

  const handleAddProduct = () => {
    if (!newProdName.trim()) {
      toast({ title: "Product name required", tone: "warn" });
      return;
    }
    setProductsList((prev) => [
      ...prev,
      {
        name: newProdName.trim(),
        description: newProdDesc.trim(),
        price: newProdPrice.trim() || "Contact for pricing",
      },
    ]);
    setNewProdName("");
    setNewProdDesc("");
    setNewProdPrice("");
    setShowAddProduct(false);
    toast({ title: "Product added to draft", body: "Click 'Save Company Profile' to persist to MongoDB.", tone: "info" });
  };

  const handleRemoveProduct = (index: number) => {
    setProductsList((prev) => prev.filter((_, i) => i !== index));
    toast({ title: "Product removed", body: "Click 'Save Company Profile' to persist changes.", tone: "info" });
  };

  const NAV_ITEMS: PortalNavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Manage" },
    { id: "profile", label: "Company Profile", icon: Building2, group: "Manage" },
    { id: "expos", label: "Expos & Applications", icon: CalendarClock, badge: myApps.length || undefined, group: "Manage" },
    { id: "booth", label: "Booth & Floor Plan", icon: MapPin, group: "Manage" },
    { id: "leads", label: "Leads", icon: Target, badge: liveLeads.length || undefined, group: "Manage" },
    { id: "staff", label: "Staff & badges", icon: Users, badge: staffList.length || ME.staff, group: "Manage" },
    { id: "messages", label: "Messages & Support", icon: MessageSquare, group: "Communication" },
    { id: "payments", label: "Payments & Invoices", icon: Banknote, group: "Billing" },
    { id: "docs", label: "Documents", icon: FileCheck2, badge: myDocs.length || undefined, group: "Compliance" },
    { id: "settings", label: "Settings", icon: Settings, group: "Compliance" },
  ];

  return (
    <PortalLayout
      roleLabel="Exhibitor portal"
      roleShort="Exhibitor"
      nav={NAV_ITEMS}
      active={tab}
      onNavigate={setTab}
      searchPlaceholder="Search leads, booths, documents…"
      headerRight={
        <Button
          size="sm"
          icon={<ScanLine className="size-4" />}
          onClick={() => setLeadModalOpen(true)}
          className="hidden sm:inline-flex"
        >
          Capture Lead
        </Button>
      }
      banner={
        <section className="relative overflow-hidden bg-ink-950">
          <div className="absolute inset-0 grid-noise-dark opacity-50" />
          <div className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-brand-600/30 blur-[120px]" />
          <div className="pointer-events-none absolute -right-24 bottom-0 size-[380px] rounded-full bg-aqua-500/15 blur-[110px]" />
          <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-5 lg:gap-7">
              {/* Company avatar — left-anchored */}
              <div className="shrink-0">
                <ExhibitorLogo name={companyName} bg={ME.logoBg} size={68} />
              </div>

              {/* Company info — expands to fill left column */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-white sm:text-[25px]">
                    {companyName}
                  </h1>
                  <Badge tone="purple" className="bg-white/10 text-purple-200 ring-white/15">
                    {profileTier} exhibitor
                  </Badge>
                  <Badge tone="success" className="bg-white/10 text-emerald-200 ring-white/15" dot>
                    {profileVerificationStatus === "verified" ? "Approved" : profileVerificationStatus}
                  </Badge>
                </div>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-300/80 line-clamp-2">
                  {description || "World-class expo exhibitor showcasing cutting-edge technology solutions and cloud infrastructure."}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-brand-400" />
                    Booth {assignedBooth} · {assignedHall}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5 text-cyan-400" />
                    {staffList.length} staff badges
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-3.5 text-amber-400" />
                    {profileRating} exhibitor rating
                  </span>
                </div>
              </div>

              {/* CTA buttons — right side */}
              <div className="flex shrink-0 flex-wrap gap-2.5">
                <Button
                  variant="outline"
                  icon={<Building2 className="size-4" />}
                  onClick={() => setTab("profile")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Edit Profile
                </Button>
                <Link to={profileId ? `/exhibitors/${profileId}` : "/exhibitors"} target="_blank">
                  <Button
                    variant="outline"
                    icon={<Eye className="size-4" />}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Public Profile
                  </Button>
                </Link>
                <Button
                  icon={<ScanLine className="size-4" />}
                  onClick={() => setLeadModalOpen(true)}
                >
                  Capture Lead
                </Button>
              </div>
            </div>
          </div>
        </section>
      }
    >
      <div className="space-y-6">

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Badge scans"
                value={fmt(totalInteractions)}
                delta="+11.2%"
                icon={<ScanLine className="size-5" />}
                tone="brand"
                sub="Live booth interactions & scans"
                spark={<Sparkline values={[Math.round(totalInteractions * 0.2), Math.round(totalInteractions * 0.4), Math.round(totalInteractions * 0.6), Math.round(totalInteractions * 0.8), totalInteractions]} color="#6366f1" width={140} height={32} />}
              />
              <StatCard
                label="Qualified leads"
                value={fmt(qualifiedLeads.length)}
                delta={`${qualificationRate}%`}
                icon={<Target className="size-5" />}
                tone="success"
                sub={`${qualificationRate}% qualification rate`}
                spark={<Sparkline values={[Math.round(qualifiedLeads.length * 0.25), Math.round(qualifiedLeads.length * 0.5), Math.round(qualifiedLeads.length * 0.75), qualifiedLeads.length]} color="#10b981" width={140} height={32} />}
              />
              <StatCard
                label="Meetings booked"
                value={String(liveAppointments.length)}
                delta={confirmedMeetings.length > 0 ? `+${confirmedMeetings.length} confirmed` : undefined}
                icon={<CalendarClock className="size-5" />}
                tone="info"
                sub={`${confirmedMeetings.length} confirmed · ${liveAppointments.filter((a) => a.status === 'pending').length} pending`}
                spark={<Sparkline values={[0, Math.min(1, liveAppointments.length), Math.min(2, liveAppointments.length), liveAppointments.length]} color="#06b6d4" width={140} height={32} />}
              />
              <StatCard
                label="Pipeline value"
                value={money(estimatedPipeline)}
                delta="+22.1%"
                icon={<TrendingUp className="size-5" />}
                tone="warn"
                sub={`${liveLeads.filter((l) => l.status === 'Hot').length} hot prospect deals`}
                spark={<Sparkline values={[Math.round(estimatedPipeline * 0.2), Math.round(estimatedPipeline * 0.4), Math.round(estimatedPipeline * 0.7), estimatedPipeline]} color="#f97316" width={140} height={32} />}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader
                  title="Booth traffic trend"
                  subtitle={`Daily interactions at booth ${assignedBooth}`}
                  right={<Badge tone="brand">MongoDB Live</Badge>}
                />
                <div className="p-5">
                  <AreaChart
                    data={trafficTrendData}
                    format={fmt}
                    height={250}
                    labels={["This edition", "Target pace"]}
                  />
                </div>
              </Card>
              <Card>
                <CardHeader title="Lead quality" subtitle="Scored by real-time enriched metrics" />
                <div className="flex flex-col items-center p-5">
                  <Gauge value={avgLeadScore} label="Lead score" sub={`Based on ${liveLeads.length} live leads`} size={168} />
                  <div className="mt-4 w-full space-y-2">
                    {leadDistribution.map((d) => (
                      <div key={d.label} className="flex items-center gap-2.5">
                        <span className="w-16 text-[12px] font-semibold text-slate-600">{d.label}</span>
                        <Progress value={d.pct} className="flex-1" height={6} tone={d.label === "Hot" ? "danger" : d.label === "Warm" ? "warn" : "brand"} />
                        <span className="w-8 text-right text-[12px] font-bold text-slate-900">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Sessions & Programme"
                  subtitle="Key sessions & presentations at this expo"
                  right={
                    <Link to="/schedule">
                      <Button size="xs" variant="ghost">Full schedule</Button>
                    </Link>
                  }
                />
                <div className="space-y-3 p-5">
                  {speakingSessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-[13px]">
                      No sessions currently scheduled.
                    </div>
                  ) : (
                    speakingSessions.map((s) => <SessionCard key={s.id} s={s} compact />)
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader
                  title="Neighbouring exhibitors"
                  subtitle="Exhibitors at this expo — collaborate & network"
                  right={<Badge tone="info">Live Directory</Badge>}
                />
                <div className="divide-y divide-slate-100">
                  {neighbouringExhibitors.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-[13px]">
                      No other exhibitors registered yet.
                    </div>
                  ) : (
                    neighbouringExhibitors.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                        <ExhibitorLogo name={e.company} bg={e.logoBg} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-slate-900">{e.company}</p>
                          <p className="text-[11px] text-slate-500">
                            Booth {typeof e.booth === "object" ? (e.booth as any)?.boothId || (e.booth as any)?.name || "TBD" : e.booth} · {e.category}
                          </p>
                        </div>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<MessageSquare className="size-3.5" />}
                          onClick={() => handleChatNeighbour(e)}
                        >
                          Chat
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Reveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    i: Upload,
                    t: "Compliance Documents",
                    d: `${myDocs.length} documents uploaded & verified`,
                    tone: "from-brand-500 to-violet-600",
                    action: () => setTab("documents"),
                  },
                  {
                    i: UserPlus,
                    t: "Staff & Badges",
                    d: `${staffList.length} staff passes issued`,
                    tone: "from-cyan-500 to-blue-600",
                    action: () => setTab("staff"),
                  },
                  {
                    i: Award,
                    t: "Booth & Floor Plan",
                    d: `Booth ${assignedBooth} · ${assignedHall}`,
                    tone: "from-amber-400 to-flame-500",
                    action: () => setTab("booth"),
                  },
                  {
                    i: Download,
                    t: "Export Leads CSV",
                    d: `${liveLeads.length} leads ready for download`,
                    tone: "from-emerald-500 to-teal-600",
                    action: handleExportLeadsCSV,
                  },
                ].map((a) => (
                  <button key={a.t} onClick={a.action} className="text-left">
                    <Card hover className="group flex h-full items-center gap-4 p-4">
                      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105", a.tone)}>
                        <a.i className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-slate-900">{a.t}</p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{a.d}</p>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-md">
                    <Building2 className="size-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-display text-[22px] font-bold text-slate-900">Company Profile</h2>
                      <Badge tone="success" dot>MongoDB Live</Badge>
                      <Badge tone="brand">Step 2: Profile Management</Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-slate-500">
                      Manage your official exhibitor identity, branding, representative details, and products shown across EventSphere expos.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  icon={<Save className="size-4" />}
                  className="shadow-sm"
                >
                  {profileSaving ? "Saving to MongoDB..." : "Save Company Profile"}
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: Brand & Logo Preview */}
              <div className="space-y-6 lg:col-span-1">
                <Card>
                  <CardHeader title="Company Branding" subtitle="Logo and visual identity" />
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                      {logoUrl ? (
                        <div className="relative group">
                          <img
                            src={logoUrl}
                            alt={companyName}
                            className="size-24 rounded-2xl object-cover ring-2 ring-brand-500/40 shadow-lg"
                            onError={() => setLogoUrl("")}
                          />
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
                            title="Remove logo"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <ExhibitorLogo name={companyName} bg={ME.logoBg} size={84} />
                      )}
                      <p className="mt-4 font-display text-[16px] font-bold text-slate-900">{companyName || "Your Company"}</p>
                      <p className="text-[12px] text-slate-500">{category}</p>
                      <Badge tone="purple" className="mt-2.5">
                        {ME.badgeTier} Exhibitor Tier
                      </Badge>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-bold text-slate-700 shadow-sm hover:border-brand-500 hover:text-brand-600 transition">
                          <Upload className="size-3.5" />
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>

                    {/* Logo Image URL field */}
                    <Field label="Or paste Logo Image URL">
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://.../logo.png"
                      />
                    </Field>

                    {/* Preset Logo Selection */}
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sample High-Res Logos</p>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_LOGOS.map((pl) => (
                          <button
                            key={pl.name}
                            type="button"
                            onClick={() => setLogoUrl(pl.url)}
                            className={cn(
                              "overflow-hidden rounded-xl border p-1 transition hover:scale-105",
                              logoUrl === pl.url ? "border-brand-600 ring-2 ring-brand-500/30" : "border-slate-200"
                            )}
                            title={pl.name}
                          >
                            <img src={pl.url} alt={pl.name} className="size-10 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2 text-[12px] text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Headquarters</span>
                        <span className="font-semibold text-slate-800">{country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Verification</span>
                        <span className="font-semibold text-emerald-600">Verified Exhibitor</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Exhibitor ID</span>
                        <span className="font-mono text-[11px] text-slate-500">{ME.id}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Privacy & Public Visibility */}
                <Card>
                  <CardHeader title="Public Visibility" subtitle="Attendee privacy controls" />
                  <div className="divide-y divide-slate-100 p-2">
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">Show on Floor Plan</p>
                        <p className="text-[11.5px] text-slate-500">Show assigned booth on interactive map</p>
                      </div>
                      <Toggle
                        checked={visibilitySettings.showBoothOnPlan}
                        onChange={(v) => setVisibilitySettings({ ...visibilitySettings, showBoothOnPlan: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">Attendee Direct Chat</p>
                        <p className="text-[11.5px] text-slate-500">Allow verified attendees to message you</p>
                      </div>
                      <Toggle
                        checked={visibilitySettings.allowAttendeeChat}
                        onChange={(v) => setVisibilitySettings({ ...visibilitySettings, allowAttendeeChat: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">Public Business Email</p>
                        <p className="text-[11.5px] text-slate-500">Display email in public directory</p>
                      </div>
                      <Toggle
                        checked={visibilitySettings.showEmailPublicly}
                        onChange={(v) => setVisibilitySettings({ ...visibilitySettings, showEmailPublicly: v })}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Company Info & Products */}
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader title="Company Information" subtitle="Official registration and business details" />
                  <div className="p-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Company Name" required className="sm:col-span-2">
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Technologies Inc."
                      />
                    </Field>

                    <Field label="Industry / Category" required>
                      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {[
                          "Cloud Infrastructure",
                          "Industrial Automation",
                          "Medical Devices",
                          "Renewables",
                          "Data & AI",
                          "Cybersecurity",
                          "Logistics",
                          "Fintech & Payments",
                          "Materials",
                          "Consumer Electronics",
                          "Other",
                        ].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Country / Region" required>
                      <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                        {["United States", "Germany", "Switzerland", "Singapore", "United Kingdom", "United Arab Emirates", "Pakistan", "India", "Netherlands"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Official Website">
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                      />
                    </Field>

                    <Field label="Company Registration / Tax ID">
                      <Input
                        value={registrationNo}
                        onChange={(e) => setRegistrationNo(e.target.value)}
                        placeholder="e.g. US-DE-104928"
                      />
                    </Field>

                    <Field label="Founded Year">
                      <Input
                        type="number"
                        value={String(foundedYear)}
                        onChange={(e) => setFoundedYear(e.target.value)}
                        placeholder="e.g. 2020"
                      />
                    </Field>

                    <Field label="Official Address" className="sm:col-span-2">
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Suite, Street Address, City, State/Province"
                      />
                    </Field>

                    <Field label="Company Description (About Us)" className="sm:col-span-2" required>
                      <Textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Comprehensive description of your company, mission, capabilities and what attendees will experience at your booth..."
                      />
                    </Field>
                  </div>
                </Card>

                {/* Primary Representative */}
                <Card>
                  <CardHeader title="Primary Representative & Contacts" subtitle="Designated point of contact for expos" />
                  <div className="p-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Representative Full Name" required>
                      <Input
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="e.g. Amara Osei"
                      />
                    </Field>

                    <Field label="Business Email" required>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="rep@company.com"
                      />
                    </Field>

                    <Field label="Business Phone">
                      <Input
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </Field>

                    <div className="flex items-end">
                      <div className="w-full rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-[12px] text-brand-900 leading-snug">
                        Organizers will contact this representative regarding booth approvals, build deadlines, and passes.
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Products & Services Showcase */}
                <Card>
                  <CardHeader
                    title="Products & Services Showcase"
                    subtitle="Offerings displayed to attendees in the expo directory"
                    right={
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus className="size-4" />}
                        onClick={() => setShowAddProduct(!showAddProduct)}
                      >
                        Add Product / Service
                      </Button>
                    }
                  />

                  {showAddProduct && (
                    <div className="border-b border-slate-100 bg-slate-50/80 p-5 space-y-3">
                      <h4 className="text-[13px] font-bold text-slate-800">Add New Product or Solution</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Product Name" required>
                          <Input
                            value={newProdName}
                            onChange={(e) => setNewProdName(e.target.value)}
                            placeholder="e.g. Cloud API Gateway"
                          />
                        </Field>
                        <Field label="Price / Tier Label">
                          <Input
                            value={newProdPrice}
                            onChange={(e) => setNewProdPrice(e.target.value)}
                            placeholder="e.g. From $999 / mo or Contact Sales"
                          />
                        </Field>
                        <Field label="Description" className="sm:col-span-2">
                          <Input
                            value={newProdDesc}
                            onChange={(e) => setNewProdDesc(e.target.value)}
                            placeholder="Key features, enterprise use cases or benefits..."
                          />
                        </Field>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAddProduct}>Add to Showcase</Button>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100">
                    {productsList.map((prod, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold text-slate-900">{prod.name}</p>
                            {prod.price && <Badge tone="brand" className="text-[11px]">{prod.price}</Badge>}
                          </div>
                          {prod.description && (
                            <p className="mt-1 text-[12.5px] text-slate-500">{prod.description}</p>
                          )}
                        </div>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<Trash2 className="size-3.5 text-rose-500" />}
                          onClick={() => handleRemoveProduct(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {productsList.length === 0 && (
                      <div className="p-8 text-center text-[13px] text-slate-400">
                        No products added yet. Click &quot;Add Product / Service&quot; above to list your solutions.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Final Action Bar */}
                <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    icon={<Save className="size-4" />}
                    size="lg"
                  >
                    {profileSaving ? "Saving to MongoDB..." : "Save Company Profile"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "expos" && (
          <div className="space-y-8">
            {/* Header banner */}
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-indigo-50/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-[18px] font-bold text-slate-900">
                    Apply for Upcoming Expos & Trade Shows
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-600">
                    Select any published event to submit your company profile and booth request to the organizer for approval.
                  </p>
                </div>
                <Badge tone="brand" className="text-[12px] px-3 py-1">
                  {liveExpos.length} Expos Accepting Applications
                </Badge>
              </div>
            </div>

            {/* My Submitted Applications */}
            <Card>
              <CardHeader
                title="My Submitted Applications"
                subtitle="Live status of your expo applications in MongoDB"
                right={<Badge tone={myApps.some((a) => a.status === "approved") ? "success" : "brand"}>{myApps.length} Submitted</Badge>}
              />
              {myApps.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarClock className="mx-auto size-9 text-slate-300" />
                  <p className="mt-2 text-[14px] font-bold text-slate-700">No applications submitted yet</p>
                  <p className="mt-1 text-[12.5px] text-slate-500">
                    Browse the available expos below and apply to secure your booth space!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {["Expo", "Dates", "Tier / Zone", "Submitted", "Review Status", "Assigned Booth", "Payment / Billing"].map((h) => (
                          <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myApps.map((a: any) => {
                        const expoTitle = a.expo?.title || "Expo";
                        const isApproved = a.status === "approved";
                        const isPending = a.status === "pending" || a.status === "under_review";
                        const isRejected = a.status === "rejected";
                        return (
                          <tr key={a._id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{expoTitle}</p>
                              <p className="text-[11.5px] text-slate-500">{a.expo?.venue?.city || a.expo?.venue?.name || "Venue"}</p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-[12.5px] text-slate-600">
                              {a.expo?.startDate ? new Date(a.expo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"} –{" "}
                              {a.expo?.endDate ? new Date(a.expo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <Badge tone="purple">{a.tier || "Standard"}</Badge>
                                <span className="text-[12px] text-slate-500">Zone {a.requestedZone || "A"}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-[12px] text-slate-500">
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                tone={isApproved ? "success" : isRejected ? "danger" : isPending ? "warn" : "info"}
                                dot={isApproved || isPending}
                              >
                                {isApproved ? "Approved ✓" : isRejected ? "Rejected" : "Pending Review"}
                              </Badge>
                              {a.rejectionReason && (
                                <p className="mt-1 text-[11px] text-rose-600 max-w-xs">{a.rejectionReason}</p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {a.boothLabel || a.booth?.boothId ? (
                                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[12px]">
                                  <MapPin className="size-3.5" /> Booth {a.boothLabel || a.booth?.boothId}
                                </span>
                              ) : (
                                <span className="text-[12px] text-slate-400 italic">
                                  {isApproved ? "Awaiting booth allocation" : "Assigned upon approval"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {(() => {
                                const expoId = a.expo?._id || a.expo?.id || a.expo;
                                const matchingOrder = ordersList.find(
                                  (o) =>
                                    (o.orderType === "BOOTH_BOOKING" || (o.orderType as string) === "booth_booking") &&
                                    String(o.expoId?._id || o.expoId) === String(expoId)
                                );
                                const isPaid = matchingOrder?.paymentStatus === "PAID";

                                if (isPaid) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Badge tone="success" dot>Paid & Confirmed</Badge>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        icon={<Download className="size-3" />}
                                        onClick={() => setTab("payments")}
                                      >
                                        Invoice
                                      </Button>
                                    </div>
                                  );
                                }

                                if (isApproved) {
                                  return (
                                    <Button
                                      size="xs"
                                      icon={<Banknote className="size-3.5" />}
                                      disabled={creatingOrder}
                                      onClick={() => handlePayBoothApplication(a)}
                                    >
                                      {creatingOrder ? "Starting..." : "Pay Booth Fee"}
                                    </Button>
                                  );
                                }

                                return (
                                  <span className="text-[12px] text-slate-400 italic">
                                    {isPending ? "Unlocks upon approval" : "—"}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Published Expos List */}
            <div>
              <div className="mb-4">
                <h3 className="font-display text-[18px] font-bold text-slate-900">Available Expos from Organizers</h3>
                <p className="text-[13px] text-slate-500">Explore published expos created by EventSphere admins and apply today.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {liveExpos.map((e) => {
                  const existingApp = myApps.find((a: any) => (a.expo?._id || a.expo?.id || a.expo) === e.id);
                  const isApproved = existingApp?.status === "approved";
                  const isPending = existingApp?.status === "pending" || existingApp?.status === "under_review";
                  return (
                    <Card key={e.id} className="overflow-hidden flex flex-col">
                      <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                        <img
                          src={e.cover}
                          alt={e.title}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          onError={(ev) => {
                            (ev.target as HTMLImageElement).src =
                              "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
                          }}
                        />
                        <div className="absolute top-3 left-3">
                          <Badge tone={e.status === "Live" ? "danger" : "brand"}>{e.status}</Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-white">
                            {e.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-display text-[16px] font-bold text-slate-900 leading-snug">{e.title}</h4>
                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500">
                            <MapPin className="size-3.5 text-brand-500 shrink-0" />
                            {e.venue || e.city}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                            <CalendarClock className="size-3.5 text-slate-400 shrink-0" />
                            {e.startDate ? new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} –{" "}
                            {e.endDate ? new Date(e.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </p>
                          <p className="mt-2 text-[12.5px] text-slate-600 line-clamp-2">{e.description}</p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          {existingApp ? (
                            <div className="flex items-center gap-2">
                              <Badge tone={isApproved ? "success" : isPending ? "warn" : "danger"}>
                                {isApproved ? `Approved: ${existingApp.boothLabel || "Booth Confirmed"}` : isPending ? "Application Pending" : "Application Rejected"}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-[12px] text-slate-400">Applications open</span>
                          )}

                          <Button
                            size="sm"
                            variant={existingApp ? "outline" : undefined}
                            onClick={() => {
                              setApplyExpo(e);
                              setApplyForm((prev) => ({
                                ...prev,
                                showcaseSummary: `Our company ${companyName} intends to showcase enterprise solutions and engage with key attendees at ${e.title}.`,
                              }));
                            }}
                          >
                            {existingApp ? (existingApp.status === "rejected" ? "Re-apply" : "View Application") : "Apply for Expo"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "booth" && (
          <div className="space-y-6">
            {/* Expo Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-[16px] font-bold text-slate-900">Expo Floor Plan & Booth Allocation</h3>
                  <p className="text-[12.5px] text-slate-500">Live MongoDB floor layout, booth statuses, and your assigned space</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[12.5px] font-medium text-slate-500">Active Expo:</span>
                <Select
                  value={selectedExpoId}
                  onChange={(e) => setSelectedExpoId(e.target.value)}
                  className="h-10 min-w-[240px]"
                >
                  {liveExpos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.city || "Venue"})
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RefreshCw className="size-3.5" />}
                  onClick={() => {
                    if (selectedExpoId) {
                      setLoadingBooths(true);
                      fetchLiveBooths(selectedExpoId).then((b) => setLiveBooths(b)).finally(() => setLoadingBooths(false));
                    }
                  }}
                  title="Refresh floor plan"
                />
              </div>
            </div>

            {/* Current Allocation Card */}
            {(() => {
              const currentExpo = liveExpos.find((e) => e.id === selectedExpoId);
              const currentApp = myApps.find(
                (a: any) => (a.expo?._id || a.expo?.id || a.expo) === selectedExpoId
              );
              const isAppApproved = currentApp?.status === "approved";
              const isPending = currentApp?.status === "pending" || currentApp?.status === "under_review";
              const allocatedBoothId = currentApp?.boothLabel || currentApp?.booth?.boothId;

              return (
                <Card>
                  <CardHeader
                    title="Your Booth Allocation"
                    subtitle={currentExpo ? `${currentExpo.title} — ${currentExpo.venue || currentExpo.city}` : "Allocation details"}
                    right={
                      isAppApproved && allocatedBoothId ? (
                        <Badge tone="success" dot>Confirmed & Allocated</Badge>
                      ) : isAppApproved ? (
                        <Badge tone="brand" dot>Approved — Select a Booth Below</Badge>
                      ) : isPending ? (
                        <Badge tone="warn" dot>Application Pending Review</Badge>
                      ) : (
                        <Badge tone="neutral">No Application Yet</Badge>
                      )
                    }
                  />
                  <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Assigned Booth</p>
                        <p className="mt-1 text-[16px] font-bold text-slate-900">
                          {allocatedBoothId ? `Booth ${allocatedBoothId}` : "Not Assigned Yet"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Hall & Zone</p>
                        <p className="mt-1 text-[14px] font-bold text-slate-900">
                          {currentApp?.requestedZone ? `Hall 4 · Zone ${currentApp.requestedZone}` : "Main Exhibition Hall"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Booth Type & Dimensions</p>
                        <p className="mt-1 text-[14px] font-bold text-slate-900">
                          {currentApp?.requestedCategory || "Island"} · 36 m² (6m × 6m)
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Inclusions</p>
                        <p className="mt-1 text-[13px] font-bold text-slate-900">
                          3-Phase Power · High-Speed Wi-Fi · Rigging
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 p-5 text-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-5 text-amber-300" />
                          <p className="font-display text-[15px] font-bold">Booth Reservation & Status</p>
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
                          {isAppApproved && allocatedBoothId
                            ? `You are confirmed in Booth ${allocatedBoothId}. Select any green available booth below to request a relocation.`
                            : isAppApproved
                            ? "Your application is approved! Select an available booth on the interactive floor plan below and click 'Reserve This Booth Space'."
                            : isPending
                            ? "Your application for this expo is currently under review by the organizers. Booth allocation will unlock once approved."
                            : "You have not submitted an application for this expo yet. Click below to apply."}
                        </p>
                      </div>
                      {!currentApp ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => {
                            if (currentExpo) setApplyExpo(currentExpo);
                          }}
                        >
                          Apply for this Expo
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => {
                            if (allocatedBoothId) {
                              toast({ title: "Relocation request submitted", body: "The organizer will review your relocation request.", tone: "success" });
                            } else {
                              toast({ title: "Select a Booth", body: "Click on any available green booth in the floor plan below to reserve.", tone: "info" });
                            }
                          }}
                        >
                          {allocatedBoothId ? "Request Booth Change" : "Browse Floor Plan Below"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Interactive Floor Plan */}
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
                    Interactive Expo Floor Plan
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Live floor layout loaded from MongoDB. Click any green booth to inspect dimensions and reserve space.
                  </p>
                </div>
                {booth && <Badge tone="brand">Selected Booth: {booth}</Badge>}
              </div>

              {loadingBooths ? (
                <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RefreshCw className="size-6 animate-spin text-brand-600" />
                    <p className="text-[13px]">Loading floor plan from MongoDB...</p>
                  </div>
                </div>
              ) : (
                <FloorPlan
                  key={selectedExpoId}
                  expoId={selectedExpoId}
                  mode="select"
                  selected={booth}
                  onSelect={setBooth}
                  booths={liveBooths.length > 0 ? liveBooths : undefined}
                  onBoothsLoaded={(booths) => setLiveBooths(booths)}
                  height={520}
                />
              )}

              {(() => {
                if (!booth) return null;
                const currentBoothObj = liveBooths.find((b) => b.id === booth || (b as any)._id === booth);
                const isAvailable = currentBoothObj ? currentBoothObj.status === "available" : true;
                const isReserved = currentBoothObj?.status === "reserved";

                return (
                  <div className="mt-5 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            "grid size-12 place-items-center rounded-2xl font-display font-extrabold text-[15px]",
                            isAvailable
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : isReserved
                              ? "border border-amber-200 bg-amber-50 text-amber-700"
                              : "border border-indigo-200 bg-indigo-50 text-indigo-700"
                          )}
                        >
                          {booth}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display text-[16px] font-bold text-slate-900">Booth {booth}</h4>
                            <Badge tone={isAvailable ? "success" : isReserved ? "warn" : "neutral"}>
                              {isAvailable ? "Available Space" : isReserved ? "Reserved" : "Booked"}
                            </Badge>
                            {currentBoothObj?.size && <Badge tone="brand">{currentBoothObj.size}</Badge>}
                          </div>
                          <p className="mt-1 text-[12.5px] text-slate-500">
                            Zone {currentBoothObj?.zone || "A"} · {currentBoothObj?.sqm || 12} m² · $
                            {currentBoothObj?.price ? currentBoothObj.price.toLocaleString() : "2,600"} USD
                            {currentBoothObj?.owner && ` · Occupied by ${currentBoothObj.owner}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {isAvailable && (
                          <Button
                            onClick={() => handleReserveBooth(booth)}
                            disabled={reservingBooth}
                            icon={<Check className="size-4" />}
                          >
                            {reservingBooth ? "Reserving in MongoDB..." : "Reserve This Booth Space"}
                          </Button>
                        )}

                        {isReserved && (
                          <>
                            <Button
                              icon={<Banknote className="size-4" />}
                              onClick={() => handlePayReservedBooth(booth)}
                              disabled={creatingOrder}
                            >
                              {creatingOrder ? "Starting..." : "Pay Booth Fee & Confirm"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReleaseBooth(booth)}
                              disabled={reservingBooth}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            >
                              {reservingBooth ? "Releasing..." : "Release Reservation"}
                            </Button>
                          </>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => setBooth(null)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab === "leads" && (
          <div className="space-y-6">
            {/* KPI Cards based on dynamic leads */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total captured leads"
                value={String(liveLeads.length)}
                icon={<ScanLine className="size-5" />}
                tone="brand"
                sub="Live in MongoDB"
              />
              <StatCard
                label="High-intent / Hot"
                value={String(liveLeads.filter((l) => l.status === "Hot").length)}
                icon={<Target className="size-5" />}
                tone="warn"
                sub="Score > 85 · Ready to buy"
              />
              <StatCard
                label="Warm / Nurture"
                value={String(liveLeads.filter((l) => l.status === "Warm" || l.status === "Nurture").length)}
                icon={<CalendarClock className="size-5" />}
                tone="info"
                sub="In follow-up pipeline"
              />
              <StatCard
                label="Pipeline value"
                value={money(liveLeads.filter((l) => l.status === "Hot" || l.status === "Warm").length * 18500)}
                icon={<Award className="size-5" />}
                tone="success"
                sub="Estimated deal value"
              />
            </div>

            <Card>
              <CardHeader
                title="Captured Leads Registry"
                subtitle={`${liveLeads.length} leads recorded in MongoDB for ${companyName}`}
                right={
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download className="size-4" />}
                      onClick={handleExportLeadsCSV}
                    >
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      icon={<Plus className="size-4" />}
                      onClick={() => setLeadModalOpen(true)}
                    >
                      Capture Lead
                    </Button>
                  </div>
                }
              />

              {/* Search & Filter Bar */}
              <div className="border-b border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      placeholder="Search leads by name, company, email, or interest…"
                      className="pl-9 h-9.5 text-[13px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-500">Filter status:</span>
                    <Select
                      value={leadStatusFilter}
                      onChange={(e) => setLeadStatusFilter(e.target.value)}
                      className="h-9.5 text-[12.5px] min-w-[120px]"
                    >
                      {["All", "Hot", "Warm", "Cold", "Nurture", "Closed"].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Leads Table */}
              <div className="overflow-x-auto">
                {loadingLeads ? (
                  <div className="py-12 text-center text-slate-500 text-[13.5px]">Loading dynamic leads from server...</div>
                ) : liveLeads.length === 0 ? (
                  <div className="py-16 text-center">
                    <Target className="mx-auto size-9 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No leads captured yet</p>
                    <p className="text-[12.5px] text-slate-500 mt-1">Use the "Capture Lead" button or badge scanner to record visitor interactions.</p>
                    <Button size="sm" className="mt-4" icon={<Plus className="size-4" />} onClick={() => setLeadModalOpen(true)}>
                      Capture First Lead
                    </Button>
                  </div>
                ) : (
                  <table className="w-full min-w-[840px] text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {["Contact", "Company", "Interest", "Scanned", "Score", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {liveLeads
                        .filter((l) => {
                          const q = leadSearch.toLowerCase();
                          const matchQ = !q || `${l.name} ${l.company} ${l.email} ${l.interest} ${l.jobTitle || ""}`.toLowerCase().includes(q);
                          const matchStatus = leadStatusFilter === "All" || l.status === leadStatusFilter;
                          return matchQ && matchStatus;
                        })
                        .map((l) => {
                          const sc = l.score || 75;
                          const formattedDate = l.scannedAt
                            ? new Date(l.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "Just now";

                          return (
                            <tr key={l._id} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar name={l.name} size={32} />
                                  <div>
                                    <p className="font-semibold text-slate-900 leading-tight">{l.name}</p>
                                    <p className="text-[11.5px] text-slate-500 leading-tight">{l.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-slate-800">{l.company}</p>
                                <p className="text-[11px] text-slate-400">{l.jobTitle || "Attendee"}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge tone="neutral" className="bg-slate-100 text-slate-700 font-medium">
                                  {l.interest}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-slate-600">
                                {formattedDate}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <Progress value={sc} className="w-14" height={5} tone={sc > 85 ? "danger" : sc > 65 ? "warn" : "brand"} />
                                  <span className="text-[11.5px] font-bold tabular-nums text-slate-700">{sc}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <Select
                                  value={l.status}
                                  onChange={(e) => handleUpdateLeadStatus(l._id, e.target.value as any)}
                                  className="h-8 text-[11.5px] font-semibold py-0 min-w-[95px]"
                                >
                                  {["Hot", "Warm", "Cold", "Nurture", "Closed"].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </Select>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={<MessageSquare className="size-3.5" />}
                                    onClick={() => {
                                      setTab("messages");
                                      toast({ title: `Opening chat with ${l.name}`, tone: "info" });
                                    }}
                                    title="Open Messages"
                                  />
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-rose-600"
                                    icon={<Trash2 className="size-3.5" />}
                                    onClick={() => handleDeleteLead(l._id)}
                                    title="Delete lead"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Badge scans trend" subtitle="Interactions logged on floor plan" />
                <div className="p-5">
                  <BarChart
                    color="#6366f1"
                    height={200}
                    showValues
                    format={fmt}
                    data={[
                      { label: "Day 1", v: 620 },
                      { label: "Day 2", v: 980 },
                      { label: "Day 3", v: 1240 },
                      { label: "Day 4", v: 1080 },
                    ]}
                  />
                </div>
              </Card>
              <Card>
                <CardHeader title="Lead distribution by tier" subtitle="Pipeline qualification" />
                <div className="p-5 space-y-3">
                  {[
                    ["Hot (High Priority)", liveLeads.filter((l) => l.status === "Hot").length, "bg-rose-500"],
                    ["Warm (Actively Engaged)", liveLeads.filter((l) => l.status === "Warm").length, "bg-amber-500"],
                    ["Nurture (Information Sent)", liveLeads.filter((l) => l.status === "Nurture").length, "bg-brand-500"],
                    ["Cold / Other", liveLeads.filter((l) => l.status === "Cold" || l.status === "Closed").length, "bg-slate-400"],
                  ].map(([label, count, color]) => (
                    <div key={label as string} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full", color as string)} />
                        <span className="text-slate-700">{label as string}</span>
                      </span>
                      <span className="font-bold text-slate-900">{count as number} leads</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "staff" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Badges allocated"
                value={`${staffList.length} / 8`}
                icon={<Users className="size-5" />}
                tone="brand"
                sub="Active booth representatives"
              />
              <StatCard
                label="Lead scanners enabled"
                value={String(staffList.filter((s) => s.permissions?.includes("lead_scanner")).length)}
                icon={<ScanLine className="size-5" />}
                tone="info"
                sub="Can scan attendee badges"
              />
              <StatCard
                label="Demo Specialists"
                value={String(staffList.filter((s) => s.role?.includes("Demo") || s.permissions === "demo_only").length || 1)}
                icon={<Activity className="size-5" />}
                tone="success"
                sub="Arena demonstration staff"
              />
            </div>

            <Card>
              <CardHeader
                title="Staff & Badges Management"
                subtitle="Manage registered booth personnel and official QR admission passes"
                right={
                  <Button
                    size="sm"
                    icon={<UserPlus className="size-4" />}
                    onClick={() => setStaffOpen(true)}
                  >
                    Add Staff Member
                  </Button>
                }
              />
              <div className="divide-y divide-slate-100">
                {staffList.map((s) => {
                  const sId = s._id || s.id;
                  const isLeadScanner = s.permissions?.includes("lead_scanner");

                  return (
                    <div key={sId || s.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/60 transition">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar src={s.avatar} name={s.name} size={42} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-bold text-slate-900 leading-tight">{s.name}</p>
                            <Badge tone="success" className="text-[10px]">
                              Badge Active ✓
                            </Badge>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-tight">{s.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={s.role === "Booth Lead" ? "purple" : s.role === "Sales Engineer" ? "brand" : "neutral"}>
                          {s.role || "Booth Staff"}
                        </Badge>
                        <Badge tone="neutral" className="bg-slate-100 text-slate-700">
                          {isLeadScanner ? "Scanner Enabled" : "Floor Access Only"}
                        </Badge>

                        <Button
                          size="xs"
                          variant="outline"
                          icon={<QrCode className="size-3.5 text-brand-600" />}
                          onClick={() => setBadgeModalMember(s)}
                        >
                          View Badge
                        </Button>

                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-slate-400 hover:text-rose-600"
                          icon={<Trash2 className="size-3.5" />}
                          onClick={() => handleRemoveStaffMember(sId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="size-5 text-brand-600 shrink-0 mt-0.5" />
                  <p className="text-[12.5px] leading-relaxed text-slate-600">
                    Each exhibitor badge contains an authenticated QR code linked to <span className="font-bold text-slate-900">{companyName}</span>. Staff members can present their badge on mobile or print it for expo turnstile admission and attendee lead capture.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-4">
            <RealtimeChatView defaultFilter="ALL" />
          </div>
        )}

        {tab === "docs" && (
          <div className="space-y-6">
            {/* Header KPI cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <FileText className="size-6" />
                </div>
                <div>
                  <p className="font-display text-[22px] font-bold text-slate-900">{myDocs.length}</p>
                  <p className="text-[12px] font-medium text-slate-500">Total Uploaded Documents</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileCheck2 className="size-6" />
                </div>
                <div>
                  <p className="font-display text-[22px] font-bold text-emerald-700">
                    {myDocs.filter((d) => d.status === "verified").length}
                  </p>
                  <p className="text-[12px] font-medium text-slate-500">Verified by Organizers</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock className="size-6" />
                </div>
                <div>
                  <p className="font-display text-[22px] font-bold text-amber-700">
                    {myDocs.filter((d) => d.status === "pending" || !d.status).length}
                  </p>
                  <p className="text-[12px] font-medium text-slate-500">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Upload Document Card */}
              <Card className="lg:col-span-1">
                <CardHeader title="Upload Compliance Document" subtitle="Upload required certificates for approval" />
                <div className="p-5 space-y-4">
                  <Field label="Document Category" required>
                    <Select
                      value={docTypeToUpload}
                      onChange={(e) => setDocTypeToUpload(e.target.value)}
                    >
                      <option value="certificate_of_incorporation">Certificate of Incorporation</option>
                      <option value="public_liability_insurance">Public Liability Insurance</option>
                      <option value="product_liability_waiver">Product Liability Waiver</option>
                      <option value="booth_build_risk_assessment">Booth Build Risk Assessment</option>
                      <option value="electrical_certificate">Electrical Safety Certificate</option>
                      <option value="staff_list">Staff List & ID Badges</option>
                      <option value="sustainability_statement">Sustainability Statement</option>
                      <option value="other">Other Compliance Document</option>
                    </Select>
                  </Field>

                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center hover:border-brand-500 transition">
                    <Upload className="mx-auto size-8 text-brand-600" />
                    <p className="mt-2 text-[13px] font-bold text-slate-800">Select PDF, JPG, PNG or DOCX</p>
                    <p className="text-[11.5px] text-slate-400">Up to 10 MB per document</p>

                    <label className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-[12.5px] font-bold text-white shadow-sm hover:bg-brand-700 transition">
                      <Plus className="size-4" />
                      {uploadingDoc ? "Uploading to Server..." : "Browse & Upload File"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                        className="hidden"
                        onChange={handleUploadDocument}
                        disabled={uploadingDoc}
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[12px] text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800 mb-1">Compliance Requirement</p>
                    Organizers require a Certificate of Incorporation and Liability Insurance before granting access to build-up halls.
                  </div>
                </div>
              </Card>

              {/* Uploaded Documents List */}
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Compliance Documents Registry"
                  subtitle="Live documents verified in MongoDB for your company"
                  right={
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={<RefreshCw className="size-3" />}
                      onClick={loadDocuments}
                      title="Refresh documents list"
                    />
                  }
                />
                <div className="divide-y divide-slate-100">
                  {loadingDocs ? (
                    <div className="p-8 text-center text-slate-400">
                      <RefreshCw className="mx-auto size-8 animate-spin text-brand-600" />
                      <p className="mt-2 text-[13px] font-medium text-slate-600">Loading compliance documents...</p>
                    </div>
                  ) : myDocs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <FileCheck2 className="mx-auto size-10 text-slate-300" />
                      <p className="mt-2 text-[14px] font-bold text-slate-700">No documents found</p>
                      <p className="text-[12px] text-slate-500">Upload your compliance files using the form on the left.</p>
                    </div>
                  ) : (
                    myDocs.map((doc: any) => {
                      const isVerified = doc.status === "verified";
                      const isRejected = doc.status === "rejected";
                      const isPending = !isVerified && !isRejected;
                      const typeLabel = (doc.docType || "document").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

                      return (
                        <div key={doc._id} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50/70 transition">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl",
                              isVerified ? "bg-emerald-50 text-emerald-600" : isRejected ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                            )}>
                              <FileCheck2 className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-bold text-slate-900">{doc.originalName || doc.filename || "Compliance Document"}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-500">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{typeLabel}</span>
                                {doc.sizeBytes && <span>{(doc.sizeBytes / 1024).toFixed(0)} KB</span>}
                                {doc.createdAt && <span>Uploaded {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge tone={isVerified ? "success" : isRejected ? "danger" : "warn"} dot={isVerified || isPending}>
                              {isVerified ? "Verified ✓" : isRejected ? "Rejected" : "Pending Review"}
                            </Badge>

                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <Button size="xs" variant="secondary" icon={<ExternalLink className="size-3.5" />}>
                                  View
                                </Button>
                              </a>
                            )}

                            <Button
                              size="xs"
                              variant="ghost"
                              icon={<Trash2 className="size-3.5 text-rose-500" />}
                              onClick={() => handleDeleteDocument(doc._id)}
                              title="Delete document"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-6">
            <UserPaymentsView />
          </div>
        )}

        {tab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Company profile" subtitle="Live settings saved directly to MongoDB for your exhibitor account" />
              <div className="space-y-4 p-5">
                <Field label="Company name" required>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </Field>
                <Field label="Category">
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </Field>
                <Field label="Website">
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                </Field>
                <Field label="Country">
                  <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                    {["United States", "Germany", "Switzerland", "Singapore", "Netherlands", "United Kingdom", "Pakistan", "United Arab Emirates"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contact Representative">
                  <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
                </Field>
                <Field label="Contact Email">
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </Field>
                <Field label="Business Phone">
                  <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                </Field>
                <Field label="Company Description">
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <Button onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? "Saving to MongoDB..." : "Save company profile"}
                </Button>
              </div>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader title="Notifications" subtitle="Live alerts configuration for your team" />
                <div className="space-y-5 p-5">
                  <Toggle checked={notify.alloc} label="Booth & allocation changes" desc="Any change affecting your space" onChange={(v) => setNotify({ ...notify, alloc: v })} />
                  <Toggle checked={notify.neighbour} label="Neighbour messages" desc="Messages from adjacent exhibitors" onChange={(v) => setNotify({ ...notify, neighbour: v })} />
                  <Toggle checked={notify.leads} label="New lead alerts" desc="Real-time when a badge is scanned" onChange={(v) => setNotify({ ...notify, leads: v })} />
                  <Toggle checked={notify.digest} label="Daily performance digest" desc="Emailed each evening during the expo" onChange={(v) => setNotify({ ...notify, digest: v })} />
                  <Button variant="secondary" onClick={() => toast({ title: "Notification preferences saved ✓", tone: "success" })}>
                    Save preferences
                  </Button>
                </div>
              </Card>
              <Card>
                <CardHeader title="Privacy & Compliance" subtitle="Control what attendees and visitors can see" />
                <div className="space-y-5 p-5">
                  <Toggle
                    checked={visibilitySettings.showBoothOnPlan}
                    label="Show booth location on floor plan"
                    desc="Attendees can locate your physical booth on the 2D/3D map"
                    onChange={(v) => setVisibilitySettings((prev) => ({ ...prev, showBoothOnPlan: v }))}
                  />
                  <Toggle
                    checked={visibilitySettings.allowAttendeeChat}
                    label="Allow attendee chat requests"
                    desc="Receive direct inquiries and meeting requests in Messages"
                    onChange={(v) => setVisibilitySettings((prev) => ({ ...prev, allowAttendeeChat: v }))}
                  />
                  <Toggle
                    checked={visibilitySettings.showEmailPublicly}
                    label="Show email address publicly"
                    desc="Display your primary contact email on the public expo directory"
                    onChange={(v) => setVisibilitySettings((prev) => ({ ...prev, showEmailPublicly: v }))}
                  />
                  <Button variant="secondary" onClick={handleSaveProfile} disabled={profileSaving}>
                    {profileSaving ? "Updating MongoDB..." : "Save privacy settings"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm booth reservation" subtitle={`Booth ${booth} · Global Tech Summit 2026`} size="md"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button onClick={() => { setConfirm(false); setBooth(null); toast({ title: "Reservation requested 🎉", body: "The organizer will confirm within 4 hours.", tone: "success" }); }}>Confirm reservation</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[["Booth", booth ?? "—"], ["Zone", (booth ?? "A").split("-")[0]], ["Size", `${BOOTHS.find((b) => b.id === booth)?.sqm ?? 0} m²`], ["Rate", money(BOOTHS.find((b) => b.id === booth)?.price ?? 0)]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                <p className="mt-0.5 font-display text-[15px] font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-brand-50 p-4 text-[12.5px] leading-relaxed text-brand-900">
            Your current booth {ME.booth} will be released once this reservation is approved by the organizer. No payment is
            taken until confirmation.
          </div>
        </div>
      </Modal>

      <Modal open={editProfile} onClose={() => setEditProfile(false)} title="Edit exhibitor profile" subtitle="Your public listing in the expo directory (connected to MongoDB)" size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setEditProfile(false)} disabled={profileSaving}>Cancel</Button>
          <Button onClick={handleSaveProfile} disabled={profileSaving}>
            {profileSaving ? "Saving to MongoDB..." : "Save profile"}
          </Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required className="sm:col-span-2">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
          <Field label="Primary contact">
            <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
          </Field>
          <Field label="Contact email">
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Cloud Infrastructure", "Industrial Automation", "Medical Devices", "Renewables", "Data & AI", "Cybersecurity"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Country">
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              {["United States", "Germany", "Switzerland", "Singapore"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Logo</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
              <ExhibitorLogo name={companyName} bg={ME.logoBg} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-slate-900">nexora-logo.svg</p>
                <p className="text-[11px] text-slate-500">SVG · 18 KB</p>
              </div>
              <Button size="sm" variant="secondary" icon={<Upload className="size-4" />}>Replace</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Staff Member Modal */}
      <Modal
        open={staffOpen}
        onClose={() => setStaffOpen(false)}
        title="Add Booth Staff Member"
        subtitle="Staff will be issued an authenticated EventSphere digital exhibitor pass"
        size="md"
        footer={<>
          <Button variant="ghost" onClick={() => setStaffOpen(false)} disabled={savingStaff}>Cancel</Button>
          <Button loading={savingStaff} onClick={handleAddStaffMember}>Save & Issue Badge</Button>
        </>}
      >
        <div className="grid gap-4">
          <Field label="Staff Full Name" required>
            <Input
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="e.g. Jordan Ellis"
            />
          </Field>
          <Field label="Staff Email Address" required>
            <Input
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              placeholder="e.g. jordan@nexoracloud.com"
            />
          </Field>
          <Field label="Role at the Booth">
            <Select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
            >
              {["Booth Lead", "Sales Engineer", "Demo Specialist", "Field Marketer", "Technical Specialist", "Support"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="App & Scanner Permissions">
            <Select
              value={staffForm.permissions}
              onChange={(e) => setStaffForm({ ...staffForm, permissions: e.target.value })}
            >
              <option value="lead_scanner_full">Lead scanner (Full CRM access & notes)</option>
              <option value="lead_scanner_only">Lead scanner only (Quick badge scan)</option>
              <option value="demo_only">Demo area only (No attendee data export)</option>
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Official Staff Badge Modal */}
      <Modal
        open={!!badgeModalMember}
        onClose={() => setBadgeModalMember(null)}
        title="Official Exhibitor Pass"
        subtitle="Turnstile admission badge and QR scanner verification"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setBadgeModalMember(null)}>Close</Button>
          <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>Print Badge</Button>
        </>}
      >
        {badgeModalMember && (
          <div className="p-2 text-center space-y-4">
            <div className="mx-auto max-w-[280px] rounded-3xl border-2 border-slate-900 bg-gradient-to-b from-ink-950 to-slate-900 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="font-display text-[13px] font-extrabold tracking-wider uppercase text-brand-400">EventSphere</span>
                <Badge tone="purple" className="text-[10px] uppercase font-bold">Exhibitor</Badge>
              </div>

              <div className="my-5">
                <div className="mx-auto size-20 rounded-2xl bg-white/10 p-1 ring-2 ring-white/20 mb-3 overflow-hidden">
                  <Avatar src={badgeModalMember.avatar} name={badgeModalMember.name} size={72} />
                </div>
                <h3 className="font-display text-[18px] font-bold text-white leading-tight">{badgeModalMember.name}</h3>
                <p className="text-[12px] text-brand-300 font-semibold mt-0.5">{badgeModalMember.role || "Booth Staff"}</p>
                <p className="text-[13px] font-bold text-slate-200 mt-2">{companyName}</p>
                <p className="text-[11px] text-slate-400">Booth {ME.booth} · Hall 4</p>
              </div>

              {/* QR Code Graphic */}
              <div className="rounded-2xl bg-white p-3.5 mx-auto w-36 shadow-inner">
                <QrCode className="size-28 mx-auto text-slate-900" />
                <p className="font-mono text-[9.5px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                  ES-EXH-{(badgeModalMember._id || "9248").slice(-6)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Access: All Halls</span>
                <span className="text-emerald-400 font-semibold">Verified Active ✓</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Capture New Lead Modal */}
      <Modal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title="Capture New Attendee Lead"
        subtitle="Log badge interaction, interest notes, and qualification rating"
        size="md"
        footer={<>
          <Button variant="ghost" onClick={() => setLeadModalOpen(false)} disabled={savingLead}>Cancel</Button>
          <Button loading={savingLead} icon={<Check className="size-4" />} onClick={handleCreateLead}>Save Lead</Button>
        </>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Attendee Full Name" required className="sm:col-span-2">
            <Input
              value={newLeadForm.name}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
              placeholder="e.g. Marcus Vance"
            />
          </Field>
          <Field label="Attendee Email" required>
            <Input
              type="email"
              value={newLeadForm.email}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
              placeholder="e.g. marcus@enterprise.com"
            />
          </Field>
          <Field label="Phone Number">
            <Input
              value={newLeadForm.phone}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label="Company / Organization">
            <Input
              value={newLeadForm.company}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
              placeholder="e.g. Apex Global Industries"
            />
          </Field>
          <Field label="Job Title / Role">
            <Input
              value={newLeadForm.jobTitle}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, jobTitle: e.target.value })}
              placeholder="e.g. Chief Technology Officer"
            />
          </Field>
          <Field label="Product / Solution of Interest" className="sm:col-span-2">
            <Input
              value={newLeadForm.interest}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, interest: e.target.value })}
              placeholder="e.g. Cloud Infrastructure, Observability Suite"
            />
          </Field>
          <Field label="Lead Priority / Intent">
            <Select
              value={newLeadForm.status}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, status: e.target.value as any })}
            >
              <option value="Hot">Hot (Ready for POC / Immediate Follow-up)</option>
              <option value="Warm">Warm (Actively Evaluating)</option>
              <option value="Nurture">Nurture (Information Requested)</option>
              <option value="Cold">Cold (Casual Visitor)</option>
            </Select>
          </Field>
          <Field label="Qualification Score (1 - 100)">
            <Input
              type="number"
              min={1}
              max={100}
              value={String(newLeadForm.score)}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, score: Number(e.target.value) || 75 })}
            />
          </Field>
          <Field label="Notes & Discussion Summary" className="sm:col-span-2">
            <Textarea
              value={newLeadForm.notes}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
              placeholder="Specific pain points discussed, timeline, budget, or agreed next steps..."
              rows={3}
            />
          </Field>
        </div>
      </Modal>

      {/* Expo Application Modal */}
      <Modal
        open={!!applyExpo}
        onClose={() => setApplyExpo(null)}
        title={`Apply for ${applyExpo?.title || "Expo"}`}
        subtitle={`${applyExpo?.venue || applyExpo?.city || "Venue"} · ${applyExpo?.startDate || ""} to ${applyExpo?.endDate || ""}`}
        size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setApplyExpo(null)} disabled={applying}>Cancel</Button>
          <Button loading={applying} onClick={handleApply}>Submit Application to Organizer</Button>
        </>}
      >
        {applyExpo && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-brand-800">Applying as</p>
              <p className="text-[15px] font-bold text-slate-900 mt-0.5">{companyName}</p>
              <p className="text-[12px] text-slate-600 mt-0.5">Contact: {repName} ({contactEmail})</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sponsorship Tier" required>
                <Select
                  value={applyForm.tier}
                  onChange={(e) => setApplyForm({ ...applyForm, tier: e.target.value })}
                >
                  {["Platinum", "Gold", "Silver", "Bronze"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Preferred Hall Zone" required>
                <Select
                  value={applyForm.requestedZone}
                  onChange={(e) => setApplyForm({ ...applyForm, requestedZone: e.target.value })}
                >
                  {["A", "B", "C", "D"].map((z) => (
                    <option key={z} value={z}>Zone {z}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Booth Category" required>
                <Select
                  value={applyForm.requestedCategory}
                  onChange={(e) => setApplyForm({ ...applyForm, requestedCategory: e.target.value })}
                >
                  {["Small", "Medium", "Large", "Island"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Number of Booths">
                <Select
                  value={String(applyForm.boothQty)}
                  onChange={(e) => setApplyForm({ ...applyForm, boothQty: Number(e.target.value) || 1 })}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "Booth" : "Booths"}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Showcase & Exhibit Summary" required className="sm:col-span-2">
                <Textarea
                  value={applyForm.showcaseSummary}
                  onChange={(e) => setApplyForm({ ...applyForm, showcaseSummary: e.target.value })}
                  placeholder="Describe the products, solutions or demos you plan to showcase at this expo..."
                  rows={4}
                />
              </Field>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-[12px] text-slate-500">
              Your application will be sent to the Admin / Organizer queue. Once approved, the organizer will assign your booth on the floor plan.
            </div>
          </div>
        )}
      </Modal>

      {/* Checkout Modal for Booth Fees & Sponsorships */}
      <CheckoutModal
        open={!!checkoutOrder}
        initialOrder={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onSuccess={() => {
          setCheckoutOrder(null);
          loadOrders();
          loadExposAndApps();
        }}
      />
    </PortalLayout>
  );
}
