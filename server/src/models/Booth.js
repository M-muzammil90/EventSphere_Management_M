import mongoose from "mongoose";

const boothSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },

    boothId: {
      type: String,
      required: [true, "Booth ID is required"],
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    zone: {
      type: String,
      required: true,
      uppercase: true,
      enum: { values: ["A", "B", "C", "D", "E", "F"], message: "Zone must be A–F" },
    },

    category: {
      type: String,
      required: true,
      enum: { values: ["Small", "Medium", "Large", "Island"], message: "Unsupported booth category" },
    },
    sqm: { type: Number, required: true, min: [4, "Booth must be at least 4 m²"], max: [400, "Booth cannot exceed 400 m²"] },
    dimensions: { width: Number, depth: Number, height: Number },

    // pricing snapshot (effective at booking time)
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    currency: { type: String, default: "USD", uppercase: true, maxlength: 3 },

    status: {
      type: String,
      enum: ["available", "reserved", "booked", "blocked"],
      default: "available",
      index: true,
    },

    // occupancy
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", default: null },
    heldUntil: { type: Date, default: null }, // reservation TTL
    reservedAt: Date,
    bookedAt: Date,

    // plan geometry (percentages so the floor plan scales responsively)
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    size: { w: { type: Number, default: 14 }, h: { type: Number, default: 14 } },

    amenities: [{ type: String, trim: true }],
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* --------------------- CRITICAL: prevent double-booking --------------- */
/* A booth can only be occupied by one exhibitor per expo.               */
boothSchema.index({ expo: 1, boothId: 1 }, { unique: true });
/* Partial index blocks two documents claiming the same (expo, exhibitor) */
boothSchema.index(
  { expo: 1, exhibitor: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["reserved", "booked"] }, exhibitor: { $type: "objectId" } } }
);
boothSchema.index({ expo: 1, status: 1, zone: 1 });
boothSchema.index({ boothId: "text" });

/* ------------------------------- virtuals ----------------------------- */
boothSchema.virtual("isOccupied").get(function () {
  return ["reserved", "booked"].includes(this.status);
});

boothSchema.virtual("isAvailable").get(function () {
  if (this.status !== "available") return false;
  if (this.heldUntil && this.heldUntil > new Date()) return false;
  return true;
});

boothSchema.virtual("pricePerSqm").get(function () {
  return this.sqm ? Math.round((this.price / this.sqm) * 100) / 100 : 0;
});

/* --------------------------- query helpers ---------------------------- */
boothSchema.query.available = function () {
  return this.where({ status: "available" });
};
boothSchema.query.inExpo = function (expoId) {
  return this.where({ expo: expoId });
};

const Booth = mongoose.models.Booth || mongoose.model("Booth", boothSchema);
export default Booth;
