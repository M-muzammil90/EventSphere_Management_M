import Feedback from "../models/Feedback.js";
import Expo from "../models/Expo.js";
import Session from "../models/Session.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import EventRegistration from "../models/EventRegistration.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { notificationService } from "../services/notificationService.js";

/* =====================================================================
   SUBMIT FEEDBACK
   ===================================================================== */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { targetType, expo, session, exhibitor, rating, title, body, category, wouldRecommend } = req.body;

  // resolve + validate the target
  let targetLabel = null;
  if (targetType === "expo") {
    const e = await Expo.findById(expo);
    if (!e) throw ApiError.notFound("Expo not found");
    targetLabel = e.title;
  } else if (targetType === "session") {
    const s = await Session.findById(session);
    if (!s) throw ApiError.notFound("Session not found");
    targetLabel = s.title;
  } else if (targetType === "exhibitor") {
    const x = await ExhibitorProfile.findById(exhibitor);
    if (!x) throw ApiError.notFound("Exhibitor not found");
    targetLabel = x.company?.name;
  } else {
    throw ApiError.badRequest("targetType must be expo, session or exhibitor");
  }

  // duplicate check (unique index also enforces this)
  const dupeFilter = { author: req.user._id, targetType };
  if (targetType === "expo") dupeFilter.expo = expo;
  if (targetType === "session") dupeFilter.session = session;
  if (targetType === "exhibitor") dupeFilter.exhibitor = exhibitor;

  const existing = await Feedback.findOne(dupeFilter);
  if (existing) throw ApiError.conflict("You have already reviewed this — edit your existing review instead");

  // attendees may only review expos they registered for
  if (targetType === "expo" && req.user.role === "attendee") {
    const reg = await EventRegistration.findOne({ expo, user: req.user._id, status: { $in: ["confirmed", "attended"] } });
    if (!reg) throw ApiError.forbidden("You can only review expos you registered for");
  }

  const feedback = await Feedback.create({
    author: req.user._id, targetType, expo, session, exhibitor,
    targetLabel, rating, title, body, category, wouldRecommend,
    status: "new",
  });

  // keep the denormalised average rating fresh
  if (targetType === "exhibitor" && exhibitor) {
    const agg = await Feedback.aggregate([
      { $match: { targetType: "exhibitor", exhibitor } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);
    await ExhibitorProfile.updateOne({ _id: exhibitor }, { rating: Math.round((agg[0]?.avg ?? 0) * 10) / 10 });
  }

  const populated = await feedback.populate("author", "name avatar");

  // notify staff
  const { default: User } = await import("../models/User.js");
  const staff = await User.find({ role: { $in: ["admin", "organizer"] } }).select("_id");
  await notificationService.notifyMany(staff.map((s) => s._id), {
    type: "system",
    title: `New ${rating}★ feedback — ${targetLabel}`,
    body: title ?? body.slice(0, 100),
    link: "/admin/feedback",
    relatedType: "feedback",
    relatedId: feedback._id,
  });

  return ApiResponse.created(res, populated, "Thank you — your feedback has been submitted");
});

/* =====================================================================
   LIST FEEDBACK  (admin sees all, users see their own)
   ===================================================================== */
export const listFeedback = asyncHandler(async (req, res) => {
  const { status, category, targetType, target, rating, q, mine, page = 1, limit = 12 } = req.query;

  const filter = {};

  // NON-STAFF users can only ever read their own feedback
  if (!req.user?.isStaff || mine === "true") {
    filter.author = req.user._id;
  }
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (targetType) filter.targetType = targetType;
  if (target) filter.$or = [{ expo: target }, { session: target }, { exhibitor: target }];
  if (rating === "4-5") filter.rating = { $gte: 4 };
  else if (rating === "3") filter.rating = 3;
  else if (rating === "0-2") filter.rating = { $lte: 2 };

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = filter.$and ?? [];
    filter.$and.push({ $or: [{ title: rx }, { body: rx }, { targetLabel: rx }] });
  }

  const total = await Feedback.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const feedback = await Feedback.find(filter)
    .populate("author", "name avatar email")
    .populate("expo", "title slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, feedback, undefined, { page: p, pages, total, limit: l });
});

/* ===================== PUBLIC REVIEWS (for profiles) ================ */
export const getPublicReviews = asyncHandler(async (req, res) => {
  const { targetType, target, page = 1, limit = 10 } = req.query;
  if (!targetType || !target) throw ApiError.badRequest("targetType and target are required");

  const filter = { targetType, [targetType === "expo" ? "expo" : targetType === "session" ? "session" : "exhibitor"]: target };
  // only reviews the organiser has made public, or 4★+ auto-public
  filter.$or = [{ isPublic: true }, { rating: { $gte: 4 } }];

  const total = await Feedback.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const reviews = await Feedback.find(filter)
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l)
    .select("rating title body reply repliedAt createdAt author");

  return ApiResponse.ok(res, reviews, undefined, { page: p, pages, total, limit: l });
});

/* ========================= REPLY (admin) ============================ */
export const replyToFeedback = asyncHandler(async (req, res) => {
  const { reply, status, assignedTo } = req.body;

  const feedback = await Feedback.findById(req.params.id).populate("author", "name email");
  if (!feedback) throw ApiError.notFound("Feedback not found");

  feedback.reply = reply;
  feedback.repliedBy = req.user._id;
  feedback.repliedAt = new Date();
  if (status) feedback.status = status;
  if (assignedTo) feedback.assignedTo = assignedTo;
  await feedback.save();

  await notificationService.notifyFeedbackReply({
    recipient: feedback.author?._id,
    user: feedback.author,
    reply,
  });

  return ApiResponse.ok(res, feedback, "Reply sent to the attendee");
});

/* ========================= SET STATUS =============================== */
export const setFeedbackStatus = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound("Feedback not found");

  const { status, isPublic, assignedTo, internalNotes } = req.body;
  if (status) feedback.status = status;
  if (isPublic !== undefined) feedback.isPublic = isPublic;
  if (assignedTo !== undefined) feedback.assignedTo = assignedTo;
  if (internalNotes !== undefined) feedback.internalNotes = internalNotes;
  await feedback.save();

  return ApiResponse.ok(res, feedback, `Feedback marked ${feedback.status}`);
});

/* ========================= DELETE =================================== */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound("Feedback not found");

  // ownership: author or admin
  if (String(feedback.author) !== String(req.user._id) && !req.user.isStaff) {
    throw ApiError.forbidden("You can only delete your own feedback");
  }

  await feedback.deleteOne();
  return ApiResponse.ok(res, { deleted: true }, "Feedback deleted");
});

/* ===================== RATING BREAKDOWN (stats) ===================== */
export const getRatingBreakdown = asyncHandler(async (req, res) => {
  const { targetType, target } = req.query;
  const match = {};
  if (targetType) match.targetType = targetType;
  if (target) match[targetType === "expo" ? "expo" : targetType === "session" ? "session" : "exhibitor"] = target;

  const [byRating, byCategory, byType, summary] = await Promise.all([
    Feedback.aggregate([
      { $match: match },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Feedback.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Feedback.aggregate([
      { $match: match },
      { $group: { _id: "$targetType", count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([
      { $match: match },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          promoters: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
          detractors: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
          wouldRecommend: { $sum: { $cond: ["$wouldRecommend", 1, 0] } },
      } },
    ]),
  ]);

  const s = summary[0] ?? { total: 0, avgRating: 0, promoters: 0, detractors: 0, wouldRecommend: 0 };
  const nps = s.total ? Math.round(((s.promoters - s.detractors) / s.total) * 100) : 0;

  return ApiResponse.ok(res, {
    breakdown: [5, 4, 3, 2, 1].map((n) => ({
      rating: n,
      count: byRating.find((b) => b._id === n)?.count ?? 0,
      percent: s.total ? Math.round(((byRating.find((b) => b._id === n)?.count ?? 0) / s.total) * 100) : 0,
    })),
    byCategory,
    byType,
    summary: { ...s, avgRating: Math.round((s.avgRating ?? 0) * 10) / 10, nps },
  });
});

export default { submitFeedback, listFeedback, getPublicReviews, replyToFeedback, setFeedbackStatus, deleteFeedback, getRatingBreakdown };
