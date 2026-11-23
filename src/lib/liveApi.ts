import { get, post, patch, del } from "./api";
import { EXPOS, SESSIONS, EXHIBITORS, BOOTHS, type Expo, type Session, type Exhibitor, type Booth } from "./data";
import { ATTENDEES, FEEDBACK, CONVERSATIONS, type Attendee, type Feedback, type Conversation } from "./mock";

/* =====================================================================
   EventSphere Live API Service Layer
   Connects UI directly to MongoDB / Express API with robust mapping.
   ===================================================================== */

// Helper to determine status display
function mapExpoStatus(status?: string): Expo["status"] {
  switch (status?.toLowerCase()) {
    case "live": return "Live";
    case "completed": return "Completed";
    case "draft": return "Draft";
    case "published": return "Upcoming";
    default: return "Upcoming";
  }
}

function normalizeExpoStatus(status?: string): "draft" | "published" | "live" | "completed" | "archived" {
  if (!status) return "draft";
  const s = status.toLowerCase();
  if (s === "upcoming" || s === "published") return "published";
  if (s === "live" || s === "active") return "live";
  if (s === "completed" || s === "ended") return "completed";
  if (s === "archived") return "archived";
  return "draft";
}

function mapBoothCategory(cat?: string): Booth["size"] {
  if (cat === "Medium" || cat === "Large" || cat === "Island") return cat;
  return "Small";
}

function mapBoothStatus(status?: string): Booth["status"] {
  if (status === "booked") return "sold";
  if (status === "reserved" || status === "blocked") return status;
  return "available";
}

/* ============================ EXPOS CRUD ============================ */
export async function fetchLiveExpos(): Promise<Expo[]> {
  try {
    const res = await get<any[]>("/expos?includeDrafts=true&limit=100");
    if (!res.success || !Array.isArray(res.data)) {
      return EXPOS;
    }
    // If API returned data (even empty array) prefer it over static
    if (res.data.length === 0) return EXPOS;
    return res.data.map((e: any) => ({
      id: e._id || e.id,
      title: e.title || "Untitled Expo",
      slug: e.slug || "",
      category: e.category || "Technology",
      industry: e.industry || "General",
      theme: e.theme || "",
      city: e.venue?.city || e.city || "Dubai",
      venue: e.venue ? `${e.venue.name || ""}${e.venue.hall ? " — " + e.venue.hall : ""}`.trim() : (e.venue || ""),
      startDate: e.startDate ? new Date(e.startDate).toISOString().split("T")[0] : "",
      endDate: e.endDate ? new Date(e.endDate).toISOString().split("T")[0] : "",
      status: mapExpoStatus(e.status),
      attendees: e.stats?.attendees || e.capacity?.attendees || 0,
      exhibitors: e.stats?.exhibitors || e.capacity?.exhibitors || 0,
      sessions: e.stats?.sessions || 0,
      boothsTotal: e.boothsTotal || e.capacity?.booths || 32,
      boothsSold: e.boothsSold || 0,
      price: e.startingPrice || 149,
      cover: e.banner?.url
        ? (e.banner.url.startsWith("/") ? `http://localhost:5000${e.banner.url}` : e.banner.url)
        : "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      description: e.description || "",
      rating: e.stats?.avgRating || 4.8,
      tags: e.tags && e.tags.length > 0 ? e.tags : ["technology", "innovation"],
      featured: Boolean(e.isFeatured),
    }));
  } catch (err) {
    console.warn("Live API /expos fallback to static:", err);
    return EXPOS;
  }
}

export async function createLiveExpo(data: any): Promise<any> {
  const [cityName, countryName] = (data.city || "Dubai, UAE").includes(",")
    ? data.city.split(",").map((s: string) => s.trim())
    : [data.city || "Dubai", "UAE"];

  const desc = (data.description && data.description.trim().length >= 20)
    ? data.description.trim()
    : `${data.title} is an international exhibition and premier event bringing together industry leaders and professionals.`;

  const payload = {
    title: data.title,
    category: data.category || "Technology",
    industry: data.industry || "Technology",
    theme: data.theme || "Next Gen Innovation",
    description: desc,
    startDate: new Date(data.startDate || Date.now() + 86400000 * 30),
    endDate: new Date(data.endDate || Date.now() + 86400000 * 34),
    venue: {
      name: data.venue || "Exhibition Centre",
      hall: data.hall || "Hall 1",
      city: cityName,
      country: countryName || "UAE",
      address: data.venue || "Exhibition Blvd",
    },
    capacity: {
      attendees: Number(data.attendees) || 10000,
      exhibitors: Number(data.exhibitors) || 200,
      booths: Number(data.totalBooths) || 300,
    },
    status: normalizeExpoStatus(data.status || "published"),
    isFeatured: Boolean(data.isFeatured),
  };

  return await post("/expos", payload);
}

export async function updateLiveExpo(id: string, data: any): Promise<any> {
  const payload: any = {};

  // Map UI status values → DB enum values
  if (data.status) payload.status = normalizeExpoStatus(data.status);

  // Title, theme, industry
  if (data.title) payload.title = data.title;
  if (data.theme) payload.theme = data.theme;
  if (data.industry) payload.industry = data.industry;

  // Description — must be ≥20 chars
  if (data.description) {
    payload.description = data.description.trim().length >= 20
      ? data.description.trim()
      : `${data.title || "Expo"} showcases groundbreaking innovations, keynote presentations, and industry booths.`;
  }

  // Dates
  if (data.startDate) payload.startDate = new Date(data.startDate);
  if (data.endDate) payload.endDate = new Date(data.endDate);

  // Category
  if (data.category) payload.category = data.category;

  // Venue — API expects nested object { name, city, country, hall }
  if (data.city || data.venue) {
    const rawCity = data.city || "";
    const [c, co] = rawCity.includes(",")
      ? rawCity.split(",").map((s: string) => s.trim())
      : [rawCity || "Dubai", "UAE"];
    payload.venue = {
      name: data.venue && typeof data.venue === "string" ? data.venue : (data.venueName || "Exhibition Hall"),
      hall: data.hall || "",
      city: c,
      country: co || "UAE",
      address: data.venueAddress || "",
    };
  }

  // Price → stored in capacity or as a custom field (not in schema, skip)
  // isFeatured
  if (typeof data.isFeatured === "boolean") payload.isFeatured = data.isFeatured;

  return await patch(`/expos/${id}`, payload);
}

export async function uploadExpoBanner(id: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const { upload } = await import("./api");
  return await upload(`/expos/${id}/banner`, formData);
}

export async function deleteLiveExpo(id: string): Promise<any> {
  return await del(`/expos/${id}`);
}

/* =========================== SESSIONS CRUD ========================== */
export async function fetchLiveSessions(expoId?: string): Promise<Session[]> {
  try {
    const url = expoId ? `/schedule?expo=${expoId}&limit=200` : "/schedule?limit=200";
    const res = await get<any[]>(url);
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return SESSIONS;
    }
    return res.data.map((s: any, i: number) => ({
      id: s._id || `SS-${String(i + 1).padStart(2, "0")}`,
      expoId: s.expo?._id || s.expo || "expo-1",
      day: `Day ${((i % 4) + 1)}`,
      date: s.date ? new Date(s.date).toISOString().split("T")[0] : "2026-03-18",
      start: s.startTime || "09:00",
      end: s.endTime || "10:00",
      time: `${s.startTime || "09:00"} – ${s.endTime || "10:00"}`,
      title: s.title || "Session",
      speaker: s.speaker?.name || "Featured Speaker",
      speakerRole: s.speaker?.role || "Specialist",
      role: s.speaker?.role || "Specialist",
      company: s.speaker?.company || "EventSphere",
      stage: s.stage || "Main Stage",
      track: s.track || "Vision",
      type: (["Keynote", "Workshop", "Panel", "Demo", "Roundtable"].includes(s.type) ? s.type : "Keynote") as Session["type"],
      capacity: s.capacity || 200,
      registered: s.registeredCount || 0,
      rating: 4.8,
      description: s.description || "",
      tags: s.tags || ["conference"],
      avatar: s.speaker?.avatar || "https://images.pexels.com/photos/6497112/pexels-photo-6497112.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
    }));
  } catch (err) {
    console.warn("Live API /schedule fallback to static:", err);
    return SESSIONS;
  }
}

export async function createLiveSession(data: any): Promise<any> {
  let expoId = data.expoId;
  if (!expoId || !/^[0-9a-fA-F]{24}$/.test(expoId)) {
    try {
      const expos = await get<any[]>("/expos?limit=1");
      if (expos?.data && Array.isArray(expos.data) && expos.data.length > 0) {
        expoId = expos.data[0]._id || expos.data[0].id;
      }
    } catch {
      // fallback
    }
  }

  const payload = {
    expo: expoId,
    title: data.title,
    description: data.description || `${data.title} - session presentation and live Q&A.`,
    type: ["Keynote", "Workshop", "Panel", "Demo", "Roundtable"].includes(data.type) ? data.type : "Keynote",
    track: data.track || "Vision",
    stage: data.stage && data.stage.length >= 2 ? data.stage : "Main Stage",
    date: new Date(data.date || Date.now()),
    startTime: data.startTime || "10:00",
    endTime: data.endTime || "11:00",
    capacity: Number(data.capacity) || 200,
    speaker: {
      name: data.speakerName && data.speakerName.length >= 2 ? data.speakerName : "Guest Speaker",
      role: data.speakerRole || "Speaker",
      company: data.speakerCompany || "Organization",
      bio: data.speakerBio || "",
    },
    isPublished: true,
  };
  return await post("/schedule", payload);
}

export async function updateLiveSession(id: string, data: any): Promise<any> {
  return await patch(`/schedule/${id}`, data);
}

export async function deleteLiveSession(id: string): Promise<any> {
  return await del(`/schedule/${id}`);
}

/* ========================== EXHIBITORS CRUD ========================= */
export async function fetchAdminExhibitors(): Promise<{ exhibitors: Exhibitor[]; applications: any[] }> {
  try {
    const [dirRes, appRes] = await Promise.allSettled([
      get<any[]>("/exhibitors/directory?includeAll=true&limit=100"),
      get<any[]>("/exhibitors/applications"),
    ]);

    let list: Exhibitor[] = EXHIBITORS;
    let apps: any[] = [];

    if (dirRes.status === "fulfilled" && dirRes.value.success && Array.isArray(dirRes.value.data) && dirRes.value.data.length > 0) {
      list = dirRes.value.data.map((p: any, i: number) => ({
        id: p._id || `EX-${i + 1}`,
        company: p.company?.name || "Company",
        logoText: (p.company?.name || "EX").slice(0, 2).toUpperCase(),
        logoBg: "from-indigo-500 to-violet-600",
        category: p.category || "Technology",
        booth: p.boothId || `A-${i + 1}`,
        hall: p.hall || "Hall 1",
        country: p.contact?.country || "United States",
        rep: p.company?.contactPerson || p.staff?.[0]?.name || "Representative",
        avatar: p.logo?.url || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
        status: (p.verificationStatus === "verified" ? "Approved" : p.verificationStatus === "rejected" ? "Rejected" : "Pending") as Exhibitor["status"],
        docs: "Complete" as const,
        staff: (p.staff || []).length || 4,
        leadScore: 88,
        rating: p.rating || 4.8,
        products: (p.products || []).map((x: any) => x.name || x),
        joined: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "2026-01-10",
        traffic: p.stats?.traffic || 1200 + i * 150,
        revenue: p.stats?.revenue || 45000 + i * 5000,
        description: p.company?.description || "",
        badgeTier: "Platinum" as const,
        tier: p.tier || "Standard",
        email: p.contact?.email || `contact@${(p.company?.name || "company").toLowerCase().replace(/\s+/g, "")}.com`,
        leads: p.stats?.leads || 450 + i * 40,
        logo: p.logo?.url || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
      }));
    }

    if (appRes.status === "fulfilled" && appRes.value.success && Array.isArray(appRes.value.data)) {
      apps = appRes.value.data;
    }

    return { exhibitors: list, applications: apps };
  } catch (err) {
    console.warn("Live API /exhibitors fallback to static:", err);
    return { exhibitors: EXHIBITORS, applications: [] };
  }
}

export async function fetchLiveExhibitors(expoId?: string): Promise<{ exhibitors: Exhibitor[]; applications: any[] }> {
  try {
    const query = expoId ? `?expo=${expoId}&limit=100` : "?limit=100";
    const dirRes = await get<any[]>(`/exhibitors/directory${query}`);

    let list: Exhibitor[] = [];
    if (dirRes.success && Array.isArray(dirRes.data)) {
      list = dirRes.data.map((p: any, i: number) => ({
        id: p._id || `EX-${i + 1}`,
        company: p.company?.name || "Company",
        logoText: (p.company?.name || "EX").slice(0, 2).toUpperCase(),
        logoBg: "from-indigo-500 to-violet-600",
        category: p.category || "Technology",
        booth: p.boothId || `A-${i + 1}`,
        hall: p.hall || "Hall 1",
        country: p.contact?.country || "United States",
        rep: p.company?.contactPerson || p.staff?.[0]?.name || "Representative",
        avatar: p.logo?.url || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
        status: "Approved" as Exhibitor["status"],
        docs: "Complete" as const,
        staff: (p.staff || []).length || 4,
        leadScore: 88,
        rating: p.rating || 4.8,
        products: (p.products || []).map((x: any) => x.name || x),
        joined: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "2026-01-10",
        traffic: p.stats?.traffic || 1200 + i * 150,
        revenue: p.stats?.revenue || 45000 + i * 5000,
        description: p.company?.description || "",
        badgeTier: "Platinum" as const,
        tier: p.tier || "Standard",
        email: p.contact?.email || `contact@${(p.company?.name || "company").toLowerCase().replace(/\s+/g, "")}.com`,
        leads: p.stats?.leads || 450 + i * 40,
        logo: p.logo?.url || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
      }));
    }

    return { exhibitors: list, applications: [] };
  } catch (err) {
    console.warn("Live API /exhibitors directory error:", err);
    return { exhibitors: [], applications: [] };
  }
}

export async function reviewLiveApplication(id: string, decision: { status: "approved" | "rejected"; rejectionReason?: string; booth?: string }): Promise<any> {
  return await patch(`/exhibitors/applications/${id}/review`, decision);
}

export async function updateLiveExhibitorStatus(id: string, status: string): Promise<any> {
  return await patch(`/exhibitors/${id}/status`, { status });
}

export async function applyForLiveExpo(expoId: string, payload: {
  tier?: string;
  requestedZone?: string;
  requestedCategory?: string;
  showcaseSummary?: string;
  boothQty?: number;
}): Promise<any> {
  const res = await post<any>(`/exhibitors/applications/${expoId}`, payload);
  if (!res.success) {
    throw new Error(res.message || "Failed to submit expo application");
  }
  return res.data;
}

export async function fetchMyApplications(): Promise<any[]> {
  try {
    const res = await get<any[]>("/exhibitors/me/applications");
    return res.data || [];
  } catch (err) {
    console.warn("fetchMyApplications error:", err);
    return [];
  }
}

export async function fetchAdminApplications(expoId?: string): Promise<any[]> {
  try {
    const res = await get<any[]>(`/exhibitors/applications${expoId ? `?expo=${expoId}` : ""}`);
    return res.data || [];
  } catch (err) {
    console.warn("fetchAdminApplications error:", err);
    return [];
  }
}

export async function fetchExpoBooths(expoId: string): Promise<any[]> {
  try {
    const res = await get<any>(`/booths/expo/${expoId}`);
    return res.data?.booths || (Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.warn("fetchExpoBooths error:", err);
    return [];
  }
}

export async function fetchExpoApprovedExhibitors(expoId?: string): Promise<Exhibitor[]> {
  try {
    const query = expoId ? `?expo=${expoId}` : "";
    const res = await get<any[]>(`/exhibitors/directory${query}`);
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data.map((p: any, i: number) => ({
      id: p._id || `EX-${i + 1}`,
      company: p.company?.name || "Company",
      logoText: (p.company?.name || "CO").slice(0, 2).toUpperCase(),
      logoBg: "from-brand-600 to-indigo-600",
      category: p.category || "Technology",
      booth: p.boothId || p.booths?.[0]?.boothId || "TBD",
      hall: "Hall 4",
      country: p.contact?.country || "United States",
      rep: p.contact?.primaryName || "Representative",
      avatar: "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
      status: "Approved",
      leadScore: 92,
      traffic: 1400,
      revenue: 120000,
      staff: 8,
      docs: "Complete",
      rating: p.rating || 4.9,
      badgeTier: p.tier || "Platinum",
      description: p.company?.description || "",
      joined: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "2026-01-01",
      products: Array.isArray(p.products) ? p.products.map((pr: any) => pr.name || pr) : ["Enterprise Solutions"],
    }));
  } catch (err) {
    console.warn("fetchExpoApprovedExhibitors error:", err);
    return [];
  }
}

/* =================== MY EXHIBITOR PROFILE (Authenticated) ============ */
export async function fetchMyExhibitorProfile(): Promise<any> {
  const res = await get<any>("/exhibitors/me");
  if (!res.success) throw new Error(res.message || "Failed to load your exhibitor profile");
  return res.data; // { profile, applications, booths, documents }
}

export async function updateMyExhibitorProfile(payload: {
  company?: {
    name?: string;
    description?: string;
    website?: string;
    registrationNo?: string;
    foundedYear?: number;
  };
  category?: string;
  contact?: {
    primaryName?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  visibility?: {
    showBoothOnPlan?: boolean;
    allowAttendeeChat?: boolean;
    showEmailPublicly?: boolean;
  };
  logo?: {
    url?: string;
    publicId?: string;
  };
}): Promise<any> {
  const res = await patch<any>("/exhibitors/me", payload);
  if (!res.success) throw new Error(res.message || "Failed to update profile");
  return res.data;
}

export async function uploadMyLogo(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const { upload } = await import("./api");
  return await upload("/exhibitors/me/logo", formData);
}

export async function fetchMyDocuments(): Promise<any[]> {
  try {
    const res = await get<any[]>("/exhibitors/me/documents");
    return res.data || [];
  } catch (err) {
    console.warn("fetchMyDocuments error:", err);
    return [];
  }
}

export async function uploadMyDocument(file: File, docType: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("docType", docType);
  const { upload } = await import("./api");
  return await upload("/exhibitors/documents", formData);
}

export async function deleteMyDocument(id: string): Promise<any> {
  return await del(`/exhibitors/documents/${id}`);
}

/* =========================== ATTENDEES CRUD ========================= */
export async function fetchLiveAttendees(): Promise<Attendee[]> {
  try {
    const res = await get<any[]>("/attendees?limit=100");
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return ATTENDEES;
    }
    return res.data.map((a: any, i: number) => ({
      id: a._id || `AT-${i + 1}`,
      name: a.name || a.user?.name || "Attendee",
      email: a.email || a.user?.email || "attendee@example.com",
      company: a.company || a.jobTitle || "Enterprise",
      jobTitle: a.jobTitle || "Delegate",
      country: a.address?.country || "United States",
      ticket: (["Full Access", "Day Pass", "Exhibitor Guest", "VIP", "Press"].includes(a.activeRegistration?.ticketType) ? a.activeRegistration.ticketType : "Full Access") as Attendee["ticket"],
      status: (a.activeRegistration?.status === "attended" ? "Checked-in" : a.activeRegistration?.status === "confirmed" ? "Confirmed" : "Confirmed") as Attendee["status"],
      registered: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "2026-03-01",
      eventsAttended: 1,
      sessionsAttended: a.sessionsCount || 4,
      boothsVisited: 6,
      spend: a.activeRegistration?.pricing?.total || 149,
      rating: 4.9,
      avatar: a.avatar || a.user?.avatar || "https://images.pexels.com/photos/7752805/pexels-photo-7752805.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
    }));
  } catch (err) {
    console.warn("Live API /attendees fallback to static:", err);
    return ATTENDEES;
  }
}

export async function updateAttendeeStatus(userId: string, regId: string, status: string): Promise<any> {
  return await patch(`/attendees/${userId}/registration/${regId}`, { status });
}

/* ============================ BOOTHS CRUD =========================== */
export async function fetchLiveBooths(expoId: string): Promise<Booth[]> {
  try {
    const res = await get<any>(`/booths/expo/${expoId}`);
    const boothList = res?.data?.booths || (Array.isArray(res?.data) ? res.data : []);
    if (!res.success || !Array.isArray(boothList) || boothList.length === 0) {
      return BOOTHS;
    }
    return boothList.map((b: any) => ({
      id: b.boothId || b._id || b.id,
      _id: b._id,
      zone: (["A", "B", "C", "D"].includes(b.zone) ? b.zone : "A") as Booth["zone"],
      size: mapBoothCategory(b.category),
      sqm: b.sqm || 12,
      price: b.price || 2600,
      status: mapBoothStatus(b.status),
      owner: b.exhibitor?.company?.name || (b.status === "booked" ? "Allocated Exhibitor" : undefined),
      x: b.position?.x ?? 4,
      y: b.position?.y ?? 4,
      w: b.size?.w ?? 14,
      h: b.size?.h ?? 14,
    }));
  } catch (err) {
    console.warn("Live API /booths fallback to static:", err);
    return BOOTHS;
  }
}

export async function createLiveBooth(payload: any): Promise<any> {
  return await post("/booths", payload);
}

export async function updateLiveBooth(id: string, payload: any): Promise<any> {
  return await patch(`/booths/${id}`, payload);
}

export async function assignLiveBooth(id: string, exhibitorId: string, status: string = "booked"): Promise<any> {
  return await post(`/booths/${id}/assign`, { exhibitor: exhibitorId, status });
}

export async function deleteLiveBooth(id: string): Promise<any> {
  return await del(`/booths/${id}`);
}

export async function reserveLiveBooth(id: string, note?: string): Promise<any> {
  return await post(`/booths/${id}/reserve`, { note });
}

export async function releaseLiveBooth(id: string): Promise<any> {
  return await post(`/booths/${id}/release`, {});
}

export async function fetchMyBooths(): Promise<any[]> {
  try {
    const res = await get<any[]>("/booths/mine");
    return res.data || [];
  } catch (err) {
    console.warn("fetchMyBooths error:", err);
    return [];
  }
}

/* =========================== FEEDBACK CRUD ========================== */
export async function fetchLiveFeedback(): Promise<Feedback[]> {
  try {
    const res = await get<any[]>("/feedback?limit=100");
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return FEEDBACK;
    }
    return res.data.map((f: any, i: number) => ({
      id: f._id || `FB-${i + 1}`,
      attendee: f.user?.name || "Participant",
      avatar: f.user?.avatar || f.author?.avatar || "https://images.pexels.com/photos/7752805/pexels-photo-7752805.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
      company: f.user?.jobTitle || "Attendee",
      target: f.targetModel || "Global Tech Summit",
      targetType: f.targetType === "Session" ? "Session" : f.targetType === "Exhibitor" ? "Exhibitor" : "Expo" as Feedback["targetType"],
      rating: f.rating || 5,
      category: f.category || "Content",
      title: f.title || "Feedback",
      body: f.comment || "",
      status: f.status === "resolved" ? "Resolved" : f.status === "reviewed" ? "In Review" : "New",
      date: f.createdAt ? new Date(f.createdAt).toISOString().split("T")[0] : "2026-03-01",
      reply: f.staffReply?.body,
    }));
  } catch (err) {
    console.warn("Live API /feedback fallback to static:", err);
    return FEEDBACK;
  }
}

export async function replyLiveFeedback(id: string, replyText: string): Promise<any> {
  return await patch(`/feedback/${id}/reply`, { reply: replyText });
}

export async function setLiveFeedbackStatus(id: string, status: string): Promise<any> {
  return await patch(`/feedback/${id}/status`, { status });
}

/* =========================== MESSAGES CRUD ========================== */
export async function fetchLiveConversations(): Promise<Conversation[]> {
  try {
    const res = await get<any[]>("/messages/conversations");
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return CONVERSATIONS;
    }
    return res.data.map((c: any, i: number) => {
      const otherUser = c.participants?.find((p: any) => p._id !== c.lastMessage?.sender) || c.participants?.[0];
      return {
        id: c._id || `CV-${i + 1}`,
        name: otherUser?.name || "Attendee / Exhibitor",
        role: (otherUser?.role === "exhibitor" ? "Exhibitor" : otherUser?.role === "admin" ? "Organizer" : "Attendee") as Conversation["role"],
        company: otherUser?.company || "Member",
        avatar: otherUser?.avatar || "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
        last: c.lastMessage?.body || "Hello",
        lastTime: c.lastMessage?.createdAt ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
        unread: c.unreadCount || 0,
        starred: false,
        status: "Active" as const,
        subject: c.subject || "Event Inquiry",
        messages: (c.messages || []).map((m: any) => ({
          id: m._id || `${Date.now()}`,
          from: m.sender?.name || "Sender",
          role: m.sender?.role === "admin" ? "Organizer" : "Attendee",
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:00",
          text: m.body || "",
          mine: false,
        })),
      };
    });
  } catch (err) {
    console.warn("Live API /messages fallback to static:", err);
    return CONVERSATIONS;
  }
}

export async function sendLiveMessage(conversationId: string, text: string): Promise<any> {
  return await post(`/messages/conversations/${conversationId}/messages`, { text });
}

/* ========================== ANALYTICS OVERVIEW ====================== */
export async function fetchLiveAnalyticsOverview(): Promise<any> {
  try {
    const res = await get<any>("/analytics/overview");
    if (res.success && res.data) return res.data;
  } catch (err) {
    console.warn("Live API /analytics/overview fallback:", err);
  }
  return null;
}

/* ============================ ORDERS & PAYMENTS ===================== */
export interface LiveOrder {
  _id: string;
  orderNumber: string;
  orderType: "BOOTH_BOOKING" | "ATTENDEE_REGISTRATION" | "WORKSHOP_SESSION";
  userId: any;
  expoId: any;
  boothId?: any;
  registrationId?: any;
  sessionId?: any;
  items: Array<{
    name: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    total: number;
    metadata?: Record<string, any>;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  orderStatus: "PENDING" | "PAID" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  paymentStatus: "UNPAID" | "INITIATED" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  billingDetails: {
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LivePayment {
  _id: string;
  orderId: any;
  userId: any;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: "payfast" | "jazzcash" | "easypaisa" | "stripe" | "demo";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId: string;
  providerTransactionId?: string;
  providerReference?: string;
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface LiveRefund {
  _id: string;
  paymentId: any;
  orderId: any;
  requestedBy: any;
  amount: number;
  currency: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt: string;
}

export async function createLiveOrder(payload: {
  orderType: string;
  expoId: string;
  boothId?: string;
  registrationId?: string;
  sessionId?: string;
  ticketTier?: string;
  ticketType?: string;
  quantity?: number;
  promoCode?: string;
  billingDetails?: {
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  notes?: string;
}): Promise<LiveOrder> {
  const res = await post<LiveOrder>("/orders", payload);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to create order");
  }
  return res.data;
}

export async function fetchLiveOrder(orderId: string): Promise<LiveOrder> {
  const res = await get<LiveOrder>(`/orders/${orderId}`);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Order not found");
  }
  return res.data;
}

export async function fetchMyOrders(): Promise<LiveOrder[]> {
  try {
    const res = await get<LiveOrder[]>("/orders/mine");
    return res.data || [];
  } catch (err) {
    console.warn("fetchMyOrders error:", err);
    return [];
  }
}

export async function fetchPaymentProviders(): Promise<{
  providers: Record<string, {
    name: string;
    supportedCurrencies: string[];
    isConfigured: boolean;
    sandbox: boolean;
    status: string;
    reason?: string;
  }>;
}> {
  const res = await get<any>("/payments/providers");
  return res.data || { providers: {} };
}

export async function initiateLivePayment(orderId: string, provider: string, paymentMethod?: string): Promise<any> {
  const res = await post<any>("/payments/initiate", { orderId, provider, paymentMethod });
  if (!res.success) {
    throw new Error(res.message || "Failed to initiate payment");
  }
  return res.data;
}

export async function verifyLivePayment(orderId: string, payload: Record<string, any> = {}): Promise<any> {
  const res = await post<any>(`/payments/verify/${orderId}`, payload);
  if (!res.success) {
    throw new Error(res.message || "Failed to verify payment");
  }
  return res.data;
}

export async function requestLiveRefund(orderId: string, amount: number, reason: string): Promise<any> {
  const res = await post<any>("/payments/refund", { orderId, amount, reason });
  if (!res.success) {
    throw new Error(res.message || "Failed to request refund");
  }
  return res.data;
}

export async function fetchAdminPayments(params: Record<string, any> = {}): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const res = await get<any>(`/payments/admin/all${query ? `?${query}` : ""}`);
  return res.data || { payments: [], stats: {}, summary: [] };
}

export async function fetchMyPayments(): Promise<{ payments: LivePayment[]; orders: LiveOrder[] }> {
  try {
    const res = await get<any>("/payments/my");
    return res.data || { payments: [], orders: [] };
  } catch (err) {
    console.warn("fetchMyPayments error:", err);
    return { payments: [], orders: [] };
  }
}

export async function fetchAdminRefunds(): Promise<LiveRefund[]> {
  const res = await get<LiveRefund[]>("/payments/refunds");
  return res.data || [];
}

export async function reviewLiveRefund(refundId: string, action: "APPROVE" | "REJECT", adminNotes?: string): Promise<any> {
  const res = await patch<any>(`/payments/refund/${refundId}/review`, { action, adminNotes });
  if (!res.success) {
    throw new Error(res.message || "Failed to update refund status");
  }
  return res.data;
}

export function getInvoicePdfUrl(invoiceIdOrPaymentId: string): string {
  return `/api/v1/payments/invoice/${invoiceIdOrPaymentId}/pdf`;
}

/* ============================ REALTIME MESSAGING ===================== */
export interface LiveConversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    companyName?: string;
    avatar?: string;
  }>;
  conversationType: "DIRECT" | "SUPPORT" | "EXHIBITOR_COLLABORATION";
  subject?: string;
  relatedExpoId?: any;
  relatedBoothId?: any;
  status: "ACTIVE" | "ARCHIVED" | "BLOCKED";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  updatedAt: string;
}

export interface LiveChatMessage {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    companyName?: string;
  };
  messageType: "TEXT" | "ATTACHMENT" | "SYSTEM" | "PAYMENT_REQUEST" | "APPOINTMENT";
  content: string;
  attachments?: Array<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }>;
  metadata?: Record<string, any>;
  readBy: Array<{ userId: string; readAt: string }>;
  createdAt: string;
}

export async function fetchFullConversations(): Promise<LiveConversation[]> {
  try {
    const res = await get<LiveConversation[]>("/conversations");
    return res.data || [];
  } catch (err) {
    console.warn("fetchFullConversations fallback:", err);
    return [];
  }
}

export async function fetchConversationMessages(conversationId: string): Promise<LiveChatMessage[]> {
  try {
    const res = await get<LiveChatMessage[]>(`/conversations/${conversationId}/messages`);
    return res.data || [];
  } catch (err) {
    console.warn("fetchConversationMessages error:", err);
    return [];
  }
}

export async function startLiveConversation(payload: {
  recipientId: string;
  subject?: string;
  initialMessage?: string;
  conversationType?: "DIRECT" | "SUPPORT" | "EXHIBITOR_COLLABORATION";
  relatedExpoId?: string;
  relatedBoothId?: string;
}): Promise<LiveConversation> {
  const res = await post<LiveConversation>("/conversations", payload);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to start conversation");
  }
  return res.data;
}

export async function sendChatMessage(
  conversationId: string,
  content: string,
  attachments?: Array<{ url: string; filename: string; size: number; mimeType: string }>
): Promise<LiveChatMessage> {
  const res = await post<LiveChatMessage>(`/conversations/${conversationId}/messages`, {
    content,
    messageType: attachments && attachments.length > 0 ? "ATTACHMENT" : "TEXT",
    attachments,
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to send message");
  }
  return res.data;
}

export async function markConversationAsRead(conversationId: string): Promise<any> {
  return await patch(`/conversations/${conversationId}/read`, {});
}

/* ============================ SUPPORT TICKETS ======================= */
export interface LiveSupportTicket {
  _id: string;
  ticketNumber: string;
  user: any;
  expo?: any;
  subject: string;
  category: "booth" | "technical" | "billing" | "registration" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: any;
  messages: Array<{
    _id: string;
    sender: any;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function fetchLiveTickets(status?: string): Promise<LiveSupportTicket[]> {
  try {
    const res = await get<LiveSupportTicket[]>(`/support${status ? `?status=${status}` : ""}`);
    return res.data || [];
  } catch (err) {
    console.warn("fetchLiveTickets error:", err);
    return [];
  }
}

export async function createLiveTicket(payload: {
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  expoId?: string;
}): Promise<LiveSupportTicket> {
  const res = await post<LiveSupportTicket>("/support", payload);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to create support ticket");
  }
  return res.data;
}

export async function replyLiveTicket(ticketId: string, message: string): Promise<LiveSupportTicket> {
  const res = await post<LiveSupportTicket>(`/support/${ticketId}/messages`, { message });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to reply to ticket");
  }
  return res.data;
}

export async function updateLiveTicketStatus(ticketId: string, payload: { status?: string; priority?: string }): Promise<LiveSupportTicket> {
  const res = await patch<LiveSupportTicket>(`/support/${ticketId}/status`, payload);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to update ticket status");
  }
  return res.data;
}
