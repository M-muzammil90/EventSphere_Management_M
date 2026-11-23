import mongoose from "mongoose";
import Booth from "../models/Booth.js";
import Expo from "../models/Expo.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { emitToExpo } from "../services/socketService.js";
import { notificationService } from "../services/notificationService.js";

/* =====================================================================
   FLOOR PLAN
   Returns every booth for an expo with live availability. Public route —
   only non-sensitive fields are exposed.
   ===================================================================== */
export const getFloorPlan = asyncHandler(async (req, res) => {
  const { expoId } = req.params;
  const { zone, status, category } = req.query;

  const expo = await Expo.findOne({ $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(expoId) ? expoId : null }, { slug: expoId }] });
  if (!expo) throw ApiError.notFound("Expo not found");

  const filter = { expo: expo._id };
  if (zone) filter.zone = zone;
  if (category) filter.category = category;
  if (status) filter.status = status;

  let booths = await Booth.find(filter)
    .populate("exhibitor", "company.name logo category tier rating")
    .sort({ boothId: 1 })
    .lean();

  if (booths.length === 0 && !zone && !category && !status) {
    const defaultBooths = [
      { boothId: "A-01", zone: "A", category: "Island", sqm: 72, price: 12000, position: { x: 4, y: 4 }, size: { w: 22, h: 22 } },
      { boothId: "A-02", zone: "A", category: "Large", sqm: 48, price: 8400, position: { x: 28, y: 4 }, size: { w: 18, h: 22 } },
      { boothId: "A-03", zone: "A", category: "Medium", sqm: 30, price: 5600, position: { x: 48, y: 4 }, size: { w: 14, h: 16 } },
      { boothId: "A-04", zone: "A", category: "Medium", sqm: 30, price: 5600, position: { x: 48, y: 22 }, size: { w: 14, h: 16 } },
      { boothId: "A-05", zone: "A", category: "Small", sqm: 12, price: 2600, position: { x: 4, y: 28 }, size: { w: 14, h: 14 } },
      { boothId: "A-06", zone: "A", category: "Small", sqm: 12, price: 2600, position: { x: 20, y: 28 }, size: { w: 14, h: 14 } },
      { boothId: "B-01", zone: "B", category: "Island", sqm: 72, price: 12000, position: { x: 74, y: 4 }, size: { w: 22, h: 22 } },
      { boothId: "B-02", zone: "B", category: "Large", sqm: 48, price: 8400, position: { x: 74, y: 28 }, size: { w: 18, h: 20 } },
      { boothId: "B-03", zone: "B", category: "Medium", sqm: 30, price: 5600, position: { x: 74, y: 50 }, size: { w: 14, h: 16 } },
      { boothId: "B-04", zone: "B", category: "Small", sqm: 12, price: 2600, position: { x: 74, y: 68 }, size: { w: 12, h: 14 } },
      { boothId: "C-01", zone: "C", category: "Medium", sqm: 30, price: 5600, position: { x: 4, y: 46 }, size: { w: 16, h: 16 } },
      { boothId: "C-02", zone: "C", category: "Small", sqm: 12, price: 2600, position: { x: 22, y: 46 }, size: { w: 14, h: 14 } },
      { boothId: "C-03", zone: "C", category: "Small", sqm: 12, price: 2600, position: { x: 38, y: 46 }, size: { w: 14, h: 14 } },
      { boothId: "D-01", zone: "D", category: "Small", sqm: 12, price: 2600, position: { x: 4, y: 66 }, size: { w: 14, h: 14 } },
      { boothId: "D-02", zone: "D", category: "Small", sqm: 12, price: 2600, position: { x: 20, y: 66 }, size: { w: 14, h: 14 } },
      { boothId: "D-03", zone: "D", category: "Small", sqm: 12, price: 2600, position: { x: 36, y: 66 }, size: { w: 14, h: 14 } },
    ];
    await Booth.insertMany(defaultBooths.map((b) => ({ ...b, expo: expo._id, status: "available" })));
    booths = await Booth.find(filter)
      .populate("exhibitor", "company.name logo category tier rating")
      .sort({ boothId: 1 })
      .lean();
  }

  // release expired holds so availability is always accurate
  // release expired holds so availability is always accurate
  await Booth.updateMany(
    { expo: expo._id, status: "available", heldUntil: { $ne: null, $lt: new Date() } },
    { $set: { exhibitor: null, heldUntil: null } }
  );

  const summary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const counts = { available: 0, reserved: 0, booked: 0, blocked: 0 };
  booths.forEach((b) => {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
    if (b.zone in summary) summary[b.zone] += 1;
  });

  return ApiResponse.ok(res, { expo: { _id: expo._id, title: expo.title, venue: expo.venue }, booths, counts, zones: summary });
});

export const getBooth = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booth = await Booth.findById(id).populate("exhibitor", "company.name logo category");
  if (!booth) throw ApiError.notFound("Booth not found");
  return ApiResponse.ok(res, booth);
});

/* ============================ CREATE BOOTH ========================== */
export const createBooth = asyncHandler(async (req, res) => {
  const { expo, boothId, zone, category, sqm, price, ...rest } = req.body;

  const target = await Expo.findById(expo);
  if (!target) throw ApiError.notFound("Expo not found");

  const dupe = await Booth.findOne({ expo, boothId });
  if (dupe) throw ApiError.conflict(`Booth ${boothId} already exists in this expo`);

  const booth = await Booth.create({ expo, boothId, zone, category, sqm, price, ...rest });
  emitToExpo(String(expo), "booth:updated", { expoId: String(expo), boothId: booth.boothId, status: booth.status });

  return ApiResponse.created(res, booth, `Booth ${booth.boothId} created`);
});

/* ============================ UPDATE BOOTH ========================== */
export const updateBooth = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const booth = isMongoId
    ? await Booth.findById(req.params.id)
    : await Booth.findOne({ boothId: req.params.id });
  if (!booth) throw ApiError.notFound("Booth not found");

  // changing the boothId must not collide
  if (req.body.boothId && req.body.boothId !== booth.boothId) {
    const dupe = await Booth.findOne({ expo: booth.expo, boothId: req.body.boothId, _id: { $ne: booth._id } });
    if (dupe) throw ApiError.conflict(`Booth ${req.body.boothId} already exists in this expo`);
  }

  Object.assign(booth, req.body);
  await booth.save({ runValidators: true });

  emitToExpo(String(booth.expo), "booth:updated", {
    expoId: String(booth.expo), boothId: booth.boothId, status: booth.status,
  });

  return ApiResponse.ok(res, booth, "Booth updated");
});

/* ============================ DELETE BOOTH ========================== */
export const deleteBooth = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const booth = isMongoId
    ? await Booth.findById(req.params.id)
    : await Booth.findOne({ boothId: req.params.id });
  if (!booth) throw ApiError.notFound("Booth not found");

  await booth.deleteOne();
  emitToExpo(String(booth.expo), "booth:updated", {
    expoId: String(booth.expo), boothId: booth.boothId, status: "deleted",
  });

  return ApiResponse.ok(res, { deleted: true }, `Booth ${booth.boothId} deleted`);
});

/* =====================================================================
   RESERVE  —  ATOMIC. Two concurrent requests for the same booth cannot
   both succeed: findOneAndUpdate with a status guard makes the check and
   the write a single database operation.
   ===================================================================== */
export const reserveBooth = asyncHandler(async (req, res) => {
  const { holdMinutes = 60, note } = req.body;

  // Exhibitors must have an approved profile
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.forbidden("Only exhibitors can reserve booths");

  // Resolve the booth first so we know which expo it belongs to
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const target = isMongoId
    ? await Booth.findById(req.params.id).select("expo boothId status")
    : await Booth.findOne({ boothId: req.params.id }).select("expo boothId status");
  if (!target) throw ApiError.notFound("Booth not found");

  // An exhibitor may hold only one booth per expo
  const already = await Booth.findOne({
    expo: target.expo,
    exhibitor: profile._id,
    status: { $in: ["reserved", "booked"] },
  });
  if (already && String(already._id) !== String(target._id)) {
    throw ApiError.conflict(`You already hold booth ${already.boothId} at this expo`);
  }

  const heldUntil = new Date(Date.now() + holdMinutes * 60 * 1000);

  /* ---- the critical atomic guard ---- */
  const booth = await Booth.findOneAndUpdate(
    {
      _id: target._id,
      status: "available",
      $or: [{ heldUntil: null }, { heldUntil: { $lte: new Date() } }],
    },
    {
      $set: { status: "reserved", exhibitor: profile._id, heldUntil, reservedAt: new Date() },
      $unset: { bookedAt: 1 },
    },
    { new: true, runValidators: true }
  );

  if (!booth) {
    // Someone beat us to it
    const current = await Booth.findById(target._id).select("status exhibitor boothId");
    throw ApiError.conflict(
      current
        ? `Booth ${current.boothId} is no longer available (status: ${current.status}). Please choose another booth.`
        : "Booth not found"
    );
  }

  emitToExpo(String(booth.expo), "booth:updated", {
    expoId: String(booth.expo), boothId: booth.boothId, status: "reserved", owner: profile.company?.name,
  });

  const populated = await booth.populate([{ path: "exhibitor", select: "company.name logo" }, { path: "expo", select: "title" }]);

  return ApiResponse.ok(res, populated, `Booth ${booth.boothId} reserved for you — complete payment within ${holdMinutes} minutes`);
});

/* =========================== RELEASE BOOTH ========================== */
export const releaseBooth = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const booth = isMongoId
    ? await Booth.findById(req.params.id)
    : await Booth.findOne({ boothId: req.params.id });
  if (!booth) throw ApiError.notFound("Booth not found");

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  const ownsIt = profile && String(booth.exhibitor) === String(profile._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "organizer";
  if (!ownsIt && !isAdmin) throw ApiError.forbidden("You can only release your own booth");

  const previousOwner = booth.exhibitor;

  booth.status = "available";
  booth.exhibitor = null;
  booth.heldUntil = null;
  booth.reservedAt = null;
  booth.bookedAt = null;
  await booth.save();

  emitToExpo(String(booth.expo), "booth:updated", { expoId: String(booth.expo), boothId: booth.boothId, status: "available" });

  if (previousOwner) {
    await notificationService.notify({
      recipient: previousOwner, type: "booth_released",
      title: `Booth ${booth.boothId} released`,
      body: "Your reservation was released and the booth is available again.",
      link: "/portal", relatedType: "booth", relatedId: booth._id,
    });
  }

  return ApiResponse.ok(res, booth, `Booth ${booth.boothId} released`);
});

/* =========================== ASSIGN BOOTH =========================== */
export const assignBooth = asyncHandler(async (req, res) => {
  const { exhibitor, status = "booked", note } = req.body;

  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const booth = isMongoId
    ? await Booth.findById(req.params.id)
    : await Booth.findOne({ boothId: req.params.id });
  if (!booth) throw ApiError.notFound("Booth not found");

  let profile = null;
  if (exhibitor) {
    profile = /^[0-9a-fA-F]{24}$/.test(exhibitor)
      ? await ExhibitorProfile.findById(exhibitor)
      : await ExhibitorProfile.findOne({ "company.name": new RegExp(`^${exhibitor}$`, "i") });
  }

  // If the exhibitor already holds another booth in this expo, release it first so the 1-booth-per-expo unique constraint is satisfied
  if (profile && (status === "booked" || status === "reserved")) {
    await Booth.updateMany(
      { expo: booth.expo, exhibitor: profile._id, _id: { $ne: booth._id } },
      { $set: { status: "available", exhibitor: null, heldUntil: null, bookedAt: null } }
    );
  }

  // update booth assignment
  booth.status = status;
  if (status === "available" || !exhibitor) {
    booth.exhibitor = null;
    booth.bookedAt = null;
    booth.heldUntil = null;
  } else if (profile) {
    booth.exhibitor = profile._id;
    if (status === "booked") booth.bookedAt = new Date();
  }
  if (note) booth.notes = note;
  booth.heldUntil = null;
  await booth.save();

  const populated = await booth.populate([
    { path: "exhibitor", select: "company.name logo tier" },
    { path: "expo", select: "title slug" },
  ]);

  emitToExpo(String(booth.expo), "booth:updated", {
    expoId: String(booth.expo), boothId: booth.boothId, status, owner: profile?.company?.name || "",
  });

  if (profile?.user) {
    await notificationService.notifyBoothAllocation({
      recipient: profile.user,
      expoTitle: populated.expo?.title,
      boothLabel: booth.boothId,
      price: booth.price,
      currency: booth.currency,
    });
  }

  return ApiResponse.ok(res, populated, `Booth ${booth.boothId} assigned`);
});

/* =========================== BULK CREATE ============================ */
export const bulkCreateBooths = asyncHandler(async (req, res) => {
  const { expo, booths } = req.body; // [{boothId, zone, category, sqm, price}]
  if (!Array.isArray(booths) || !booths.length) throw ApiError.badRequest("A non-empty booths array is required");

  const session = await mongoose.startSession();
  try {
    let created = [];
    await session.withTransaction(async () => {
      const docs = await Booth.insertMany(booths.map((b) => ({ ...b, expo })), { session });
      created = docs;
    });
    emitToExpo(String(expo), "booth:updated", { expoId: String(expo), status: "bulk_created", count: created.length });
    return ApiResponse.created(res, created, `${created.length} booths created`);
  } finally {
    session.endSession();
  }
});

/* =========================== MY BOOTHS ============================== */
export const getMyBooths = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) return ApiResponse.ok(res, []);

  const booths = await Booth.find({ exhibitor: profile._id })
    .populate("expo", "title slug startDate endDate venue.city")
    .sort({ createdAt: -1 });
  return ApiResponse.ok(res, booths);
});

/* =========================== AVAILABILITY =========================== */
export const getAvailability = asyncHandler(async (req, res) => {
  const { expoId } = req.params;
  const agg = await Booth.aggregate([
    { $match: { expo: mongoose.Types.ObjectId.createFromHexString(
        /^[0-9a-fA-F]{24}$/.test(expoId) ? expoId : "000000000000000000000000"
      ) } },
    { $group: { _id: { zone: "$zone", category: "$category", status: "$status" }, count: { $sum: 1 }, minPrice: { $min: "$price" } } },
    { $group: {
        _id: { zone: "$_id.zone", category: "$_id.category" },
        total: { $sum: "$count" },
        available: { $sum: { $cond: [{ $eq: ["$_id.status", "available"] }, "$count", 0] } },
        prices: { $push: { status: "$_id.status", count: "$count", minPrice: "$minPrice" } },
    } },
    { $sort: { "_id.zone": 1, "_id.category": 1 } },
  ]);
  return ApiResponse.ok(res, agg);
});

export default { getFloorPlan, createBooth, updateBooth, deleteBooth, reserveBooth, releaseBooth, assignBooth, bulkCreateBooths, getMyBooths, getAvailability };
