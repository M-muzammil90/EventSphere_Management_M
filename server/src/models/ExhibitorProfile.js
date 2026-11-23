import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    price: { type: String, trim: true, maxlength: 60 }, // "From $2,400 / mo"
    image: { url: String, publicId: String },
    isBeta: { type: Boolean, default: false },
    demoCount: { type: Number, default: 0 },
  },
  { _id: true }
);

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Staff name is required"], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Staff email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Provide a valid staff email"],
    },
    role: { type: String, trim: true, maxlength: 80, default: "Booth staff" },
    permissions: {
      type: String,
      enum: ["lead_scanner_full", "lead_scanner_only", "demo_only"],
      default: "lead_scanner_only",
    },
    badgeIssued: { type: Boolean, default: false },
    avatar: { type: String, default: "" },
  },
  { _id: true }
);

const exhibitorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    company: {
      name: { type: String, required: [true, "Company name is required"], trim: true, maxlength: 140 },
      registrationNo: { type: String, trim: true, maxlength: 60 },
      website: { type: String, trim: true, maxlength: 200 },
      foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
      description: { type: String, trim: true, maxlength: 2000 },
    },

    logo: { url: String, publicId: String },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Cloud Infrastructure", "Industrial Automation", "Medical Devices", "Renewables",
        "Data & AI", "Cybersecurity", "Logistics", "Fintech & Payments", "Materials",
        "Consumer Electronics", "Other",
      ],
    },
    products: [productSchema],
    staff: [staffSchema],

    contact: {
      primaryName: { type: String, trim: true, maxlength: 100 },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true, maxlength: 32 },
      country: { type: String, trim: true, maxlength: 80 },
    },

    tier: { type: String, enum: ["Platinum", "Gold", "Silver", "Bronze"], default: "Bronze" },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },

    // privacy
    visibility: {
      showBoothOnPlan: { type: Boolean, default: true },
      allowAttendeeChat: { type: Boolean, default: true },
      showEmailPublicly: { type: Boolean, default: false },
    },

    stats: { traffic: { type: Number, default: 0 }, leads: { type: Number, default: 0 }, revenue: { type: Number, default: 0 } },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

exhibitorProfileSchema.index({ "company.name": "text", category: "text", "contact.country": "text" });
exhibitorProfileSchema.index({ category: 1, verificationStatus: 1 });
exhibitorProfileSchema.index({ tier: 1 });

exhibitorProfileSchema.virtual("initials").get(function () {
  return (this.company?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

const ExhibitorProfile =
  mongoose.models.ExhibitorProfile || mongoose.model("ExhibitorProfile", exhibitorProfileSchema);
export default ExhibitorProfile;
