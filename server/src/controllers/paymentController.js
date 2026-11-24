import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import Refund from "../models/Refund.js";
import Expo from "../models/Expo.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import paymentService from "../services/payments/paymentService.js";
import invoiceService from "../services/invoiceService.js";

/* =====================================================================
   PROVIDER CONFIG STATUS & DIAGNOSTICS
   ===================================================================== */
export const getProviderStatus = asyncHandler(async (_req, res) => {
  const statuses = paymentService.getProvidersStatus();
  return ApiResponse.ok(res, statuses);
});

/* =====================================================================
   INITIATE PAYMENT
   ===================================================================== */
export const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, provider = "payfast", returnUrl } = req.body;
  if (!orderId) throw ApiError.badRequest("orderId is required");

  const result = await paymentService.initiateOrderPayment({
    orderId,
    userId: req.user._id,
    providerName: provider,
    returnUrl,
  });

  if (result.status === "BLOCKED_BY_CREDENTIALS") {
    return res.status(200).json({
      success: false,
      blockedByCredentials: true,
      provider: result.provider,
      message: result.message || "Payment provider requires official merchant credentials",
      missingKeys: result.missingKeys,
      instructions: result.instructions,
    });
  }

  return ApiResponse.ok(res, result, "Payment initiated");
});

/* =====================================================================
   VERIFY PAYMENT
   ===================================================================== */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { provider, transactionRef, testVerified } = req.body;

  const result = await paymentService.verifyPayment({
    orderId,
    providerName: provider,
    transactionRef,
    queryParams: req.query,
    testVerified: Boolean(testVerified),
  });

  return ApiResponse.ok(res, result, "Payment verified");
});

/* =====================================================================
   WEBHOOK HANDLER (Signed IPN from Gateway)
   ===================================================================== */
export const handleWebhook = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const signature = req.headers["x-signature"] || req.headers["x-payfast-signature"] || "";

  const result = await paymentService.handleWebhook({
    providerName: provider,
    payload: req.body,
    signature,
    headers: req.headers,
  });

  return res.status(200).json({ success: true, ...result });
});

/* =====================================================================
   REQUEST REFUND
   ===================================================================== */
export const requestRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  if (!paymentId || !reason) throw ApiError.badRequest("paymentId and reason are required");

  const refund = await paymentService.requestRefund({
    paymentId,
    userId: req.user._id,
    amount,
    reason,
  });

  return ApiResponse.created(res, refund, "Refund request submitted for review");
});

/* =====================================================================
   REVIEW REFUND (Admin)
   ===================================================================== */
export const reviewRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, adminNotes } = req.body; // action: APPROVED | REJECTED

  if (!["APPROVED", "REJECTED"].includes(action)) {
    throw ApiError.badRequest("Action must be APPROVED or REJECTED");
  }

  const refund = await paymentService.reviewRefund({
    refundId: id,
    adminUserId: req.user._id,
    action,
    adminNotes,
  });

  return ApiResponse.ok(res, refund, `Refund request ${action.toLowerCase()}`);
});

/* =====================================================================
   ADMIN PAYMENT DASHBOARD & ANALYTICS
   ===================================================================== */
export const getAdminPayments = asyncHandler(async (req, res) => {
  const { q, status, provider, expoId, startDate, endDate, page = 1, limit = 15 } = req.query;

  const filter = {};
  if (status && status !== "ALL") {
    filter.status = status.toUpperCase();
  }
  if (provider && provider !== "ALL") {
    filter.provider = provider.toLowerCase();
  }
  if (expoId) {
    filter.expo = expoId;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await Payment.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const payments = await Payment.find(filter)
    .populate("userId", "name email role company")
    .populate("user", "name email role company")
    .populate("orderId", "orderNumber orderType items totalAmount currency")
    .populate("expo", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l);

  // Stats aggregation (strictly from MongoDB)
  const [totalsAgg, providerAgg, refundsCount] = await Promise.all([
    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: { $ifNull: ["$amount", "$total"] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      {
        $group: {
          _id: "$provider",
          total: { $sum: { $ifNull: ["$amount", "$total"] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Refund.countDocuments({ status: "PENDING" }),
  ]);

  let verifiedRevenue = 0;
  let successfulCount = 0;
  let pendingCount = 0;
  let failedCount = 0;

  totalsAgg.forEach((item) => {
    const s = String(item._id).toUpperCase();
    if (s === "PAID") {
      verifiedRevenue += item.totalAmount;
      successfulCount += item.count;
    } else if (s === "PENDING" || s === "PROCESSING") {
      pendingCount += item.count;
    } else if (s === "FAILED" || s === "CANCELLED") {
      failedCount += item.count;
    }
  });

  return ApiResponse.ok(res, payments, undefined, {
    page: p,
    pages,
    total,
    limit: l,
    stats: {
      verifiedRevenue,
      successfulCount,
      pendingCount,
      failedCount,
      pendingRefunds: refundsCount,
      providerBreakdown: providerAgg,
    },
  });
});

/* =====================================================================
   DOWNLOAD INVOICE PDF
   ===================================================================== */
export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params; // orderId or invoiceId or invoiceNumber

  let invoice = null;
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    invoice = await Invoice.findOne({ $or: [{ _id: id }, { orderId: id }] });
  } else {
    invoice = await Invoice.findOne({ invoiceNumber: id });
  }

  if (!invoice) throw ApiError.notFound("Invoice not found");

  const order = await Order.findById(invoice.orderId);

  // Ownership check
  const isOwner = String(invoice.userId) === String(req.user._id);
  const isAdmin = ["admin", "organizer"].includes(req.user.role);
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("Access denied to this invoice");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);

  invoiceService.generatePdfStream(invoice, order, res);
});

/* =====================================================================
   GET MY PAYMENTS (Exhibitor / Attendee)
   ===================================================================== */
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    $or: [{ userId: req.user._id }, { user: req.user._id }],
  })
    .populate("orderId", "orderNumber orderType items totalAmount currency orderStatus")
    .populate("expo", "title venue banner")
    .sort({ createdAt: -1 });

  const invoices = await Invoice.find({ userId: req.user._id }).sort({ issuedAt: -1 });
  const refunds = await Refund.find({ requestedBy: req.user._id }).sort({ createdAt: -1 });

  return ApiResponse.ok(res, {
    payments,
    invoices,
    refunds,
  });
});

/* =====================================================================
   ADMIN LIST REFUNDS
   ===================================================================== */
export const listRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find()
    .populate("paymentId")
    .populate("orderId")
    .populate("requestedBy", "name email role company")
    .sort({ createdAt: -1 });

  return ApiResponse.ok(res, refunds);
});

/* =====================================================================
   ADMIN DELETE PAYMENT
   ===================================================================== */
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound("Payment record not found");
  }

  // Delete payment record and related invoices & refunds
  await Promise.all([
    Payment.findByIdAndDelete(id),
    Invoice.deleteMany({ $or: [{ paymentId: id }, { orderId: payment.orderId }] }),
    Refund.deleteMany({ paymentId: id }),
  ]);

  return ApiResponse.ok(res, null, "Payment transaction deleted successfully");
});
