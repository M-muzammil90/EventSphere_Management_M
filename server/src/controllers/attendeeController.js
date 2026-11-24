import User from "../models/User.js";
import EventRegistration from "../models/EventRegistration.js";
import SessionRegistration from "../models/SessionRegistration.js";
import Appointment from "../models/SessionRegistration.js";
import Feedback from "../models/Feedback.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";

/* =====================================================================
   ATTENDEE CONTROLLER  (admin-only views of attendee records)
   ===================================================================== */
export const listAttendees = asyncHandler(async (req, res) => {
  const { q, status, ticketType, country, company, sort = "name", page = 1, limit = 12 } = req.query;

  // Aggregate registrations so each attendee appears with their expo history
  const pipeline = [];
  const match = {};

  if (status) match.status = status;
  if (ticketType) match.ticketType = ticketType;

  pipeline.push({ $match: match });

  // join the user record
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "userData",
    },
  });
  pipeline.push({ $unwind: "$userData" });

  if (country) pipeline.push({ $match: { "userData.address.country": new RegExp(country, "i") } });
  if (company) pipeline.push({ $match: { "attendeeSnapshot.company": new RegExp(company, "i") } });
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    pipeline.push({
      $match: {
        $or: [
          { "userData.name": rx }, { "userData.email": rx },
          { "attendeeSnapshot.company": rx }, { "attendeeSnapshot.jobTitle": rx },
        ],
      },
    });
  }

  // group by user so one attendee = one row
  pipeline.push({
    $group: {
      _id: "$userData._id",
      name: { $first: "$userData.name" },
      email: { $first: "$userData.email" },
      avatar: { $first: "$userData.avatar" },
      phone: { $first: "$userData.phone" },
      country: { $first: "$userData.address.country" },
      jobTitle: { $first: "$attendeeSnapshot.jobTitle" },
      company: { $first: "$attendeeSnapshot.company" },
      lastRegistered: { $max: "$createdAt" },
      tickets: { $push: { _id: "$_id", expo: "$expo", ticketType: "$ticketType", status: "$status", badgeCode: "$badgeCode", total: "$pricing.total", registeredAt: "$createdAt" } },
      totalSpend: { $sum: "$pricing.total" },
      registrationCount: { $sum: 1 },
    },
  });

  const sorts = {
    name: { name: 1 },
    spend: { totalSpend: -1 },
    registrations: { registrationCount: -1 },
    newest: { lastRegistered: -1 },
  };
  pipeline.push({ $sort: sorts[sort] || sorts.name });

  // paginate the grouped result
  const countPipeline = [...pipeline, { $count: "total" }];
  const [countResult] = await EventRegistration.aggregate(countPipeline);
  const total = countResult?.total ?? 0;
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  pipeline.push({ $skip: skip }, { $limit: l });
  const attendees = await EventRegistration.aggregate(pipeline);

  // attach session history per attendee
  const ids = attendees.map((a) => a._id);
  const sessionCounts = await SessionRegistration.aggregate([
    { $match: { user: { $in: ids }, status: "active" } },
    { $group: { _id: "$user", registered: { $sum: { $cond: [{ $eq: ["$type", "registered"] }, 1, 0] } }, bookmarked: { $sum: { $cond: [{ $eq: ["$type", "bookmarked"] }, 1, 0] } } } },
  ]);
  const sessionMap = new Map(sessionCounts.map((s) => [String(s._id), s]));

  // populate expo titles inside the tickets array
  const { default: Expo } = await import("../models/Expo.js");
  const expoIds = Array.from(new Set(attendees.flatMap((a) => a.tickets.map((t) => t.expo))));
  const expos = await Expo.find({ _id: { $in: expoIds } }).select("title slug startDate venue").lean();
  const expoMap = new Map(expos.map((e) => [String(e._id), e]));

  const data = attendees.map((a) => {
    const s = sessionMap.get(String(a._id));
    return {
      ...a,
      eventsAttended: a.registrationCount,
      sessionsRegistered: s?.registered ?? 0,
      sessionsBookmarked: s?.bookmarked ?? 0,
      tickets: a.tickets.map((t) => ({ ...t, expo: expoMap.get(String(t.expo)) ?? t.expo })),
    };
  });

  return ApiResponse.ok(res, data, undefined, { page: p, pages, total, limit: l });
});

/* ======================= ATTENDEE DETAIL ============================ */
export const getAttendee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("Attendee not found");

  const [registrations, sessions, appointments, feedback] = await Promise.all([
    EventRegistration.find({ user: user._id })
      .populate("expo", "title slug banner startDate endDate venue status")
      .populate("payment", "status total reference receiptNumber")
      .sort({ createdAt: -1 }),
    SessionRegistration.find({ user: user._id, status: "active" })
      .populate({ path: "session", select: "title date startTime endTime stage type track" })
      .populate("expo", "title slug"),
    Appointment.find({ $or: [{ requester: user._id }, { recipient: user._id }] })
      .populate({ path: "exhibitor", select: "company.name logo" })
      .sort({ date: -1 }),
    Feedback.find({ author: user._id }).sort({ createdAt: -1 }),
  ]);

  return ApiResponse.ok(res, {
    user,
    registrations,
    sessionHistory: sessions,
    appointments,
    feedback,
    summary: {
      events: registrations.length,
      sessions: sessions.filter((s) => s.type === "registered").length,
      totalSpend: registrations.reduce((s, r) => s + (r.pricing?.total ?? 0), 0),
      appointments: appointments.length,
    },
  });
});

/* ==================== UPDATE REGISTRATION STATUS ==================== */
export const setRegistrationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const regId = req.params.regId && req.params.regId !== "active" ? req.params.regId : null;
  let reg = null;

  if (regId && /^[0-9a-fA-F]{24}$/.test(regId)) {
    reg = await EventRegistration.findById(regId).populate("user", "name email");
  }
  if (!reg && /^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    reg = await EventRegistration.findById(req.params.id).populate("user", "name email");
  }
  if (!reg && /^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    reg = await EventRegistration.findOne({ user: req.params.id }).sort({ createdAt: -1 }).populate("user", "name email");
  }
  if (!reg) throw ApiError.notFound("Registration not found");

  reg.status = status;
  if (status === "attended") reg.checkedInAt = new Date();
  if (status === "cancelled") reg.cancelledAt = new Date();
  await reg.save();

  return ApiResponse.ok(res, reg, `Registration set to ${status}`);
});

/* ==================== ATTENDEE STATISTICS ========================== */
export const getAttendeeStats = asyncHandler(async (req, res) => {
  const [byStatus, byTicket, byCountry, total] = await Promise.all([
    EventRegistration.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    EventRegistration.aggregate([{ $group: { _id: "$ticketType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    EventRegistration.aggregate([
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "u" } },
      { $unwind: "$u" },
      { $group: { _id: "$u.address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    User.countDocuments({ role: "attendee" }),
  ]);

  const s = Object.fromEntries(byStatus.map((b) => [b._id, b.count]));
  return ApiResponse.ok(res, {
    summary: {
      totalAttendeeAccounts: total,
      total: byStatus.reduce((a, b) => a + b.count, 0),
      confirmed: s.confirmed ?? 0,
      attended: s.attended ?? 0,
      waitlisted: s.waitlisted ?? 0,
      cancelled: s.cancelled ?? 0,
      checkInRate: byStatus.length ? Math.round(((s.attended ?? 0) / byStatus.reduce((a, b) => a + b.count, 0)) * 100) : 0,
    },
    byStatus, byTicket, byCountry,
  });
});

export default { listAttendees, getAttendee, setRegistrationStatus, getAttendeeStats };
