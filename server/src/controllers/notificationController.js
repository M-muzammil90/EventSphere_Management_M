import Notification from "../models/Notification.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";

/* =====================================================================
   LIST — a user only ever sees their own notifications (query-level guard)
   ===================================================================== */
export const getNotifications = asyncHandler(async (req, res) => {
  const { unread, type, page = 1, limit = 20 } = req.query;

  // OWNERSHIP enforced in the filter — impossible to read someone else's
  const filter = { recipient: req.user._id, deleted: { $ne: true } };
  if (unread === "true") filter.read = false;
  if (type) filter.type = type;

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false, deleted: { $ne: true } });
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l)
    .populate("sender", "name avatar")
    .select("-__v");

  return ApiResponse.ok(res, notifications, undefined, { page: p, pages, total, limit: l, unreadCount });
});

/* ========================= MARK ONE READ ============================ */
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound("Notification not found");

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  return ApiResponse.ok(res, notification, "Marked as read");
});

/* ========================= MARK ALL READ ============================ */
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return ApiResponse.ok(res, { updated: result.modifiedCount ?? 0 }, "All notifications marked as read");
});

/* ========================= DELETE =================================== */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound("Notification not found");

  notification.deleted = true;
  await notification.save();
  return ApiResponse.ok(res, { deleted: true }, "Notification removed");
});

/* ========================= UNREAD COUNT ============================= */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false, deleted: { $ne: true } });
  return ApiResponse.ok(res, { count });
});

export default { getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount };
