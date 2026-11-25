import Order from "../models/Order.js";
import Expo from "../models/Expo.js";
import Booth from "../models/Booth.js";
import Session from "../models/Session.js";
import EventRegistration from "../models/EventRegistration.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import ExhibitorApplication from "../models/ExhibitorApplication.js";
import { BoothPricing, TicketPricing, PricingSetting } from "../models/Pricing.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";

/* =====================================================================
   CREATE ORDER (Strict Server-Side Price Calculation)
   ===================================================================== */
export const createOrder = asyncHandler(async (req, res) => {
  const { orderType, expoId, boothId, sessionId, ticketType = "Standard", quantity = 1, promoCode, billingDetails, notes } = req.body;

  if (!expoId) throw ApiError.badRequest("expoId is required");
  const expo = await Expo.findById(expoId);
  if (!expo) throw ApiError.notFound("Expo not found");

  let normalizedType = (orderType || "").toLowerCase();
  if (normalizedType === "attendee_registration") normalizedType = "ticket_registration";
  if (normalizedType === "workshop_session" || normalizedType === "session_pass") normalizedType = "workshop_registration";

  const settings = (await PricingSetting.findOne({ expo: expoId })) ?? { taxRate: 5, currency: "PKR" };
  const currency = settings.currency || "PKR";

  let items = [];
  let subtotal = 0;
  let booth = null;
  let session = null;
  let registration = null;

  // 1. EXHIBITOR BOOTH BOOKING
  if (normalizedType === "booth_booking") {
    if (!boothId) throw ApiError.badRequest("boothId is required for booth bookings");

    // Exhibitor verification
    let profile = await ExhibitorProfile.findOne({ user: req.user._id });
    if (!profile && req.user.role === "exhibitor") {
      profile = await ExhibitorProfile.create({
        user: req.user._id,
        company: { name: req.user.company || req.user.name },
        contact: { primaryName: req.user.name, email: req.user.email },
      });
    }

    // Resolve booth by either MongoDB _id or string boothId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(String(boothId));
    const boothQuery = isMongoId
      ? { _id: boothId, expo: expoId }
      : { boothId: String(boothId).trim().toUpperCase(), expo: expoId };

    const targetBooth = await Booth.findOne(boothQuery);
    if (!targetBooth) {
      throw ApiError.notFound("Booth not found at this expo");
    }

    // Check if there is an existing pending order for this booth
    const existingOrder = await Order.findOne({
      userId: req.user._id,
      expoId,
      boothId: targetBooth._id,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    }).sort({ createdAt: -1 });

    if (existingOrder) {
      return ApiResponse.ok(res, existingOrder, "Existing pending order retrieved");
    }

    // Check ownership: does this booth belong to ANOTHER exhibitor?
    const isOccupiedByAnother =
      targetBooth.exhibitor &&
      profile &&
      String(targetBooth.exhibitor) !== String(profile._id);

    if (isOccupiedByAnother) {
      throw ApiError.conflict("This booth is already booked or currently reserved by another exhibitor.");
    }

    if (targetBooth.status === "booked" && (!profile || String(targetBooth.exhibitor) !== String(profile._id))) {
      throw ApiError.conflict("This booth is already booked or currently reserved by another exhibitor.");
    }

    // Atomic claim of booth for 60 minutes
    const heldUntil = new Date(Date.now() + 60 * 60 * 1000);
    booth = await Booth.findOneAndUpdate(
      {
        _id: targetBooth._id,
        expo: expoId,
        $or: [
          { status: { $in: ["available", "reserved"] } },
          ...(profile ? [{ exhibitor: profile._id }] : []),
        ],
      },
      {
        $set: {
          status: targetBooth.status === "booked" ? "booked" : "reserved",
          ...(profile ? { exhibitor: profile._id } : {}),
          reservedAt: new Date(),
          heldUntil,
        },
      },
      { new: true }
    );

    if (!booth) {
      booth = targetBooth;
    }

    // Pull price strictly from MongoDB pricing configuration
    const boothPricing = await BoothPricing.findOne({ expo: expoId, category: booth.category });
    const unitPrice = boothPricing?.effectivePrice ?? booth.price ?? 25000;
    subtotal = unitPrice;

    items.push({
      description: `Booth ${booth.boothId} (${booth.category}) — ${booth.sqm} m² · ${expo.title}`,
      quantity: 1,
      unitPrice,
      amount: unitPrice,
      metadata: { boothId: booth._id, category: booth.category, sqm: booth.sqm },
    });
  }

  // 2. ATTENDEE TICKET REGISTRATION
  else if (normalizedType === "ticket_registration") {
    // Check capacity
    const registeredCount = await EventRegistration.countDocuments({ expo: expoId, status: { $in: ["confirmed", "attended"] } });
    if (expo.capacity?.attendees && registeredCount >= expo.capacity.attendees) {
      throw ApiError.conflict("This expo has reached maximum attendee capacity.");
    }

    // Check duplicate or link existing registration
    const targetRegId = req.body.registrationId;
    let existing = null;
    if (targetRegId) {
      existing = await EventRegistration.findById(targetRegId);
    }
    if (!existing) {
      existing = await EventRegistration.findOne({ expo: expoId, user: req.user._id, status: { $ne: "cancelled" } });
    }

    if (existing) {
      if (existing.status === "confirmed" || existing.status === "attended") {
        throw ApiError.conflict(`You already have a confirmed registration for ${expo.title} (${existing.ticketType})`);
      }
      registration = existing;
    }

    // Fetch MongoDB price
    const ticketPricing = await TicketPricing.findOne({ expo: expoId, name: ticketType });
    let unitPrice = 0;
    if (ticketType === "Free" || ticketType === "General Admission") {
      unitPrice = ticketPricing?.price ?? 0;
    } else if (ticketType === "VIP") {
      unitPrice = ticketPricing?.price ?? (expo.startingPrice ? expo.startingPrice * 2.5 : 8500);
    } else {
      unitPrice = ticketPricing?.price ?? expo.startingPrice ?? 2500;
    }

    const qty = Math.max(1, Math.min(Number(quantity) || 1, 10));
    subtotal = unitPrice * qty;

    items.push({
      description: `${ticketType} Ticket × ${qty} — ${expo.title}`,
      quantity: qty,
      unitPrice,
      amount: subtotal,
      metadata: { ticketType, expoId },
    });

    // Create pending registration record if not already existing
    if (!registration) {
      registration = await EventRegistration.create({
        expo: expoId,
        user: req.user._id,
        ticketType,
        status: unitPrice === 0 ? "confirmed" : "pending_payment",
        attendeeSnapshot: {
          name: billingDetails?.name || req.user.name,
          email: billingDetails?.email || req.user.email,
          company: billingDetails?.company || req.user.company,
          phone: billingDetails?.phone || req.user.phone,
        },
        pricing: {
          unitPrice,
          quantity: qty,
          subtotal,
          total: subtotal,
          currency,
        },
        badgeCode: `BDG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      });
    } else {
      registration.pricing = {
        unitPrice,
        quantity: qty,
        subtotal,
        total: subtotal,
        currency,
      };
      await registration.save();
    }
  }

  // 3. WORKSHOP REGISTRATION
  else if (normalizedType === "workshop_registration" || normalizedType === "session_pass") {
    if (!sessionId) throw ApiError.badRequest("sessionId is required for workshop registrations");
    session = await Session.findById(sessionId);
    if (!session) throw ApiError.notFound("Session not found");

    if (session.capacity && (session.registeredCount || 0) >= session.capacity) {
      throw ApiError.conflict("This workshop is currently at full capacity.");
    }

    const unitPrice = session.price || (session.type === "Workshop" ? 3500 : 0);
    subtotal = unitPrice;

    items.push({
      description: `Workshop: ${session.title} (${session.stage})`,
      quantity: 1,
      unitPrice,
      amount: unitPrice,
      metadata: { sessionId: session._id, stage: session.stage },
    });
  } else {
    throw ApiError.badRequest(`Unsupported orderType: ${orderType}`);
  }

  // Server-side promo calculation
  let discount = 0;
  if (promoCode) {
    const PROMOS = { APTECH20: 20, EARLY10: 10, LAHORE15: 15, KARACHI15: 15 };
    const pct = PROMOS[promoCode.trim().toUpperCase()] || 0;
    if (pct > 0) {
      discount = Math.round((subtotal * pct) / 100);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const taxRate = settings.taxRate || 5;
  const tax = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + tax;

  const orderNumber = `ORD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const order = await Order.create({
    userId: req.user._id,
    orderNumber,
    orderType: normalizedType,
    expoId,
    boothId: booth?._id,
    registrationId: registration?._id,
    sessionId: session?._id,
    items,
    subtotal,
    discount,
    discountCode: promoCode ? promoCode.toUpperCase() : undefined,
    tax,
    totalAmount,
    currency,
    orderStatus: totalAmount === 0 ? "CONFIRMED" : "PENDING",
    paymentStatus: totalAmount === 0 ? "PAID" : "PENDING",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour order expiry
    billingDetails: {
      name: billingDetails?.name || req.user.name,
      email: billingDetails?.email || req.user.email,
      phone: billingDetails?.phone || req.user.phone || "",
      company: billingDetails?.company || req.user.company || "",
      address: billingDetails?.address || "Main Boulevard",
      city: billingDetails?.city || "Karachi",
      country: billingDetails?.country || "Pakistan",
    },
    notes,
  });

  // If free order (totalAmount === 0), auto-fulfill immediately without payment gateway
  if (totalAmount === 0) {
    if (registration) {
      registration.status = "confirmed";
      await registration.save();
    }
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      userId: req.user._id,
      billingDetails: order.billingDetails,
      items: order.items,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      currency,
      paymentStatus: "PAID",
      issuedAt: new Date(),
    });
  }

  const populated = await order.populate([
    { path: "expoId", select: "title venue startDate endDate" },
    { path: "boothId", select: "boothId category zone sqm price" },
  ]);

  return ApiResponse.created(res, populated, "Order created successfully");
});

/* =====================================================================
   GET ORDER BY ID
   ===================================================================== */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("expoId", "title venue category banner city startDate endDate")
    .populate("boothId", "boothId category zone sqm price")
    .populate("sessionId", "title stage startTime endTime speaker")
    .populate("userId", "name email role company phone");

  if (!order) throw ApiError.notFound("Order not found");

  // Ownership check: user themselves or admin
  const isOwner = String(order.userId._id || order.userId) === String(req.user._id);
  const isAdmin = ["admin", "organizer"].includes(req.user.role);
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("Access denied to this order");
  }

  const invoice = await Invoice.findOne({ orderId: order._id });
  const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });

  return ApiResponse.ok(res, {
    order,
    invoice,
    payment,
  });
});

/* =====================================================================
   GET MY ORDERS (Attendee / Exhibitor)
   ===================================================================== */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;
  const filter = { userId: req.user._id };

  if (status) filter.paymentStatus = status.toUpperCase();
  if (type) filter.orderType = type;

  const total = await Order.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const orders = await Order.find(filter)
    .populate("expoId", "title venue banner startDate endDate")
    .populate("boothId", "boothId category zone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, orders, undefined, { page: p, pages, total, limit: l });
});
