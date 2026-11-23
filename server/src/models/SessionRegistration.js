import mongoose from "mongoose";

const sessionRegistrationSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },

    type: { type: String, enum: ["registered", "bookmarked"], default: "registered", index: true },
    status: { type: String, enum: ["active", "cancelled", "attended", "no_show"], default: "active" },

    reminderSent: { type: Boolean, default: false },
    reminderSentAt: Date,
    attendedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* One row per (session, user) — bookmarking then registering upgrades in place */
sessionRegistrationSchema.index({ session: 1, user: 1 }, { unique: true });
sessionRegistrationSchema.index({ user: 1, type: 1 });
sessionRegistrationSchema.index({ session: 1, status: 1, type: 1 });

sessionRegistrationSchema.virtual("isRegistered").get(function () {
  return this.type === "registered" && this.status === "active";
});

const SessionRegistration =
  mongoose.models.SessionRegistration || mongoose.model("SessionRegistration", sessionRegistrationSchema);
export default SessionRegistration;
