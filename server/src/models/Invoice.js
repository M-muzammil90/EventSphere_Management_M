import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    billingDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      company: { type: String },
      address: { type: String },
      city: { type: String },
      country: { type: String, default: "Pakistan" },
    },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR", uppercase: true },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "REFUNDED", "CANCELLED"],
      default: "PAID",
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

invoiceSchema.index({ userId: 1, issuedAt: -1 });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;
