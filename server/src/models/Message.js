import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", index: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", index: true },

    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "DOCUMENT", "SYSTEM"],
      default: "TEXT",
    },

    content: { type: String, trim: true, maxlength: [4000, "Message too long"] },
    body: { type: String, trim: true, maxlength: [4000, "Message too long"] },

    attachments: [
      {
        url: { type: String, required: true },
        filename: String,
        size: Number,
        mimeType: String,
        publicId: String,
        resourceType: String,
      },
    ],

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    editedAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

messageSchema.pre("save", function (next) {
  if (!this.conversationId && this.conversation) this.conversationId = this.conversation;
  if (!this.conversation && this.conversationId) this.conversation = this.conversationId;
  if (!this.senderId && this.sender) this.senderId = this.sender;
  if (!this.sender && this.senderId) this.sender = this.senderId;
  if (!this.content && this.body) this.content = this.body;
  if (!this.body && this.content) this.body = this.content;
  next();
});

messageSchema.virtual("isDeleted").get(function () {
  return Boolean(this.deletedAt);
});

messageSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.body = "This message was deleted";
  this.content = "This message was deleted";
  return this.save();
};

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

/* ---------------------------- Conversation ---------------------------- */
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }],

    conversationType: {
      type: String,
      enum: ["DIRECT", "SUPPORT", "EXHIBITOR_COLLABORATION"],
      default: "DIRECT",
      index: true,
    },

    subject: { type: String, trim: true, maxlength: 200, default: "Conversation" },

    relatedExpoId: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", index: true },
    expo: { type: mongoose.Schema.Types.ObjectId, ref: "Expo", index: true },

    relatedBoothId: { type: mongoose.Schema.Types.ObjectId, ref: "Booth", index: true },
    relatedType: { type: String, enum: ["booth", "application", "support", "general", "neighbour"], default: "general" },
    relatedId: mongoose.Schema.Types.ObjectId,

    isNeighbourThread: { type: Boolean, default: false },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    readState: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastReadAt: Date,
        unread: { type: Number, default: 0 },
        archived: { type: Boolean, default: false },
      },
    ],

    status: { type: String, enum: ["active", "awaiting_reply", "closed"], default: "active", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ conversationType: 1, lastMessageAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });

conversationSchema.pre("save", function (next) {
  if (!this.relatedExpoId && this.expo) this.relatedExpoId = this.expo;
  if (!this.expo && this.relatedExpoId) this.expo = this.relatedExpoId;
  if (this.isNeighbourThread && this.conversationType !== "EXHIBITOR_COLLABORATION") {
    this.conversationType = "EXHIBITOR_COLLABORATION";
  }
  if (this.relatedType === "support" && this.conversationType !== "SUPPORT") {
    this.conversationType = "SUPPORT";
  }
  next();
});

conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some((p) => String(p._id ?? p) === String(userId));
};

conversationSchema.methods.readStateFor = function (userId) {
  return this.readState.find((r) => String(r.user) === String(userId));
};

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

export { Message, Conversation };
export default Message;
