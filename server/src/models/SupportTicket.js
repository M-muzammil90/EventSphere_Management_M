import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachments: [
      {
        url: String,
        filename: String,
        mimeType: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: String,
      enum: ["booth", "technical", "billing", "registration", "general"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messages: [ticketMessageSchema],
    resolvedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model("SupportTicket").countDocuments();
    this.ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
