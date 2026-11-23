import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // applicant

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },

    tier: { type: String, enum: ["Platinum", "Gold", "Silver", "Bronze"], default: "Silver" },
    requestedZone: { type: String, uppercase: true, enum: ["A", "B", "C", "D", "E", "F"] },
    requestedCategory: { type: String, enum: ["Small", "Medium", "Large", "Island"] },

    // what they plan to showcase
    showcaseSummary: { type: String, trim: true, maxlength: 1500 },
    boothQty: { type: Number, default: 1, min: 1, max: 10 },

    // assigned by admin on approval
    booth: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", default: null },
    boothLabel: { type: String, trim: true },

    amountQuoted: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", maxlength: 3 },

    // review trail
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 800 },
    adminNotes: { type: String, trim: true, maxlength: 1000, select: false }, // internal only

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* One application per exhibitor per expo */
applicationSchema.index({ expo: 1, exhibitor: 1 }, { unique: true });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ "expo": 1, status: 1 });

applicationSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

applicationSchema.virtual("pendingDays").get(function () {
  return Math.floor((Date.now() - this.submittedAt.getTime()) / 86400000);
});

const ExhibitorApplication =
  mongoose.models.ExhibitorApplication || mongoose.model("ExhibitorApplication", applicationSchema);
export default ExhibitorApplication;
