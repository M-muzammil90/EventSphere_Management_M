import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import Session from "../models/Session.js";
import EventRegistration from "../models/EventRegistration.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { uploadAsset, destroyAsset } from "../services/cloudinaryService.js";
import { notificationService } from "../services/notificationService.js";

/* ============================== LIST ============================== */
export const getExpos = asyncHandler(async (req, res) => {
  const {
    q, category, status, city, country, tag,
    minPrice, maxPrice, from, to,
    sort = "startDate", page = 1, limit = 12, featured, includeDrafts,
  } = req.query;

  const filter = {};

  // Non-admins only ever see published/live/completed expos
  const isStaff = ["admin", "organizer"].includes(req.user?.role ?? "guest");
  if (includeDrafts === "true" && isStaff) {
    filter.status = status || { $ne: "archived" };
  } else {
    filter.status = status && isStaff ? status : { $in: ["published", "live", "completed"] };
  }

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { description: rx }, { industry: rx }, { theme: rx }, { tags: rx }];
  }
  if (category) filter.category = category;
  if (featured === "true") filter.isFeatured = true;
  if (tag) filter.tags = tag;
  if (city) filter["venue.city"] = new RegExp(city, "i");
  if (country) filter["venue.country"] = new RegExp(country, "i");
  if (from || to) {
    filter.startDate = {};
    if (from) filter.startDate.$gte = new Date(from);
    if (to) filter.startDate.$lte = new Date(to);
  }

  const sorts = {
    startDate: { startDate: 1 },
    newest: { createdAt: -1 },
    attendees: { "stats.attendees": -1 },
    price: { "capacity.attendees": 1 },
    rating: { "stats.avgRating": -1 },
    title: { title: 1 },
  };

  const total = await Expo.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const expos = await Expo.find(filter)
    .sort(sorts[sort] || sorts.startDate)
    .skip(skip)
    .limit(l)
    .select("-__v")
    .lean();

  // Booth availability + starting price per expo
  const ids = expos.map((e) => e._id);
  const boothAgg = await Booth.aggregate([
    { $match: { expo: { $in: ids } } },
    {
      $group: {
        _id: "$expo",
        boothsTotal: { $sum: 1 },
        boothsSold: { $sum: { $cond: [{ $in: ["$status", ["reserved", "booked"]] }, 1, 0] } },
        boothsAvailable: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
        minPrice: { $min: { $cond: [{ $eq: ["$status", "available"] }, "$price", null] } },
      },
    },
  ]);
  const boothMap = new Map(boothAgg.map((b) => [String(b._id), b]));

  const data = expos.map((e) => {
    const b = boothMap.get(String(e._id)) ?? {};
    const sold = b.boothsSold ?? 0;
    const tot = b.boothsTotal ?? 0;
    return {
      ...e,
      boothsTotal: tot,
      boothsSold: sold,
      boothsAvailable: b.boothsAvailable ?? 0,
      boothOccupancy: tot ? Math.round((sold / tot) * 100) : 0,
      startingPrice: b.minPrice ?? null,
    };
  });

  return ApiResponse.ok(res, data, undefined, { page: p, pages, total, limit: l });
});

/* ============================= DETAIL ============================= */
export const getExpo = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const expo = await Expo.findOne(filter).populate("organizer", "name email avatar");
  if (!expo) throw ApiError.notFound("Expo not found");

  const isStaff = ["admin", "organizer"].includes(req.user?.role ?? "guest");
  if (!isStaff && !["published", "live", "completed"].includes(expo.status)) {
    throw ApiError.notFound("Expo not found");
  }

  const [boothAgg, sessionCount, exhibitors] = await Promise.all([
    Booth.aggregate([
      { $match: { expo: expo._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Session.countDocuments({ expo: expo._id, isPublished: true }),
    Booth.find({ expo: expo._id, status: { $in: ["reserved", "booked"] } })
      .populate("exhibitor", "company.name logo category rating tier")
      .lean(),
  ]);

  const boothStats = { total: 0, available: 0, reserved: 0, booked: 0, blocked: 0 };
  boothAgg.forEach((b) => {
    boothStats[b._id] = b.count;
    boothStats.total += b.count;
  });

  let myRegistration = null;
  if (req.user) {
    myRegistration = await EventRegistration.findOne({ expo: expo._id, user: req.user._id }).lean();
  }

  return ApiResponse.ok(res, {
    expo,
    boothStats,
    sessionCount,
    exhibitorList: exhibitors.map((b) => ({
      boothId: b.boothId,
      exhibitor: b.exhibitor,
    })),
    myRegistration,
  });
});

/* ============================== CREATE ============================ */
export const createExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.create({ ...req.body, organizer: req.user._id });
  return ApiResponse.created(res, expo, "Expo created successfully");
});

/* ============================== UPDATE ============================ */
export const updateExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.findById(req.params.id);
  if (!expo) throw ApiError.notFound("Expo not found");

  // Ownership: only the creating organizer or an admin may edit
  const isOwner = String(expo.organizer) === String(req.user._id);
  const isStaff = req.user.role === "admin" || req.user.role === "organizer";
  if (!isOwner && !isStaff) throw ApiError.forbidden("You can only edit expos you manage");

  Object.assign(expo, req.body);
  await expo.save({ runValidators: true, new: true });

  return ApiResponse.ok(res, expo, "Expo updated successfully");
});

/* ============================== DELETE ============================ */
export const deleteExpo = asyncHandler(async (req, res) => {
  const expo = await Expo.findById(req.params.id);
  if (!expo) throw ApiError.notFound("Expo not found");

  const isOwner = String(expo.organizer) === String(req.user._id);
  const isStaff = req.user.role === "admin" || req.user.role === "organizer";
  if (!isOwner && !isStaff) throw ApiError.forbidden("You can only delete expos you manage");

  // Remove banner asset if stored in Cloudinary
  if (expo.banner?.publicId) {
    try {
      await destroyAsset(expo.banner.publicId, "image");
    } catch (e) {
      // ignore
    }
  }

  // Delete all dependent records and the expo itself from MongoDB
  await Promise.all([
    EventRegistration.deleteMany({ expo: expo._id }),
    Booth.deleteMany({ expo: expo._id }),
    Session.deleteMany({ expo: expo._id }),
    expo.deleteOne(),
  ]);

  return ApiResponse.ok(res, { deleted: true }, "Expo deleted permanently");
});

/* ============================= PUBLISH ============================ */
export const setPublishState = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const expo = await Expo.findById(req.params.id);
  if (!expo) throw ApiError.notFound("Expo not found");

  const isOwner = String(expo.organizer) === String(req.user._id);
  const isStaff = req.user.role === "admin" || req.user.role === "organizer";
  if (!isOwner && !isStaff) throw ApiError.forbidden("Not your expo");

  const previous = expo.status;
  expo.status = status;
  if (status === "published" && !expo.publishedAt) expo.publishedAt = new Date();
  await expo.save();

  // Notify registered attendees when an expo goes live
  if (status === "live" && previous !== "live") {
    const regs = await EventRegistration.find({ expo: expo._id, status: "confirmed" }).select("user");
    await notificationService.notifyMany(regs.map((r) => r.user), {
      type: "system",
      title: `${expo.title} is now live`,
      body: "The halls are open — check your agenda and booth plan.",
      link: `/expos/${expo.slug}`,
      priority: "high",
    });
  }

  return ApiResponse.ok(res, expo, `Expo is now ${status}`);
});

/* =========================== BANNER UPLOAD ======================== */
export const uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("A banner image is required");

  const expo = await Expo.findById(req.params.id);
  if (!expo) throw ApiError.notFound("Expo not found");

  const isOwner = String(expo.organizer) === String(req.user._id);
  const isStaff = req.user.role === "admin" || req.user.role === "organizer";
  if (!isOwner && !isStaff) throw ApiError.forbidden("Not your expo");

  const asset = await uploadAsset(req.file, { folder: "banners", resourceType: "image" });
  // Remove the previous banner from storage
  if (expo.banner?.publicId) await destroyAsset(expo.banner.publicId, "image");

  expo.banner = { url: asset.url, publicId: asset.publicId };
  await expo.save();

  return ApiResponse.ok(res, expo, "Banner uploaded successfully");
});

/* =========================== MY EXPOS ============================= */
export const getMyExpos = asyncHandler(async (req, res) => {
  const expos = await Expo.find({ organizer: req.user._id }).sort({ createdAt: -1 }).lean();
  return ApiResponse.ok(res, expos);
});

export default { getExpos, getExpo, createExpo, updateExpo, deleteExpo, setPublishState, uploadBanner, getMyExpos };
