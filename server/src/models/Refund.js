import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    reason: { type: String, required: true, maxlength: 600 },
    providerReference: { type: String },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PROCESSED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    adminNotes: { type: String, maxlength: 600 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    processedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

refundSchema.index({ requestedBy: 1, createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });

const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);
export default Refund;
