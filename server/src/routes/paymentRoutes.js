import { Router } from "express";
import {
  getProviderStatus,
  initiatePayment,
  verifyPayment,
  handleWebhook,
  requestRefund,
  reviewRefund,
  getAdminPayments,
  getMyPayments,
  downloadInvoicePdf,
  listRefunds,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

const router = Router();

/* ----------------------------- Webhook ------------------------------- */
// Webhooks are called directly by payment gateways (PayFast, JazzCash, Easypaisa)
router.post("/webhook/:provider", handleWebhook);
router.post("/webhooks/:provider", handleWebhook);

/* -------------------------- Authenticated ---------------------------- */
router.use(protect);

router.get("/providers", getProviderStatus);
router.post("/initiate", initiatePayment);
router.post("/verify/:orderId", verifyPayment);
router.get("/verify/:orderId", verifyPayment);
router.get("/status/:orderId", verifyPayment);
router.post("/refund", requestRefund);
router.get("/my", getMyPayments);
router.get("/my-payments", getMyPayments);
router.get("/invoice/:id/pdf", downloadInvoicePdf);
router.get("/invoice/:id/download", downloadInvoicePdf);
router.get("/invoices/:id/pdf", downloadInvoicePdf);

/* ------------------------------ Admin -------------------------------- */
router.get("/admin/all", restrictTo("admin"), getAdminPayments);
router.get("/admin/analytics", restrictTo("admin"), getAdminPayments);
router.get("/refunds", restrictTo("admin"), listRefunds);
router.patch("/refund/:id/review", restrictTo("admin"), reviewRefund);

export default router;
