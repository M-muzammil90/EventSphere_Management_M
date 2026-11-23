import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },

    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // exhibitor being requested (or null when an exhibitor initiates)
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", index: true },

    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    title: { type: String, trim: true, maxlength: 160 },
    date: { type: Date, required: [true, "Appointment date is required"] },
    startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"] },
    durationMinutes: { type: Number, default: 30, min: 15, max: 240 },

    type: {
      type: String,
      enum: ["Meeting", "Demo", "Call", "Site visit"],
      default: "Meeting",
    },
    location: { type: String, trim: true, maxlength: 160 },
    agenda: { type: String, trim: true, maxlength: 1500 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed", "rescheduled"],
      default: "pending",
      index: true,
    },
    declineReason: { type: String, maxlength: 500 },
    originalDate: Date,

    initiatedBy: { type: String, enum: ["attendee", "exhibitor"], default: "attendee" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

appointmentSchema.index({ expo: 1, date: 1, startTime: 1 });
appointmentSchema.index({ requester: 1, status: 1 });
appointmentSchema.index({ exhibitor: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

appointmentSchema.virtual("endTime").get(function () {
  const [h, m] = (this.startTime || "00:00").split(":").map(Number);
  const d = new Date(this.date || Date.now());
  d.setHours(h, m + (this.durationMinutes || 30), 0, 0);
  return d;
});

appointmentSchema.virtual("isPast").get(function () {
  return this.date < new Date();
});

const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
export default Appointment;
