import { Router } from "express";
import * as c from "../controllers/pricingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { boothPricingSchema, ticketPricingSchema, pricingSettingSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.get("/expo/:expoId/booths", c.getPublicBoothPrices);
router.get("/expo/:expoId/tickets", asyncHandler(async (req, res) => {
  const { TicketPricing } = await import("../models/Pricing.js");
  const tickets = await TicketPricing.find({ expo: req.params.expoId, status: "active" })
    .select("name price currency capacity perks description");
  return res.json({ success: true, data: tickets });
}));

/* ----------------------------- admin -------------------------------- */
router.use(protect, restrictTo("admin"));

router.get("/booths", c.getBoothPrices);
router.post("/booths", validate({ body: boothPricingSchema }), c.upsertBoothPrice);
router.patch("/booths/:id", c.updateBoothPrice);
router.delete("/booths/:id", c.deleteBoothPrice);

router.get("/tickets", c.getTicketTypes);
router.post("/tickets", validate({ body: ticketPricingSchema }), c.upsertTicketType);
router.patch("/tickets/:id", c.updateTicketType);
router.delete("/tickets/:id", c.deleteTicketType);

router.get("/settings/:expoId", c.getPricingSettings);
router.patch("/settings/:expoId", validate({ body: pricingSettingSchema }), c.updatePricingSettings);

export default router;

import { asyncHandler } from "../utils/ApiResponse.js";
