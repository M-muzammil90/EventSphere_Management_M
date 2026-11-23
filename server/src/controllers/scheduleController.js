import Expo from "../models/Expo.js";
import Session from "../models/Session.js";
import SessionRegistration from "../models/SessionRegistration.js";
import EventRegistration from "../models/EventRegistration.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { emitToExpo } from "../services/socketService.js";
import { notificationService } from "../services/notificationService.js";

/* ============================== LIST ============================== */
export const getSessions = asyncHandler(async (req, res) => {
  const { expo, day, track, type, q, speaker, stage, onlyMine, page = 1, limit = 50, upcoming } = req.query;

  const filter = { isPublished: true };
  if (expo) {
    const e = /^[0-9a-fA-F]{24}$/.test(expo) ? await Expo.findById(expo) : await Expo.findOne({ slug: expo });
    filter.expo = e?._id ?? expo;
  }
  if (day) {
    const d = new Date(day);
    if (!Number.isNaN(d.getTime())) {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
  }
  if (track) filter.track = track;
  if (type) filter.type = type;
  if (stage) filter.stage = stage;
  if (speaker) filter["speaker.name"] = new RegExp(speaker, "i");
  if (upcoming === "true") filter.date = { ...filter.date, $gte: new Date() };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { description: rx }, { "speaker.name": rx }, { tags: rx }];
  }

  const total = await Session.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const sessions = await Session.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(l).lean();

  // Attach the caller's own registration state + live fill rate
  let mine = new Map();
  if (req.user) {
    const regs = await SessionRegistration.find({ user: req.user._id, session: { $in: sessions.map((s) => s._id) } });
    mine = new Map(regs.map((r) => [String(r.session), { type: r.type, status: r.status }]));
  }

  const data = sessions.map((s) => ({
    ...s,
    spotsLeft: Math.max(0, s.capacity - s.registeredCount),
    fillRate: s.capacity ? Math.round((s.registeredCount / s.capacity) * 100) : 0,
    isFull: s.registeredCount >= s.capacity,
    myRegistration: mine.get(String(s._id)) ?? null,
  }));

  return ApiResponse.ok(res, data, undefined, { page: p, pages, total, limit: l });
});

/* ============================= DETAIL ============================= */
export const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).populate("expo", "title slug venue startDate endDate");
  if (!session) throw ApiError.notFound("Session not found");

  let myRegistration = null;
  if (req.user) {
    myRegistration = await SessionRegistration.findOne({ user: req.user._id, session: session._id });
  }

  return ApiResponse.ok(res, {
    session: { ...session.toJSON(), spotsLeft: session.spotsLeft, isFull: session.isFull },
    myRegistration,
  });
});

/* ============================== CREATE ============================ */
export const createSession = asyncHandler(async (req, res) => {
  const expo = await Expo.findById(req.body.expo);
  if (!expo) throw ApiError.notFound("Expo not found");

  // no double-booking the same stage & slot (explicit check; the compound
  // unique index is a second line of defence once indexes are built)
  const dayStart = new Date(req.body.date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(req.body.date); dayEnd.setHours(23, 59, 59, 999);
  const clash = await Session.findOne({
    expo: expo._id, stage: req.body.stage, startTime: req.body.startTime,
    date: { $gte: dayStart, $lte: dayEnd },
  });
  if (clash) throw ApiError.conflict(`Stage "${req.body.stage}" is already booked at ${req.body.startTime} on that date`);

  const session = await Session.create(req.body);

  emitToExpo(String(expo._id), "schedule:updated", { expoId: String(expo._id), sessionId: session._id, action: "created" });

  return ApiResponse.created(res, session, "Session created successfully");
});

/* ============================== UPDATE ============================ */
export const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound("Session not found");

  const previous = { date: session.date, startTime: session.startTime, stage: session.stage, endTime: session.endTime };

  // Prevent over-booking when capacity is reduced below current registrations
  if (req.body.capacity !== undefined && req.body.capacity < session.registeredCount) {
    throw ApiError.conflict(
      `Capacity cannot be set below the ${session.registeredCount} existing registrations`
    );
  }

  Object.assign(session, req.body);
  await session.save({ runValidators: true });

  const changed = [];
  if (previous.startTime !== session.startTime || String(previous.date) !== String(session.date)) {
    changed.push(`moved to ${new Date(session.date).toLocaleDateString()} at ${session.startTime}`);
  }
  if (previous.stage !== session.stage) changed.push(`now on ${session.stage}`);
  if (previous.endTime !== session.endTime) changed.push(`now ends at ${session.endTime}`);

  // Real-time + notification fan-out to everyone who registered/bookmarked
  if (changed.length) {
    emitToExpo(String(session.expo), "schedule:updated", { expoId: String(session.expo), sessionId: session._id, action: "updated" });
    const regs = await SessionRegistration.find({ session: session._id, status: "active" }).populate("user", "name email").select("user");
    await notificationService.notifyScheduleChange({
      session,
      recipients: regs.map((r) => r.user?._id).filter(Boolean),
      change: changed.join(", "),
    });
  }

  return ApiResponse.ok(res, session, changed.length ? `Session updated — ${changed.join(", ")}` : "Session updated");
});

/* ============================== DELETE ============================ */
export const deleteSession = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const session = isMongoId
    ? await Session.findById(req.params.id)
    : await Session.findOne({ $or: [{ _id: req.params.id }, { title: req.params.id }] });
  if (!session) throw ApiError.notFound("Session not found");

  const regs = await SessionRegistration.find({ session: session._id, status: "active" }).select("user");
  await Promise.all([SessionRegistration.deleteMany({ session: session._id }), session.deleteOne()]);

  try {
    if (session.expo) {
      emitToExpo(String(session.expo), "schedule:updated", { expoId: String(session.expo), sessionId: session._id, action: "deleted" });
    }
    if (regs && regs.length > 0) {
      await notificationService.notifyScheduleChange({
        session,
        recipients: regs.map((r) => r.user),
        change: "This session has been cancelled.",
      });
    }
  } catch (err) {
    console.warn("Notification error on session delete:", err);
  }

  return ApiResponse.ok(res, { deleted: true }, "Session deleted");
});

/* =====================================================================
   REGISTER / BOOKMARK  — capacity-safe with atomic increment
   ===================================================================== */
export const registerForSession = asyncHandler(async (req, res) => {
  const { type = "registered" } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) throw ApiError.notFound("Session not found");
  if (!session.isPublished) throw ApiError.forbidden("This session is not open for registration");
  if (session.cancelledAt) throw ApiError.forbidden("This session has been cancelled");

  const existing = await SessionRegistration.findOne({ session: session._id, user: req.user._id });

  // idempotent
  if (existing && existing.type === type && existing.status === "active") {
    return ApiResponse.ok(res, existing, type === "bookmarked" ? "Already bookmarked" : "Already registered");
  }

  if (type === "registered") {
    // Only attendees with a confirmed expo registration may register for sessions
    const expoReg = await EventRegistration.findOne({
      expo: session.expo, user: req.user._id, status: { $in: ["confirmed", "attended"] },
    });
    if (!expoReg) throw ApiError.forbidden("Register for the expo before booking sessions");

    /* ATOMIC capacity guard — two users cannot take the last seat.
       The filter re-checks registeredCount against the capacity snapshot,
       so Mongo rejects the (capacity+1)th registration server-side. */
    const updated = await Session.findOneAndUpdate(
      { _id: session._id, registeredCount: { $lt: session.capacity } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    if (!updated) throw ApiError.conflict("This session is fully booked — no spots remaining");

    if (existing) {
      existing.type = "registered";
      existing.status = "active";
      await existing.save();
      return ApiResponse.ok(res, existing, "Session added to your agenda");
    }

    const reg = await SessionRegistration.create({
      session: session._id, user: req.user._id, expo: session.expo, type: "registered",
    });
    return ApiResponse.created(res, reg, "Registered successfully");
  }

  // bookmarking has no capacity limit
  if (existing) {
    existing.type = "bookmarked";
    existing.status = "active";
    await existing.save();
    return ApiResponse.ok(res, existing, "Bookmarked");
  }

  const reg = await SessionRegistration.create({
    session: session._id, user: req.user._id, expo: session.expo, type: "bookmarked",
  });
  return ApiResponse.created(res, reg, "Bookmarked — you'll get a reminder 45 minutes before");
});

/* =========================== CANCEL ================================= */
export const cancelSessionRegistration = asyncHandler(async (req, res) => {
  const reg = await SessionRegistration.findOne({ session: req.params.id, user: req.user._id });
  if (!reg) throw ApiError.notFound("You are not registered for this session");

  // free the seat back
  if (reg.type === "registered" && reg.status === "active") {
    await Session.updateOne({ _id: req.params.id, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
  }

  reg.status = "cancelled";
  reg.cancelledAt = new Date();
  await reg.save();

  return ApiResponse.ok(res, reg, "Removed from your agenda");
});

/* =========================== MY SCHEDULE ============================ */
export const getMySchedule = asyncHandler(async (req, res) => {
  const regs = await SessionRegistration.find({ user: req.user._id, status: "active" })
    .populate({ path: "session", select: "title date startTime endTime stage type track speaker capacity registeredCount" })
    .populate("expo", "title slug venue")
    .sort({ "session.date": 1, "session.startTime": 1 });

  const grouped = { registered: [], bookmarked: [] };
  regs.forEach((r) => {
    if (!r.session) return;
    const entry = { registrationId: r._id, ...r.session.toJSON() };
    (grouped[r.type] ?? grouped.registered).push(entry);
  });

  return ApiResponse.ok(res, grouped);
});

export default { getSessions, getSession, createSession, updateSession, deleteSession, registerForSession, cancelSessionRegistration, getMySchedule };
