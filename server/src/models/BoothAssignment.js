import mongoose from "mongoose";

const boothAssignmentSchema = new mongoose.Schema(
  {
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorApplication",
      required: true,
      index: true,
    },
    exhibitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorProfile",
      required: true,
      index: true,
    },
    booth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booth",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["assigned", "reassigned", "released"],
      default: "assigned",
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

boothAssignmentSchema.index({ expo: 1, booth: 1, status: 1 });
boothAssignmentSchema.index({ expo: 1, exhibitor: 1, status: 1 });

const BoothAssignment = mongoose.model("BoothAssignment", boothAssignmentSchema);

export default BoothAssignment;
