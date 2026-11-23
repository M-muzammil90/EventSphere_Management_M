import mongoose from "mongoose";

const expoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expo title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [140, "Title cannot exceed 140 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: [
          "Technology", "Healthcare", "Manufacturing", "Automotive", "Retail",
          "Sustainability", "Food & Beverage", "Aerospace", "Education", "Other",
        ],
        message: "Unsupported expo category",
      },
    },
    industry: { type: String, trim: true, maxlength: 140 },
    theme: { type: String, trim: true, maxlength: 120 },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    startDate: { type: Date, required: [true, "Start date is required"] },
    endDate: { type: Date, required: [true, "End date is required"] },

    venue: {
      name: { type: String, required: [true, "Venue name is required"], trim: true },
      hall: { type: String, trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      country: { type: String, required: [true, "Country is required"], trim: true },
      address: { type: String, trim: true },
    },

    banner: { url: String, publicId: String },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],

    status: {
      type: String,
      enum: ["draft", "published", "live", "completed", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },

    capacity: {
      attendees: { type: Number, default: 5000, min: 1, max: 500000 },
      exhibitors: { type: Number, default: 200, min: 1, max: 20000 },
      booths: { type: Number, default: 250, min: 1, max: 5000 },
    },

    // organiser ownership
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // denormalised counters (maintained by hooks / controllers)
    stats: {
      attendees: { type: Number, default: 0 },
      exhibitors: { type: Number, default: 0 },
      sessions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 },
    },

    publishedAt: Date,
    archivedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ------------------------------- indexes ------------------------------ */
expoSchema.index({ slug: 1 }, { unique: true });
expoSchema.index({ status: 1, startDate: 1 });
expoSchema.index({ category: 1 });
expoSchema.index({ title: "text", tags: "text", "venue.city": "text" });
expoSchema.index({ organizer: 1 });

/* ------------------------------- virtuals ----------------------------- */
expoSchema.virtual("durationDays").get(function () {
  if (!this.startDate || !this.endDate) return 0;
  return Math.max(1, Math.round((this.endDate - this.startDate) / 86400000) + 1);
});

expoSchema.virtual("isUpcoming").get(function () {
  return this.status === "published" && this.startDate > new Date();
});

expoSchema.virtual("isLive").get(function () {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

/* ------------------------------ validators ---------------------------- */
expoSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be on or after the start date");
  }
  next();
});

/* ------------------------------ slug hook ----------------------------- */
expoSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
    this.slug = this.slug || `${base}-${Date.now().toString(36).slice(-4)}`;
  }
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Expo = mongoose.models.Expo || mongoose.model("Expo", expoSchema);
export default Expo;
