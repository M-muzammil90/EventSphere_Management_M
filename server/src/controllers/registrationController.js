import Expo from "../models/Expo.js";
import EventRegistration from "../models/EventRegistration.js";
import SessionRegistration from "../models/SessionRegistration.js";
import TicketPricing from "../models/Pricing.js";
import User from "../models/User.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { notificationService } from "../services/notificationService.js";

/* =====================================================================
   REGISTER FOR AN EXPO — duplicate-safe + capacity-safe
   ===================================================================== */
export const registerForExpo = asyncHandler(async (req, res) => {
  const { expo: expoId, ticketType = "Standard", attendee, consent } = req.body;

  const expo = await Expo.findById(expoId);
  if (!expo) throw ApiError.notFound("Expo not found");
  if (!["published", "live"].includes(expo.status)) {
    throw ApiError.forbidden("Registration is not open for this expo");
  }

  // Duplicate guard (also enforced by the {expo,user} unique index)
  const existing = await EventRegistration.findOne({ expo: expoId, user: req.user._id });
  if (existing && existing.status !== "cancelled") {
    throw ApiError.conflict(`You are already registered for ${expo.title} (${existing.ticketType})`);
  }

  if (existing?.status === "cancelled") {
    // allow re-registration after cancellation
    await existing.deleteOne();
  }

  // ---- pricing + capacity (atomic increment guards sold-out) ----
  const ticket = await TicketPricing.findOne({ expo: expoId, name: ticketType });
  const unitPrice = ticket?.price ?? 0;
  const taxRate = ticket ? 0 : 5; // tax configured at expo level

  if (ticket) {
    if (ticket.status !== "active") throw ApiError.conflict(`${ticketType} tickets are not currently on sale`);
    if (ticket.salesStart && new Date() < ticket.salesStart) throw ApiError.conflict(`${ticketType} sales have not opened yet`);
    if (ticket.salesEnd && new Date() > ticket.salesEnd) throw ApiError.conflict(`${ticketType} sales have closed`);

    // ATOMIC sold-out guard: the filter re-checks soldCount against the
    // capacity snapshot, so two concurrent buyers cannot take the last ticket.
    const updated = await TicketPricing.findOneAndUpdate(
      { _id: ticket._id, soldCount: { $lt: ticket.capacity } },
      { $inc: { soldCount: 1 } },
      { new: true }
    );
    if (!updated) throw ApiError.conflict(`${ticketType} tickets are sold out`);
  }

  // ---- expo-level capacity ----
  const confirmed = await EventRegistration.countDocuments({ expo: expoId, status: { $in: ["confirmed", "attended"] } });
  if (confirmed >= expo.capacity.attendees) {
    // roll the ticket back before waitlisting
    if (ticket) await TicketPricing.updateOne({ _id: ticket._id }, { $inc: { soldCount: -1 } });
    const waitlist = await EventRegistration.create({
      expo: expoId, user: req.user._id, ticketType, status: "waitlisted",
      attendeeSnapshot: attendee,
      pricing: { unitPrice, quantity: 1, subtotal: unitPrice, taxRate, taxAmount: 0, total: unitPrice },
      consent,
    });
    return ApiResponse.created(res, waitlist, `Added to the waitlist for ${expo.title} — you'll be notified if a place opens`);
  }

  const subtotal = unitPrice;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = subtotal + taxAmount;

  const registration = await EventRegistration.create({
    expo: expoId, user: req.user._id, ticketType,
    status: total === 0 ? "confirmed" : "pending_payment",
    attendeeSnapshot: attendee,
    pricing: { unitPrice, quantity: 1, discount: 0, taxRate, subtotal, taxAmount, total, currency: "USD" },
    consent,
  });

  const populated = await registration.populate("expo", "title slug startDate endDate venue");

  if (total === 0) {
    await notificationService.notifyRegistrationConfirmed({
      recipient: req.user._id,
      user: req.user,
      expoTitle: expo.title,
      badgeCode: registration.badgeCode,
      ticketType,
    });
  }

  return ApiResponse.created(
    res,
    populated,
    total === 0
      ? `You're registered for ${expo.title}! Your badge code is ${registration.badgeCode}.`
      : `Registration created — complete payment of $${total.toFixed(2)} to confirm your place.`
  );
});

/* ==================== MY REGISTRATIONS ============================== */
export const getMyRegistrations = asyncHandler(async (req, res) => {
  const regs = await EventRegistration.find({ user: req.user._id })
    .populate("expo", "title slug banner startDate endDate venue status")
    .populate("payment", "status total reference receiptNumber mode gatewayVerified")
    .sort({ createdAt: -1 });
  return ApiResponse.ok(res, regs);
});

/* ==================== SINGLE REGISTRATION =========================== */
export const getRegistration = asyncHandler(async (req, res) => {
  const reg = await EventRegistration.findById(req.params.id)
    .populate("expo", "title slug banner startDate endDate venue")
    .populate("payment");
  if (!reg) throw ApiError.notFound("Registration not found");

  // OWNERSHIP CHECK at the query level
  if (String(reg.user) !== String(req.user._id) && !req.user.isStaff) {
    throw ApiError.forbidden("You can only view your own registration");
  }
  return ApiResponse.ok(res, reg);
});

/* ==================== CANCEL REGISTRATION =========================== */
export const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await EventRegistration.findById(req.params.id).populate("expo", "title");
  if (!reg) throw ApiError.notFound("Registration not found");
  if (String(reg.user) !== String(req.user._id) && !req.user.isStaff) {
    throw ApiError.forbidden("You can only cancel your own registration");
  }
  if (reg.status === "cancelled") return ApiResponse.ok(res, reg, "Already cancelled");

  const { reason } = req.body ?? {};

  // free the ticket + seat
  await Promise.all([
    TicketPricing.updateOne({ expo: reg.expo._id, name: reg.ticketType, soldCount: { $gt: 0 } }, { $inc: { soldCount: -1 } }),
    SessionRegistration.updateMany({ user: req.user._id, expo: reg.expo._id, status: "active" }, { status: "cancelled", cancelledAt: new Date() }),
  ]);

  reg.status = "cancelled";
  reg.cancelledAt = new Date();
  if (reason) reg.cancellationReason = reason;
  await reg.save();

  // promote the next waitlisted attendee
  const next = await EventRegistration.findOne({ expo: reg.expo._id, status: "waitlisted" }).sort({ createdAt: 1 });
  if (next) {
    next.status = next.pricing.total === 0 ? "confirmed" : "pending_payment";
    await next.save();
    const u = await User.findById(next.user);
    await notificationService.notify({
      recipient: next.user, type: "registration_confirmed",
      title: `A place opened at ${reg.expo.title}`,
      body: "You've been moved off the waitlist — complete your registration to confirm.",
      link: "/attendee", priority: "high",
      email: true,
      emailTemplate: () => Promise.resolve(),
    });
  }

  return ApiResponse.ok(res, reg, `Registration for ${reg.expo.title} cancelled`);
});

/* ==================== CHECK-IN (admin) ============================== */
export const checkIn = asyncHandler(async (req, res) => {
  const { badgeCode } = req.body;

  const reg = badgeCode
    ? await EventRegistration.findOne({ badgeCode }).populate("expo", "title")
    : await EventRegistration.findById(req.params.id).populate("expo", "title");

  if (!reg) throw ApiError.notFound(`No registration found${badgeCode ? ` for badge ${badgeCode}` : ""}`);
  if (reg.status === "cancelled") throw ApiError.conflict("This registration was cancelled");
  if (reg.status === "attended") throw ApiError.conflict("Already checked in");

  reg.status = "attended";
  reg.checkedInAt = new Date();
  await reg.save();

  return ApiResponse.ok(res, reg, `Checked in ${reg.attendeeSnapshot?.name ?? "attendee"}`);
});

export default { registerForExpo, getMyRegistrations, getRegistration, cancelRegistration, checkIn };
