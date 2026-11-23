import mongoose from "mongoose";

/* ------------------------------------------------------------------
   Pricing — two document types:
   • BoothPricing  : rate per (expo × booth category)
   • TicketPricing : attendee pass per (expo × ticket name)
   • PricingSetting: expo-level tax / discount / currency config
   ------------------------------------------------------------------ */

const boothPricingSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["Small", "Medium", "Large", "Island"],
    },
    sqm: { type: Number, required: true, min: 4, max: 400 },

    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", maxlength: 3, uppercase: true },

    discountPercent: { type: Number, default: 0, min: 0, max: 50 },
    // computed effective price = basePrice × (1 − discountPercent/100)
    effectivePrice: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ["active", "draft", "archived"], default: "active", index: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

boothPricingSchema.index({ expo: 1, category: 1 }, { unique: true });

boothPricingSchema.virtual("pricePerSqm").get(function () {
  return this.sqm ? Math.round((this.effectivePrice / this.sqm) * 100) / 100 : 0;
});

const BoothPricing = mongoose.models.BoothPricing || mongoose.model("BoothPricing", boothPricingSchema);

/* ------------------------------ TicketPricing ------------------------- */
const ticketPricingSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, index: true },
    name: {
      type: String,
      required: true,
      enum: ["General", "Standard", "VIP", "Workshop"],
    },
    price: { type: Number, required: true, min: 0 }, // 0 = free
    currency: { type: String, default: "USD", maxlength: 3, uppercase: true },

    capacity: { type: Number, required: true, min: 1, max: 200000 },
    soldCount: { type: Number, default: 0, min: 0 },

    perks: [{ type: String, trim: true, maxlength: 120 }],
    description: { type: String, maxlength: 800 },

    salesStart: Date,
    salesEnd: Date,
    status: { type: String, enum: ["active", "draft", "sold_out", "archived"], default: "active", index: true },
  },
  { timestamps: true }
);

ticketPricingSchema.index({ expo: 1, name: 1 }, { unique: true });

ticketPricingSchema.virtual("isFree").get(function () {
  return this.price === 0;
});

ticketPricingSchema.virtual("isSoldOut").get(function () {
  return this.soldCount >= this.capacity;
});

ticketPricingSchema.virtual("spotsLeft").get(function () {
  return Math.max(0, this.capacity - this.soldCount);
});

const TicketPricing = mongoose.models.TicketPricing || mongoose.model("TicketPricing", ticketPricingSchema);

/* ------------------------------ PricingSetting ------------------------ */
const pricingSettingSchema = new mongoose.Schema(
  {
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", required: true, unique: true, index: true },
    currency: { type: String, default: "USD", maxlength: 3, uppercase: true },
    taxRate: { type: Number, default: 5, min: 0, max: 50 },
    taxLabel: { type: String, default: "VAT", maxlength: 20 },

    earlyBirdEnabled: { type: Boolean, default: false },
    earlyBirdPercent: { type: Number, default: 0, min: 0, max: 50 },
    earlyBirdDeadline: Date,

    multiBoothEnabled: { type: Boolean, default: false },
    multiBoothPercent: { type: Number, default: 0, min: 0, max: 30 },
    multiBoothMinQty: { type: Number, default: 2, min: 2 },

    demoPaymentsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PricingSetting = mongoose.models.PricingSetting || mongoose.model("PricingSetting", pricingSettingSchema);

export { BoothPricing, TicketPricing, PricingSetting };
export default BoothPricing;
