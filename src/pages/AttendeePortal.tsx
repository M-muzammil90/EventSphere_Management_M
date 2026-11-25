import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { type Expo, type Exhibitor, type Session } from "@/lib/data";
import {
  fetchLiveExpos,
  fetchLiveExhibitors,
  fetchLiveSessions,
  fetchMyRegistrations,
  registerForExpoLive,
  cancelRegistrationLive,
  fetchMyAppointments,
  createAppointmentLive,
  cancelAppointmentLive,
  fetchLiveNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchMyFeedback,
  submitFeedbackLive,
  startLiveConversation,
  createLiveOrder,
  type LiveRegistration,
  type LiveAppointment,
  type LiveNotification,
  type LiveOrder,
} from "@/lib/liveApi";
import CheckoutModal from "@/components/payments/CheckoutModal";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Reveal,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { ExhibitorLogo, SessionCard, StatCard } from "@/components/shared";
import { Sparkline } from "@/components/charts";
import { ConfirmDialog } from "@/components/kit";
import { PortalLayout, type PortalNavItem } from "@/components/PortalLayout";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import RealtimeChatView from "@/components/chat/RealtimeChatView";
import UserPaymentsView from "@/components/payments/UserPaymentsView";
import {
  Banknote,
  Bell,
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Globe2,
  MapPin,
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  QrCode,
  Search,
  Send,
  Sparkles,
  Star,
  Ticket,
  Users,
  X,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";

export default function AttendeePortal() {
  const { user, bookmarks, toast, login, authMode } = useStore();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [liveExpos, setLiveExpos] = useState<Expo[]>([]);
  const [liveExhibitors, setLiveExhibitors] = useState<Exhibitor[]>([]);
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const [registrations, setRegistrations] = useState<LiveRegistration[]>([]);
  const [appointments, setAppointments] = useState<LiveAppointment[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Search & Filter
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  // Messaging Modal
  const [contact, setContact] = useState<{ id: string; name: string } | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // Appointment Modal
  const [bookApptExhibitor, setBookApptExhibitor] = useState<Exhibitor | null>(null);
  const [apptExpoId, setApptExpoId] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("10:00");
  const [apptDuration, setApptDuration] = useState(30);
  const [apptType, setApptType] = useState<"Meeting" | "Demo" | "Call" | "Site visit">("Meeting");
  const [apptLocation, setApptLocation] = useState("");
  const [apptAgenda, setApptAgenda] = useState("");
  const [bookingAppt, setBookingAppt] = useState(false);
  const [cancelApptTarget, setCancelApptTarget] = useState<LiveAppointment | null>(null);

  // Attendee Profile & Compliance Settings State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileCompany, setProfileCompany] = useState(user?.company || "");
  const [profileJobTitle, setProfileJobTitle] = useState(user?.jobTitle || "");
  const [profileBio, setProfileBio] = useState(user?.bio || "");
  const [profileCountry, setProfileCountry] = useState(user?.address || "United States");
  const [savingProfile, setSavingProfile] = useState(false);
  const [attendeePrivacy, setAttendeePrivacy] = useState({
    showProfileToExhibitors: true,
    allowDirectInquiries: true,
    shareContactWithBoothStaff: true,
  });
  const [attendeeAlerts, setAttendeeAlerts] = useState({
    meetingAlerts: true,
    scheduleChanges: true,
    dailyDigest: false,
  });

  useEffect(() => {
    if (user) {
      if (user.name) setProfileName(user.name);
      if (user.phone) setProfilePhone(user.phone);
      if (user.company) setProfileCompany(user.company);
      if (user.jobTitle) setProfileJobTitle(user.jobTitle);
      if (user.bio) setProfileBio(user.bio);
      if (user.address) setProfileCountry(user.address);
    }
  }, [user]);

  // Expo Registration Modal
  const [registerExpoModal, setRegisterExpoModal] = useState<Expo | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<"General" | "Standard" | "VIP" | "Workshop">("Standard");
  const [registeringExpo, setRegisteringExpo] = useState(false);
  const [regSuccessModal, setRegSuccessModal] = useState<LiveRegistration | null>(null);
  const [cancelRegTarget, setCancelRegTarget] = useState<LiveRegistration | null>(null);

  // Feedback Modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fbTargetType, setFbTargetType] = useState<"expo" | "session" | "exhibitor">("expo");
  const [fbTargetId, setFbTargetId] = useState("");
  const [fbTargetTitle, setFbTargetTitle] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbTitle, setFbTitle] = useState("");
  const [fbBody, setFbBody] = useState("");
  const [fbCategory, setFbCategory] = useState<"Content" | "Logistics" | "Venue" | "Technology" | "Catering" | "General">("General");
  const [fbRecommend, setFbRecommend] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // QR Badge Modal
  const [badgeModalOpen, setBadgeModalOpen] = useState<LiveRegistration | null>(null);

  // Checkout modal state
  const [checkoutOrder, setCheckoutOrder] = useState<LiveOrder | null>(null);
  const [payingRegId, setPayingRegId] = useState<string | null>(null);

  const handlePayRegistration = async (r: LiveRegistration) => {
    setPayingRegId(r._id);
    try {
      const created = await createLiveOrder({
        orderType: "ticket_registration",
        expoId: r.expo._id,
        ticketType: r.ticketType,
        registrationId: r._id,
        billingDetails: {
          fullName: user?.name || "Attendee",
          email: user?.email || "attendee@eventsphere.com",
        },
      });
      setCheckoutOrder(created);
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        body: err.message || "Could not initialize ticket payment.",
        tone: "danger",
      });
    } finally {
      setPayingRegId(null);
    }
  };

  // Load All Dynamic Data
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [exposData, exhibitorsData, sessionsData, regsData, apptsData, notifsData, fbData] = await Promise.allSettled([
        fetchLiveExpos(),
        fetchLiveExhibitors(),
        fetchLiveSessions(),
        fetchMyRegistrations(),
        fetchMyAppointments(),
        fetchLiveNotifications(),
        fetchMyFeedback(),
      ]);

      if (exposData.status === "fulfilled" && exposData.value) {
        setLiveExpos(exposData.value.filter((e) => e.status !== "Draft"));
      }
      if (exhibitorsData.status === "fulfilled" && exhibitorsData.value?.exhibitors) {
        setLiveExhibitors(exhibitorsData.value.exhibitors.filter((e) => e.status === "Approved"));
      }
      if (sessionsData.status === "fulfilled" && sessionsData.value) {
        setLiveSessions(sessionsData.value);
      }
      if (regsData.status === "fulfilled" && regsData.value) {
        setRegistrations(regsData.value);
      }
      if (apptsData.status === "fulfilled" && apptsData.value) {
        setAppointments(apptsData.value);
      }
      if (notifsData.status === "fulfilled" && notifsData.value) {
        setNotifications(notifsData.value);
      }
      if (fbData.status === "fulfilled" && fbData.value) {
        setFeedbacks(fbData.value);
      }
    } catch (err) {
      console.error("Error loading attendee live data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Derived Data
  const activeRegistrations = useMemo(
    () => registrations.filter((r) => r.status !== "cancelled"),
    [registrations]
  );

  const featuredExpo = useMemo(() => {
    if (activeRegistrations.length > 0 && activeRegistrations[0].expo) {
      return activeRegistrations[0].expo;
    }
    return liveExpos[0] || null;
  }, [activeRegistrations, liveExpos]);

  const savedSessions = useMemo(
    () => liveSessions.filter((s) => bookmarks.includes(s.id)),
    [liveSessions, bookmarks]
  );

  const recommendedExhibitors = useMemo(
    () => liveExhibitors.filter((e) => (e.rating || 0) >= 4.5).slice(0, 4),
    [liveExhibitors]
  );

  const exhibitorCategories = useMemo(
    () => ["All", ...Array.from(new Set(liveExhibitors.map((e) => e.category).filter(Boolean)))],
    [liveExhibitors]
  );

  const filteredExhibitors = useMemo(() => {
    return liveExhibitors.filter((e) => {
      const matchCat = cat === "All" || e.category === cat;
      const searchStr = `${e.company} ${e.category} ${e.products?.join(" ") || ""} ${e.country || ""}`.toLowerCase();
      const matchQ = !q || searchStr.includes(q.toLowerCase());
      return matchCat && matchQ;
    });
  }, [liveExhibitors, cat, q]);

  const unreadNotifsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Navigation Items
  const NAV_ITEMS: PortalNavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "My event" },
    { id: "agenda", label: "My agenda", icon: Bookmark, badge: savedSessions.length, group: "My event" },
    {
      id: "appointments",
      label: "Appointments",
      icon: CalendarClock,
      badge: appointments.filter((a) => a.status === "pending").length,
      group: "My event",
    },
    { id: "feedback", label: "Feedback", icon: Star, badge: feedbacks.length, group: "My event" },
    { id: "expos", label: "Event registration", icon: Ticket, badge: activeRegistrations.length, group: "Discover" },
    { id: "exhibitors", label: "Exhibitor search", icon: Building2, group: "Discover" },
    { id: "notifications", label: "Alerts", icon: Bell, badge: unreadNotifsCount, group: "Discover" },
    { id: "tickets", label: "My tickets", icon: QrCode, badge: activeRegistrations.length, group: "Account" },
    { id: "payments", label: "Payments & Invoices", icon: Banknote, group: "Account" },
    { id: "messages", label: "Messages & Support", icon: MessageSquare, group: "Account" },
    { id: "settings", label: "Settings & Compliance", icon: Settings, group: "Account" },
  ];

  const openAppointmentModal = (e: Exhibitor) => {
    setBookApptExhibitor(e);
    const activeExpo = liveExpos.find((x) => x.status === "Live" || x.status === "Upcoming" || (x.status as any) === "live" || (x.status as any) === "published") || liveExpos[0];
    const eid = (e as any).expoId || activeExpo?.id || "";
    setApptExpoId(eid);
    const targetExpo = liveExpos.find((x) => x.id === eid) || activeExpo;
    if (targetExpo?.startDate) {
      const start = new Date(targetExpo.startDate);
      const end = targetExpo.endDate ? new Date(targetExpo.endDate) : start;
      const now = new Date();
      const defaultDate = now >= start && now <= end ? now : start;
      setApptDate(defaultDate.toISOString().slice(0, 10));
    }
  };

  // Handlers
  const handleSendContact = async () => {
    if (!contactMessage.trim() || !contact) return;
    setSendingContact(true);
    try {
      await startLiveConversation({
        recipientId: contact.id,
        subject: contactSubject.trim() || `Inquiry for ${contact.name}`,
        initialMessage: contactMessage.trim(),
        conversationType: "DIRECT",
      });
      toast({
        title: "Message Sent ✓",
        body: `Conversation started with ${contact.name}. You can continue chatting in the Messages tab.`,
        tone: "success",
      });
      setContact(null);
      setContactMessage("");
      setContactSubject("");
      setTab("messages");
    } catch (err: any) {
      toast({
        title: "Could not send message",
        body: err.message || "Failed to start conversation.",
        tone: "danger",
      });
    } finally {
      setSendingContact(false);
    }
  };

  const handleRegisterExpo = async () => {
    if (!registerExpoModal) return;
    setRegisteringExpo(true);
    try {
      const reg = await registerForExpoLive({
        expo: registerExpoModal.id,
        ticketType: selectedTicketType,
        attendee: {
          name: user?.name || "Attendee",
          email: user?.email || "attendee@eventsphere.com",
        },
        consent: {
          terms: true,
          marketing: false,
          dataProcessing: true,
        },
      });
      setRegisterExpoModal(null);
      if (reg.status === "pending_payment") {
        toast({
          title: "Registration Created — Complete Payment",
          body: `Please complete payment for your ${selectedTicketType} pass.`,
          tone: "info",
        });
        await handlePayRegistration(reg);
      } else {
        toast({
          title: "Registration Successful! 🎉",
          body: `You are now registered for ${registerExpoModal.title}. Badge code generated.`,
          tone: "success",
        });
        setRegSuccessModal(reg);
      }
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        body: err.message || "Could not complete registration. Check if you are already registered.",
        tone: "danger",
      });
    } finally {
      setRegisteringExpo(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!cancelRegTarget) return;
    try {
      await cancelRegistrationLive(cancelRegTarget._id, "Attendee requested cancellation");
      toast({
        title: "Registration Cancelled",
        body: "Your registration has been cancelled successfully.",
        tone: "warn",
      });
      setCancelRegTarget(null);
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Error cancelling registration",
        body: err.message || "Failed to cancel registration.",
        tone: "danger",
      });
    }
  };

  const handleBookAppointment = async () => {
    if (!bookApptExhibitor) return;
    const expoId = apptExpoId || liveExpos.find((x) => x.status === "Live" || x.status === "Upcoming" || (x.status as any) === "live" || (x.status as any) === "published")?.id || liveExpos[0]?.id;
    if (!expoId) {
      toast({ title: "No active expo found", tone: "danger" });
      return;
    }
    if (!apptDate) {
      toast({ title: "Please pick an appointment date", tone: "danger" });
      return;
    }
    setBookingAppt(true);
    try {
      await createAppointmentLive({
        expo: expoId,
        exhibitor: bookApptExhibitor.id,
        title: `Meeting with ${bookApptExhibitor.company}`,
        date: apptDate,
        startTime: apptTime,
        durationMinutes: apptDuration,
        type: apptType,
        location: apptLocation || `Booth ${bookApptExhibitor.booth || "TBD"}`,
        agenda: apptAgenda || `Discussing business collaboration and product offerings.`,
        initiatedBy: "attendee",
      });
      toast({
        title: "Appointment Requested! 📅",
        body: `Meeting request sent to ${bookApptExhibitor.company}. You will be notified when they confirm.`,
        tone: "success",
      });
      setBookApptExhibitor(null);
      setApptAgenda("");
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Could not book appointment",
        body: err.message || "Failed to submit appointment request.",
        tone: "danger",
      });
    } finally {
      setBookingAppt(false);
    }
  };

  const handleSaveAttendeeProfile = async () => {
    setSavingProfile(true);
    try {
      const { patch } = await import("@/lib/api");
      const res = await patch<any>("/users/me", {
        name: profileName,
        phone: profilePhone,
        company: profileCompany,
        jobTitle: profileJobTitle,
        address: profileCountry,
      });
      if (res?.data) {
        login(res.data, authMode);
      }
      toast({
        title: "Profile Updated ✓",
        body: "Your profile details have been saved to MongoDB.",
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Profile Save Failed",
        body: err.message || "Failed to update profile.",
        tone: "danger",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelApptTarget) return;
    try {
      await cancelAppointmentLive(cancelApptTarget._id, "Cancelled by attendee");
      toast({
        title: "Appointment Cancelled",
        body: "The meeting request has been cancelled.",
        tone: "warn",
      });
      setCancelApptTarget(null);
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Error cancelling appointment",
        body: err.message || "Failed to cancel appointment.",
        tone: "danger",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!fbBody.trim() || fbBody.trim().length < 10) {
      toast({ title: "Please provide at least 10 characters in your review", tone: "danger" });
      return;
    }
    setSubmittingFeedback(true);
    try {
      const payload: any = {
        targetType: fbTargetType,
        rating: fbRating,
        title: fbTitle.trim() || "Event Feedback",
        body: fbBody.trim(),
        category: fbCategory,
        wouldRecommend: fbRecommend,
      };
      if (fbTargetType === "expo" && fbTargetId) {
        payload.expo = fbTargetId;
      } else if (fbTargetType === "exhibitor" && fbTargetId) {
        payload.exhibitor = fbTargetId;
      } else if (fbTargetType === "session" && fbTargetId) {
        payload.session = fbTargetId;
      } else if (liveExpos[0]?.id) {
        payload.expo = liveExpos[0].id;
      }

      await submitFeedbackLive(payload);
      toast({
        title: "Feedback Submitted! ⭐",
        body: "Thank you for your valuable feedback. It has been recorded in MongoDB.",
        tone: "success",
      });
      setFeedbackOpen(false);
      setFbTitle("");
      setFbBody("");
      setFbRating(5);
      loadData(true);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        body: err.message || "Could not submit feedback.",
        tone: "danger",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read", tone: "success" });
    } catch (err: any) {
      toast({ title: "Failed to mark notifications", body: err.message, tone: "danger" });
    }
  };

  const handleMarkSingleNotifRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.warn("Could not mark notif read:", err);
    }
  };

  return (
    <PortalLayout
      roleLabel="Attendee dashboard"
      roleShort="Attendee"
      nav={NAV_ITEMS}
      active={tab}
      onNavigate={setTab}
      searchPlaceholder="Search sessions, exhibitors, expos…"
      headerRight={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw className={cn("size-4", refreshing && "animate-spin")} />}
            onClick={() => loadData(true)}
            className="hidden sm:inline-flex"
            title="Refresh Live Data"
          >
            Sync
          </Button>
          {activeRegistrations.length > 0 && (
            <Button
              size="sm"
              icon={<QrCode className="size-4" />}
              onClick={() => setBadgeModalOpen(activeRegistrations[0])}
              className="inline-flex"
            >
              My e-Badge
            </Button>
          )}
        </div>
      }
      banner={
        <section className="relative overflow-hidden bg-ink-950">
          <img
            src={
              featuredExpo && "cover" in featuredExpo
                ? (featuredExpo as any).cover
                : liveExpos[0]?.cover ||
                  "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
            }
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/60" />
          <div className="pointer-events-none absolute inset-0 grid-noise-dark opacity-50" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0">
                <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">
                  <Sparkles className="size-3" />
                  {featuredExpo?.title || "EventSphere International Expo 2026"}
                </Badge>
                <h1 className="mt-3 font-display text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[32px]">
                  Hi {user?.name?.split(" ")[0] ?? "Attendee"}, your live agenda is ready
                </h1>
                <p className="mt-1.5 max-w-xl text-[13.5px] text-slate-300/90">
                  You have {savedSessions.length} bookmarked sessions, {activeRegistrations.length} active event pass
                  {activeRegistrations.length === 1 ? "" : "es"}, and{" "}
                  {appointments.filter((a) => a.status === "confirmed").length} confirmed meetings.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {activeRegistrations.length > 0 ? (
                    <Button
                      size="sm"
                      icon={<QrCode className="size-4" />}
                      onClick={() => setBadgeModalOpen(activeRegistrations[0])}
                    >
                      Show my badge
                    </Button>
                  ) : (
                    <Button size="sm" icon={<Ticket className="size-4" />} onClick={() => setTab("expos")}>
                      Register for an expo
                    </Button>
                  )}
                  <Link to="/floor-plan">
                    <Button size="sm" variant="outline" icon={<MapPin className="size-4" />}>
                      Open floor plan
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Digital Pass Card */}
              <div className="w-[220px] rounded-3xl border border-white/12 bg-white/[0.055] p-4 backdrop-blur-2xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Live Digital Pass</p>
                <div className="mt-2.5 grid place-items-center rounded-2xl bg-white p-3.5 shadow-md">
                  <QrCode className="size-20 text-slate-900" strokeWidth={1.2} />
                </div>
                <p className="mt-2.5 text-center font-display text-[13px] font-bold text-white">
                  {user?.name ?? "Event Attendee"}
                </p>
                <p className="text-center font-mono text-[10.5px] text-brand-300">
                  {activeRegistrations[0]?.badgeCode || (user as any)?._id?.slice(-8).toUpperCase() || user?.id?.slice(-8).toUpperCase() || "PASS-LIVE"}
                </p>
                <div className="mt-2 rounded-lg bg-emerald-400/15 px-2 py-1 text-center text-[10px] font-bold text-emerald-300">
                  {activeRegistrations[0]?.ticketType
                    ? `${activeRegistrations[0].ticketType.toUpperCase()} PASS`
                    : "ACTIVE ATTENDEE"}
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    >
      {/* Title & Quick Stats */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">
            {NAV_ITEMS.find((n) => n.id === tab)?.label}
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            {featuredExpo?.title ? `${featuredExpo.title} · Live MongoDB Portal` : "Live Attendee Portal"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeRegistrations.length > 0 ? (
            <Badge tone="success" dot>
              {activeRegistrations[0].ticketType} Pass
            </Badge>
          ) : (
            <Badge tone="warn" dot>
              No active pass
            </Badge>
          )}
          <Badge tone="brand">{savedSessions.length} bookmarked</Badge>
          <Badge tone="info">
            {appointments.filter((a) => a.status === "confirmed").length} confirmed meetings
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-brand-600" />
          <p className="text-[13px] font-semibold text-slate-500">Syncing live data from MongoDB...</p>
        </div>
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Registered Expos"
                  value={String(activeRegistrations.length)}
                  icon={<Ticket className="size-5" />}
                  tone="brand"
                  sub="Active passes"
                  spark={<Sparkline values={[1, 1, 2, 2, 3, activeRegistrations.length || 1]} color="#6854d9" width={140} height={32} />}
                />
                <StatCard
                  label="Bookmarked Sessions"
                  value={String(savedSessions.length)}
                  icon={<Bookmark className="size-5" />}
                  tone="info"
                  sub="Personal schedule"
                  spark={<Sparkline values={[1, 2, 3, 3, 4, savedSessions.length || 1]} color="#0ea5e9" width={140} height={32} />}
                />
                <StatCard
                  label="Exhibitor Meetings"
                  value={String(appointments.length)}
                  delta={appointments.filter((a) => a.status === "confirmed").length > 0 ? `+${appointments.filter((a) => a.status === "confirmed").length} confirmed` : undefined}
                  icon={<CalendarClock className="size-5" />}
                  tone="success"
                  sub="Booked via portal"
                  spark={<Sparkline values={[0, 1, 1, 2, appointments.length || 1]} color="#10b981" width={140} height={32} />}
                />
                <StatCard
                  label="Unread Alerts"
                  value={String(unreadNotifsCount)}
                  icon={<Bell className="size-5" />}
                  tone="warn"
                  sub="System updates"
                  spark={<Sparkline values={[0, 1, 2, 1, unreadNotifsCount || 0]} color="#f97316" width={140} height={32} />}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {/* Next up in agenda */}
                <Card className="xl:col-span-2">
                  <CardHeader
                    title="Next up in your agenda"
                    subtitle="Real sessions bookmarked in your personal schedule"
                    right={
                      <Link to="/schedule">
                        <Button size="xs" variant="ghost">
                          Browse schedule
                        </Button>
                      </Link>
                    }
                  />
                  <div className="space-y-3 p-5">
                    {savedSessions.length === 0 ? (
                      <EmptyState
                        icon={<Bookmark className="size-6" />}
                        title="No sessions bookmarked yet"
                        body="Browse the live event schedule and tap the bookmark icon on any session you would like to attend."
                        action={
                          <Link to="/schedule">
                            <Button>Explore sessions</Button>
                          </Link>
                        }
                      />
                    ) : (
                      savedSessions.slice(0, 3).map((s) => <SessionCard key={s.id} s={s} compact />)
                    )}
                  </div>
                </Card>

                {/* Notifications Preview */}
                <Card>
                  <CardHeader
                    title="Live Notifications"
                    subtitle="Real-time updates from MongoDB"
                    right={
                      <Badge tone="brand">
                        {unreadNotifsCount} unread
                      </Badge>
                    }
                  />
                  <div className="divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[12.5px] text-slate-400">
                        No notifications yet. You are all caught up!
                      </div>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkSingleNotifRead(n._id)}
                          className={cn(
                            "flex cursor-pointer gap-3 px-5 py-3.5 transition hover:bg-slate-50",
                            !n.read && "bg-brand-50/20"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl",
                              n.priority === "urgent" || n.priority === "high"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-brand-50 text-brand-600"
                            )}
                          >
                            <Bell className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-bold leading-snug text-slate-900">{n.title}</p>
                              {!n.read && <span className="size-2 rounded-full bg-brand-600" />}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-slate-500">{n.body}</p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Recommended Exhibitors */}
              <Card>
                <CardHeader
                  title="Recommended Exhibitors"
                  subtitle="Top-rated verified exhibitors with allocated booths"
                />
                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  {recommendedExhibitors.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-[13px]">
                      No approved exhibitors with assigned booths available yet.
                    </div>
                  ) : (
                    recommendedExhibitors.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-start gap-3">
                            <ExhibitorLogo name={e.company} bg={e.logoBg} size={40} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-slate-900">{e.company}</p>
                              <p className="truncate text-[11px] text-slate-500">{e.category}</p>
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-2 text-[11.5px] leading-snug text-slate-600">
                            {e.description || "Leading innovator offering breakthrough industry solutions."}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <Badge tone="brand">
                            Booth {typeof e.booth === "object" ? (e.booth as any)?.boothId || (e.booth as any)?.name || "TBD" : e.booth}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={<CalendarClock className="size-3.5" />}
                              onClick={() => {
                                openAppointmentModal(e);
                                setApptLocation(`Booth ${typeof e.booth === "object" ? (e.booth as any)?.boothId || (e.booth as any)?.name || "TBD" : e.booth}`);
                              }}
                              title="Book meeting"
                            >
                              Meet
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={<MessageSquare className="size-3.5" />}
                              onClick={() => setContact({ id: e.id, name: e.company })}
                            >
                              Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Your Expo Activity */}
              <Reveal>
                <Card>
                  <CardHeader
                    title="Your Live Expo Activity"
                    subtitle="Live tracking of your participation in EventSphere"
                  />
                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          i: Ticket,
                          l: "Expos Registered",
                          v: `${activeRegistrations.length} events`,
                          p: Math.min(100, activeRegistrations.length * 50),
                        },
                        {
                          i: Bookmark,
                          l: "Sessions Saved",
                          v: `${savedSessions.length} sessions`,
                          p: Math.min(100, savedSessions.length * 20),
                        },
                        {
                          i: CalendarClock,
                          l: "Meetings Booked",
                          v: `${appointments.length} meetings`,
                          p: Math.min(100, appointments.length * 25),
                        },
                        {
                          i: Star,
                          l: "Feedback Reviews",
                          v: `${feedbacks.length} submitted`,
                          p: Math.min(100, feedbacks.length * 33),
                        },
                      ].map((a) => (
                        <div key={a.l} className="rounded-2xl border border-slate-200 p-4">
                          <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                            <a.i className="size-4" />
                          </span>
                          <p className="mt-3 font-display text-[16px] font-bold text-slate-900">{a.v}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{a.l}</p>
                          <div className="mt-2.5">
                            <Progress value={a.p} height={5} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </Reveal>
            </div>
          )}

          {/* TAB: AGENDA */}
          {tab === "agenda" && (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="My Bookmarked Sessions"
                  subtitle={`${savedSessions.length} sessions selected · reminders enabled`}
                  right={
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Download className="size-4" />}
                      onClick={() =>
                        toast({
                          title: "Agenda Exported",
                          body: "Your bookmarked schedule has been exported to calendar format.",
                          tone: "success",
                        })
                      }
                    >
                      Export calendar
                    </Button>
                  }
                />
                {savedSessions.length === 0 ? (
                  <EmptyState
                    icon={<Bookmark className="size-6" />}
                    title="Your agenda is empty"
                    body="Browse the schedule and tap the bookmark icon on any session you would like to attend."
                    action={
                      <Link to="/schedule">
                        <Button icon={<CalendarDays className="size-4" />}>Browse the schedule</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3 p-5">
                    {savedSessions.map((s) => (
                      <SessionCard key={s.id} s={s} />
                    ))}
                  </div>
                )}
              </Card>

              {savedSessions.length > 0 && (
                <Card>
                  <CardHeader title="Day-by-day plan" subtitle="Your personalized session timeline" />
                  <div className="grid gap-4 p-5 lg:grid-cols-4">
                    {["Day 1", "Day 2", "Day 3", "Day 4"].map((d) => {
                      const items = savedSessions.filter((s) => s.day === d);
                      return (
                        <div key={d} className="rounded-2xl bg-slate-50 p-3.5">
                          <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                            {d}
                          </p>
                          {items.length === 0 ? (
                            <p className="px-1 py-4 text-[12px] text-slate-400">No sessions booked</p>
                          ) : (
                            <div className="space-y-2.5">
                              {items.map((s) => (
                                <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                                  <p className="font-display text-[12px] font-bold text-brand-700">{s.start}</p>
                                  <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-900">
                                    {s.title}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                    <MapPin className="size-3" /> {s.stage}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB: EXHIBITORS */}
          {tab === "exhibitors" && (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="relative min-w-0 flex-1">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search exhibitors by company, product or keyword…"
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-[14px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
                    />
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 min-w-[190px]">
                    {exhibitorCategories.map((c) => (
                      <option key={c} value={c}>
                        {c === "All" ? "All categories" : c}
                      </option>
                    ))}
                  </Select>
                  <Badge tone="neutral" className="h-8 px-3">
                    {filteredExhibitors.length} exhibitors
                  </Badge>
                </div>
              </Card>

              {filteredExhibitors.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Building2 className="size-6" />}
                    title="No exhibitors found"
                    body="Try a different keyword or widen the category filter."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setQ("");
                          setCat("All");
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExhibitors.map((e) => (
                    <Card key={e.id} hover className="flex flex-col justify-between p-5">
                      <div>
                        <div className="flex items-start gap-3.5">
                          <ExhibitorLogo name={e.company} bg={e.logoBg} size={48} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-[15px] font-bold text-slate-900">{e.company}</p>
                            <p className="mt-0.5 text-[11.5px] text-slate-500">{e.category}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-[11.5px] font-bold text-slate-700">{e.rating}</span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <Globe2 className="size-3" /> {e.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">
                          {e.description || "Verified company participating in EventSphere expo."}
                        </p>
                        {e.products && e.products.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {e.products.slice(0, 4).map((p) => (
                              <span
                                key={p}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                        <Badge tone="brand">
                          <MapPin className="size-3" /> Booth {typeof e.booth === "object" ? (e.booth as any)?.boothId || (e.booth as any)?.name || "TBD" : e.booth}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{e.hall}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            size="xs"
                            variant="secondary"
                            icon={<CalendarClock className="size-3" />}
                            onClick={() => {
                              openAppointmentModal(e);
                              setApptLocation(`Booth ${typeof e.booth === "object" ? (e.booth as any)?.boothId || (e.booth as any)?.name || "TBD" : e.booth}`);
                            }}
                          >
                            Meet
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={<MessageSquare className="size-3.5" />}
                            onClick={() => setContact({ id: e.id, name: e.company })}
                          >
                            Chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXPOS / EVENT REGISTRATION */}
          {tab === "expos" && (
            <div className="space-y-6">
              {/* My Registered Events */}
              <Card>
                <CardHeader
                  title="Your registered events"
                  subtitle="Live active registrations linked to your user account in MongoDB"
                  right={
                    <Badge tone="success" dot>
                      {activeRegistrations.length} active
                    </Badge>
                  }
                />
                <div className="divide-y divide-slate-100">
                  {activeRegistrations.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[13.5px] font-medium text-slate-600">You have not registered for any events yet.</p>
                      <p className="mt-1 text-[12px] text-slate-400">
                        Choose an upcoming expo below to get your digital badge and fast-lane entry pass.
                      </p>
                    </div>
                  ) : (
                    activeRegistrations.map((r) => (
                      <div key={r._id} className="flex flex-wrap items-center gap-4 p-5">
                        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-sm">
                          <Ticket className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-bold text-slate-900">
                              {r.expo?.title || "International Expo"}
                            </p>
                            <Badge
                              tone={
                                r.status === "confirmed"
                                  ? "success"
                                  : r.status === "pending_payment"
                                  ? "warn"
                                  : "neutral"
                              }
                              dot={r.status === "confirmed"}
                            >
                              {r.status}
                            </Badge>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                            {r.expo?.startDate && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" />
                                {new Date(r.expo.startDate).toLocaleDateString()} –{" "}
                                {r.expo.endDate ? new Date(r.expo.endDate).toLocaleDateString() : ""}
                              </span>
                            )}
                            {r.expo?.venue && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-3.5" />
                                {typeof r.expo.venue === "string"
                                  ? r.expo.venue
                                  : `${r.expo.venue.name || ""} (${r.expo.venue.city || ""})`}
                              </span>
                            )}
                            {r.badgeCode && (
                              <span className="font-mono font-bold text-brand-600">
                                Badge: {r.badgeCode}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-[12px] font-semibold text-brand-600">
                            {r.ticketType} Pass · ${r.pricing?.total ?? 0}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                          {r.status === "pending_payment" ? (
                            <Button
                              size="sm"
                              full
                              icon={<Banknote className="size-3.5" />}
                              onClick={() => handlePayRegistration(r)}
                              disabled={payingRegId === r._id}
                            >
                              {payingRegId === r._id ? "Starting..." : "Pay Ticket Fee"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              full
                              variant="secondary"
                              icon={<QrCode className="size-3.5" />}
                              onClick={() => setBadgeModalOpen(r)}
                            >
                              Show badge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            full
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setCancelRegTarget(r)}
                          >
                            Cancel pass
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Browse and register for expos */}
              <div>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
                      Browse and register for Expos
                    </h3>
                    <p className="mt-1 text-[13px] text-slate-500">
                      Published editions open for live attendee registration
                    </p>
                  </div>
                  <Link to="/expos">
                    <Button size="sm" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
                      Explore all expos
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {liveExpos.map((e) => {
                    const isRegistered = activeRegistrations.some((r) => r.expo?._id === e.id);
                    return (
                      <Card key={e.id} className="overflow-hidden">
                        <img src={e.cover} alt={e.title} className="h-44 w-full object-cover" />
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-2">
                            <Badge tone="brand">{e.category}</Badge>
                            <span className="text-[12px] font-bold text-brand-700">${e.price} starting</span>
                          </div>
                          <h4 className="mt-3 font-display text-[16px] font-bold text-slate-900 line-clamp-1">
                            {e.title}
                          </h4>
                          <p className="mt-1 text-[12px] text-slate-500 line-clamp-2">
                            {e.description || "Discover breakthrough industry solutions and connect with top exhibitors."}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[11.5px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" /> {e.startDate}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" /> {e.city}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <Link to={`/expos/${e.slug || e.id}`}>
                              <Button size="xs" variant="ghost">
                                Details
                              </Button>
                            </Link>
                            {isRegistered ? (
                              <Badge tone="success" dot>
                                Registered ✓
                              </Badge>
                            ) : (
                              <Button
                                size="xs"
                                icon={<Ticket className="size-3.5" />}
                                onClick={() => setRegisterExpoModal(e)}
                              >
                                Register Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TICKETS */}
          {tab === "tickets" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="My tickets & passes"
                  subtitle="Active entry badges and event access tokens"
                  right={
                    <Badge tone="success" dot>
                      {activeRegistrations.length} Active
                    </Badge>
                  }
                />
                <div className="divide-y divide-slate-100">
                  {activeRegistrations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Ticket className="mx-auto size-10 text-slate-300" />
                      <p className="mt-3 font-bold text-slate-700">No tickets purchased yet</p>
                      <p className="mt-1 text-[12px] text-slate-400">
                        Register for an upcoming expo to receive your e-Badge and admission credentials.
                      </p>
                      <Button size="sm" className="mt-4" onClick={() => setTab("expos")}>
                        Browse Expos
                      </Button>
                    </div>
                  ) : (
                    activeRegistrations.map((t) => (
                      <div key={t._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                          <Ticket className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-slate-900">{t.ticketType} Pass</p>
                          <p className="mt-0.5 text-[12px] text-slate-500">{t.expo?.title}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                            {t.expo?.startDate && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="size-3" /> {new Date(t.expo.startDate).toLocaleDateString()}
                              </span>
                            )}
                            <span className="font-mono text-[10.5px] text-brand-600 font-bold">
                              {t.badgeCode || t._id.slice(-8).toUpperCase()}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-[18px] font-bold text-slate-900">
                            ${t.pricing?.total ?? 0}
                          </p>
                          <Badge tone="brand" className="mt-1">
                            {t.status}
                          </Badge>
                        </div>
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={<QrCode className="size-3.5" />}
                          onClick={() => setBadgeModalOpen(t)}
                        >
                          Show QR
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Pass info / support sidebar */}
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                    <Ticket className="size-5" />
                    <p className="mt-3 font-display text-[15px] font-bold">Digital Fast-Lane Badge</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/80">
                      Your QR code grants fast-lane entry through turnstiles and booth scanning for seamless business card exchanges.
                    </p>
                    {activeRegistrations.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => setBadgeModalOpen(activeRegistrations[0])}
                      >
                        Open Active Badge
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: APPOINTMENTS */}
          {tab === "appointments" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Confirmed"
                  value={String(appointments.filter((a) => a.status === "confirmed").length)}
                  icon={<CheckCircle2 className="size-5" />}
                  tone="brand"
                  sub="Upcoming meetings"
                />
                <StatCard
                  label="Pending"
                  value={String(appointments.filter((a) => a.status === "pending").length)}
                  icon={<Clock className="size-5" />}
                  tone="warn"
                  sub="Awaiting exhibitor reply"
                />
                <StatCard
                  label="Completed"
                  value={String(appointments.filter((a) => a.status === "completed").length)}
                  icon={<CalendarClock className="size-5" />}
                  tone="success"
                  sub="This edition"
                />
                <StatCard
                  label="Total Meeting Time"
                  value={`${appointments
                    .filter((a) => a.status !== "cancelled" && a.status !== "declined")
                    .reduce((s, a) => s + (a.durationMinutes || 30), 0)}m`}
                  icon={<Users className="size-5" />}
                  tone="info"
                  sub="Booked with exhibitors"
                />
              </div>

              <Card>
                <CardHeader
                  title="Your Appointments"
                  subtitle="Live meetings requested with exhibitors from MongoDB"
                  right={
                    <Button
                      size="sm"
                      icon={<CalendarClock className="size-4" />}
                      onClick={() => {
                        if (liveExhibitors.length > 0) {
                          openAppointmentModal(liveExhibitors[0]);
                          setApptLocation(`Booth ${liveExhibitors[0].booth}`);
                        } else {
                          toast({ title: "No approved exhibitors available to meet", tone: "warn" });
                        }
                      }}
                    >
                      Book a meeting
                    </Button>
                  }
                />
                <div className="divide-y divide-slate-100">
                  {appointments.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[13.5px] font-medium text-slate-600">No appointments requested yet.</p>
                      <p className="mt-1 text-[12px] text-slate-400">
                        Schedule one-on-one meetings with exhibitors directly through the portal.
                      </p>
                      <Button
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          if (liveExhibitors.length > 0) {
                            openAppointmentModal(liveExhibitors[0]);
                          } else {
                            toast({ title: "No exhibitors available", tone: "warn" });
                          }
                        }}
                      >
                        Request Meeting
                      </Button>
                    </div>
                  ) : (
                    appointments.map((a) => (
                      <div key={a._id} className="flex flex-wrap items-start gap-4 p-5">
                        <Avatar
                          src={a.exhibitor?.logo?.url || a.recipient?.avatar}
                          name={a.exhibitor?.company?.name || a.recipient?.name || "Exhibitor"}
                          size={44}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-bold text-slate-900">
                              {a.exhibitor?.company?.name || a.recipient?.name || a.title || "Meeting"}
                            </p>
                            <Badge
                              tone={
                                a.status === "confirmed"
                                  ? "success"
                                  : a.status === "pending"
                                  ? "warn"
                                  : a.status === "completed"
                                  ? "brand"
                                  : "danger"
                              }
                              dot={a.status === "pending"}
                            >
                              {a.status}
                            </Badge>
                            <Badge tone="neutral" className="bg-slate-50">
                              {a.type}
                            </Badge>
                          </div>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="size-3.5 text-brand-500" />
                              {new Date(a.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="size-3.5" /> {a.startTime} · {a.durationMinutes} min
                            </span>
                            {a.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-3.5" /> {a.location}
                              </span>
                            )}
                          </p>
                          {a.agenda && (
                            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{a.agenda}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                          {a.status === "pending" ? (
                            <Button
                              size="sm"
                              full
                              variant="ghost"
                              icon={<X className="size-3.5" />}
                              onClick={() => setCancelApptTarget(a)}
                            >
                              Withdraw request
                            </Button>
                          ) : a.status === "confirmed" ? (
                            <Button
                              size="sm"
                              full
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setCancelApptTarget(a)}
                            >
                              Cancel meeting
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              full
                              variant="secondary"
                              onClick={() => {
                                setFbTargetType("exhibitor");
                                setFbTargetTitle(a.exhibitor?.company?.name || "Exhibitor");
                                setFbTargetId(a.exhibitor?._id || "");
                                setFeedbackOpen(true);
                              }}
                            >
                              Leave feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB: FEEDBACK */}
          {tab === "feedback" && (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Submit Feedback"
                  subtitle="Rate sessions, review the expo, or evaluate exhibitor booths"
                  right={
                    <Button
                      size="sm"
                      icon={<Star className="size-4" />}
                      onClick={() => {
                        setFbTargetType("expo");
                        setFbTargetTitle(featuredExpo?.title || "Expo");
                        setFbTargetId((featuredExpo as any)?._id || (featuredExpo as any)?.id || liveExpos[0]?.id || "");
                        setFeedbackOpen(true);
                      }}
                    >
                      Write a review
                    </Button>
                  }
                />
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {[
                    {
                      t: "Event review",
                      d: "Overall expo organization, venue & facilities",
                      i: Globe2,
                      type: "expo" as const,
                    },
                    {
                      t: "Session rating",
                      d: "Rate a speaker, workshop or panel session",
                      i: CalendarClock,
                      type: "session" as const,
                    },
                    {
                      t: "Exhibitor feedback",
                      d: "Review booth demonstrations and product demos",
                      i: Building2,
                      type: "exhibitor" as const,
                    },
                  ].map((x) => (
                    <button
                      key={x.t}
                      onClick={() => {
                        setFbTargetType(x.type);
                        setFbTargetTitle(x.t);
                        setFeedbackOpen(true);
                      }}
                      className="text-left"
                    >
                      <Card hover className="group h-full p-5">
                        <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white">
                          <x.i className="size-5" />
                        </span>
                        <p className="mt-4 text-[14px] font-bold text-slate-900">{x.t}</p>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">{x.d}</p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-600">
                          Write review <ArrowRight className="size-3.5" />
                        </span>
                      </Card>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Submitted Feedback */}
              <Card>
                <CardHeader
                  title="Your Submitted Feedback"
                  subtitle={`${feedbacks.length} reviews recorded in MongoDB`}
                />
                <div className="divide-y divide-slate-100">
                  {feedbacks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[13px]">
                      You haven't submitted any feedback yet. Help us improve by leaving a review above!
                    </div>
                  ) : (
                    feedbacks.map((f) => (
                      <div key={f._id} className="flex flex-wrap items-start gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13.5px] font-bold text-slate-900">{f.title || "Feedback"}</p>
                            <Badge tone="brand">{f.targetType}</Badge>
                            <Badge tone={f.status === "resolved" ? "success" : "warn"}>{f.status || "Submitted"}</Badge>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "size-3.5",
                                    i < (f.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                  )}
                                />
                              ))}
                            </span>
                            <span className="text-[11.5px] text-slate-400">
                              {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{f.body || f.comment}</p>
                          {f.staffReply?.body && (
                            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3">
                              <p className="text-[11px] font-bold text-brand-700">Reply from the organizer</p>
                              <p className="mt-1 text-[12.5px] leading-relaxed text-brand-900">
                                {f.staffReply.body}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {tab === "notifications" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="All Notifications"
                  subtitle="Real-time schedule changes, reminders and approvals"
                  right={
                    <Button size="xs" variant="ghost" onClick={handleMarkAllNotifsRead}>
                      Mark all read
                    </Button>
                  }
                />
                <div className="divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[13px]">
                      No notifications found.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkSingleNotifRead(n._id)}
                        className={cn(
                          "flex cursor-pointer gap-3 px-5 py-4 transition hover:bg-slate-50",
                          !n.read && "bg-brand-50/20"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                            n.priority === "urgent" || n.priority === "high"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-brand-50 text-brand-600"
                          )}
                        >
                          <Bell className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-bold leading-snug text-slate-900">{n.title}</p>
                            {!n.read && <span className="size-2 rounded-full bg-brand-600" />}
                          </div>
                          <p className="mt-0.5 text-[12px] text-slate-500">{n.body}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader title="Notification Settings" subtitle="How and when we alert you" />
                <div className="space-y-5 p-5">
                  <Toggle checked label="Session reminders" desc="45 minutes before bookmarked sessions" onChange={() => {}} />
                  <Toggle checked label="Schedule change alerts" desc="Instant notification for hall/time updates" onChange={() => {}} />
                  <Toggle checked label="Exhibitor meeting alerts" desc="Instant notifications when requests are confirmed" onChange={() => {}} />
                  <Button variant="secondary" onClick={() => toast({ title: "Preferences saved ✓", tone: "success" })}>
                    Save preferences
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {tab === "payments" && <UserPaymentsView />}

          {/* TAB: MESSAGES */}
          {tab === "messages" && <RealtimeChatView defaultFilter="ALL" />}

          {/* TAB: SETTINGS & COMPLIANCE */}
          {tab === "settings" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Personal Profile" subtitle="Your attendee identity across registered expos in MongoDB" />
                <div className="space-y-4 p-5">
                  <Field label="Full name" required>
                    <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </Field>
                  <Field label="Email address" hint="Primary login identity (read-only)">
                    <Input value={user?.email || ""} disabled className="bg-slate-50 cursor-not-allowed" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Organization / Company">
                      <Input value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} placeholder="e.g. Acme Innovations" />
                    </Field>
                    <Field label="Job title">
                      <Input value={profileJobTitle} onChange={(e) => setProfileJobTitle(e.target.value)} placeholder="e.g. Software Lead" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone number">
                      <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+1 (555) 012-3456" />
                    </Field>
                    <Field label="Country / Region">
                      <Input value={profileCountry} onChange={(e) => setProfileCountry(e.target.value)} placeholder="e.g. United States" />
                    </Field>
                  </div>
                  <Field label="Professional Bio" hint="Shown on attendee connection cards">
                    <Textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Brief summary of your professional background and event interests..." />
                  </Field>
                  <Button onClick={handleSaveAttendeeProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving to MongoDB..." : "Save Profile Changes"}
                  </Button>
                </div>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader title="Account Compliance & Security" subtitle="Verified status & event access credentials" />
                  <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div>
                          <p className="text-[13.5px] font-bold text-emerald-950">Attendee Account Verified</p>
                          <p className="text-[12px] text-emerald-800/80">Compliant with EventSphere security & fast-lane protocol</p>
                        </div>
                      </div>
                      <Badge tone="success" dot>Active</Badge>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <p className="text-[13px] font-bold text-slate-800">Consent & Privacy Compliance</p>
                      <div className="space-y-2 text-[12px] text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>Terms of Service Acceptance:</span>
                          <span className="font-semibold text-emerald-700">Agreed ✓</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>GDPR & Data Processing Consent:</span>
                          <span className="font-semibold text-emerald-700">Consented ✓</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Active Event Badges Issued:</span>
                          <span className="font-semibold text-brand-700">{activeRegistrations.length} Badges</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-[13px] font-bold text-slate-800">Privacy Preferences</p>
                      <Toggle
                        checked={attendeePrivacy.showProfileToExhibitors}
                        label="Visible in Attendee Directory"
                        desc="Allows verified exhibitors to discover and connect with you"
                        onChange={(v) => setAttendeePrivacy((p) => ({ ...p, showProfileToExhibitors: v }))}
                      />
                      <Toggle
                        checked={attendeePrivacy.allowDirectInquiries}
                        label="Allow Exhibitor Meeting Requests"
                        desc="Receive scheduled appointment invitations from booth teams"
                        onChange={(v) => setAttendeePrivacy((p) => ({ ...p, allowDirectInquiries: v }))}
                      />
                      <Toggle
                        checked={attendeePrivacy.shareContactWithBoothStaff}
                        label="Fast-Lane Contact Sharing"
                        desc="Instantly share contact card upon QR badge scanning at booths"
                        onChange={(v) => setAttendeePrivacy((p) => ({ ...p, shareContactWithBoothStaff: v }))}
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Notification Alerts" subtitle="Stay updated during expo days" />
                  <div className="space-y-4 p-5">
                    <Toggle
                      checked={attendeeAlerts.meetingAlerts}
                      label="Appointment Confirmation Alerts"
                      desc="Immediate notifications when exhibitors accept or reschedule meetings"
                      onChange={(v) => setAttendeeAlerts((a) => ({ ...a, meetingAlerts: v }))}
                    />
                    <Toggle
                      checked={attendeeAlerts.scheduleChanges}
                      label="Keynote & Stage Schedule Updates"
                      desc="Real-time alerts for speaker schedule changes or venue shifts"
                      onChange={(v) => setAttendeeAlerts((a) => ({ ...a, scheduleChanges: v }))}
                    />
                    <Toggle
                      checked={attendeeAlerts.dailyDigest}
                      label="Daily Event Highlights Digest"
                      desc="Morning digest of top sessions, demos and networking opportunities"
                      onChange={(v) => setAttendeeAlerts((a) => ({ ...a, dailyDigest: v }))}
                    />
                    <Button variant="secondary" onClick={() => toast({ title: "Notification preferences saved ✓", tone: "success" })}>
                      Save Alert Preferences
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: REGISTER FOR EXPO */}
      <Modal
        open={!!registerExpoModal}
        onClose={() => setRegisterExpoModal(null)}
        title={`Register for ${registerExpoModal?.title}`}
        subtitle="Confirm your attendee details and pass selection"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegisterExpoModal(null)}>
              Cancel
            </Button>
            <Button
              icon={<Ticket className="size-4" />}
              disabled={registeringExpo}
              onClick={handleRegisterExpo}
            >
              {registeringExpo ? "Registering in MongoDB..." : "Confirm Registration"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Attendee Name">
            <Input value={user?.name || ""} disabled />
          </Field>
          <Field label="Email Address">
            <Input value={user?.email || ""} disabled />
          </Field>
          <Field label="Select Pass / Ticket Type" required>
            <Select
              value={selectedTicketType}
              onChange={(e) => setSelectedTicketType(e.target.value as any)}
            >
              <option value="Standard">Standard Pass — General Exhibition & Keynotes</option>
              <option value="VIP">VIP Pass — Fast Lane, Lounge & All Stages</option>
              <option value="Workshop">Workshop Pass — Interactive Technical Labs</option>
              <option value="General">General Pass — Day Access</option>
            </Select>
          </Field>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[12px] text-slate-600">
            By confirming, your registration record will be created in MongoDB and a personalized QR e-Badge generated.
          </div>
        </div>
      </Modal>

      {/* MODAL: REGISTRATION SUCCESS */}
      <Modal
        open={!!regSuccessModal}
        onClose={() => setRegSuccessModal(null)}
        title="Registration Confirmed! 🎉"
        subtitle={regSuccessModal?.expo?.title || "Your Expo Pass"}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setRegSuccessModal(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-7" />
            </span>
            <h3 className="mt-3 font-display text-[17px] font-bold text-emerald-900">
              You are all set!
            </h3>
            <p className="mt-1 text-[13px] text-emerald-800/80">
              Your official digital badge code is:
            </p>
            <p className="mt-2 font-mono text-[16px] font-extrabold text-emerald-950">
              {regSuccessModal?.badgeCode}
            </p>
          </div>
          <p className="text-[12px] text-slate-500">
            Show your QR e-Badge at the venue fast-lane entrance for expedited turnstile access.
          </p>
        </div>
      </Modal>

      {/* MODAL: BOOK APPOINTMENT */}
      <Modal
        open={!!bookApptExhibitor}
        onClose={() => setBookApptExhibitor(null)}
        title={`Request Meeting with ${bookApptExhibitor?.company}`}
        subtitle="Schedule a dedicated meeting slot during expo days"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookApptExhibitor(null)}>
              Cancel
            </Button>
            <Button
              icon={<CalendarClock className="size-4" />}
              disabled={bookingAppt}
              onClick={handleBookAppointment}
            >
              {bookingAppt ? "Submitting Request..." : "Request Appointment"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Select Event / Expo" required hint="Choose the expo you are scheduling for">
            <Select
              value={apptExpoId}
              onChange={(e) => {
                const newEid = e.target.value;
                setApptExpoId(newEid);
                const targetExpo = liveExpos.find((x) => x.id === newEid);
                if (targetExpo?.startDate) {
                  const s = new Date(targetExpo.startDate);
                  const ed = targetExpo.endDate ? new Date(targetExpo.endDate) : s;
                  const now = new Date();
                  const defaultD = now >= s && now <= ed ? now : s;
                  setApptDate(defaultD.toISOString().slice(0, 10));
                }
              }}
            >
              {liveExpos.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title} ({new Date(x.startDate).toLocaleDateString()} – {x.endDate ? new Date(x.endDate).toLocaleDateString() : ""})
                </option>
              ))}
            </Select>
          </Field>
          {(() => {
            const currentExpo = liveExpos.find((x) => x.id === apptExpoId) || liveExpos[0];
            const minDate = currentExpo?.startDate ? new Date(currentExpo.startDate).toISOString().slice(0, 10) : undefined;
            const maxDate = currentExpo?.endDate ? new Date(currentExpo.endDate).toISOString().slice(0, 10) : undefined;
            return (
              <>
                {currentExpo && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-2.5 text-[12px] font-medium text-brand-900">
                    📅 Allowed appointment window: {new Date(currentExpo.startDate).toLocaleDateString()} to {currentExpo.endDate ? new Date(currentExpo.endDate).toLocaleDateString() : ""}.
                  </div>
                )}
                <Field label="Meeting Date" required hint="Pick a date during the event">
                  <Input
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                  />
                </Field>
              </>
            );
          })()}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time" required>
              <Select value={apptTime} onChange={(e) => setApptTime(e.target.value)}>
                {["09:30", "10:00", "11:00", "11:30", "13:00", "14:00", "15:00", "16:00", "16:30"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration">
              <Select
                value={String(apptDuration)}
                onChange={(e) => setApptDuration(Number(e.target.value))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </Select>
            </Field>
          </div>
          <Field label="Meeting Type">
            <Select value={apptType} onChange={(e) => setApptType(e.target.value as any)}>
              <option value="Meeting">General Meeting</option>
              <option value="Demo">Product Demo</option>
              <option value="Call">Phone / Video Call</option>
              <option value="Site visit">Booth Visit</option>
            </Select>
          </Field>
          <Field label="Location">
            <Input
              value={apptLocation}
              onChange={(e) => setApptLocation(e.target.value)}
              placeholder="e.g. Booth A-12 or Meeting Room 2"
            />
          </Field>
          <Field label="Discussion Agenda / Notes">
            <Textarea
              value={apptAgenda}
              onChange={(e) => setApptAgenda(e.target.value)}
              placeholder="What would you like to discuss with the exhibitor team?"
            />
          </Field>
        </div>
      </Modal>

      {/* MODAL: SUBMIT FEEDBACK */}
      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Share your feedback"
        subtitle={`Reviewing: ${fbTargetTitle || "EventSphere Expo"}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button
              icon={<Send className="size-4" />}
              disabled={submittingFeedback}
              onClick={handleSubmitFeedback}
            >
              {submittingFeedback ? "Submitting to MongoDB..." : "Submit Review"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Your rating</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFbRating(i + 1)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={cn(
                      "size-7",
                      i < fbRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-[13px] font-bold text-slate-700">{fbRating}.0</span>
            </div>
          </div>

          <Field label="Headline" required>
            <Input
              value={fbTitle}
              onChange={(e) => setFbTitle(e.target.value)}
              placeholder="Summarize your experience in one sentence"
            />
          </Field>

          <Field label="Your detailed review" required hint="At least 10 characters">
            <Textarea
              value={fbBody}
              onChange={(e) => setFbBody(e.target.value)}
              placeholder="What worked well? What could be improved for future editions?"
              className="min-h-[110px]"
            />
          </Field>

          <Field label="Feedback Category">
            <Select value={fbCategory} onChange={(e) => setFbCategory(e.target.value as any)}>
              {["General", "Content", "Logistics", "Venue", "Technology", "Catering"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <Checkbox
              checked={fbRecommend}
              onChange={(v: boolean) => setFbRecommend(v)}
              label="I would recommend this event to a colleague"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: VIEW QR BADGE */}
      <Modal
        open={!!badgeModalOpen}
        onClose={() => setBadgeModalOpen(null)}
        title="Official Attendee e-Badge"
        subtitle={badgeModalOpen?.expo?.title || "EventSphere Expo Pass"}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setBadgeModalOpen(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-center">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-white p-4 shadow-sm">
              <QrCode className="size-40 text-slate-900" strokeWidth={1.2} />
            </div>
            <p className="mt-4 font-display text-[17px] font-extrabold text-slate-900">
              {user?.name ?? "Event Attendee"}
            </p>
            <p className="font-mono text-[13px] font-bold text-brand-700">
              {badgeModalOpen?.badgeCode}
            </p>
            <div className="mt-3 inline-flex rounded-lg bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">
              {badgeModalOpen?.ticketType.toUpperCase()} PASS · FAST-LANE ENTRY
            </div>
          </div>
          <p className="text-[11.5px] text-slate-500">
            Keep this badge accessible on your mobile screen when entering turnstiles and booth areas.
          </p>
        </div>
      </Modal>

      {/* CONFIRM DIALOG: CANCEL APPOINTMENT */}
      <ConfirmDialog
        open={!!cancelApptTarget}
        onClose={() => setCancelApptTarget(null)}
        title="Cancel this appointment?"
        body={`Are you sure you want to cancel your meeting with ${cancelApptTarget?.exhibitor?.company?.name || "the exhibitor"}? They will be notified immediately.`}
        confirmLabel="Cancel Appointment"
        onConfirm={handleCancelAppointment}
      />

      {/* CONFIRM DIALOG: CANCEL REGISTRATION */}
      <ConfirmDialog
        open={!!cancelRegTarget}
        onClose={() => setCancelRegTarget(null)}
        title="Cancel this Expo Registration?"
        body={`Are you sure you want to cancel your registration for ${cancelRegTarget?.expo?.title}? Your badge code will be deactivated.`}
        confirmLabel="Cancel Registration"
        onConfirm={handleCancelRegistration}
      />

      {/* MODAL: DIRECT MESSAGING */}
      <Modal
        open={!!contact}
        onClose={() => setContact(null)}
        title={`Message ${contact?.name}`}
        subtitle="Live direct messaging — conversation will appear in your Messages tab"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContact(null)}>
              Cancel
            </Button>
            <Button
              icon={<Send className="size-4" />}
              disabled={sendingContact || !contactMessage.trim()}
              onClick={handleSendContact}
            >
              {sendingContact ? "Sending..." : "Send message"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject">
            <Input
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder={`Meeting inquiry with ${contact?.name}`}
            />
          </Field>
          <Field label="Message" required>
            <Textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={`Hi ${contact?.name}, I would like to learn more about your solutions…`}
            />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600">
            <Users className="size-4 shrink-0 text-slate-400" />
            Direct message sent via MongoDB Socket.IO. The exhibitor will receive it in real-time.
          </div>
        </div>
      </Modal>

      {/* Checkout Modal for Attendee Tickets */}
      <CheckoutModal
        open={!!checkoutOrder}
        initialOrder={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onSuccess={() => {
          setCheckoutOrder(null);
          loadData(true);
        }}
      />
    </PortalLayout>
  );
}
