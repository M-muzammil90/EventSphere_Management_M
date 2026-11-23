import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },

    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      minlength: [4, "Title must be at least 4 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: { type: String, trim: true, maxlength: 3000 },
    type: {
      type: String,
      enum: ["Keynote", "Workshop", "Panel", "Demo", "Roundtable"],
      default: "Workshop",
      index: true,
    },
    track: { type: String, trim: true, maxlength: 80, index: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],

    speaker: {
      name: { type: String, required: [true, "Speaker name is required"], trim: true, maxlength: 100 },
      role: { type: String, trim: true, maxlength: 140 },
      company: { type: String, trim: true, maxlength: 140 },
      avatar: { type: String, default: "" },
      bio: { type: String, trim: true, maxlength: 1200 },
    },

    // scheduling
    date: { type: Date, required: [true, "Session date is required"] },
    startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)"] },
    endTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)"] },
    stage: { type: String, required: [true, "Stage/room is required"], trim: true, maxlength: 80 },

    capacity: { type: Number, required: true, min: [1, "Capacity must be at least 1"], max: 20000 },
    registeredCount: { type: Number, default: 0, min: 0 },

    isPublished: { type: Boolean, default: true },
    cancelledAt: Date,
    rescheduledFrom: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

sessionSchema.index({ expo: 1, date: 1, startTime: 1 });
sessionSchema.index({ track: 1, type: 1 });
sessionSchema.index({ title: "text", "speaker.name": "text" });
// Prevent a speaker double-booking the same stage & slot
sessionSchema.index({ expo: 1, stage: 1, date: 1, startTime: 1 }, { unique: true });

sessionSchema.virtual("isFull").get(function () {
  return this.registeredCount >= this.capacity;
});

sessionSchema.virtual("spotsLeft").get(function () {
  return Math.max(0, this.capacity - this.registeredCount);
});

sessionSchema.virtual("fillRate").get(function () {
  return this.capacity ? Math.round((this.registeredCount / this.capacity) * 100) : 0;
});

sessionSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate("endTime", "End time must be after the start time");
  }
  next();
});

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export default Session;
