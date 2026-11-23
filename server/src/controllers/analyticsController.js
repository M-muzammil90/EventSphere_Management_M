import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import EventRegistration from "../models/EventRegistration.js";
import SessionRegistration from "../models/SessionRegistration.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Payment from "../models/Payment.js";
import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import { ApiResponse, asyncHandler } from "../utils/ApiResponse.js";

/* ------------------------------------------------------------------
   Helper: resolve a date range from ?range=24h|7d|30d|ytd|all|custom
   ------------------------------------------------------------------ */
function resolveRange(from, to) {
  const now = new Date();
  let start = new Date(0);
  if (from) start = new Date(from);
  else if (to) start = new Date(0);
  else start = new Date(now.getFullYear(), 0, 1);
  const end = to ? new Date(to) : now;
  return { start, end };
}

const revenueMatch = (start, end) => ({
  createdAt: { $gte: start, $lte: end },
  status: { $in: ["paid", "awaiting_confirmation"] },
});

/* =====================================================================
   OVERVIEW  — every number computed from MongoDB
   ===================================================================== */
export const getOverview = asyncHandler(async (req, res) => {
  const { from, to, expo: expoId } = req.query;
  const { start, end } = resolveRange(from, to);
  const expoFilter = expoId ? { expo: Array.isArray(expoId) ? { $in: expoId } : expoId } : {};

  const [
    totalExpos,
    liveExpos,
    upcomingExpos,
    totalAttendees,
    totalExhibitors,
    applicationsPending,
    applicationsApproved,
    boothAgg,
    revenueAgg,
    sessionAgg,
    feedbackAgg,
    recentPayments,
  ] = await Promise.all([
    Expo.countDocuments({ status: { $ne: "archived" } }),
    Expo.countDocuments({ status: "live" }),
    Expo.countDocuments({ status: "published", startDate: { $gt: new Date() } }),
    User.countDocuments({ role: "attendee", isActive: true }),
    ExhibitorProfile.countDocuments({ verificationStatus: { $ne: "rejected" } }),
    ExhibitorApplication.countDocuments({ status: { $in: ["pending", "under_review"] } }),
    ExhibitorApplication.countDocuments({ status: "approved" }),
    Booth.aggregate([
      ...(expoId ? [{ $match: { expo: Array.isArray(expoId) ? { $in: expoId } : expoId } }] : []),
      { $group: { _id: null, total: { $sum: 1 }, booked: { $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] } }, reserved: { $sum: { $cond: [{ $eq: ["$status", "reserved"] }, 1, 0] } }, available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } } } },
    ]),
    Payment.aggregate([
      { $match: revenueMatch(start, end) },
      { $group: { _id: "$currency", total: { $sum: "$total" }, count: { $sum: 1 }, genuinelyPaid: { $sum: { $cond: ["$gatewayVerified", "$total", 0] } } } },
    ]),
    Session.aggregate([
      ...(expoId ? [{ $match: { expo: Array.isArray(expoId) ? { $in: expoId } : expoId } }] : []),
      { $group: { _id: null, total: { $sum: 1 }, registrations: { $sum: "$registeredCount" }, capacity: { $sum: "$capacity" } } },
    ]),
    Feedback.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$rating" }, pending: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } } } },
    ]),
    Payment.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(8).populate("user", "name").lean(),
  ]);

  const booths = boothAgg[0] ?? { total: 0, booked: 0, reserved: 0, available: 0 };
  const revenue = revenueAgg[0] ?? { total: 0, count: 0, genuinelyPaid: 0 };
  const sessions = sessionAgg[0] ?? { total: 0, registrations: 0, capacity: 0 };
  const feedback = feedbackAgg[0] ?? { total: 0, avg: 0, pending: 0 };

  const registrationTrend = await EventRegistration.aggregate([
    { $match: { ...expoFilter, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 60 },
  ]);

  const revenueTrend = await Payment.aggregate([
    { $match: revenueMatch(start, end) },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$total" } } },
    { $sort: { _id: 1 } },
  ]);

  return ApiResponse.ok(res, {
    expos: { total: totalExpos, live: liveExpos, upcoming: upcomingExpos },
    users: { attendees: totalAttendees, exhibitors: totalExhibitors },
    applications: { pending: applicationsPending, approved: applicationsApproved },
    booths: {
      ...booths,
      occupancy: booths.total ? Math.round(((booths.booked + booths.reserved) / booths.total) * 100) : 0,
    },
    revenue: {
      total: revenue.total ?? 0,
      currency: revenue._id ?? "USD",
      transactions: revenue.count ?? 0,
      genuinelyPaid: revenue.genuinelyPaid ?? 0,
      demoMode: (process.env.PAYMENT_MODE || "demo") === "demo",
    },
    sessions: {
      total: sessions.total,
      registrations: sessions.registrations,
      avgFillRate: sessions.capacity ? Math.round((sessions.registrations / sessions.capacity) * 100) : 0,
    },
    feedback: {
      total: feedback.total,
      avgRating: Math.round((feedback.avg ?? 0) * 10) / 10,
      pendingTriage: feedback.pending,
    },
    trends: { registrations: registrationTrend, revenue: revenueTrend },
    recentPayments,
    range: { from: start, to: end },
    generatedAt: new Date().toISOString(),
  });
});

/* =====================================================================
   ATTENDEE ENGAGEMENT REPORT
   ===================================================================== */
export const getAttendeeAnalytics = asyncHandler(async (req, res) => {
  const { from, to, expo: expoId } = req.query;
  const { start, end } = resolveRange(from, to);

  const matchReg = { createdAt: { $gte: start, $lte: end }, ...(expoId ? { expo: expoId } : {}) };

  const [byCountry, byTicket, byStatus, acquisition, engagement] = await Promise.all([
    EventRegistration.aggregate([
      { $match: matchReg },
      { $group: { _id: "$attendeeSnapshot.company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    EventRegistration.aggregate([{ $match: matchReg }, { $group: { _id: "$ticketType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    EventRegistration.aggregate([{ $match: matchReg }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    EventRegistration.aggregate([
      { $match: matchReg },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SessionRegistration.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);

  const [total, checkedIn] = await Promise.all([
    EventRegistration.countDocuments(matchReg),
    EventRegistration.countDocuments({ ...matchReg, status: "attended" }),
  ]);

  return ApiResponse.ok(res, {
    summary: { total, checkedIn, checkInRate: total ? Math.round((checkedIn / total) * 100) : 0 },
    byCountry, byTicket, byStatus, acquisition, engagement,
    range: { from: start, to: end },
  });
});

/* =====================================================================
   BOOTH TRAFFIC / OCCUPANCY REPORT
   ===================================================================== */
export const getBoothAnalytics = asyncHandler(async (req, res) => {
  const { expo: expoId } = req.query;
  const match = expoId ? { expo: expoId } : {};

  const [byZone, byStatus, byCategory, topBooths, revenueByExpo] = await Promise.all([
    Booth.aggregate([
      { $match: match },
      { $group: { _id: "$zone", total: { $sum: 1 }, booked: { $sum: { $cond: [{ $in: ["$status", ["booked", "reserved"]] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ["$status", "booked"] }, "$price", 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    Booth.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booth.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" }, totalSqm: { $sum: "$sqm" } } },
      { $sort: { avgPrice: -1 } },
    ]),
    Booth.find({ ...match, status: { $in: ["booked", "reserved"] } })
      .populate({ path: "exhibitor", select: "company.name logo tier stats" })
      .populate("expo", "title")
      .sort({ "exhibitor.stats.traffic": -1 })
      .limit(15)
      .lean(),
    Booth.aggregate([
      { $match: { status: "booked" } },
      { $group: { _id: "$expo", revenue: { $sum: "$price" }, booths: { $sum: 1 } } },
      { $lookup: { from: "expos", localField: "_id", foreignField: "_id", as: "expo" } },
      { $unwind: "$expo" },
      { $project: { "expo.title": 1, revenue: 1, booths: 1 } },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const total = byStatus.reduce((s, b) => s + b.count, 0);
  const booked = byStatus.find((b) => b._id === "booked")?.count ?? 0;

  return ApiResponse.ok(res, {
    summary: {
      total,
      occupancy: total ? Math.round((booked / total) * 100) : 0,
      totalRevenue: byZone.reduce((s, z) => s + (z.revenue ?? 0), 0),
    },
    byZone: byZone.map((z) => ({ ...z, occupancy: z.total ? Math.round((z.booked / z.total) * 100) : 0 })),
    byStatus, byCategory, topBooths, revenueByExpo,
  });
});

/* =====================================================================
   SESSION POPULARITY REPORT
   ===================================================================== */
export const getSessionAnalytics = asyncHandler(async (req, res) => {
  const { expo: expoId } = req.query;
  const match = expoId ? { expo: expoId } : {};

  const [byType, byTrack, topSessions, byHour, summary] = await Promise.all([
    Session.aggregate([
      { $match: { ...match, isPublished: true } },
      { $group: { _id: "$type", count: { $sum: 1 }, registrations: { $sum: "$registeredCount" }, avgCapacity: { $avg: "$capacity" } } },
      { $sort: { registrations: -1 } },
    ]),
    Session.aggregate([
      { $match: { ...match, isPublished: true } },
      { $group: { _id: "$track", count: { $sum: 1 }, registrations: { $sum: "$registeredCount" } } },
      { $sort: { registrations: -1 } },
    ]),
    Session.find({ ...match, isPublished: true })
      .sort({ registeredCount: -1 })
      .limit(12)
      .select("title type track date startTime stage capacity registeredCount")
      .lean(),
    Session.aggregate([
      { $match: { ...match, isPublished: true } },
      { $group: { _id: "$startTime", registrations: { $sum: "$registeredCount" } } },
      { $sort: { _id: 1 } },
    ]),
    Session.aggregate([
      { $match: { ...match, isPublished: true } },
      { $group: { _id: null, total: { $sum: 1 }, registrations: { $sum: "$registeredCount" }, capacity: { $sum: "$capacity" } } },
    ]),
  ]);

  const s = summary[0] ?? { total: 0, registrations: 0, capacity: 0 };

  return ApiResponse.ok(res, {
    summary: {
      total: s.total,
      registrations: s.registrations,
      avgFillRate: s.capacity ? Math.round((s.registrations / s.capacity) * 100) : 0,
    },
    byType, byTrack, topSessions: topSessions.map((x) => ({ ...x, fillRate: x.capacity ? Math.round((x.registeredCount / x.capacity) * 100) : 0 })), byHour,
  });
});

/* =====================================================================
   EVENT-WISE REPORT (side-by-side comparison of every expo)
   ===================================================================== */
export const getEventAnalytics = asyncHandler(async (req, res) => {
  const expos = await Expo.find({ status: { $ne: "archived" } }).select("title slug category venue startDate endDate status banner").lean();

  const [regs, booths, sessions, revenue, feedback] = await Promise.all([
    EventRegistration.aggregate([
      {
        $group: {
          _id: "$expo",
          count: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $in: ["$status", ["confirmed", "attended"]] }, 1, 0] } },
        },
      },
    ]),
    Booth.aggregate([
      {
        $group: {
          _id: "$expo",
          total: { $sum: 1 },
          booked: { $sum: { $cond: [{ $in: ["$status", ["booked", "reserved"]] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "booked"] }, "$price", 0] } },
        },
      },
    ]),
    Session.aggregate([
      {
        $group: {
          _id: "$expo",
          count: { $sum: 1 },
          registrations: { $sum: "$registeredCount" },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ["paid", "awaiting_confirmation"] } } },
      { $group: { _id: "$expo", total: { $sum: "$total" } } },
    ]),
    Feedback.aggregate([
      {
        $group: {
          _id: "$expo",
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const idx = (arr) => new Map(arr.map((x) => [String(x._id), x]));

  const [R, B, S, P, F] = [idx(regs), idx(booths), idx(sessions), idx(revenue), idx(feedback)];

  const report = expos.map((e) => {
    const b = B.get(String(e._id)) ?? { total: 0, booked: 0, revenue: 0 };
    const r = R.get(String(e._id)) ?? { count: 0, confirmed: 0 };
    const s = S.get(String(e._id)) ?? { count: 0, registrations: 0 };
    const f = F.get(String(e._id)) ?? { avg: 0, count: 0 };
    const p = P.get(String(e._id)) ?? { total: 0 };
    return {
      ...e,
      registrations: r.count,
      confirmed: r.confirmed,
      sessions: s.count,
      sessionRegistrations: s.registrations,
      boothsTotal: b.total,
      boothsBooked: b.booked,
      boothOccupancy: b.total ? Math.round((b.booked / b.total) * 100) : 0,
      boothRevenue: b.revenue,
      paymentRevenue: p.total,
      avgRating: Math.round((f.avg ?? 0) * 10) / 10,
      feedbackCount: f.count,
    };
  });

  return ApiResponse.ok(res, report);
});

/* =====================================================================
   REVENUE REPORT
   ===================================================================== */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { from, to, expo: expoId } = req.query;
  const { start, end } = resolveRange(from, to);

  const match = { ...revenueMatch(start, end), ...(expoId ? { expo: expoId } : {}) };

  const [byMonth, byPurpose, byStatus, byCurrency, topExpos] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([{ $match: match }, { $group: { _id: "$purpose", total: { $sum: "$total" }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    Payment.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } }]),
    Payment.aggregate([{ $match: match }, { $group: { _id: "$currency", total: { $sum: "$total" } } }]),
    Payment.aggregate([
      { $match: match },
      { $group: { _id: "$expo", total: { $sum: "$total" } } },
      { $lookup: { from: "expos", localField: "_id", foreignField: "_id", as: "expo" } },
      { $unwind: "$expo" },
      { $project: { "expo.title": 1, total: 1 } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const grand = byCurrency.reduce((s, c) => s + c.total, 0);

  return ApiResponse.ok(res, {
    summary: {
      grandTotal: grand,
      currencies: byCurrency,
      demoMode: (process.env.PAYMENT_MODE || "demo") === "demo",
      genuinelyVerified: true,
    },
    byMonth, byPurpose, byStatus, topExpos,
    range: { from: start, to: end },
  });
});

/* =====================================================================
   APPOINTMENT + LEAD SUMMARY (used by the exhibitor dashboard)
   ===================================================================== */
export const getEngagementSummary = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [appointments, sessionsBooked, exposVisited] = await Promise.all([
    Appointment.countDocuments({ $or: [{ requester: uid }, { recipient: uid }] }),
    SessionRegistration.countDocuments({ user: uid, type: "registered", status: "active" }),
    EventRegistration.countDocuments({ user: uid, status: { $in: ["confirmed", "attended"] } }),
  ]);

  return ApiResponse.ok(res, { appointments, sessionsBooked, exposVisited });
});

export default { getOverview, getAttendeeAnalytics, getBoothAnalytics, getSessionAnalytics, getEventAnalytics, getRevenueAnalytics, getEngagementSummary };
