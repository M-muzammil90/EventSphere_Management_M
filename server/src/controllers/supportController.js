import SupportTicket from "../models/SupportTicket.js";
import { ApiError, ApiResponse, asyncHandler, paginate } from "../utils/ApiResponse.js";

/* =====================================================================
   CREATE SUPPORT TICKET
   ===================================================================== */
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, message, expoId } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    throw ApiError.badRequest("Subject and message are required");
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    expo: expoId || undefined,
    subject: subject.trim(),
    category: category || "general",
    priority: priority || "medium",
    status: "open",
    messages: [
      {
        sender: req.user._id,
        message: message.trim(),
      },
    ],
  });

  return ApiResponse.created(res, ticket, "Support ticket created successfully");
});

/* =====================================================================
   LIST SUPPORT TICKETS (User or Admin)
   ===================================================================== */
export const listTickets = asyncHandler(async (req, res) => {
  const { status, category, priority, page = 1, limit = 20 } = req.query;
  const isStaff = ["admin", "organizer"].includes(req.user.role);

  const filter = {};
  if (!isStaff) {
    filter.user = req.user._id;
  }
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  const total = await SupportTicket.countDocuments(filter);
  const { skip, limit: l, page: p, pages } = paginate({ page, limit, total });

  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email role avatar")
    .populate("expo", "title")
    .populate("assignedTo", "name email")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(l)
    .lean();

  return ApiResponse.ok(res, tickets, undefined, { page: p, pages, total, limit: l });
});

/* =====================================================================
   GET TICKET DETAILS
   ===================================================================== */
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate("user", "name email role avatar")
    .populate("expo", "title")
    .populate("assignedTo", "name email")
    .populate("messages.sender", "name email role avatar");

  if (!ticket) throw ApiError.notFound("Ticket not found");

  const isStaff = ["admin", "organizer"].includes(req.user.role);
  const isOwner = String(ticket.user._id || ticket.user) === String(req.user._id);

  if (!isStaff && !isOwner) {
    throw ApiError.forbidden("You do not have access to this ticket");
  }

  return ApiResponse.ok(res, ticket);
});

/* =====================================================================
   REPLY TO TICKET
   ===================================================================== */
export const replyTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) throw ApiError.badRequest("Message is required");

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound("Ticket not found");

  const isStaff = ["admin", "organizer"].includes(req.user.role);
  const isOwner = String(ticket.user) === String(req.user._id);

  if (!isStaff && !isOwner) {
    throw ApiError.forbidden("You do not have access to this ticket");
  }

  ticket.messages.push({
    sender: req.user._id,
    message: message.trim(),
  });

  if (isStaff && ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();

  return ApiResponse.ok(res, ticket, "Reply added successfully");
});

/* =====================================================================
   UPDATE TICKET STATUS / ASSIGNMENT (Staff only)
   ===================================================================== */
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound("Ticket not found");

  if (status) {
    ticket.status = status;
    if (status === "resolved") ticket.resolvedAt = new Date();
    if (status === "closed") ticket.closedAt = new Date();
  }
  if (priority) ticket.priority = priority;
  if (assignedTo) ticket.assignedTo = assignedTo;

  await ticket.save();

  return ApiResponse.ok(res, ticket, "Ticket updated successfully");
});
