import { Router } from "express";
import * as c from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadDocument, optionalUpload } from "../middleware/uploadMiddleware.js";

const router = Router();
router.use(protect);

// Conversations CRUD
router.get("/conversations", c.getConversations);
router.post("/conversations", c.startConversation);
router.get("/conversations/:id", c.getConversation);
router.get("/conversations/:id/messages", c.getConversationMessages);
router.post("/conversations/:id/messages", optionalUpload(uploadDocument), c.sendMessage);
router.patch("/conversations/:id/read", c.markConversationRead);
router.patch("/conversations/:id/state", c.setConversationState);

// Aliases when mounted directly under /conversations
router.get("/:id/messages", c.getConversationMessages);
router.post("/:id/messages", optionalUpload(uploadDocument), c.sendMessage);
router.patch("/:id/read", c.markConversationRead);
router.patch("/:id/state", c.setConversationState);
router.get("/:id", c.getConversation);

// Single Message operations
router.patch("/messages/:id/read", c.markSingleMessageRead);
router.delete("/messages/:id", c.deleteSingleMessage);

// Root path aliases when mounted directly
router.get("/", c.getConversations);
router.post("/", c.startConversation);

export default router;
