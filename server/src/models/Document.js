import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    exhibitor: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorProfile", index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "ExhibitorApplication", index: true },

    docType: {
      type: String,
      required: true,
      enum: {
        values: [
          "certificate_of_incorporation",
          "public_liability_insurance",
          "product_liability_waiver",
          "booth_build_risk_assessment",
          "electrical_certificate",
          "staff_list",
          "sustainability_statement",
          "iso_certification",
          "other",
        ],
        message: "Unsupported document type",
      },
      index: true,
    },

    filename: { type: String, required: true, trim: true, maxlength: 260 },
    originalName: { type: String, required: true, trim: true },

    // storage
    storage: { type: String, enum: ["cloudinary", "local"], default: "local" },
    url: { type: String, required: true },
    publicId: { type: String }, // Cloudinary asset id
    resourceType: { type: String, enum: ["image", "raw"], default: "raw" },

    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    checksum: { type: String, maxlength: 64 },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    rejectionReason: { type: String, maxlength: 600 },
    expiresAt: Date,

    isPrivate: { type: Boolean, default: true }, // never publicly served
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    deletedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

documentSchema.index({ owner: 1, docType: 1, status: 1 });
documentSchema.index({ exhibitor: 1, status: 1 });
documentSchema.index({ docType: 1, status: 1 });

documentSchema.virtual("isExpired").get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

documentSchema.virtual("sizeLabel").get(function () {
  const b = this.sizeBytes || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
});

const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);
export default Document;
