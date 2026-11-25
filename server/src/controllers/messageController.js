import { Conversation, Message } from "../models/Message.js";
import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";
import { emitToConversation, emitToUser, isUserOnline } from "../services/socketService.js";
import { notificationService } from "../services/notificationService.js";
import { uploadAsset } from "../services/cloudinaryService.js";

/* =====================================================================
   GET CONVERSATIONS
   ===================================================================== */
export const getConversations = asyncHandler(async (req, res) => {
  const { q, type, status, page = 1, limit = 30 } = req.query;
  const uid = String(req.user._id);

  const filter = {};

  // Staff can view all support conversations if requested, otherwise caller must be participant
  if (req.user.isStaff && type === "SUPPORT") {
    filter.conversationType = "SUPPORT";
  } else {
    filter.participants = req.user._id;
  }

  if (type && ["DIRECT", "SUPPORT", "EXHIBITOR_COLLABORATION"].includes(type)) {
    filter.conversationType = type;
  }
  if (status) {
    filter.status = status;
  }

  let list = await Conversation.find(filter)
    .populate("participants", "name email avatar role company phone")
    .populate("lastSender", "name")
    .populate("expo", "title slug banner")
    .populate("relatedExpoId", "title slug banner")
    .populate("relatedBoothId", "boothId category zone")
    .sort({ lastMessageAt: -1 })
    .lean();

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    list = list.filter(
      (c) =>
        rx.test(c.subject) ||
        rx.test(c.lastMessage) ||
        c.participants.some((p) => rx.test(p?.name ?? "") || rx.test(p?.company ?? ""))
    );
  }

  const total = list.length;
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });
  const slice = list.slice(skip, skip + l);

  const data = slice.map((c) => {
    const state = (c.readState ?? []).find((r) => String(r.user) === uid);
    const others = c.participants.filter((x) => String(x._id) !== uid);
    const primaryOther = others[0] ?? { name: "System Support", role: "organizer" };

    return {
      _id: c._id,
      id: c._id,
      subject: c.subject,
      conversationType: c.conversationType,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      status: c.status,
      isNeighbourThread: c.isNeighbourThread,
      expo: c.expo || c.relatedExpoId,
      booth: c.relatedBoothId,
      participants: others,
      display: {
        ...primaryOther,
        isOnline: isUserOnline(primaryOther._id),
      },
      unread: state?.unread ?? 0,
      archived: state?.archived ?? false,
      pinned: (c.pinnedBy ?? []).some((x) => String(x) === uid),
    };
  });

  const unreadTotal = list.reduce(
    (sum, c) => sum + ((c.readState ?? []).find((r) => String(r.user) === uid)?.unread ?? 0),
    0
  );

  return ApiResponse.ok(res, data, undefined, {
    page: p,
    pages,
    total,
    limit: l,
    unreadTotal,
  });
});

/* =====================================================================
   START CONVERSATION (Role & Permission Validation)
   ===================================================================== */
export const startConversation = asyncHandler(async (req, res) => {
  let { participants = [], recipientId, recipient, recipients, subject, initialMessage, conversationType = "DIRECT", relatedType, relatedId, expoId } = req.body;
  const myId = String(req.user._id);

  if (!Array.isArray(participants)) participants = participants ? [participants] : [];
  if (recipientId) participants.push(recipientId);
  if (recipient) participants.push(recipient);
  if (Array.isArray(recipients)) participants.push(...recipients);

  // Resolve emails or exhibitor profiles to User IDs if needed
  const resolvedParticipants = [];
  for (const p of participants) {
    if (typeof p === "string" && p.includes("@")) {
      const u = await User.findOne({ email: p.trim().toLowerCase() });
      if (u) resolvedParticipants.push(String(u._id));
    } else if (p && /^[0-9a-fA-F]{24}$/.test(String(p))) {
      const u = await User.findById(p);
      if (u) {
        resolvedParticipants.push(String(u._id));
      } else {
        const ep = await ExhibitorProfile.findById(p);
        if (ep?.user) resolvedParticipants.push(String(ep.user));
      }
    } else if (p) {
      const ep = await ExhibitorProfile.findOne({
        $or: [
          { "company.name": new RegExp(`^${p}$`, "i") },
          { slug: p },
        ],
      });
      if (ep?.user) {
        resolvedParticipants.push(String(ep.user));
      } else {
        const u = await User.findOne({
          $or: [
            { name: new RegExp(`^${p}$`, "i") },
            { email: new RegExp(`^${p}$`, "i") },
          ],
        });
        if (u) resolvedParticipants.push(String(u._id));
      }
    }
  }

  // Filter and deduplicate
  const otherIds = Array.from(new Set(resolvedParticipants.map(String).filter((id) => id !== myId)));

  // If no other recipient resolved, auto-assign to admin/organizer for support/general
  if (otherIds.length === 0) {
    const adminUser = await User.findOne({ role: { $in: ["admin", "organizer"] } });
    if (adminUser) otherIds.push(String(adminUser._id));
  }

  if (otherIds.length === 0) {
    throw ApiError.badRequest("At least one recipient is required");
  }

  // Enforce communication relationship rules:
  // 1. Attendee can contact Exhibitor or Support (Admin)
  if (req.user.role === "attendee") {
    for (const targetId of otherIds) {
      const targetUser = await User.findById(targetId);
      if (!targetUser) throw ApiError.badRequest("Recipient not found");

      if (targetUser.role === "attendee") {
        throw ApiError.forbidden("Attendees cannot initiate private messages with other attendees");
      }

      if (targetUser.role === "exhibitor") {
        const profile = await ExhibitorProfile.findOne({ user: targetId });
        if (profile?.visibility?.allowAttendeeChat === false) {
          throw ApiError.forbidden("This exhibitor has disabled attendee inquiries");
        }
      }
    }
  }

  const allParticipantIds = [myId, ...otherIds];

  // Check if identical direct thread already exists
  if (conversationType === "DIRECT" && otherIds.length === 1) {
    const existing = await Conversation.findOne({
      conversationType: "DIRECT",
      participants: { $all: allParticipantIds, $size: 2 },
    });
    if (existing) {
      if (initialMessage) {
        await Message.create({
          conversationId: existing._id,
          conversation: existing._id,
          senderId: req.user._id,
          sender: req.user._id,
          content: initialMessage,
          body: initialMessage,
          readBy: [req.user._id],
        });
        existing.lastMessage = initialMessage.slice(0, 200);
        existing.lastMessageAt = new Date();
        await existing.save();
      }
      return ApiResponse.ok(res, existing, "Existing conversation opened");
    }
  }

  const conversation = await Conversation.create({
    participants: allParticipantIds,
    conversationType,
    subject: subject || (conversationType === "SUPPORT" ? "Support Request" : "New Conversation"),
    relatedExpoId: expoId,
    expo: expoId,
    relatedType: relatedType || (conversationType === "SUPPORT" ? "support" : "general"),
    relatedId,
    readState: allParticipantIds.map((id) => ({
      user: id,
      unread: 0,
      lastReadAt: id === myId ? new Date() : undefined,
    })),
    lastMessage: initialMessage?.slice(0, 200) ?? "",
    lastMessageAt: new Date(),
    lastSender: req.user._id,
  });

  if (initialMessage) {
    await Message.create({
      conversationId: conversation._id,
      conversation: conversation._id,
      senderId: req.user._id,
      sender: req.user._id,
      content: initialMessage,
      body: initialMessage,
      readBy: [req.user._id],
    });

    // Notify recipients
    otherIds.forEach((pid) => {
      emitToUser(pid, "message:new", {
        conversationId: String(conversation._id),
        from: req.user.name,
        text: initialMessage,
      });
    });

    await notificationService.notifyMany(otherIds, {
      type: "new_message",
      title: `New message from ${req.user.name}`,
      body: initialMessage.slice(0, 100),
      link: req.user.role === "attendee" ? "/attendee" : "/portal",
      relatedType: "message",
      relatedId: conversation._id,
    });
  }

  return ApiResponse.created(res, conversation, "Conversation created successfully");
});

/* =====================================================================
   GET CONVERSATION DETAILS & MESSAGES
   ===================================================================== */
export const getConversation = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const conversation = await Conversation.findById(req.params.id)
    .populate("participants", "name email avatar role company phone")
    .populate("expo", "title slug banner venue")
    .populate("relatedExpoId", "title slug banner venue")
    .populate("relatedBoothId", "boothId category zone sqm price");

  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isParticipant = conversation.isParticipant(uid);
  const isAdmin = ["admin", "organizer"].includes(req.user.role);
  if (!isParticipant && !isAdmin) {
    throw ApiError.forbidden("You do not have permission to view this conversation");
  }

  const messages = await Message.find({
    $or: [{ conversationId: conversation._id }, { conversation: conversation._id }],
    deletedAt: { $exists: false },
  })
    .populate("sender", "name avatar role company")
    .populate("senderId", "name avatar role company")
    .sort({ createdAt: 1 })
    .limit(300);

  // Mark unread as 0 for this user
  const state = conversation.readState.find((r) => String(r.user) === uid);
  if (state) {
    state.unread = 0;
    state.lastReadAt = new Date();
    await conversation.save();
  }

  return ApiResponse.ok(res, {
    conversation,
    messages,
  });
});

/* =====================================================================
   GET MESSAGES FOR CONVERSATION (Paginated)
   ===================================================================== */
export const getConversationMessages = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conv = await Conversation.findById(id);
  if (!conv) throw ApiError.notFound("Conversation not found");

  const isParticipant = conv.isParticipant(uid);
  const isAdmin = ["admin", "organizer"].includes(req.user.role);
  if (!isParticipant && !isAdmin) throw ApiError.forbidden("Access denied");

  const total = await Message.countDocuments({
    $or: [{ conversationId: id }, { conversation: id }],
    deletedAt: { $exists: false },
  });

  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const messages = await Message.find({
    $or: [{ conversationId: id }, { conversation: id }],
    deletedAt: { $exists: false },
  })
    .populate("sender", "name email avatar role company")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(l);

  return ApiResponse.ok(res, messages, undefined, { page: p, pages, total, limit: l });
});

/* =====================================================================
   SEND MESSAGE (REST Endpoint)
   ===================================================================== */
export const sendMessage = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const { id } = req.params;
  const { content, body: legacyBody, messageType = "TEXT" } = req.body;
  const text = (content || legacyBody || "").trim();

  if (!text && !req.file) {
    throw ApiError.unprocessable("Message body cannot be empty");
  }

  const conv = await Conversation.findById(id).populate("participants", "name role");
  if (!conv) throw ApiError.notFound("Conversation not found");

  const isParticipant = conv.isParticipant(uid);
  const isAdmin = ["admin", "organizer"].includes(req.user.role);
  if (!isParticipant && !isAdmin) throw ApiError.forbidden("Access denied");

  let attachments = [];
  if (req.file) {
    const asset = await uploadAsset(req.file, { folder: "documents" });
    attachments.push({
      url: asset.url,
      filename: asset.originalName || req.file.originalname,
      size: asset.sizeBytes || req.file.size,
      mimeType: req.file.mimetype,
      publicId: asset.publicId,
    });
  }

  if (!text && attachments.length === 0) {
    throw ApiError.badRequest("Message must contain text or an attachment");
  }

  const message = await Message.create({
    conversationId: conv._id,
    conversation: conv._id,
    senderId: req.user._id,
    sender: req.user._id,
    messageType: attachments.length > 0 ? (req.file?.mimetype?.startsWith("image/") ? "IMAGE" : "DOCUMENT") : messageType,
    content: text,
    body: text,
    attachments,
    readBy: [req.user._id],
  });

  conv.lastMessage = text.slice(0, 200) || "Attachment";
  conv.lastMessageAt = new Date();
  conv.lastSender = req.user._id;
  if (conv.status === "closed") conv.status = "active";

  conv.participants.forEach((p) => {
    const pid = String(p._id ?? p);
    if (pid === uid) return;
    const state = conv.readState.find((r) => String(r.user) === pid);
    if (state) {
      state.unread = (state.unread ?? 0) + 1;
      state.archived = false;
    } else {
      conv.readState.push({ user: pid, unread: 1 });
    }
  });
  await conv.save();

  const populated = await message.populate("sender", "name email avatar role");

  // Real-time broadcast
  emitToConversation(String(conv._id), "message:new", {
    conversationId: String(conv._id),
    message: populated,
  });

  // Offline notification
  const others = conv.participants.filter((p) => String(p._id ?? p) !== uid);
  await notificationService.notifyMany(others.map((p) => p._id ?? p), {
    type: "new_message",
    title: `New message from ${req.user.name}`,
    body: text.slice(0, 100),
    link: req.user.role === "attendee" ? "/attendee" : "/portal",
    relatedType: "message",
    relatedId: conv._id,
  });

  return ApiResponse.created(res, populated, "Message sent");
});

/* =====================================================================
   MARK SINGLE MESSAGE READ
   ===================================================================== */
export const markSingleMessageRead = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound("Message not found");

  if (!message.readBy.includes(req.user._id)) {
    message.readBy.push(req.user._id);
    await message.save();
  }

  return ApiResponse.ok(res, { read: true, messageId: message._id });
});

/* =====================================================================
   SOFT DELETE MESSAGE
   ===================================================================== */
export const deleteSingleMessage = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound("Message not found");

  if (String(message.senderId || message.sender) !== uid && !req.user.isStaff) {
    throw ApiError.forbidden("You can only delete your own messages");
  }

  await message.softDelete();
  return ApiResponse.ok(res, { deleted: true, messageId: message._id });
});

/* =====================================================================
   MARK CONVERSATION AS READ
   ===================================================================== */
export const markConversationRead = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const conv = await Conversation.findById(req.params.id);
  if (!conv) throw ApiError.notFound("Conversation not found");

  const state = conv.readState.find((r) => String(r.user) === uid);
  if (state) {
    state.unread = 0;
    state.lastReadAt = new Date();
  } else {
    conv.readState.push({ user: req.user._id, unread: 0, lastReadAt: new Date() });
  }
  await conv.save();

  return ApiResponse.ok(res, { read: true });
});

/* =====================================================================
   UPDATE CONVERSATION STATE / STATUS
   ===================================================================== */
export const setConversationState = asyncHandler(async (req, res) => {
  const uid = String(req.user._id);
  const { status, archived, assignedTo } = req.body;

  const conv = await Conversation.findById(req.params.id);
  if (!conv) throw ApiError.notFound("Conversation not found");

  if (status && req.user.isStaff) {
    conv.status = status;
  }
  if (assignedTo && req.user.isStaff) {
    conv.assignedTo = assignedTo;
  }
  if (archived !== undefined) {
    const state = conv.readState.find((r) => String(r.user) === uid);
    if (state) state.archived = Boolean(archived);
  }

  await conv.save();
  return ApiResponse.ok(res, conv, "Conversation updated");
});
