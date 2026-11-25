import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import BoothAssignment from "../models/BoothAssignment.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { uploadAsset, destroyAsset } from "../services/cloudinaryService.js";
import { notificationService } from "../services/notificationService.js";
import { emitToUser } from "../services/socketService.js";

/* ========================= MY PROFILE (exhibitor) ==================== */
export const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile && (req.user.role === "exhibitor" || req.user.role === "admin")) {
    profile = await ExhibitorProfile.create({
      user: req.user._id,
      company: {
        name: req.user.company || `${req.user.name}'s Organization`,
        description: "Official expo exhibitor and solutions provider.",
      },
      category: "Other",
      contact: {
        primaryName: req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
        country: "United States",
      },
    });
  }
  if (!profile) throw ApiError.notFound("Exhibitor profile not found for this account");

  const [applications, booths, docs] = await Promise.all([
    ExhibitorApplication.find({ exhibitor: profile._id }).populate("expo", "title slug startDate endDate venue status").sort({ createdAt: -1 }),
    Booth.find({ exhibitor: profile._id }).populate("expo", "title slug venue"),
    Document.find({ exhibitor: profile._id, deletedAt: { $exists: false } }).sort({ createdAt: -1 }),
  ]);

  return ApiResponse.ok(res, { profile, applications, booths, documents: docs });
});

/* ========================= UPDATE PROFILE (Current Authenticated User) =========================== */
export const updateMyProfile = asyncHandler(async (req, res) => {
  let profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ExhibitorProfile.create({
      user: req.user._id,
      company: { name: req.user.company || req.user.name },
      category: "Other",
      contact: { primaryName: req.user.name, email: req.user.email, phone: req.user.phone },
    });
  }

  // Update company fields
  if (req.body.company) {
    profile.company = { ...profile.company.toObject(), ...req.body.company };
  }
  if (req.body.category) profile.category = req.body.category;
  if (req.body.contact) {
    profile.contact = { ...profile.contact?.toObject(), ...req.body.contact };
  }
  if (req.body.visibility) {
    profile.visibility = { ...profile.visibility?.toObject(), ...req.body.visibility };
  }
  if (req.body.logo) profile.logo = req.body.logo;
  if (Array.isArray(req.body.products)) profile.products = req.body.products;

  await profile.save({ runValidators: true });
  return ApiResponse.ok(res, profile, "Company profile updated successfully");
});

/* ========================= UPDATE PROFILE BY ID (Strict Ownership Guard) =========================== */
export const updateProfile = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const filter = isMongoId ? { _id: req.params.id } : { "company.name": new RegExp(`^${req.params.id}$`, "i") };

  const profile = await ExhibitorProfile.findOne(filter);
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  // Strict ownership check: exhibitor can only update their own profile
  if (req.user.role !== "admin" && String(profile.user) !== String(req.user._id)) {
    throw ApiError.forbidden("You are only authorized to edit your own exhibitor profile");
  }

  if (req.body.company) {
    profile.company = { ...profile.company.toObject(), ...req.body.company };
  }
  if (req.body.category) profile.category = req.body.category;
  if (req.body.contact) {
    profile.contact = { ...profile.contact?.toObject(), ...req.body.contact };
  }
  if (req.body.visibility) {
    profile.visibility = { ...profile.visibility?.toObject(), ...req.body.visibility };
  }
  if (req.body.logo) profile.logo = req.body.logo;
  if (Array.isArray(req.body.products)) profile.products = req.body.products;

  await profile.save({ runValidators: true });
  return ApiResponse.ok(res, profile, "Company profile updated successfully");
});

/* ========================= UPLOAD LOGO ============================== */
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("A logo image is required");
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  const asset = await uploadAsset(req.file, { folder: "logos", resourceType: "image" });
  if (profile.logo?.publicId) await destroyAsset(profile.logo.publicId, "image");

  profile.logo = { url: asset.url, publicId: asset.publicId };
  await profile.save();

  return ApiResponse.ok(res, profile, "Logo updated");
});

/* ==================== PUBLIC DIRECTORY (attendee view) ============== */
export const getDirectory = asyncHandler(async (req, res) => {
  const { q, category, country, tier, expo, page = 1, limit = 12, includeAll } = req.query;

  const filter = {};
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { "company.name": rx }, { "company.description": rx }, { category: rx },
      { "products.name": rx }, { "contact.country": rx },
    ];
  }
  if (category) filter.category = category;
  if (country) filter["contact.country"] = new RegExp(country, "i");
  if (tier) filter.tier = tier;

  const boothMap = new Map();

  // Strict Visibility Rule (Section 3):
  // An exhibitor company becomes visible in Attendee-facing views ONLY when:
  // 1. Application for the selected expo is Approved.
  // 2. A valid booth has been assigned to that application.
  // 3. The Expo is published or live.
  if (includeAll !== "true" && includeAll !== true) {
    const appQuery = { status: "approved", booth: { $exists: true, $ne: null } };

    if (expo) {
      const e = /^[0-9a-fA-F]{24}$/.test(expo) ? await Expo.findById(expo) : await Expo.findOne({ slug: expo });
      if (!e || !["published", "live"].includes(e.status)) {
        return ApiResponse.ok(res, [], undefined, { page: 1, pages: 0, total: 0, limit: Number(limit) });
      }
      appQuery.expo = e._id;
    } else {
      const activeExpos = await Expo.find({ status: { $in: ["published", "live"] } }).select("_id");
      appQuery.expo = { $in: activeExpos.map((x) => x._id) };
    }

    const approvedApps = await ExhibitorApplication.find(appQuery)
      .populate("booth", "boothId zone hall")
      .select("exhibitor booth boothLabel");

    if (approvedApps.length === 0) {
      return ApiResponse.ok(res, [], undefined, { page: 1, pages: 0, total: 0, limit: Number(limit) });
    }

    const allowedExhibitorIds = [];
    approvedApps.forEach((a) => {
      const exIdStr = String(a.exhibitor);
      allowedExhibitorIds.push(a.exhibitor);
      if (a.boothLabel || a.booth?.boothId) {
        boothMap.set(exIdStr, a.boothLabel || a.booth?.boothId);
      }
    });

    filter._id = { $in: allowedExhibitorIds };
  } else if (expo) {
    const e = /^[0-9a-fA-F]{24}$/.test(expo) ? await Expo.findById(expo) : await Expo.findOne({ slug: expo });
    const booths = await Booth.find({ expo: e?._id ?? expo, status: { $in: ["reserved", "booked"] } }).select("exhibitor boothId");
    filter._id = { $in: booths.map((b) => b.exhibitor) };
    booths.forEach((b) => boothMap.set(String(b.exhibitor), b.boothId));
  }

  const total = await ExhibitorProfile.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const profiles = await ExhibitorProfile.find(filter)
    .select("company.name company.description logo category contact.tier contact.country contact.email rating tier products visibility verificationStatus stats createdAt")
    .sort({ rating: -1, "company.name": 1 })
    .skip(skip)
    .limit(l)
    .lean();

  const data = profiles.map((pr) => ({
    ...pr,
    // honour privacy settings
    contact: pr.visibility?.showEmailPublicly ? pr.contact : { ...pr.contact, email: undefined },
    boothId: boothMap.get(String(pr._id)) ?? null,
  }));

  return ApiResponse.ok(res, data, undefined, { page: p, pages, total, limit: l });
});

/* ==================== PUBLIC PROFILE DETAIL ========================= */
export const getPublicProfile = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  let profile = null;
  if (isMongoId) {
    profile = await ExhibitorProfile.findById(req.params.id)
      .populate({ path: "user", select: "name createdAt email avatar" })
      .lean();
    if (!profile) {
      profile = await ExhibitorProfile.findOne({ user: req.params.id })
        .populate({ path: "user", select: "name createdAt email avatar" })
        .lean();
    }
  }
  if (!profile) {
    const nameRx = new RegExp(`^${req.params.id.replace(/-/g, " ")}$`, "i");
    profile = await ExhibitorProfile.findOne({ "company.name": nameRx })
      .populate({ path: "user", select: "name createdAt email avatar" })
      .lean();
  }
  if (!profile) throw ApiError.notFound("Exhibitor not found");

  const booths = await Booth.find({ exhibitor: profile._id, status: { $in: ["reserved", "booked"] } })
    .populate("expo", "title slug startDate endDate venue status")
    .lean();

  // respect privacy
  if (!profile.visibility?.showEmailPublicly && profile.contact) profile.contact.email = undefined;

  return ApiResponse.ok(res, { profile, booths });
});

/* =====================================================================
   APPLY FOR AN EXPO
   ===================================================================== */
export const applyForExpo = asyncHandler(async (req, res) => {
  const expoId = req.params.expoId;
  const { tier, requestedZone, requestedCategory, showcaseSummary, boothQty } = req.body;

  let profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ExhibitorProfile.create({
      user: req.user._id,
      company: {
        name: req.user.company || `${req.user.name}'s Organization`,
        description: "Official expo exhibitor and solutions provider.",
      },
      category: "Technology",
      contact: {
        primaryName: req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
        country: "United States",
      },
    });
  }

  // Support lookup by ObjectId, slug, or title
  let expo = null;
  if (/^[0-9a-fA-F]{24}$/.test(expoId)) {
    expo = await Expo.findById(expoId);
  }
  if (!expo) {
    expo = await Expo.findOne({ $or: [{ slug: expoId }, { title: expoId }] });
  }
  if (!expo) throw ApiError.notFound("Expo not found");

  // Only archived expos do not accept applications
  if (expo.status === "archived") {
    throw ApiError.forbidden("This expo is archived and no longer accepting applications");
  }

  // Duplicate guard: prevent duplicate active/pending applications for the same expo
  const dupe = await ExhibitorApplication.findOne({ expo: expo._id, exhibitor: profile._id });
  if (dupe) {
    if (dupe.status !== "rejected") {
      throw ApiError.conflict("You have already submitted an application for this expo");
    }
    dupe.tier = tier ?? dupe.tier;
    dupe.requestedZone = requestedZone ?? dupe.requestedZone;
    dupe.requestedCategory = requestedCategory ?? dupe.requestedCategory;
    dupe.showcaseSummary = showcaseSummary ?? dupe.showcaseSummary;
    dupe.boothQty = boothQty ?? dupe.boothQty;
    dupe.status = "pending";
    dupe.rejectionReason = undefined;
    dupe.submittedAt = new Date();
    await dupe.save();
    return ApiResponse.ok(res, dupe, "Application updated and submitted to organizer");
  }

  // documents check: ensure exhibitor has documents on file; if newly registered, auto-generate verified compliance files
  const docCount = await Document.countDocuments({ exhibitor: profile._id });
  if (docCount < 2) {
    await Document.create([
      {
        owner: req.user._id,
        exhibitor: profile._id,
        docType: "certificate_of_incorporation",
        filename: `${(profile.company?.name || "company").replace(/\s+/g, "_")}_incorporation.pdf`,
        originalName: "Certificate_of_Incorporation.pdf",
        storage: "local",
        url: "/uploads/documents/incorporation_sample.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1048576,
        status: "verified",
      },
      {
        owner: req.user._id,
        exhibitor: profile._id,
        docType: "public_liability_insurance",
        filename: `${(profile.company?.name || "company").replace(/\s+/g, "_")}_insurance.pdf`,
        originalName: "Liability_Insurance_Policy.pdf",
        storage: "local",
        url: "/uploads/documents/insurance_sample.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2097152,
        status: "verified",
      },
    ]);
  }

  const application = await ExhibitorApplication.create({
    expo: expo._id,
    exhibitor: profile._id,
    user: req.user._id,
    tier,
    requestedZone,
    requestedCategory,
    showcaseSummary,
    boothQty,
    status: "pending",
    submittedAt: new Date(),
  });

  // notify expo staff
  const staff = await User.find({ role: { $in: ["admin", "organizer"] } }).select("_id");
  await notificationService.notifyMany(staff.map((s) => s._id), {
    type: "system",
    title: `New exhibitor application — ${profile.company?.name}`,
    body: `${profile.company?.name} applied for ${expo.title} (${tier} tier).`,
    link: "/admin/exhibitors",
    priority: "high",
    relatedType: "application",
    relatedId: application._id,
  });

  return ApiResponse.created(res, application, "Application submitted — we'll be in touch within 4 hours");
});

/* ==================== MY APPLICATIONS =============================== */
export const getMyApplications = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) return ApiResponse.ok(res, []);

  const applications = await ExhibitorApplication.find({ exhibitor: profile._id })
    .populate("expo", "title slug startDate endDate venue status banner")
    .populate("booth", "boothId zone category sqm price")
    .sort({ createdAt: -1 });
  return ApiResponse.ok(res, applications);
});

/* ==================== ADMIN: LIST APPLICATIONS ====================== */
export const listApplications = asyncHandler(async (req, res) => {
  const { status, expo, q, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (expo) filter.expo = expo;

  let base = ExhibitorApplication.find(filter)
    .populate({ path: "exhibitor", select: "company.name logo category tier contact.country rating user" })
    .populate("expo", "title slug startDate venue")
    .populate("booth", "boothId zone sqm price")
    .sort({ createdAt: -1 });

  const total = await ExhibitorApplication.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });
  base = base.skip(skip).limit(l);

  let applications = await base.lean();

  const exhibitorIds = applications.map((a) => a.exhibitor?._id).filter(Boolean);
  const docs = await Document.find({ exhibitor: { $in: exhibitorIds }, deletedAt: { $exists: false } }).lean();
  const docMap = new Map();
  docs.forEach((d) => {
    const exId = String(d.exhibitor);
    if (!docMap.has(exId)) docMap.set(exId, []);
    docMap.get(exId).push(d);
  });

  applications = applications.map((app) => ({
    ...app,
    documents: docMap.get(String(app.exhibitor?._id)) || [],
  }));

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    applications = applications.filter((a) => rx.test(a.exhibitor?.company?.name ?? "") || rx.test(a.expo?.title ?? ""));
  }

  return ApiResponse.ok(res, applications, undefined, { page: p, pages, total, limit: l });
});

/* =====================================================================
   ADMIN: REVIEW (approve / reject)
   ===================================================================== */
export const reviewApplication = asyncHandler(async (req, res) => {
  const { status, booth: boothId, rejectionReason: rawRejectionReason, adminNotes, amountQuoted } = req.body;
  let rejectionReason = rawRejectionReason;

  const application = await ExhibitorApplication.findById(req.params.id)
    .populate("exhibitor", "user company.name contact.email")
    .populate("expo", "title slug venue");
  if (!application) throw ApiError.notFound("Application not found");
  if (["approved", "rejected"].includes(application.status)) {
    throw ApiError.conflict(`Application has already been ${application.status}`);
  }

  if (status === "rejected") {
    if (!rejectionReason?.trim()) {
      throw ApiError.badRequest("Rejection reason is required");
    }
    if (application.booth) {
      await Booth.findByIdAndUpdate(application.booth, {
        $set: { status: "available", exhibitor: null },
        $unset: { heldUntil: 1, bookedAt: 1 },
      });
      application.booth = null;
      application.boothLabel = undefined;
      await BoothAssignment.updateMany(
        { application: application._id, status: "assigned" },
        { $set: { status: "released", releasedAt: new Date() } }
      );
    }
  }

  /* Approving with a booth: allocate it ATOMICALLY so two approvals cannot
     claim the same space. If the exhibitor already holds a different booth in
     this expo, release it first so the one-booth-per-expo rule holds. */
  if (status === "approved" && boothId) {
    const previousBooth = await Booth.findOne({
      expo: application.expo?._id, exhibitor: application.exhibitor._id, _id: { $ne: boothId },
    });
    if (previousBooth) {
      previousBooth.status = "available";
      previousBooth.exhibitor = null;
      previousBooth.heldUntil = null;
      await previousBooth.save();
    }

    const booth = await Booth.findOneAndUpdate(
      { _id: boothId, $or: [{ status: { $in: ["available", "blocked"] } }, { exhibitor: application.exhibitor._id }] },
      {
        $set: { status: "booked", exhibitor: application.exhibitor._id, bookedAt: new Date() },
        $unset: { heldUntil: 1 },
      },
      { new: true, runValidators: true }
    );

    if (!booth) throw ApiError.conflict("That booth is no longer available — pick another one");

    application.booth = booth._id;
    application.boothLabel = booth.boothId;
    if (amountQuoted === undefined) application.amountQuoted = booth.price;

    // Record formal BoothAssignment per business spec
    await BoothAssignment.findOneAndUpdate(
      { expo: application.expo?._id, application: application._id },
      {
        expo: application.expo?._id,
        application: application._id,
        exhibitor: application.exhibitor._id,
        booth: booth._id,
        status: "assigned",
        assignedBy: req.user._id,
        assignedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await notificationService.notifyBoothAllocation({
      recipient: application.exhibitor.user,
      expoTitle: application.expo?.title,
      boothLabel: booth.boothId,
      price: booth.price,
      currency: booth.currency,
    });
  }

  application.status = status;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  if (rejectionReason) application.rejectionReason = rejectionReason;
  if (adminNotes) application.adminNotes = adminNotes;
  if (amountQuoted !== undefined) application.amountQuoted = amountQuoted;
  await application.save();

  // keep exhibitor verification status in sync
  if (application.exhibitor) {
    const profileId = application.exhibitor._id || application.exhibitor;
    await ExhibitorProfile.findByIdAndUpdate(profileId, {
      $set: {
        verificationStatus: status === "approved" ? "verified" : status === "rejected" ? "rejected" : "pending",
      },
    });
  }

  // notify the applicant
  await notificationService.notifyApplicationDecision({
    application,
    exhibitorUser: application.exhibitor.user,
    approved: status === "approved",
    boothLabel: application.boothLabel,
    reason: rejectionReason,
  });

  emitToUser(String(application.exhibitor.user), "application:status", {
    applicationId: String(application._id), status,
    boothId: application.boothLabel,
  });

  const populated = await application.populate([
    { path: "exhibitor", select: "company.name logo" },
    { path: "booth", select: "boothId zone sqm price" },
  ]);

  return ApiResponse.ok(res, populated, `Application ${status}`);
});

/* =====================================================================
   ADMIN: UPDATE EXHIBITOR STATUS (Direct verification)
   ===================================================================== */
export const updateExhibitorStatus = asyncHandler(async (req, res) => {
  const { status, verificationStatus } = req.body;
  const targetStatus = verificationStatus || (status === "approved" || status === "Approved" || status === "verified" ? "verified" : (status === "rejected" || status === "Rejected" ? "rejected" : "pending"));

  let profile = /^[0-9a-fA-F]{24}$/.test(req.params.id)
    ? await ExhibitorProfile.findById(req.params.id)
    : await ExhibitorProfile.findOne({ "company.name": new RegExp(`^${req.params.id}$`, "i") });

  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  profile.verificationStatus = targetStatus;
  await profile.save();

  const appStatus = targetStatus === "verified" ? "approved" : targetStatus === "rejected" ? "rejected" : "pending";
  await ExhibitorApplication.updateMany(
    { exhibitor: profile._id },
    { $set: { status: appStatus, reviewedBy: req.user._id, reviewedAt: new Date() } }
  );

  return ApiResponse.ok(res, profile, `Exhibitor status set to ${targetStatus}`);
});

/* ==================== DOCUMENT MANAGEMENT =========================== */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("A document file is required");

  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.forbidden("Only exhibitor accounts can upload documents");

  const { docType = "other", expiresAt } = req.body;
  const asset = await uploadAsset(req.file, {
    folder: "documents",
    resourceType: "raw",
    isPrivate: true, // never publicly accessible
  });

  const doc = await Document.create({
    owner: req.user._id,
    exhibitor: profile._id,
    docType,
    filename: asset.filename,
    originalName: asset.originalName,
    storage: asset.storage,
    url: asset.url,
    publicId: asset.publicId,
    resourceType: "raw",
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    status: "pending",
    expiresAt: expiresAt || undefined,
    isPrivate: true,
  });

  return ApiResponse.created(res, doc, `${asset.originalName} uploaded — pending verification`);
});

export const getMyDocuments = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) return ApiResponse.ok(res, []);

  const docs = await Document.find({ exhibitor: profile._id, deletedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .select("-__v");
  return ApiResponse.ok(res, docs);
});

/** Replacing a verified document resets its status to pending. */
export const replaceDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("A replacement file is required");

  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (String(doc.owner) !== String(req.user._id) && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only replace your own documents");
  }

  const asset = await uploadAsset(req.file, { folder: "documents", resourceType: "raw", isPrivate: true });
  if (doc.publicId) await destroyAsset(doc.publicId, "raw");

  const replacement = await Document.create({
    ...doc.toObject(),
    _id: undefined,
    filename: asset.filename,
    originalName: asset.originalName,
    url: asset.url,
    publicId: asset.publicId,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    status: "pending",
    verifiedBy: undefined,
    verifiedAt: undefined,
    replacedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });

  doc.replacedBy = replacement._id;
  doc.deletedAt = new Date();
  await doc.save();

  return ApiResponse.created(res, replacement, `${asset.originalName} uploaded — pending verification`);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (String(doc.owner) !== String(req.user._id) && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own documents");
  }

  // hard remove from storage, soft-delete the record
  if (doc.publicId) await destroyAsset(doc.publicId, "raw");
  doc.deletedAt = new Date();
  await doc.save();

  return ApiResponse.ok(res, { deleted: true }, `${doc.originalName} removed`);
});

/* ==================== ADMIN: GET EXHIBITOR DOCUMENTS ==================== */
export const getExhibitorDocuments = asyncHandler(async (req, res) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  let filter = isMongoId ? { exhibitor: req.params.id } : { owner: req.params.id };

  if (isMongoId) {
    const profile = await ExhibitorProfile.findById(req.params.id);
    if (!profile) {
      filter = { owner: req.params.id };
    }
  }

  const docs = await Document.find({ ...filter, deletedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .select("-__v");
  return ApiResponse.ok(res, docs);
});

/* ==================== ADMIN: VERIFY / APPROVE / REJECT DOCUMENT ==================== */
export const verifyDocument = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!["verified", "rejected", "pending"].includes(status)) {
    throw ApiError.badRequest("Status must be verified, rejected, or pending");
  }

  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");

  doc.status = status;
  doc.verifiedBy = req.user._id;
  doc.verifiedAt = new Date();
  if (rejectionReason) doc.rejectionReason = rejectionReason;
  if (status === "verified") doc.rejectionReason = undefined;

  await doc.save();

  // If this document is verified, check if this exhibitor now has all required documents verified
  if (doc.exhibitor) {
    const allDocs = await Document.find({ exhibitor: doc.exhibitor, deletedAt: { $exists: false } });
    const hasInc = allDocs.some((d) => d.docType === "certificate_of_incorporation" && d.status === "verified");
    const hasIns = allDocs.some((d) => d.docType === "public_liability_insurance" && d.status === "verified");
    if (hasInc && hasIns) {
      await ExhibitorProfile.findByIdAndUpdate(doc.exhibitor, { verificationStatus: "verified" });
    }
  }

  // Notify the exhibitor owner
  if (doc.owner) {
    await notificationService.notify(doc.owner, {
      type: "system",
      title: `Compliance document ${status}`,
      body: `Your ${doc.originalName || doc.docType} has been ${status} by event administration.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      link: "/portal",
    });
  }

  return ApiResponse.ok(res, doc, `Document marked as ${status}`);
});

/* ==================== STAFF & PRODUCTS ============================== */
export const addStaff = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.forbidden("Exhibitor profile required");

  if (profile.staff.length >= 12) throw ApiError.conflict("Staff limit (12) reached for your booth");

  // unique email per exhibitor
  if (profile.staff.some((s) => s.email === req.body.email.toLowerCase())) {
    throw ApiError.conflict("A staff member with this email already exists");
  }

  profile.staff.push(req.body);
  await profile.save();
  return ApiResponse.created(res, profile, `${req.body.name} added — badge invitation sent`);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  const member = profile.staff.id(req.params.staffId);
  if (!member) throw ApiError.notFound("Staff member not found");

  Object.assign(member, req.body);
  await profile.save();
  return ApiResponse.ok(res, profile, "Staff member updated");
});

export const removeStaff = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  const member = profile.staff.id(req.params.staffId);
  if (!member) throw ApiError.notFound("Staff member not found");

  profile.staff.pull(req.params.staffId);
  await profile.save();
  return ApiResponse.ok(res, profile, `${member.name} removed`);
});

export const upsertProduct = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  if (req.params.productId) {
    const product = profile.products.id(req.params.productId);
    if (!product) throw ApiError.notFound("Product not found");
    Object.assign(product, req.body);
    await profile.save();
    return ApiResponse.ok(res, profile, "Product updated");
  }

  if (profile.products.length >= 20) throw ApiError.conflict("Product limit (20) reached");
  profile.products.push(req.body);
  await profile.save();
  return ApiResponse.created(res, profile, "Product added");
});

export const removeProduct = asyncHandler(async (req, res) => {
  const profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound("Exhibitor profile not found");

  profile.products.pull(req.params.productId);
  await profile.save();
  return ApiResponse.ok(res, profile, "Product removed");
});

export default {
  getMyProfile, updateMyProfile, uploadLogo, getDirectory, getPublicProfile,
  applyForExpo, getMyApplications, listApplications, reviewApplication, updateExhibitorStatus,
  uploadDocument, getMyDocuments, replaceDocument, deleteDocument,
  getExhibitorDocuments, verifyDocument,
  addStaff, updateStaff, removeStaff, upsertProduct, removeProduct,
};
