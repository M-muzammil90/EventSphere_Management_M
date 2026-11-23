import express from "express";
import {
  createTicket,
  listTickets,
  getTicket,
  replyTicket,
  updateTicketStatus,
} from "../controllers/supportController.js";
import protect from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createTicket)
  .get(listTickets);

router.route("/:id")
  .get(getTicket);

router.route("/:id/messages")
  .post(replyTicket);

router.route("/:id/status")
  .patch(restrictTo("admin", "organizer"), updateTicketStatus);

export default router;
