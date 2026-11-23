import Appointment from "../models/Appointment.js";
import Expo from "../models/Expo.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import User from "../models/User.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { notificationService } from "../services/notificationService.js";

/* =====================================================================
   REQUEST AN APPOINTMENT
   ===================================================================== */
export const createAppointment = asyncHandler(async (req, res) => {
  const { expo: expoId, exhibitor, recipient, date, startTime, durationMinutes, type, location, agenda, title, initiatedBy } = req.body;

  const expo = await Expo.findById(expoId);
  if (!expo) throw ApiError.notFound("Expo not found");

  let exhibitorProfile = null;
  let recipientUser = recipient;

  if (exhibitor) {
    exhibitorProfile = await ExhibitorProfile.findById(exhibitor).populate("user", "name email");
    if (!exhibitorProfile) throw ApiError.notFound("Exhibitor not found");
    if (exhibitorProfile.visibility?.allowAttendeeChat === false && req.user.role === "attendee") {
      throw ApiError.forbidden("This exhibitor is not accepting meeting requests");
    }
    recipientUser = exhibitorProfile.user?._id;
  } else if (recipientUser) {
    const target = await User.findById(recipientUser);
    if (!target) throw ApiError.notFound("Recipient not found");
  } else {
    throw ApiError.badRequest("Either an exhibitor or a recipient is required");
  }

  // date must fall inside the expo window
  const d = new Date(date);
  if (d < new Date(expo.startDate) || d > new Date(expo.endDate)) {
    throw ApiError.badRequest("The appointment date must fall within the expo dates");
  }

  // exhibitor: avoid a conflicting slot for the same exhibitor (same calendar day)
  if (exhibitorProfile) {
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const clash = await Appointment.findOne({
      exhibitor: exhibitorProfile._id,
      date: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: { $in: ["pending", "confirmed"] },
    });
    if (clash) throw ApiError.conflict(`That slot is already taken at ${startTime}. Please pick another time.`);
  }

  const appointment = await Appointment.create({
    expo: expoId,
    requester: req.user._id,
    exhibitor: exhibitorProfile?._id ?? null,
    recipient: recipientUser ?? null,
    title, date: d, startTime, durationMinutes, type, location, agenda,
    status: "pending",
    initiatedBy: initiatedBy ?? (req.user.role === "exhibitor" ? "exhibitor" : "attendee"),
  });

  const populated = await appointment.populate([
    { path: "requester", select: "name avatar company" },
    { path: "exhibitor", select: "company.name logo" },
    { path: "recipient", select: "name avatar" },
  ]);

  // notify the other side
  const notifyUser = recipientUser;
  if (notifyUser) {
    const target = await User.findById(notifyUser);
    await notificationService.notifyAppointmentUpdate({
      recipient: notifyUser,
      user: target,
      counterpart: req.user.name,
      status: "pending",
      date: d.toLocaleDateString(),
      time: startTime,
    });
  }

  return ApiResponse.created(res, populated, "Appointment requested — you'll be notified when they respond");
});

/* =====================================================================
   MY APPOINTMENTS  (both directions, ownership enforced in the query)
   ===================================================================== */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, upcoming, page = 1, limit = 25 } = req.query;

  const me = await ExhibitorProfile.findOne({ user: req.user._id });
  const filter = {
    $or: [{ requester: req.user._id }, { recipient: req.user._id }, ...(me ? [{ exhibitor: me._id }] : [])],
  };
  if (status) filter.status = status;
  if (upcoming === "true") filter.date = { $gte: new Date() };

  const total = await Appointment.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const appointments = await Appointment.find(filter)
    .populate([{ path: "requester", select: "name avatar email" }, { path: "recipient", select: "name avatar email" }, { path: "exhibitor", select: "company.name logo tier" }, { path: "expo", select: "title slug venue startDate endDate" }])
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, appointments, undefined, { page: p, pages, total, limit: l });
});

/* ========================= RESPOND ================================== */
export const respondToAppointment = asyncHandler(async (req, res) => {
  const { status, reason, newDate, newStartTime } = req.body;

  const appointment = await Appointment.findById(req.params.id)
    .populate([{ path: "requester", select: "name email" }, { path: "recipient", select: "name email" }, { path: "exhibitor", select: "company.name user" }]);
  if (!appointment) throw ApiError.notFound("Appointment not found");

  // OWNERSHIP: only the recipient (or the exhibitor's owner) may respond
  const me = await ExhibitorProfile.findOne({ user: req.user._id });
  const isRecipient = String(appointment.recipient?._id) === String(req.user._id);
  const isExhibitorOwner = me && String(appointment.exhibitor?._id) === String(me._id);
  const isRequester = String(appointment.requester?._id) === String(req.user._id);

  if (!isRecipient && !isExhibitorOwner && !req.user.isStaff) {
    throw ApiError.forbidden("Only the recipient can respond to this appointment");
  }
  if (!["pending", "confirmed", "rescheduled"].includes(appointment.status)) {
    throw ApiError.conflict(`This appointment is already ${appointment.status}`);
  }

  if (status === "rescheduled") {
    if (!newDate || !newStartTime) throw ApiError.badRequest("A new date and time are required to reschedule");
    appointment.originalDate = appointment.date;
    appointment.date = new Date(newDate);
    appointment.startTime = newStartTime;
    appointment.status = "rescheduled";
  } else {
    appointment.status = status;
  }

  if (reason) appointment.declineReason = reason;
  await appointment.save();

  const counterpartName = isRequester
    ? appointment.exhibitor?.company?.name ?? appointment.recipient?.name
    : appointment.requester?.name;

  // notify the requester about the outcome
  await notificationService.notifyAppointmentUpdate({
    recipient: appointment.requester?._id,
    user: appointment.requester,
    counterpart: counterpartName,
    status,
    date: appointment.date.toLocaleDateString(),
    time: appointment.startTime,
  });

  const populated = await appointment
    .populate([{ path: "requester", select: "name avatar email" }, { path: "recipient", select: "name avatar email" }, { path: "exhibitor", select: "company.name logo" }]);

  return ApiResponse.ok(res, populated, `Appointment ${status}`);
});

/* ========================= CANCEL =================================== */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate([{ path: "requester", select: "name email" }, { path: "recipient", select: "name email" }, { path: "exhibitor", select: "company.name user" }]);
  if (!appointment) throw ApiError.notFound("Appointment not found");

  const me = await ExhibitorProfile.findOne({ user: req.user._id });
  const involved =
    String(appointment.requester?._id) === String(req.user._id) ||
    String(appointment.recipient?._id) === String(req.user._id) ||
    (me && String(appointment.exhibitor?._id) === String(me._id)) ||
    req.user.isStaff;

  if (!involved) throw ApiError.forbidden("You are not part of this appointment");
  if (["cancelled", "completed"].includes(appointment.status)) {
    throw ApiError.conflict(`This appointment is already ${appointment.status}`);
  }

  appointment.status = "cancelled";
  await appointment.save();

  const other = String(appointment.requester?._id) === String(req.user._id) ? appointment.recipient : appointment.requester;
  if (other) {
    await notificationService.notifyAppointmentUpdate({
      recipient: other._id, user: other,
      counterpart: req.user.name, status: "cancelled",
      date: appointment.date.toLocaleDateString(), time: appointment.startTime,
    });
  }

  return ApiResponse.ok(res, appointment, "Appointment cancelled");
});

/* ==================== ADMIN: ALL APPOINTMENTS ======================= */
export const listAppointments = asyncHandler(async (req, res) => {
  const { status, expo, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (expo) filter.expo = expo;

  const total = await Appointment.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const appointments = await Appointment.find(filter)
    .populate([{ path: "requester", select: "name avatar email" }, { path: "recipient", select: "name avatar email" }, { path: "exhibitor", select: "company.name logo tier" }, { path: "expo", select: "title slug" }])
    .sort({ date: -1, startTime: -1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, appointments, undefined, { page: p, pages, total, limit: l });
});

export default { createAppointment, getMyAppointments, respondToAppointment, cancelAppointment, listAppointments };
