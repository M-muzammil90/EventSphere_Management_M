import { Router } from "express";
import { createOrder, getOrder, getMyOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.post("/", createOrder);
router.get("/mine", getMyOrders);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrder);

export default router;
