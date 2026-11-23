import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: [
        "registration_confirmed",
        "application_approved",
        "application_rejected",
        "booth_allocated",
        "booth_released",
        "schedule_change",
        "session_reminder",
        "appointment_update",
        "new_message",
        "feedback_reply",
        "payment_update",
        "system",
      ],
      default: "system",
      index: true,
    },

    title: { type: String, required: [true, "Notification title is required"], trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 1000 },

    // deep link for the client
    link: { type: String, trim: true, maxlength: 300 },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },

    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    deleted: { type: Boolean, default: false },

    // polymorphic reference
    relatedType: { type: String, enum: ["expo", "booth", "session", "application", "appointment", "message", "payment", "feedback"] },
    relatedId: mongoose.Schema.Types.ObjectId,

    // delivery tracking
    emailedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* Efficient "unread for user X" query used by the notification bell */
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1 year TTL

notificationSchema.virtual("isRead").get(function () {
  return this.read;
});

notificationSchema.methods.markRead = function () {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
  }
  return this.save();
};

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
