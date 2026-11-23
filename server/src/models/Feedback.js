import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // polymorphic target
    targetType: {
      type: String,
      enum: ["expo", "session", "exhibitor"],
      required: true,
      index: true,
    },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", index: true },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", index: true },
    targetLabel: { type: String, trim: true, maxlength: 200 }, // denormalised display name

    rating: {
      type: Number,
      required: [true, "A rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    title: { type: String, trim: true, maxlength: 160 },
    body: {
      type: String,
      required: [true, "Feedback body is required"],
      trim: true,
      minlength: [10, "Please provide at least 10 characters of feedback"],
      maxlength: [2000, "Feedback cannot exceed 2000 characters"],
    },

    category: {
      type: String,
      enum: ["Content", "Logistics", "Venue", "Technology", "Catering", "General"],
      default: "General",
      index: true,
    },
    wouldRecommend: { type: Boolean, default: true },

    // moderation / workflow
    status: {
      type: String,
      enum: ["new", "in_review", "resolved", "closed"],
      default: "new",
      index: true,
    },
    isPublic: { type: Boolean, default: false }, // shown on public profiles?

    // organizer reply
    reply: { type: String, maxlength: 1500 },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repliedAt: Date,

    assignedTo: { type: String, maxlength: 80 },
    internalNotes: { type: String, maxlength: 1000, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

feedbackSchema.index({ targetType: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ author: 1, createdAt: -1 });
feedbackSchema.index({ expo: 1, rating: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ body: "text", title: "text" });

feedbackSchema.virtual("hasReply").get(function () {
  return Boolean(this.reply && this.repliedAt);
});

feedbackSchema.virtual("sentiment").get(function () {
  if (this.rating >= 4) return "positive";
  if (this.rating === 3) return "neutral";
  return "negative";
});

feedbackSchema.virtual("stars").get(function () {
  return "★".repeat(this.rating) + "☆".repeat(5 - this.rating);
});

/** A user may only leave one review per target. */
feedbackSchema.index(
  { author: 1, targetType: 1, expo: 1, session: 1, exhibitor: 1 },
  { unique: true }
);

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
export default Feedback;
