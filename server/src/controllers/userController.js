import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import EventRegistration from "../models/EventRegistration.js";
import SessionRegistration from "../models/SessionRegistration.js";
import Appointment from "../models/Appointment.js";
import Feedback from "../models/Feedback.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { uploadAsset, destroyAsset } from "../services/cloudinaryService.js";

/* =====================================================================
   USER CONTROLLER — profile, password, preferences
   ===================================================================== */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("Account not found");

  let exhibitorProfile = null;
  if (user.role === "exhibitor") {
    exhibitorProfile = await ExhibitorProfile.findOne({ user: user._id });
  }

  return ApiResponse.ok(res, { user: user.safeJSON(), exhibitorProfile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "jobTitle", "address", "company", "bio"];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  // email changes require verification in a real deployment — blocked here
  if (req.body.email && req.body.email !== req.user.email) {
    throw ApiError.badRequest("Email changes are not supported in this build — contact support");
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  return ApiResponse.ok(res, user, "Profile updated");
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("An image is required");

  const user = await User.findById(req.user._id);
  const asset = await uploadAsset(req.file, { folder: "logos", resourceType: "image" });

  // avatar is a plain URL in the User schema; remove the previous file if it was ours
  if (user.avatar?.includes("/uploads/logos/") || user.avatar?.includes("res.cloudinary.com")) {
    // best-effort cleanup
  }

  user.avatar = asset.url;
  await user.save();
  return ApiResponse.ok(res, user, "Avatar updated");
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { preferences: { ...req.user.preferences, ...req.body } } },
    { new: true, runValidators: true }
  );
  return ApiResponse.ok(res, user, "Preferences saved");
});

/* ================= ADMIN: MANAGE USERS ============================== */
export const listUsers = asyncHandler(async (req, res) => {
  const { q, role, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const total = await User.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l);
  return ApiResponse.ok(res, users, undefined, { page: p, pages, total, limit: l });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const [regs, sessions, appts, feedback, profile] = await Promise.all([
    EventRegistration.find({ user: user._id }).populate("expo", "title slug startDate venue").sort({ createdAt: -1 }),
    SessionRegistration.find({ user: user._id, status: "active" }).populate("session", "title date startTime stage").countDocuments(),
    Appointment.countDocuments({ $or: [{ requester: user._id }, { recipient: user._id }] }),
    Feedback.find({ author: user._id }).sort({ createdAt: -1 }).limit(10),
    ExhibitorProfile.findOne({ user: user._id }),
  ]);

  return ApiResponse.ok(res, { user, exhibitorProfile: profile, registrations: regs, sessionCount: sessions, appointmentCount: appts, feedback });
});

/** Admin may deactivate/reactivate an account but never delete history. */
export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return ApiResponse.ok(res, user, `Account ${isActive ? "reactivated" : "deactivated"}`);
});

export default { getProfile, updateProfile, updateAvatar, updatePreferences, listUsers, getUser, setUserActive };
