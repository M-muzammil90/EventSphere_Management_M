import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    exhibitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorProfile",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Lead contact name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Lead email is required"],
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 140,
      default: "Independent",
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Decision Maker",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    interest: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "General Solutions",
    },
    score: {
      type: Number,
      min: 1,
      max: 100,
      default: 75,
    },
    status: {
      type: String,
      enum: ["Hot", "Warm", "Cold", "Nurture", "Closed"],
      default: "Warm",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

leadSchema.index({ exhibitor: 1, status: 1 });
leadSchema.index({ name: "text", company: "text", email: "text" });

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export default Lead;
