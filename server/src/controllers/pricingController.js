import { BoothPricing, TicketPricing, PricingSetting } from "../models/Pricing.js";
import Expo from "../models/Expo.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";

/* =====================================================================
   BOOTH PRICING
   ===================================================================== */
export const getBoothPrices = asyncHandler(async (req, res) => {
  const { expo, status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (expo) filter.expo = expo;
  if (status) filter.status = status;

  const total = await BoothPricing.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const prices = await BoothPricing.find(filter)
    .populate("expo", "title slug banner")
    .sort({ "expo.title": 1, category: 1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, prices, undefined, { page: p, pages, total, limit: l });
});

/** Public: only active prices, no admin-only fields. */
export const getPublicBoothPrices = asyncHandler(async (req, res) => {
  const { expoId } = req.params;
  const prices = await BoothPricing.find({ expo: expoId, status: "active" }).select("category sqm basePrice discountPercent effectivePrice currency");
  return ApiResponse.ok(res, prices);
});

export const upsertBoothPrice = asyncHandler(async (req, res) => {
  const { expo, category, sqm, basePrice, discountPercent = 0, currency = "USD", status = "active" } = req.body;

  const target = await Expo.findById(expo);
  if (!target) throw ApiError.notFound("Expo not found");

  const effectivePrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;

  // one price row per (expo, category) — upsert keeps it unique
  const price = await BoothPricing.findOneAndUpdate(
    { expo, category },
    { expo, category, sqm, basePrice, discountPercent, effectivePrice, currency, status },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return ApiResponse.ok(res, price, `${category} pricing saved for ${target.title}`);
});

export const deleteBoothPrice = asyncHandler(async (req, res) => {
  const price = await BoothPricing.findByIdAndDelete(req.params.id);
  if (!price) throw ApiError.notFound("Price not found");
  return ApiResponse.ok(res, { deleted: true }, "Booth price deleted");
});

/* =====================================================================
   TICKET TYPES
   ===================================================================== */
export const getTicketTypes = asyncHandler(async (req, res) => {
  const { expo, status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (expo) filter.expo = expo;
  if (status) filter.status = status;

  const total = await TicketPricing.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const tickets = await TicketPricing.find(filter)
    .populate("expo", "title slug banner")
    .sort({ "expo.title": 1, price: 1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, tickets, undefined, { page: p, pages, total, limit: l });
});

export const upsertTicketType = asyncHandler(async (req, res) => {
  const { expo, name, price, capacity, perks, description, status = "active" } = req.body;

  const target = await Expo.findById(expo);
  if (!target) throw ApiError.notFound("Expo not found");

  const existing = await TicketPricing.findOne({ expo, name });

  // capacity may never be reduced below tickets already sold
  if (existing && capacity < existing.soldCount) {
    throw ApiError.conflict(`Capacity cannot be below the ${existing.soldCount} tickets already sold`);
  }

  const ticket = await TicketPricing.findOneAndUpdate(
    { expo, name },
    { expo, name, price, capacity, perks, description, status },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return ApiResponse.ok(res, ticket, `${name} ticket saved for ${target.title}`);
});

export const deleteTicketType = asyncHandler(async (req, res) => {
  const ticket = await TicketPricing.findById(req.params.id);
  if (!ticket) throw ApiError.notFound("Ticket type not found");

  if (ticket.soldCount > 0) {
    ticket.status = "archived";
    await ticket.save();
    return ApiResponse.ok(res, ticket, `${ticket.soldCount} tickets already sold — type archived instead of deleted`);
  }

  await ticket.deleteOne();
  return ApiResponse.ok(res, { deleted: true }, "Ticket type deleted");
});

/* =====================================================================
   EXPO-LEVEL PRICING SETTINGS (tax / discounts / currency)
   ===================================================================== */
export const getPricingSettings = asyncHandler(async (req, res) => {
  const settings = await PricingSetting.findOne({ expo: req.params.expoId })
    ?? (await PricingSetting.create({ expo: req.params.expoId }));
  return ApiResponse.ok(res, settings);
});

export const updatePricingSettings = asyncHandler(async (req, res) => {
  const settings = await PricingSetting.findOneAndUpdate(
    { expo: req.params.expoId },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return ApiResponse.ok(res, settings, "Pricing settings saved");
});

/* =====================================================================
   PRICE CALCULATOR — used by both booth reservation and ticket checkout
   ===================================================================== */
export const calculatePrice = ({ basePrice, quantity = 1, discountPercent = 0, taxRate = 0, multiBoothPercent = 0, multiBoothMinQty = 2 }) => {
  const gross = basePrice * quantity;

  const lineDiscount = (gross * discountPercent) / 100;
  const afterLine = gross - lineDiscount;

  const multiDiscount = quantity >= multiBoothMinQty && multiBoothPercent > 0 ? (afterLine * multiBoothPercent) / 100 : 0;
  const subtotal = Math.round((afterLine - multiDiscount) * 100) / 100;

  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    lineItems: [
      { description: `Base × ${quantity}`, amount: gross },
      ...(lineDiscount > 0 ? [{ description: `Discount (${discountPercent}%)`, amount: -lineDiscount }] : []),
      ...(multiDiscount > 0 ? [{ description: `Multi-booth discount (${multiBoothPercent}%)`, amount: -multiDiscount }] : []),
    ],
    gross,
    discountTotal: Math.round((lineDiscount + multiDiscount) * 100) / 100,
    subtotal,
    taxRate,
    taxAmount,
    total,
  };
};

export default { getBoothPrices, getPublicBoothPrices, upsertBoothPrice, deleteBoothPrice, getTicketTypes, upsertTicketType, deleteTicketType, getPricingSettings, updatePricingSettings, calculatePrice };
