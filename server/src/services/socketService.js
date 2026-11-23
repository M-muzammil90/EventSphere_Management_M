import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Conversation, Message } from "../models/Message.js";
import { notificationService } from "./notificationService.js";

let io = null;
const onlineUsers = new Map(); // userId -> Set<socketId>

export const attachIO = (server) => {
  io = server;

  /* --------------------------- Handshake Auth ------------------------- */
  io.use(async (socket, next) => {
    try {
      // 1. Try cookie
      const cookie = socket.handshake.headers.cookie || "";
      const match = cookie.match(new RegExp(`${process.env.JWT_COOKIE_NAME || "es_token"}=([^;]+)`));
      let token = match?.[1];

      // 2. Try auth payload or query token
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error("Account not found or inactive"));

      socket.userId = String(user._id);
      socket.userName = user.name;
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error(err.name === "TokenExpiredError" ? "Session expired" : "Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    const isFirstSocket = !onlineUsers.has(uid);

    if (isFirstSocket) {
      onlineUsers.set(uid, new Set());
    }
    onlineUsers.get(uid).add(socket.id);

    // Private room for user and role
    socket.join(`user:${uid}`);
    socket.join(`role:${socket.userRole}`);

    // Broadcast online status if this is the first active connection for this user
    if (isFirstSocket) {
      socket.broadcast.emit("user:status", { userId: uid, status: "online", lastSeen: new Date() });
    }

    socket.emit("connection:established", {
      userId: uid,
      name: socket.userName,
      role: socket.userRole,
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    /* ------------------- Room Join with Permission Guard ---------------- */
    socket.on("conversation:join", async (conversationId, callback) => {
      try {
        const id = typeof conversationId === "object" ? (conversationId?.conversationId || conversationId?.id) : conversationId;
        if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
          return callback?.({ error: "Invalid conversation ID" });
        }

        const conv = await Conversation.findById(id);
        if (!conv) return callback?.({ error: "Conversation not found" });

        // Authorization check: User must be a participant or an admin staff
        const isParticipant = conv.isParticipant(uid);
        const isAdmin = ["admin", "organizer"].includes(socket.userRole);
        if (!isParticipant && !isAdmin) {
          return callback?.({ error: "Access denied to this conversation" });
        }

        socket.join(`conversation:${id}`);
        callback?.({ success: true, conversationId: id });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      const id = typeof conversationId === "object" ? (conversationId?.conversationId || conversationId?.id) : conversationId;
      if (id) socket.leave(`conversation:${id}`);
    });

    /* -------------------- Real-Time Message Sending ------------------- */
    socket.on("message:send", async (data, callback) => {
      try {
        const { conversationId, content, messageType = "TEXT", attachments = [] } = data;
        const text = content?.trim() || "";

        if (!text && (!attachments || attachments.length === 0)) {
          return callback?.({ error: "Message content or attachment required" });
        }

        const conv = await Conversation.findById(conversationId).populate("participants", "name role");
        if (!conv) return callback?.({ error: "Conversation not found" });

        const isParticipant = conv.isParticipant(uid);
        const isAdmin = ["admin", "organizer"].includes(socket.userRole);
        if (!isParticipant && !isAdmin) {
          return callback?.({ error: "Unauthorized" });
        }

        const msg = await Message.create({
          conversationId: conv._id,
          conversation: conv._id,
          senderId: uid,
          sender: uid,
          messageType,
          content: text,
          body: text,
          attachments,
          readBy: [uid],
        });

        conv.lastMessage = text.slice(0, 200) || "Attachment";
        conv.lastMessageAt = new Date();
        conv.lastSender = uid;
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

        const populatedMsg = await msg.populate("sender", "name email avatar role");

        const payload = {
          conversationId: String(conv._id),
          message: populatedMsg,
        };

        // Broadcast to conversation room (single emit — prevents client-side duplicates)
        io.to(`conversation:${conversationId}`).emit("message:new", payload);

        // Notify recipient sockets directly in case they are not in the room
        const others = conv.participants.filter((p) => String(p._id ?? p) !== uid);
        others.forEach((p) => {
          const pid = String(p._id ?? p);
          emitToUser(pid, "conversation:updated", {
            conversationId: String(conv._id),
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unread: (conv.readState.find((r) => String(r.user) === pid)?.unread ?? 1),
          });
        });

        // Push persistent notification
        notificationService.notifyMany(others.map((p) => p._id ?? p), {
          type: "new_message",
          title: `New message from ${socket.userName}`,
          body: text.slice(0, 100),
          link: socket.userRole === "attendee" ? "/attendee" : "/portal",
          relatedType: "message",
          relatedId: conv._id,
        });

        callback?.({ success: true, message: populatedMsg });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    /* -------------------------- Read Receipts ------------------------- */
    socket.on("message:read", async ({ conversationId, messageId }) => {
      try {
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: uid } });
        }

        if (conversationId) {
          const conv = await Conversation.findById(conversationId);
          if (conv) {
            const state = conv.readState.find((r) => String(r.user) === uid);
            if (state) {
              state.unread = 0;
              state.lastReadAt = new Date();
              await conv.save();
            }
            io.to(`conversation:${conversationId}`).emit("message:read_receipt", {
              conversationId,
              userId: uid,
              readAt: new Date(),
            });
          }
        }
      } catch (err) {
        // silent fail for socket event
      }
    });

    /* ----------------------------- Typing ----------------------------- */
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:typing", { conversationId, userId: uid, name: socket.userName });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:typing:stop", { conversationId, userId: uid });
    });

    /* --------------------------- Subscriptions ------------------------ */
    socket.on("expo:subscribe", (expoId) => socket.join(`expo:${expoId}`));
    socket.on("expo:unsubscribe", (expoId) => socket.leave(`expo:${expoId}`));

    /* --------------------------- Disconnect --------------------------- */
    socket.on("disconnect", () => {
      const set = onlineUsers.get(uid);
      if (set) {
        set.delete(socket.id);
        if (!set.size) {
          onlineUsers.delete(uid);
          socket.broadcast.emit("user:status", { userId: uid, status: "offline", lastSeen: new Date() });
        }
      }
    });
  });

  return io;
};

/* ------------------------------ Emitters ---------------------------- */
export const emitToUser = (userId, event, payload) => {
  if (!io) return false;
  io.to(`user:${userId}`).emit(event, payload);
  return true;
};

export const emitToUsers = (userIds, event, payload) => {
  if (!io) return false;
  userIds.forEach((id) => id && io.to(`user:${id}`).emit(event, payload));
  return true;
};

export const emitToRole = (role, event, payload) => {
  if (!io) return false;
  io.to(`role:${role}`).emit(event, payload);
  return true;
};

export const emitToConversation = (conversationId, event, payload) => {
  if (!io) return false;
  io.to(`conversation:${conversationId}`).emit(event, payload);
  return true;
};

export const emitToExpo = (expoId, event, payload) => {
  if (!io) return false;
  io.to(`expo:${expoId}`).emit(event, payload);
  return true;
};

export const isUserOnline = (userId) => onlineUsers.has(String(userId));
export const onlineCount = () => onlineUsers.size;
export const getOnlineUsers = () => Array.from(onlineUsers.keys());
export const getIO = () => io;

export default {
  attachIO,
  emitToUser,
  emitToUsers,
  emitToRole,
  emitToConversation,
  emitToExpo,
  isUserOnline,
  onlineCount,
  getOnlineUsers,
  getIO,
};
