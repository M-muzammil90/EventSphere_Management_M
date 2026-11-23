import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    ticketType: {
      type: String,
      enum: ["General", "Standard", "VIP", "Workshop"],
      default: "Standard",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "waitlisted", "cancelled", "attended", "no_show"],
      default: "confirmed",
      index: true,
    },

    // attendee snapshot at time of registration
    attendeeSnapshot: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      company: { type: String, trim: true },
      jobTitle: { type: String, trim: true },
      phone: { type: String, trim: true },
    },

    // pricing snapshot (immutable once created)
    pricing: {
      unitPrice: { type: Number, required: true, min: 0 },
      quantity: { type: Number, default: 1, min: 1, max: 10 },
      discount: { type: Number, default: 0, min: 0 },
      taxRate: { type: Number, default: 0, min: 0, max: 50 },
      subtotal: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "USD", maxlength: 3 },
    },

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    badgeCode: { type: String, unique: true, index: true },

    checkedInAt: Date,
    cancelledAt: Date,
    cancellationReason: { type: String, maxlength: 400 },

    consent: {
      terms: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      dataProcessing: { type: Boolean, default: true },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* Prevent duplicate registration for the same expo by the same user */
eventRegistrationSchema.index({ expo: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ status: 1, createdAt: -1 });
eventRegistrationSchema.index({ "attendeeSnapshot.email": 1 });
eventRegistrationSchema.index({ expo: 1, status: 1, ticketType: 1 });

eventRegistrationSchema.virtual("isPaid").get(function () {
  return this.pricing?.total === 0 || this.status === "confirmed";
});

/** Generates a short, human-readable badge code. */
eventRegistrationSchema.pre("save", function (next) {
  if (this.isNew && !this.badgeCode) {
    const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.badgeCode = `ES-${new Date().getFullYear()}-${String(this.user).slice(-5).toUpperCase()}${rnd}`;
  }
  next();
});

const EventRegistration =
  mongoose.models.EventRegistration || mongoose.model("EventRegistration", eventRegistrationSchema);
export default EventRegistration;
