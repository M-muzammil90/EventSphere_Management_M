import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Automatically purge expired tokens from MongoDB
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);
export default RevokedToken;
