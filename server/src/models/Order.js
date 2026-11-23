import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    orderType: {
      type: String,
      enum: ["booth_booking", "ticket_registration", "workshop_registration"],
      required: true,
      index: true,
    },
    expoId: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },
    boothId: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", index: true },
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRegistration", index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", index: true },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, trim: true },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR", uppercase: true, maxlength: 3 },

    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    expiresAt: { type: Date, index: true },
    billingDetails: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      company: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, default: "Pakistan" },
    },

    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ expoId: 1, orderStatus: 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
