import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    // backward compatibility fields
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", index: true },
    purpose: {
      type: String,
      enum: ["booth_reservation", "event_ticket", "workshop_addon", "sponsorship", "booth_booking", "ticket_registration", "workshop_registration"],
      default: "event_ticket",
      index: true,
    },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", index: true },
    booth: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", index: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: "EventRegistration", index: true },

    provider: {
      type: String,
      enum: ["payfast", "jazzcash", "easypaisa", "stripe", "paypal", "demo", "manual"],
      default: "demo",
      index: true,
    },
    providerTransactionId: { type: String, index: true },
    providerReference: { type: String, index: true },
    webhookEventId: { type: String, sparse: true, index: true },
    failureReason: { type: String },

    items: [
      {
        description: { type: String, required: true, maxlength: 200 },
        quantity: { type: Number, default: 1, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    discountLabel: { type: String, maxlength: 120 },
    taxRate: { type: Number, default: 0, min: 0, max: 50 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amount: { type: Number, min: 0 },
    currency: { type: String, default: "PKR", maxlength: 3, uppercase: true },

    status: {
      type: String,
      enum: [
        "PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED",
        "pending", "awaiting_confirmation", "paid", "failed", "refunded", "cancelled", "expired"
      ],
      default: "PENDING",
      index: true,
    },
    mode: { type: String, enum: ["demo", "live"], default: "demo" },

    reference: { type: String, unique: true, index: true },
    transactionRef: { type: String, index: true },
    gateway: { type: String, default: "demo" },
    gatewayVerified: { type: Boolean, default: false },

    verifiedAt: Date,
    paidAt: Date,
    failedAt: Date,
    refundedAt: Date,
    cancelledAt: Date,
    expiresAt: Date,

    receiptNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
    notes: { type: String, maxlength: 600 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ expo: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.virtual("isPaid").get(function () {
  const s = (this.status || "").toLowerCase();
  return s === "paid";
});

paymentSchema.virtual("isGenuinelyPaid").get(function () {
  const s = (this.status || "").toLowerCase();
  return s === "paid" && this.gatewayVerified === true;
});

paymentSchema.virtual("isDemoPayment").get(function () {
  return this.mode === "demo" || this.provider === "demo";
});

paymentSchema.pre("save", function (next) {
  if (this.isNew && !this.reference) {
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.reference = `ESN-${new Date().getFullYear()}-${rnd}`;
  }
  if (!this.amount && this.total) {
    this.amount = this.total;
  }
  if (!this.userId && this.user) {
    this.userId = this.user;
  }
  if (!this.user && this.userId) {
    this.user = this.userId;
  }
  next();
});

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
